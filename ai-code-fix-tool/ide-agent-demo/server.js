'use strict';
const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json({ limit: '100mb' })); // Allows massive codebase uploads
app.use(express.static(path.join(__dirname, 'public')));

process.on('uncaughtException', (err) => { console.error('CRITICAL ERROR:', err); });
process.on('unhandledRejection', (err) => { console.error('UNHANDLED REJECTION:', err); });

// ─────────────────────────────────────────────────────────────
// STATE (Codebase & BM25 Engine)
// ─────────────────────────────────────────────────────────────
let CODEBASE = {};

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
      let s = 0; qt.forEach(t => { if(!this.idf[t]||!d.tf[t])return; s += this.idf[t]*(d.tf[t]*2.5)/(d.tf[t]+1.5*(0.25+0.75*d.tk.length/this.avgdl)); });
      const lines = d.content.split('\n');
      return { file: d.file, name: d.file, score: Math.round(s*100)/100, preview: lines.slice(0, 5).join('\n'), startLine: 1, endLine: lines.length };
    }).filter(d=>d.score > 0.01).sort((a,b)=>b.score-a.score).slice(0,k);
  }
}
let bm25 = new BM25();

// ─────────────────────────────────────────────────────────────
// SECURE AI INTEGRATION (Aligned exactly with ai-code-fix-tool)
// ─────────────────────────────────────────────────────────────
async function callAI(provider, apiKey, history) {
  if (provider === 'gemini') {
    const data = { contents: history, generationConfig: { temperature: 0.1 } };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json.candidates[0].content.parts[0].text;
  } else {
    const data = { 
      model: 'llama-3.3-70b-versatile', 
      messages: history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.parts[0].text) })), 
      temperature: 0.2
    };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json.choices[0].message.content;
  }
}

// ─────────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────────
app.post('/api/upload', (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files)) return res.status(400).send('Invalid payload');
  
  CODEBASE = {};
  bm25 = new BM25();
  
  files.forEach(f => {
    CODEBASE[f.path] = f.content;
    bm25.add({ file: f.path, content: f.content });
  });
  bm25.build();
  console.log(`Indexed ${files.length} files successfully.`);
  res.json({ ok: true, filesAdded: files.length });
});

app.get('/api/index', (req, res) => {
  const files = Object.keys(CODEBASE).map(fp => ({ path: fp, lines: CODEBASE[fp].split('\n').length, symbols: [] }));
  res.json({ files, totalChunks: bm25.docs.length, totalSymbols: 0 });
});

app.get('/api/file', (req, res) => res.json({ content: CODEBASE[req.query.path] || "File not found" }));

app.post('/api/test-key', async (req, res) => {
  const { provider, key } = req.body;
  try {
    if(provider === 'gemini') {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash?key=${key}`);
      if(!resp.ok) { const err = await resp.json(); return res.status(resp.status).json({ ok: false, error: JSON.stringify(err) }); }
      res.json({ ok: true });
    } else {
      const resp = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${key}` } });
      if(!resp.ok) { const err = await resp.json(); return res.status(resp.status).json({ ok: false, error: JSON.stringify(err) }); }
      res.json({ ok: true });
    }
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

async function* runDemoAgent(query) {
  if (Object.keys(CODEBASE).length === 0) {
    yield { type: 'error', message: 'The codebase is empty. Please upload your project folder first!' };
    return;
  }
  yield { type: 'debug', content: 'Demo running local retrieval...' };
  const res = bm25.search(query);
  yield { type: 'thought', content: `Querying local codebase... Found ${res.length} potential matches out of ${bm25.docs.length} files.` };
  yield { type: 'tool_call', tool: 'search_codebase', args: { query } };
  yield { type: 'tool_result', tool: 'search_codebase', result: res };
  if(res.length) {
    yield { type: 'thought', content: `Simulating reading file content for top hit: ${res[0].file}` };
    yield { type: 'tool_call', tool: 'read_file', args: { path: res[0].file } };
    const clines = CODEBASE[res[0].file].split('\n');
    yield { type: 'tool_result', tool: 'read_file', result: { file: res[0].file, content: CODEBASE[res[0].file].substring(0, 500) + '...', linesRead: clines.length, totalLines: clines.length } };
  }
  yield { type: 'final_answer', content: 'In Demo Mode, the AI reasoning is simulated. Add a live key to get an actual code fix response!' };
}

app.post('/api/agent/stream', async (req, res) => {
  const { query, apiKey, provider } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  const send = d => res.write(`data: ${JSON.stringify(d)}\n\n`);
  
  try {
    const gen = !apiKey ? runDemoAgent(query) : (async function*(){
      if(Object.keys(CODEBASE).length === 0) {
        yield { type: 'error', message: 'Workspace is empty. Please upload a project folder first.' };
        return;
      }
      try {
        const sysPrompt = `You are a surgical IDE AI assistant. You must analyze the user's issue based strictly on the retrieved files provided below.\nExplain the bug or solution accurately.`;
        const matched = bm25.search(query, 5); // get top 5 context files
        
        yield { type: 'thought', content: `Used local BM25 to search codebase for "${query}". Found ${matched.length} files.` };
        yield { type: 'tool_call', tool: 'search_codebase', args: { query, limit: 5 } };
        yield { type: 'tool_result', tool: 'search_codebase', result: matched };

        if(matched.length === 0) {
           yield { type: 'final_answer', content: `I could not find any files related to "**${query}**" in the uploaded codebase.` };
           return;
        }

        yield { type: 'thought', content: `Sending ${matched.length} contextual files to ${provider.toUpperCase()} (${provider === 'gemini' ? 'gemini-2.0-flash' : 'llama-3.3-70b-versatile'}) for analysis...` };
        
        // Build huge prompt payload containing all context
        let contextContent = matched.map(m => `--- FILE: ${m.file} ---\n\`\`\`\n${CODEBASE[m.file]}\n\`\`\``).join('\n\n');
        const history = [
          { role: 'user', parts: [{ text: `${sysPrompt}\n\nUSER ISSUE: ${query}\n\nCODE CONTEXT:\n${contextContent}` }] }
        ];

        const rawAns = await callAI(provider, apiKey, history);
        yield { type: 'final_answer', content: rawAns };
      } catch(ex) { yield { type: 'error', message: ex.message }; }
    })();
    for await (const e of gen) send(e);
    send({ type: 'done' });
  } catch(e) { send({ type: 'error', message: e.message }); }
  res.end();
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 REAL-WORLD IDE Demo Ready on port ${PORT}!`));
