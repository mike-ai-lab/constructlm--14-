import { readFileSync } from 'fs';

// Load API key
const envContent = readFileSync('.env.local', 'utf-8');
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!API_KEY) {
  console.error('❌ No API key found in .env.local');
  process.exit(1);
}

console.log('✅ API Key loaded');

// Tool definitions
const CANVAS_TOOLS = [
  {
    name: "update_canvas",
    description: "Update Canvas with patches or full rewrite",
    parameters: {
      type: "object",
      properties: {
        patches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["block_replace"] },
              oldCode: { type: "string" },
              newCode: { type: "string" },
              explanation: { type: "string" }
            }
          }
        },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        fullCode: { type: "string" },
        summary: { type: "string" }
      },
      required: ["confidence"]
    }
  }
];

// Test code with error
const BROKEN_CODE = `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8">
      <h1>Counter</h1>
      <div>{count}</div>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div
  );
}`;

const ERROR_MESSAGE = "Unexpected token, expected 'jsxTagEnd'";

async function testCanvasFix() {
  console.log('\n🧪 Testing Canvas Error Fix Feature\n');
  
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    const model = genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      tools: [{ functionDeclarations: CANVAS_TOOLS }],
      contents: [{
        role: 'user',
        parts: [{ text: `Fix this error: ${ERROR_MESSAGE}\n\nCode:\n${BROKEN_CODE}` }]
      }]
    });

    const numberedCode = BROKEN_CODE.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n');
    
    const prompt = `Fix the Canvas component error using the update_canvas tool.

ERROR: ${ERROR_MESSAGE}

CODE (with line numbers):
\`\`\`tsx
${numberedCode}
\`\`\`

Instructions:
1. Identify the exact code block causing the error
2. Use block_replace patches with exact oldCode matching
3. Set confidence to "high" if it's a simple fix
4. Use fullCode only if the fix requires major changes`;

    console.log('📤 Sending request to Gemini...\n');
    
    const result = await model;

    const response = result;
    const functionCall = response.functionCalls?.[0];
    
    if (functionCall) {
      console.log('✅ Function call received!');
      console.log('📋 Function name:', functionCall.name);
      console.log('📦 Arguments:', JSON.stringify(functionCall.args, null, 2));
      
      const { confidence, patches, fullCode, summary } = functionCall.args;
      
      console.log('\n📊 Analysis:');
      console.log('  Confidence:', confidence);
      console.log('  Patches:', patches?.length || 0);
      console.log('  Has fullCode:', !!fullCode);
      console.log('  Summary:', summary);
      
      if (patches && patches.length > 0) {
        console.log('\n🔧 Patches:');
        patches.forEach((patch, i) => {
          console.log(`\n  Patch ${i + 1}:`);
          console.log('    Type:', patch.type);
          console.log('    Old:', patch.oldCode?.substring(0, 50) + '...');
          console.log('    New:', patch.newCode?.substring(0, 50) + '...');
          console.log('    Explanation:', patch.explanation);
        });
      }
      
      console.log('\n✅ TEST PASSED - Tool calling works!');
      return true;
    } else {
      console.log('❌ No function call - got text response instead');
      console.log('Response:', response.text());
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    return false;
  }
}

testCanvasFix().then(success => {
  process.exit(success ? 0 : 1);
});
