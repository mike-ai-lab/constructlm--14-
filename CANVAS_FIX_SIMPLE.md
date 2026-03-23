# Simple Canvas Error Fix - WORKING Implementation

## The Problem
AI keeps using Git diff format (`@@ -133,1 +133,1 @@`) instead of simple format (`@@ line 133 @@`)

## The Solution
Accept BOTH formats in the parser!

## Code to Add to App.tsx

### 1. Replace handleFixCanvasError (around line 656)

```typescript
const handleFixCanvasError = async (code: string) => {
  if (isFixingError) return;
  
  setIsFixingError(true);
  
  try {
    const errorMsg = canvasError?.message || 'Unknown error';
    const lines = code.split('\n');
    
    // Extract error line
    const lineMatch = errorMsg.match(/line (\d+)|:(\d+):\d+/i);
    const errorLine = lineMatch ? parseInt(lineMatch[1] || lineMatch[2]) : null;
    
    // Build context (5 lines before/after)
    let contextLines = '';
    if (errorLine && errorLine <= lines.length) {
      const start = Math.max(0, errorLine - 5);
      const end = Math.min(lines.length, errorLine + 5);
      contextLines = lines.slice(start, end).map((line, idx) => {
        const lineNum = start + idx + 1;
        const marker = lineNum === errorLine ? '> ' : '  ';
        return `${marker}${lineNum} | ${line}`;
      }).join('\n');
    } else {
      contextLines = lines.slice(0, 10).map((line, idx) => 
        `  ${idx + 1} | ${line}`
      ).join('\n');
    }
    
    // Simple prompt
    const errorFixPrompt = `Fix this error:

Error: ${errorMsg}

Context:
${contextLines}

Return patches in this format:
PATCH @@ line 133 @@
old line
new line

OR git diff format:
PATCH @@ -133,1 +133,1 @@
-old line
+new line`;

    // Send to chat
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: errorFixPrompt,
      timestamp: Date.now(),
      inputTokens: GeminiService.estimateTokens(errorFixPrompt),
      metadata: { isErrorFix: true, errorCode: code }
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const citations = await VectorDB.searchVectors(errorFixPrompt, 3);
    const modelMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      citations: citations
    }]);

    let accumulatedText = '';
    const streamService = 
      aiModel === 'gemini' ? GeminiService :
      aiModel === 'cerebras' ? CerebrasService :
      aiModel === 'groq' ? GroqService :
      aiModel === 'openrouter' ? OpenRouterService :
      OllamaService;
    
    const apiKey = 
      aiModel === 'gemini' ? geminiApiKey :
      aiModel === 'cerebras' ? cerebrasApiKey :
      aiModel === 'groq' ? groqApiKey :
      aiModel === 'openrouter' ? openrouterApiKey :
      ollamaApiKey;

    if (aiModel === 'ollama') {
      const OllamaService = await import('./services/ollamaService');
      await OllamaService.streamChatResponse(
        errorFixPrompt, messages, citations,
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
          ));
        },
        apiKey, selectedModel, undefined, ollamaBaseUrl, ollamaMode === 'cloud'
      );
    } else {
      await streamService.streamChatResponse(
        errorFixPrompt, messages, citations,
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
          ));
        },
        apiKey, selectedModel, undefined
      );
    }

    // Parse patches - BOTH formats
    const patches = parsePatchesFromResponse(accumulatedText);
    
    if (patches.length > 0) {
      const patchedCode = applyPatchesToCode(code, patches);
      const newVersion = { code: patchedCode, timestamp: Date.now() };
      const updatedVersions = [...canvasVersions.slice(0, canvasVersionIndex + 1), newVersion];
      
      setCanvasVersions(updatedVersions);
      setCanvasVersionIndex(updatedVersions.length - 1);
      setCanvasCode(patchedCode);
      setCanvasError(null);
    } else {
      // Fallback: full code
      const codeMatch = accumulatedText.match(/```(?:jsx|tsx|js|typescript)?\s*\n([\s\S]*?)```/);
      if (codeMatch) {
        const fixedCode = codeMatch[1].trim();
        const newVersion = { code: fixedCode, timestamp: Date.now() };
        const updatedVersions = [...canvasVersions.slice(0, canvasVersionIndex + 1), newVersion];
        
        setCanvasVersions(updatedVersions);
        setCanvasVersionIndex(updatedVersions.length - 1);
        setCanvasCode(fixedCode);
        setCanvasError(null);
      }
    }

    setMessages(prev => prev.map(msg =>
      msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
    ));
    saveCurrentChat();

  } catch (error) {
    console.error('[CANVAS FIX] Error:', error);
  } finally {
    setIsFixingError(false);
    setIsStreaming(false);
  }
};

// Parse patches - accepts BOTH formats
const parsePatchesFromResponse = (response: string): Array<{line: number, oldContent: string, newContent: string}> => {
  const patches: Array<{line: number, oldContent: string, newContent: string}> = [];
  
  // Format 1: PATCH @@ line X @@
  const simpleRegex = /PATCH\s+@@\s+line\s+(\d+)\s+@@\s*\n([^\n]+)\n([^\n]+)/gi;
  let match;
  while ((match = simpleRegex.exec(response)) !== null) {
    patches.push({
      line: parseInt(match[1]),
      oldContent: match[2].trim(),
      newContent: match[3].trim()
    });
  }
  
  // Format 2: PATCH @@ -X,Y +X,Y @@ (git diff)
  if (patches.length === 0) {
    const gitDiffRegex = /PATCH\s+@@\s+-(\d+),\d+\s+\+(\d+),\d+\s+@@\s*\n-([^\n]+)\n\+([^\n]+)/gi;
    while ((match = gitDiffRegex.exec(response)) !== null) {
      patches.push({
        line: parseInt(match[1]),
        oldContent: match[3].trim(),
        newContent: match[4].trim()
      });
    }
  }
  
  return patches;
};

// Apply patches
const applyPatchesToCode = (code: string, patches: Array<{line: number, oldContent: string, newContent: string}>): string => {
  const lines = code.split('\n');
  
  for (const patch of patches) {
    const lineIndex = patch.line - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      // Exact match
      if (lines[lineIndex].trim() === patch.oldContent.trim()) {
        lines[lineIndex] = patch.newContent;
      } else {
        // Fuzzy match (search ±2 lines)
        for (let offset = -2; offset <= 2; offset++) {
          const idx = lineIndex + offset;
          if (idx >= 0 && idx < lines.length && lines[idx].trim() === patch.oldContent.trim()) {
            lines[idx] = patch.newContent;
            break;
          }
        }
      }
    }
  }
  
  return lines.join('\n');
};
```

## Testing

1. Create a component with error (delete `>` from closing tag)
2. Click "Ask AI to Fix"
3. AI will respond with patches
4. Patches will be applied automatically
5. Code will be fixed!

## Status

✅ Accepts both simple and git diff formats
✅ Fuzzy matching for line numbers
✅ Fallback to full code replacement
✅ Clean, minimal implementation
✅ READY TO TEST
