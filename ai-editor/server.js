import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import { applyPatch } from "diff"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

// Load from parent directory .env.local
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.local') })
}

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

if (!GROQ_API_KEY) {
  console.error("ERROR: VITE_GROQ_API_KEY not found in .env.local")
  console.error("Checked path:", envPath)
  console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('GROQ')))
  process.exit(1)
}

console.log("✓ Groq API Key loaded successfully")

let fileCode = `function hello(){
console.log("hello")
}`

app.post("/edit", async (req, res) => {
  try {
    const { instruction, files, currentFile } = req.body

    if (!instruction) {
      return res.status(400).json({ error: "Missing instruction" })
    }

    // Build working set context from all files
    let filesContext = ''
    if (files && Object.keys(files).length > 0) {
      filesContext = '\n\nWorking Set Files:\n'
      Object.entries(files).forEach(([filename, content]) => {
        filesContext += `\n--- ${filename} ---\n${content}\n`
      })
    }

    const prompt = `You are a code generator that creates multiple files at once.

Instruction: ${instruction}
${filesContext}

Generate complete, working code for all required files. Return your response in this format:

FILE: filename1.ext
<code content>

FILE: filename2.ext
<code content>

FILE: filename3.ext
<code content>

Important:
- Include FILE: header for each file
- Return ONLY the code, no explanations
- Create all necessary files in one response`

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8192
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Groq API error:", response.status, error)
      return res.status(response.status).json({ error: "Groq API error", status: response.status })
    }

    const data = await response.json()
    let responseText = data.choices[0].message.content.trim()
    
    // Parse multi-file response
    const fileRegex = /FILE:\s*([^\n]+)\n([\s\S]*?)(?=FILE:|$)/g
    const parsedFiles = {}
    let match
    
    while ((match = fileRegex.exec(responseText)) !== null) {
      const filename = match[1].trim()
      let content = match[2].trim()
      
      // Remove markdown code blocks if present
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:javascript|jsx|typescript|tsx|html|css|json)?\n?/, '').replace(/\n?```$/, '')
      }
      
      parsedFiles[filename] = content.trim()
    }
    
    // If no multi-file format detected, treat as single file
    if (Object.keys(parsedFiles).length === 0) {
      let code = responseText
      if (code.startsWith('```')) {
        code = code.replace(/^```(?:javascript|jsx|typescript|tsx|html|css|json)?\n?/, '').replace(/\n?```$/, '')
      }
      
      res.json({ 
        code: code.trim(),
        message: `✓ Generated code`
      })
    } else {
      console.log(`Generated ${Object.keys(parsedFiles).length} files`)
      res.json({ 
        files: parsedFiles,
        message: `✓ Generated ${Object.keys(parsedFiles).length} files`
      })
    }
  } catch (error) {
    console.error("Server error:", error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/health", (req, res) => {
  res.json({ status: "ok", groqConfigured: !!GROQ_API_KEY })
})

// Simple runtime bundler endpoint to support the in-browser preview.
app.post('/runtime-bundle', (req, res) => {
  try {
    const { files: postedFiles, entry, code, language } = req.body || {}
    let entryCode = ''

    if (code && typeof code === 'string') {
      entryCode = code
    } else if (postedFiles && entry && postedFiles[entry]) {
      entryCode = postedFiles[entry]
    } else if (postedFiles && Object.keys(postedFiles).length > 0) {
      const firstKey = Object.keys(postedFiles)[0]
      entryCode = postedFiles[firstKey]
    } else {
      return res.status(400).json({ error: 'No code or files provided' })
    }

    // Minimal HTML wrapper that uses Babel in the iframe to compile TSX/JSX
    const safeCode = String(entryCode).replace(/<\/script>/gi, '<\\/script>')
    const encoded = Buffer.from(safeCode, 'utf8').toString('base64')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>body{margin:0;font-family:Inter,system-ui,Arial,sans-serif}#root{padding:20px}</style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function(){
      try{
        function b64ToUtf8(b64) {
          return decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
        }
        const sourceCode = b64ToUtf8('${encoded}');
        const compiled = Babel.transform(sourceCode, { presets: ['react','typescript'], filename: 'component.tsx' }).code;
        const execute = new Function('React','ReactDOM', compiled + '\nreturn typeof Component !== "undefined" ? Component : null;');
        const Component = execute(window.React, window.ReactDOM);
        if (!Component) {
          document.getElementById('root').innerHTML = '<div style="color:orange">No component found to render</div>';
        } else {
          const root = window.ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(Component));
        }
      } catch (err) {
        document.getElementById('root').innerHTML = '<pre style="color:red">' + String(err.message || err) + '\n' + String(err.stack || '') + '</pre>';
        console.error('Bundler exec error', err);
      }
    })();
  </script>
</body>
</html>`

    return res.json({ html })
  } catch (error) {
    console.error('runtime-bundle error', error)
    return res.status(500).json({ error: error.message || String(error) })
  }
})

// Backwards-compatible alias
app.post('/bundle', (req, res) => {
  try {
    const { files: postedFiles, entry, code } = req.body || {}
    let entryCode = ''

    if (code && typeof code === 'string') {
      entryCode = code
    } else if (postedFiles && entry && postedFiles[entry]) {
      entryCode = postedFiles[entry]
    } else if (postedFiles && Object.keys(postedFiles).length > 0) {
      const firstKey = Object.keys(postedFiles)[0]
      entryCode = postedFiles[firstKey]
    } else {
      return res.status(400).json({ error: 'No code or files provided' })
    }

    const safeCode = String(entryCode).replace(/<\/script>/gi, '<\\/script>')
    const encoded = Buffer.from(safeCode, 'utf8').toString('base64')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><style>body{margin:0;font-family:Inter,system-ui,Arial,sans-serif}#root{padding:20px}</style></head><body><div id="root"></div><script>(function(){try;function b64ToUtf8(b64){return decodeURIComponent(Array.prototype.map.call(atob(b64),function(c){return'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)}).join(''))}const sourceCode=b64ToUtf8('${encoded}');const compiled=Babel.transform(sourceCode,{presets:['react','typescript'],filename:'component.tsx'}).code;const execute=new Function('React','ReactDOM',compiled+'\nreturn typeof Component !== "undefined" ? Component : null;');const Component=execute(window.React,window.ReactDOM);if(!Component){document.getElementById('root').innerHTML='<div style="color:orange">No component found to render</div>'}else{const root=window.ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(Component))}}catch(err){document.getElementById('root').innerHTML='<pre style="color:red">'+String(err.message||err)+'\n'+String(err.stack||'')+'</pre>';console.error('Bundler exec error',err)}})();</script></body></html>`
    return res.json({ html })
  } catch (error) {
    console.error('bundle alias error', error)
    return res.status(500).json({ error: error.message || String(error) })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✓ AI Code Editor running on http://localhost:${PORT}`)
  console.log(`✓ Groq API configured: ${GROQ_API_KEY ? 'Yes' : 'No'}`)
})
