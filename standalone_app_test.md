Below is a **minimal AI code editor with patch editing** using the same concept as GitHub Copilot and Cursor.

Stack

* Editor: Monaco Editor (VSCode engine)
* Patch engine: `diff`
* Backend: Node.js
* AI: any LLM returning unified diff

Project structure

```
ai-editor/
 ├ server.js
 ├ index.html
 └ package.json
```

---

# 1. package.json

```json
{
 "name": "ai-code-editor",
 "version": "1.0.0",
 "type": "module",
 "dependencies": {
   "express": "^4.18.2",
   "cors": "^2.8.5",
   "diff": "^5.2.0",
   "node-fetch": "^3.3.2"
 }
}
```

Install

```
npm install
```

---

# 2. server.js

```javascript
import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import { applyPatch } from "diff"

const app = express()
app.use(cors())
app.use(express.json())

let fileCode = `function hello(){
console.log("hello")
}`

app.post("/edit", async (req,res)=>{

 const {instruction, code} = req.body

 const prompt = `
Return ONLY unified diff.
Modify minimal lines.

Instruction:
${instruction}

Code:
${code}
`

 const ai = await fetch("YOUR_LLM_ENDPOINT",{
  method:"POST",
  headers:{
   "Content-Type":"application/json",
   "Authorization":"Bearer YOUR_KEY"
  },
  body:JSON.stringify({prompt})
 })

 const data = await ai.json()
 const patch = data.output

 const updated = applyPatch(code,patch)

 fileCode = updated

 res.json({code:updated,patch})
})

app.listen(3000,()=>console.log("server running"))
```

---

# 3. index.html

```html
<!DOCTYPE html>
<html>
<head>
<script src="https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js"></script>
</head>

<body>

<textarea id="prompt" placeholder="instruction"></textarea>
<button onclick="edit()">Edit</button>

<div id="editor" style="height:500px;border:1px solid #ccc"></div>

<script>

let editor

require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' }})

require(['vs/editor/editor.main'], function(){

 editor = monaco.editor.create(document.getElementById('editor'),{
  value:`function hello(){
console.log("hello")
}`,
  language:'javascript',
  theme:'vs-dark'
 })

})

async function edit(){

 const instruction = document.getElementById("prompt").value
 const code = editor.getValue()

 const res = await fetch("http://localhost:3000/edit",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({instruction,code})
 })

 const data = await res.json()

 editor.setValue(data.code)

}

</script>

</body>
</html>
```

---

# 4. How it works

Flow

```
Editor code
   ↓
User instruction
   ↓
LLM request
   ↓
LLM returns unified diff
   ↓
diff.applyPatch()
   ↓
Editor updates
```

Example AI response:

```
--- code
+++ code
@@
-function hello(){
-console.log("hello")
-}
+function hello(){
+console.log("hello world")
+}
```

Only the changed lines are applied.

---

