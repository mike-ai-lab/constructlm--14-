
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Load .env.local
const ENV = {};
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
    const [k, v] = l.split('=');
    if (k && v) ENV[k.trim()] = v.trim();
  });
}

// State
let CODEBASE = {};
const AGENT_TOOLS = [
  { name: 'search_codebase', description: 'Search the codebase', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'read_file', description: 'Read a file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'list_files', description: 'List files', parameters: { type: 'object', properties: {} } },
  { name: 'grep_codebase', description: 'Grep search', parameters: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] } }
];

// BM25
class BM25 {
  constructor() { this.docs = []; this.idf = {}; this.avgdl = 0; }
  tokenize(t) { return t.toLowerCase().replace(/[^a-z0-0_]/g,' ').split(/\s+/).filter(x=>x.length>1); }
  normalize(q) { return q.replace(/purpose|what|how|does|is|are|of|the/gi, '').trim() || q; }
  add(d) { const tk = this.tokenize(d.content), tf = {}; tk.forEach(t=>tf[t]=(tf[t]||0)+1); this.docs.push({...d, tk, tf}); }
  build() {
    const N = this.docs.length; if(N===0) return; this.avgdl = this.docs.reduce((a,b)=>a+b.tk.length,0)/N;
    const all = new Set(this.docs.flatMap(d=>d.tk));
    all.forEach(t => { const df = this.docs.filter(d=>d.tf[t]>0).length; this.idf[t] = Math.log((N-df+0.5)/(df+0.5)+1); });
  }
  search(q, k=5) {
    if(!q || typeof q !== 'string') return [];
    if(!this.docs.length) return [];
    const qt = this.tokenize(this.normalize(q));
    return this.docs.map(d => {
      let s = 0; qt.forEach(t => { if(this.idf[t] && d.tf[t]) s += this.idf[t]*(d.tf[t]*2.5)/(d.tf[t]+1.5*(0.25+0.75*d.tk.length/this.avgdl)); });
      return { ...d, score: s };
    }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,k).map(d => ({
      file: d.file,
      content: d.content,
      startLine: d.startLine,
      score: d.score
    }));
  }
}
const bm25 = new BM25();

// Indexing
function autoIndex() {
  const target = path.join(__dirname, 'test_project/my-project (3)/my-project');
  if(!fs.existsSync(target)) return console.log('❌ target missing');
  function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      if(fs.statSync(fp).isDirectory() && !f.includes('node_modules')) walk(fp);
      else if(f.match(/\.(js|jsx|ts|tsx)$/)) {
        const c = fs.readFileSync(fp,'utf8');
        const rel = path.relative(target, fp).replace(/\\/g,'/');
        CODEBASE[rel] = c;
        const lines = c.split('\n');
        for(let i=0; i<lines.length; i+=35) {
          bm25.add({ file: rel, content: lines.slice(i, i+40).join('\n'), startLine: i+1 });
        }
      }
    });
  }
  walk(target); bm25.build(); console.log('✅ Index OK');
}

// Routes
app.get('/', (req,res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/api/index', (req,res) => res.json({ files: Object.keys(CODEBASE).map(p=>({ path: p, lines: CODEBASE[p].split('\n').length, symbols: [] })), totalChunks: bm25.docs.length }));
app.get('/api/file', (req,res) => {
  const c = CODEBASE[req.query.path];
  if(!c) return res.status(404).send('Not found');
  res.json({ content: c });
});

app.post('/api/upload', (req, res) => {
  try {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid files array' });
    }
    
    console.log(`📤 Uploading ${files.length} files...`);
    
    // Remove old chunks for files being re-uploaded
    const uploadedPaths = new Set(files.map(f => f.path));
    bm25.docs = bm25.docs.filter(doc => !uploadedPaths.has(doc.file));
    
    // Add new files
    files.forEach(f => {
      if (f.path && f.content) {
        CODEBASE[f.path] = f.content;
        const lines = f.content.split('\n');
        for(let i=0; i<lines.length; i+=35) {
          bm25.add({ file: f.path, content: lines.slice(i, i+40).join('\n'), startLine: i+1 });
        }
      }
    });
    
    bm25.build();
    console.log(`✅ Upload complete: ${files.length} files indexed`);
    
    res.json({ ok: true, filesAdded: files.length });
  } catch (e) {
    console.error('❌ Upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/test-key', (req,res) => {
  const { provider, apiKey, key } = req.body;
  const k = apiKey || key; 
  if (!k && !ENV.VITE_GROQ_API_KEY) return res.status(401).json({ error: 'No key provided' });
  res.json({ ok: true, success: true });
});

app.post('/api/delete-file', (req, res) => {
  console.log('🗑️ Delete request:', req.body);
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'No path provided' });
    }
    
    // Remove from CODEBASE
    if (CODEBASE[path]) {
      delete CODEBASE[path];
      
      // Remove from BM25 index
      bm25.docs = bm25.docs.filter(doc => doc.file !== path);
      
      // Rebuild IDF after removing documents
      if (bm25.docs.length > 0) {
        bm25.build();
      }
      
      console.log(`✅ Deleted: ${path}`);
      res.json({ ok: true, message: 'File deleted successfully' });
    } else {
      console.warn(`⚠️ File not found: ${path}`);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (e) {
    console.error('❌ Delete error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/clear-all', (req, res) => {
  try {
    // Clear codebase
    CODEBASE = {};
    
    // Clear BM25 index
    bm25.docs = [];
    bm25.idf = {};
    bm25.avgdl = 0;
    
    console.log('✅ Workspace cleared');
    res.json({ ok: true, message: 'All files cleared' });
  } catch (e) {
    console.error('❌ Clear error:', e);
    res.status(500).json({ error: e.message });
  }
});

async function* runAgentic(query, provider, apiKey) {
  console.log(`[AGENTIC START] Query: "${query}"`);
  console.log(`[AGENTIC] CODEBASE state: ${CODEBASE ? 'exists' : 'null/undefined'}, type: ${typeof CODEBASE}`);
  
  // Ensure CODEBASE is always an object
  if (!CODEBASE || typeof CODEBASE !== 'object') {
    console.log('[AGENTIC] CODEBASE was invalid, resetting to {}');
    CODEBASE = {};
  }
  
  console.log(`[AGENTIC] CODEBASE files: ${Object.keys(CODEBASE).length}`);
  
  // Check if codebase is empty
  if (Object.keys(CODEBASE).length === 0) {
    console.log('[AGENTIC] No files indexed, returning error');
    yield { type: 'error', message: 'No files indexed yet. Upload a project first.' };
    return;
  }
  
  const systemPrompt = `You are an expert IDE code assistant with access to a codebase search system.

THINKING PROCESS:
- Before using tools or answering, wrap your reasoning in <think></think> tags
- Show your step-by-step analysis inside thinking tags
- Think through which tools to use and why
- After thinking, use the appropriate tools

AVAILABLE TOOLS:
1. search_codebase(query) - Semantic search using BM25, returns relevant code chunks with file paths and line numbers
2. read_file(path) - Read complete file content to examine code in detail
3. list_files() - List all indexed files (use ONLY to discover file structure)
4. grep_codebase(pattern) - Find files containing exact text pattern

CRITICAL INSTRUCTIONS FOR TOOL USAGE:
- ALWAYS use search_codebase FIRST to find relevant code before answering
- If search results mention specific files, use read_file to examine them in detail
- NEVER answer based only on list_files - it only shows filenames, not content
- Use multiple tools in sequence to gather complete information
- Cite specific file names, line numbers, and code snippets in your answers

EXAMPLE WORKFLOW:
User: "How many projects are there?"

<think>
Let me break this down:
1. I need to find where projects are defined in the codebase
2. I'll search for "projects array data" to locate the relevant code
3. Once I find the file, I'll read it to see the actual project definitions
4. Then I can count them and provide a specific answer
</think>

1. search_codebase("projects array data") - Find where projects are defined
2. read_file("pages/Home.js") - Read the file that contains project data
3. Analyze the code and count the projects
4. Answer: "There are 3 projects defined in pages/Home.js (lines 6-10): Project 1, Project 2, and Project 3"

ANSWER REQUIREMENTS:
- Provide concrete answers based on actual code
- Cite file names and line numbers when referencing code
- If you can't find relevant code after searching, say so clearly
- Never make assumptions - always verify with code
- Use <think></think> tags to show your reasoning process

Answer the user's question using these tools.`;

  const messages = [
    { role: 'system', content: systemPrompt }, 
    { role: 'user', content: query }
  ];
  
  for(let i=0; i<6; i++) {
    const keyToUse = (apiKey && apiKey.length > 5) ? apiKey : (provider === 'gemini' ? ENV.VITE_GEMINI_API_KEY : ENV.VITE_GROQ_API_KEY);
    if (!keyToUse) {
       yield { type: 'error', message: `No API key found for ${provider}. Configure in UI or .env.local` };
       return;
    }
    
    // Calculate token estimate before sending
    const messageText = messages.map(m => m.content || '').join(' ');
    const estimatedTokens = Math.ceil(messageText.length / 4);
    console.log(`[TOKEN ESTIMATE] ~${estimatedTokens} tokens in request (${messageText.length} chars)`);
    
    // Add small delay before API call for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Select API endpoint and model based on provider
      let apiUrl, model, headers, requestBody;
      
      if (provider === 'gemini') {
        // Use Gemini 2.5 Flash (confirmed working from tests)
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
        headers = {
          'Content-Type': 'application/json',
          'x-goog-api-key': keyToUse
        };
        
        // Convert messages to Gemini format
        const geminiMessages = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content || '' }]
          }));
        
        const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
        
        requestBody = {
          contents: geminiMessages,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000
          }
        };
      } else if (provider === 'openrouter') {
        // OpenRouter with tool calling support
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${keyToUse}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'IDE Agent Demo'
        };
        model = 'arcee-ai/trinity-large-preview:free'; // REASONING MODEL - supports <think> tags
        requestBody = {
          model,
          messages,
          tools: AGENT_TOOLS.map(t=>({type:'function', function:t})),
          tool_choice: 'auto',
          stream: true,
          temperature: 0.3,
          max_tokens: 4000
        };
      } else if (provider === 'cerebras') {
        // Cerebras (fast but limited models)
        apiUrl = 'https://api.cerebras.ai/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${keyToUse}`,
          'Content-Type': 'application/json',
          'X-Cerebras-Version-Patch': '2'
        };
        model = 'llama3.1-8b'; // Confirmed working from tests
        requestBody = {
          model,
          messages,
          stream: true,
          temperature: 0.3,
          max_tokens: 4000
        };
      } else {
        // Groq (default)
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${keyToUse}`,
          'Content-Type': 'application/json'
        };
        model = 'llama-3.3-70b-versatile';
        requestBody = {
          model,
          messages,
          tools: AGENT_TOOLS.map(t=>({type:'function', function:t})),
          tool_choice: 'auto',
          stream: true,
          temperature: 0.3,
          max_tokens: 4000
        };
      }
      
      console.log(`[API CALL] Using ${provider} at ${apiUrl}`);
      
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!r.ok) {
        const j = await r.json();
        console.error(`${provider.toUpperCase()} API Error:`, j);
        yield { type: 'error', message: `API Error: ${j.error?.message || 'Unknown error'}` };
        return;
      }
      
      // Stream the response
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessage = { role: 'assistant', content: '', tool_calls: [], reasoning: '' };
      let toolCallIndex = -1;
      let isInThinkBlock = false;
      let thinkBuffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            
            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                if (toolCall.index !== undefined) {
                  toolCallIndex = toolCall.index;
                  if (!currentMessage.tool_calls[toolCallIndex]) {
                    currentMessage.tool_calls[toolCallIndex] = {
                      id: toolCall.id || '',
                      type: 'function',
                      function: { name: '', arguments: '' }
                    };
                  }
                }
                
                if (toolCall.function?.name) {
                  currentMessage.tool_calls[toolCallIndex].function.name = toolCall.function.name;
                }
                if (toolCall.function?.arguments) {
                  currentMessage.tool_calls[toolCallIndex].function.arguments += toolCall.function.arguments;
                }
                if (toolCall.id) {
                  currentMessage.tool_calls[toolCallIndex].id = toolCall.id;
                }
              }
            }
            
            if (delta?.content) {
              const content = delta.content;
              
              // Detect thinking blocks
              if (content.includes('<think>') || content.includes('<thinking>')) {
                isInThinkBlock = true;
                thinkBuffer += content.replace(/<think>|<thinking>/g, '');
                console.log('[SERVER] 🧠 THINKING BLOCK STARTED');
                continue;
              }
              
              if (content.includes('</think>') || content.includes('</thinking>')) {
                isInThinkBlock = false;
                thinkBuffer += content.replace(/<\/think>|<\/thinking>/g, '');
                currentMessage.reasoning = thinkBuffer;
                console.log('[SERVER] 🧠 REASONING DETECTED:', thinkBuffer.substring(0, 100) + '...');
                console.log('[SERVER] 🧠 EMITTING reasoning EVENT');
                yield { type: 'reasoning', content: thinkBuffer };
                thinkBuffer = '';
                continue;
              }
              
              if (isInThinkBlock) {
                thinkBuffer += content;
                console.log('[SERVER] 🧠 BUFFERING THINKING:', content.substring(0, 50));
              } else {
                currentMessage.content += content;
              }
            }
          } catch (e) {
            console.warn('Parse error:', e);
          }
        }
      }
      
      messages.push(currentMessage);
      
      if (currentMessage.tool_calls && currentMessage.tool_calls.length > 0) {
        for (const call of currentMessage.tool_calls) {
          let res;
          let args = {};
          
          try {
            if (call.function.arguments && call.function.arguments.trim() !== '') {
              args = JSON.parse(call.function.arguments);
            }
          } catch (e) {
            console.warn('Failed to parse tool arguments:', e);
            args = {};
          }
          
          // Ensure args is always an object
          if (!args || typeof args !== 'object') {
            args = {};
          }
          
          // Generate reasoning narrative based on tool and args
          const reasoningNarratives = {
            'search_codebase': `Let me search the codebase for "${args.query || 'relevant code'}"... I need to find files that contain information about this topic.`,
            'read_file': `Now I'll read ${args.path || 'the file'} to examine the actual code implementation and understand how it works.`,
            'list_files': `Let me see what files are available in the codebase to understand the project structure.`,
            'grep_codebase': `I'll search for the exact pattern "${args.pattern || 'text'}" to find specific code references.`
          };
          
          const reasoning = reasoningNarratives[call.function.name] || `Analyzing ${call.function.name}...`;
          yield { type: 'reasoning', content: reasoning };
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Show tool call
          yield { type: 'tool_call', tool: call.function.name, args };
          await new Promise(resolve => setTimeout(resolve, 400));
          
          // Execute tool
          console.log(`[TOOL EXEC] ${call.function.name}`, { args, codebaseType: typeof CODEBASE, codebaseNull: CODEBASE === null });
          
          if (call.function.name === 'search_codebase') {
            const querySafe = args.query || '';
            console.log(`[SEARCH] Query: "${querySafe}"`);
            const rawResults = bm25.search(querySafe);
            console.log(`[SEARCH] Found ${rawResults.length} results`);
            res = rawResults.map(r => ({
              file: r.file,
              content: r.content,
              startLine: r.startLine,
              score: r.score
            }));
          } else if (call.function.name === 'list_files') {
            console.log(`[LIST] CODEBASE check: ${CODEBASE ? 'exists' : 'null/undefined'}, type: ${typeof CODEBASE}`);
            res = CODEBASE && typeof CODEBASE === 'object' ? Object.keys(CODEBASE) : [];
            console.log(`[LIST] Returning ${res.length} files`);
          } else if (call.function.name === 'read_file') {
            console.log(`[READ] Path: ${args.path}, CODEBASE exists: ${!!CODEBASE}`);
            res = { content: (CODEBASE && CODEBASE[args.path]) || 'File not found' };
          } else if (call.function.name === 'grep_codebase') {
            console.log(`[GREP] Pattern: "${args.pattern}", CODEBASE exists: ${!!CODEBASE}`);
            res = CODEBASE && typeof CODEBASE === 'object'
              ? Object.keys(CODEBASE)
                  .filter(f => typeof CODEBASE[f] === 'string' && CODEBASE[f].includes(args.pattern || ''))
                  .map(f => ({ file: f }))
              : [];
            console.log(`[GREP] Found ${res.length} matches`);
          }
          
          // Show result with delay
          await new Promise(resolve => setTimeout(resolve, 300));
          yield { type: 'tool_result', tool: call.function.name, result: res };
          
          // Prepare condensed result for AI context (avoid sending full files)
          let aiResult = res;
          
          if (call.function.name === 'read_file' && res.content) {
            // Only send first 50 lines + summary instead of full file
            const lines = res.content.split('\n');
            const preview = lines.slice(0, 50).join('\n');
            const summary = lines.length > 50 
              ? `\n... [${lines.length - 50} more lines omitted for brevity]`
              : '';
            aiResult = { 
              content: preview + summary,
              totalLines: lines.length,
              truncated: lines.length > 50
            };
          } else if (call.function.name === 'search_codebase' && Array.isArray(res)) {
            // Limit search results to top 3 and truncate content
            aiResult = res.slice(0, 3).map(r => ({
              file: r.file,
              content: r.content.slice(0, 500) + (r.content.length > 500 ? '...' : ''),
              startLine: r.startLine,
              score: r.score
            }));
          }
          
          messages.push({ 
            role: 'tool', 
            tool_call_id: call.id, 
            name: call.function.name, 
            content: JSON.stringify(aiResult) 
          });
        }
      } else if (currentMessage.content) {
        // Stream final answer with better pacing
        const words = currentMessage.content.split(' ');
        let streamedContent = '';
        
        for (let i = 0; i < words.length; i++) {
          streamedContent += (i > 0 ? ' ' : '') + words[i];
          yield { type: 'final_answer_chunk', content: streamedContent };
          // Slower streaming for better UX (100ms per word)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        yield { type: 'final_answer', content: currentMessage.content };
        yield { type: 'done' };
        break;
      }
    } catch (error) {
      console.error('[AGENTIC ERROR]', error);
      console.error('[AGENTIC ERROR] Stack:', error.stack);
      yield { type: 'error', message: `System error: ${error.message}` };
      yield { type: 'done' };
      return;
    }
  }
  
  // If loop completes without breaking (max iterations reached)
  yield { type: 'done' };
}

// Semantic search mode (RAG without tool calling)
async function* runSemantic(query, provider, apiKey) {
  // Ensure CODEBASE is always an object
  if (!CODEBASE || typeof CODEBASE !== 'object') {
    CODEBASE = {};
  }
  
  // Check if codebase is empty
  if (Object.keys(CODEBASE).length === 0) {
    yield { type: 'error', message: 'No files indexed yet. Upload a project first.' };
    return;
  }
  
  const systemPrompt = `You are an expert code assistant. Answer questions based on the provided code context.

Be concise and cite specific files and line numbers when referencing code.`;

  // Add delay before search
  await new Promise(resolve => setTimeout(resolve, 500));

  // Search codebase
  yield { type: 'tool_call', tool: 'search_codebase', args: { query } };
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const rawResults = bm25.search(query, 5);
  const results = rawResults.map(r => ({
    file: r.file,
    content: r.content,
    startLine: r.startLine,
    score: r.score
  }));
  yield { type: 'tool_result', tool: 'search_codebase', result: results };
  
  await new Promise(resolve => setTimeout(resolve, 600));

  // Build context from results
  const contextText = results.map((r, i) => 
    `[FILE ${i + 1}: ${r.file}]\n${r.content}\n[END FILE ${i + 1}]\n`
  ).join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Context:\n${contextText}\n\nQuestion: ${query}` }
  ];

  const keyToUse = (apiKey && apiKey.length > 5) ? apiKey : (provider === 'gemini' ? ENV.VITE_GEMINI_API_KEY : ENV.VITE_GROQ_API_KEY);
  if (!keyToUse) {
    yield { type: 'error', message: `No API key found for ${provider}` };
    return;
  }

  try {
    // Select API endpoint based on provider
    let apiUrl, headers, requestBody;
    
    if (provider === 'gemini') {
      // Use Gemini 2.5 Flash (confirmed working from tests)
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': keyToUse
      };
      
      requestBody = {
        contents: [
          { role: 'user', parts: [{ text: messages[1].content }] }
        ],
        systemInstruction: { parts: [{ text: messages[0].content }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      };
    } else if (provider === 'openrouter') {
      // OpenRouter
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'IDE Agent Demo'
      };
      
      requestBody = {
        model: 'arcee-ai/trinity-large-preview:free', // REASONING MODEL
        messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      };
    } else if (provider === 'cerebras') {
      // Cerebras
      apiUrl = 'https://api.cerebras.ai/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
        'X-Cerebras-Version-Patch': '2'
      };
      
      requestBody = {
        model: 'llama3.1-8b',
        messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      };
    } else {
      // Groq (default)
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      };
      
      requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      };
    }
    
    console.log(`[SEMANTIC API] Using ${provider} at ${apiUrl}`);
    
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!r.ok) {
      const j = await r.json();
      console.error(`${provider.toUpperCase()} API Error:`, j);
      yield { type: 'error', message: `API Error: ${j.error?.message || 'Unknown error'}` };
      return;
    }

    // Handle response based on provider
    if (provider === 'gemini') {
      // Gemini doesn't stream, so get full response
      const data = await r.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Simulate streaming for UX
      const words = text.split(' ');
      let fullAnswer = '';
      
      for (let i = 0; i < words.length; i++) {
        fullAnswer += (i > 0 ? ' ' : '') + words[i];
        yield { type: 'final_answer_chunk', content: fullAnswer };
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      
      yield { type: 'final_answer', content: text };
    } else {
      // Groq streaming response
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            fullAnswer += content;
            // Stream word by word with delays
            yield { type: 'final_answer_chunk', content: fullAnswer };
            await new Promise(resolve => setTimeout(resolve, 40));
          }
        } catch (e) {
          console.warn('Parse error:', e);
        }
      }
    }

      yield { type: 'final_answer', content: fullAnswer };
    }
  } catch (error) {
    console.error('Semantic search error:', error);
    yield { type: 'error', message: `System error: ${error.message}` };
  }
}

app.post('/api/agent/stream', async (req,res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  
  const { query, provider, apiKey, strategy } = req.body;
  
  // Choose mode based on strategy
  const runner = strategy === 'semantic' 
    ? runSemantic(query, provider, apiKey)
    : runAgentic(query, provider, apiKey);
  
  for await (const e of runner) {
    res.write(`data: ${JSON.stringify(e)}\n\n`);
  }
  
  res.write('data: {"type":"done"}\n\n'); 
  res.end();
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error('🔥 SERVER ERROR:', err.message);
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((req, res) => {
  console.warn('⚠️ 404:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(3001, () => { console.log('🚀 Port 3001'); autoIndex(); });
