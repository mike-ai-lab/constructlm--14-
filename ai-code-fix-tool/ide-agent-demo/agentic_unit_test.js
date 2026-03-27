
const fs = require('fs');
const path = require('path');

// 1. REPRODUCE SERVER STATE
let CODEBASE = {};
const chunkContent = (file, content, chunkSize = 40, overlap = 5) => {
  const lines = content.split('\n');
  const chunks = [];
  if (lines.length <= chunkSize) return [{ file, content, startLine: 1, endLine: lines.length }];
  for (let i = 0; i < lines.length; i += (chunkSize - overlap)) {
    const chunkLines = lines.slice(i, i + chunkSize);
    chunks.push({ file, content: chunkLines.join('\n'), startLine: i + 1, endLine: i + chunkLines.length });
    if (i + chunkSize >= lines.length) break;
  }
  return chunks;
};

class BM25 {
  constructor() { this.docs = []; this.idf = {}; this.avgdl = 0; }
  tokenize(t) { return t.toLowerCase().replace(/[^a-z0-9_]/g,' ').split(/\s+/).filter(x=>x.length>1); }
  add(d) { const tk = this.tokenize(d.content), tf = {}; tk.forEach(t => tf[t] = (tf[t]||0)+1); this.docs.push({...d, tk, tf}); }
  build() {
    const N = this.docs.length; if(N===0) return; this.avgdl = this.docs.reduce((a,b)=>a+b.tk.length,0)/N;
    const all = new Set(this.docs.flatMap(d=>d.tk));
    all.forEach(t => { const df = this.docs.filter(d=>d.tf[t]>0).length; this.idf[t] = Math.log((N-df+0.5)/(df+0.5)+1); });
  }
  search(q, k=5) {
    if(this.docs.length === 0) return [];
    const qt = this.tokenize(q);
    return this.docs.map(d => {
      let s = 0; qt.forEach(t => { 
        if(this.idf[t] && d.tf[t]) {
          s += this.idf[t]*(d.tf[t]*2.5)/(d.tf[t]+1.5*(0.25+0.75*d.tk.length/this.avgdl)); 
        } else {
          const tPrefix = t.slice(0, 4);
          if (t.length >= 4 && d.tk.some(dt => dt.startsWith(tPrefix))) s += 0.3;
          else if (d.content.toLowerCase().includes(t)) s += 0.5;
        }
      });
      return { file: d.file, score: Math.round(s*100)/100, content: d.content, startLine: d.startLine, endLine: d.endLine };
    }).filter(d=>d.score > 0.01).sort((a,b)=>b.score-a.score).slice(0,k);
  }
}
const bm25 = new BM25();

// 2. LOAD KEYS & PROJECT
const envPath = path.join(__dirname, '..', '.env.local');
let GROQ_KEY = '';
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
    if (l.startsWith('VITE_GROQ_API_KEY=')) GROQ_KEY = l.split('=')[1].trim();
  });
}

const target = path.join(__dirname, 'test_project/my-project (3)/my-project');
function autoIndex() {
  function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isDirectory() && !f.includes('node_modules')) walk(fp);
      else if (f.match(/\.(js|jsx)$/)) {
        const content = fs.readFileSync(fp, 'utf8');
        const rel = path.relative(target, fp);
        CODEBASE[rel] = content;
        chunkContent(rel, content).forEach(c => bm25.add(c));
      }
    });
  }
  walk(target); bm25.build();
}
autoIndex();

// 3. AGENTIC LOOP TEST
const AGENT_TOOLS = [
  { name: 'search_codebase', description: 'Search the codebase.', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer' } }, required: ['query'] } },
  { name: 'read_file', description: 'Read a file.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } }
];

const logFile = path.join(__dirname, 'agentic_test_results.txt');
fs.writeFileSync(logFile, '');
function log(msg) { console.log(msg); fs.appendFileSync(logFile, msg + '\n'); }

async function runAgenticTest() {
  log('🤖 STARTING LIVE AGENTIC LOOP INTEGRATION TEST...');
  if (!GROQ_KEY) throw new Error('NO GROQ KEY FOUND IN .env.local');

  const query = "Find the routing entry point.";
  const messages = [
    { role: 'system', content: 'You are an agent. Use tools to find routing.' },
    { role: 'user', content: query }
  ];

  let turn = 0, hasUsedTools = false;
  while (turn < 5) {
    turn++;
    log(`\n--- Turn ${turn}: AI Reasoning...`);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ 
        model: 'llama-3.3-70b-versatile', 
        messages, 
        tools: AGENT_TOOLS.map(t => ({ type: 'function', function: t })),
        tool_choice: 'auto' 
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));

    const msg = json.choices[0].message;
    messages.push(msg);

    if (msg.tool_calls) {
      hasUsedTools = true;
      for (const call of msg.tool_calls) {
        const tool = call.function.name, args = JSON.parse(call.function.arguments);
        log(`🔧 AI called tool: ${tool}(${JSON.stringify(args)})`);
        let result = (tool === 'search_codebase') ? bm25.search(args.query, args.limit || 5) : { file: args.path, status: 'OK' };
        log(`📦 Result received (${Array.isArray(result) ? result.length : 'OK'} items)`);
        messages.push({ role: 'tool', tool_call_id: call.id, name: tool, content: JSON.stringify(result) });
      }
    } else {
      log('✨ AI provided final answer: ' + msg.content.slice(0, 100).replace(/\n/g, ' ') + '...');
      if (!hasUsedTools) throw new Error('AI finished without using tools!');
      log('\n✅ TEST SUCCESS: Agentic Loop verified.');
      return;
    }
  }
}

runAgenticTest().catch(e => {
  console.error('\n❌ TEST FAILURE:', e.message);
  process.exit(1);
});
