# Canvas Error Fix Feature - Complete Code Reference

## Overview
This feature allows users to click "Ask AI to Fix" when there's a rendering error in the Canvas component. The AI analyzes the error and source code, then applies semantic patches to fix the issue.

## Problem Statement
When a user creates a React component with a syntax error (e.g., missing `>`), the Canvas shows an error. The user can click "Ask AI to Fix" to automatically fix the error. However, the AI is currently:
1. Misidentifying which line has the error
2. Providing incorrect patches
3. Not properly applying fixes to the code

## Current Issue Example

**User deletes `>` from line 55:**
```jsx
      </div    // Missing >
```

**Error shown:**
```
/component.tsx: Unexpected token, expected "jsxTagEnd" (58:4)
  56 |         ))}
  57 |       </div
> 58 |     </div>
```

**AI incorrectly responds with:**
```
PATCH @@ line 55 @@
<div className="absolute bottom-0 flex justify-center items-center w-full">
<div className="absolute bottom-0 flex justify-center items-center w-full">
```

This is wrong because:
- Line 55 has `</div` (closing tag) not `<div` (opening tag)
- The AI is fixing line 46 (opening tag) instead of line 55 (closing tag)

---

## Code Implementation

### 1. App.tsx - Main Error Fix Handler

```typescript
const handleFixCanvasError = async (code: string) => {
  if (isFixingError) {
    return;
  }

  console.log('========================================');
  console.log('[CANVAS FIX] STARTING ERROR FIX PROCESS');
  console.log('========================================');
  console.log('[CANVAS FIX] Input code length:', code.length);
  console.log('[CANVAS FIX] Input code preview:', code.substring(0, 200) + '...');
  console.log('[CANVAS FIX] Canvas error:', canvasError);

  setIsFixingError(true);
  
  try {
    const errorMsg = canvasError?.message || 'Unknown error';
    
    // CRITICAL FIX: Use the ORIGINAL source code from Canvas, not the transpiled error code
    // The error line numbers are from transpiled code, but we need to fix the source
    const sourceCode = code; // This is the original source from Canvas editor
    
    console.log('[CANVAS FIX] Source code lines:', sourceCode.split('\n').length);
    console.log('[CANVAS FIX] Error message:', errorMsg);
    console.log('[CANVAS FIX] Full source code:');
    console.log('--- SOURCE CODE START ---');
    console.log(sourceCode);
    console.log('--- SOURCE CODE END ---');
    
    // Send the ENTIRE source code as context since we can't map transpiled line numbers to source
    const lines = sourceCode.split('\n');
    const contextLines = lines.map((line, idx) => 
      `  ${idx + 1} | ${line}`
    ).join('\n');
    
    // Semantic patch prompt - WELL STRUCTURED with clear sections
    const errorFixPrompt = `# CODE ERROR FIX REQUEST

## ERROR DETAILS
${errorMsg}

## FULL SOURCE CODE (with line numbers)
${contextLines}

## INSTRUCTIONS
The error above is from transpiled code. You need to find and fix the actual error in the SOURCE CODE above.

**CRITICAL**: Look at the EXACT line number mentioned in the error. The broken code is ON THAT LINE in the source code above.

Common issues:
- Missing closing brackets: }, ), ], >
- Missing opening brackets: {, (, [, <
- Missing semicolons
- Unclosed strings or template literals
- Mismatched JSX tags

**IMPORTANT**: If the error says "expected jsxTagEnd", look for a CLOSING tag (</...>) that is missing the final >.

### PATCH FORMAT (CRITICAL - READ CAREFULLY)
Each patch must be EXACTLY 3 lines:

Line 1: PATCH @@ line X @@
Line 2: old code (the EXACT broken line from source code - copy it EXACTLY)
Line 3: new code (the fixed version of that line)

### RULES
1. Each patch is 3 lines - no more, no less
2. Put your explanation BEFORE the patches
3. Do NOT put explanation text after the new code line
4. Use line numbers from the SOURCE CODE above (not from error message)
5. Copy the old code EXACTLY as it appears - don't change anything except the fix
6. Only fix the specific error - don't change other code

### CORRECT EXAMPLE
Fixed missing closing bracket on div tag at line 55.

PATCH @@ line 55 @@
      </div
      </div>

### WRONG EXAMPLE (DO NOT DO THIS)
PATCH @@ line 55 @@
<div className="...">
<div className="...">

## YOUR RESPONSE
Provide: Brief explanation, then patches in the format above.`;

    console.log('[CANVAS FIX] Prompt being sent to AI:');
    console.log('--- PROMPT START ---');
    console.log(errorFixPrompt);
    console.log('--- PROMPT END ---');

    // Send to chat
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: errorFixPrompt,
      timestamp: Date.now(),
      inputTokens: GeminiService.estimateTokens(errorFixPrompt),
      metadata: {
        isErrorFix: true,
        errorCode: code
      }
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Get citations
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
    
    console.log('[CANVAS FIX] Starting AI streaming...');
    
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
        errorFixPrompt,
        messages,
        citations,
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
          ));
        },
        apiKey,
        selectedModel,
        undefined,
        ollamaBaseUrl,
        ollamaMode === 'cloud'
      );
    } else {
      await streamService.streamChatResponse(
        errorFixPrompt,
        messages,
        citations,
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
          ));
        },
        apiKey,
        selectedModel,
        undefined
      );
    }

    console.log('[CANVAS FIX] AI response received:');
    console.log('--- AI RESPONSE START ---');
    console.log(accumulatedText);
    console.log('--- AI RESPONSE END ---');
    console.log('[CANVAS FIX] AI response length:', accumulatedText.length);

    // Parse patches from AI response
    console.log('[CANVAS FIX] Parsing patches from AI response...');
    const patches = parsePatchesFromResponse(accumulatedText);
    
    console.log('[CANVAS FIX] Patches parsed:', patches.length);
    patches.forEach((patch, idx) => {
      console.log(`[CANVAS FIX] Patch ${idx + 1}:`, patch);
    });
    
    if (patches.length > 0) {
      console.log('[CANVAS FIX] Applying patches to source code...');
      console.log('[CANVAS FIX] Source code before patching:');
      console.log('--- BEFORE PATCH ---');
      console.log(code);
      console.log('--- BEFORE PATCH END ---');
      
      // Apply patches to the SOURCE code (the original code from editor)
      const patchedCode = applyPatchesToCode(code, patches);
      
      console.log('[CANVAS FIX] Source code after patching:');
      console.log('--- AFTER PATCH ---');
      console.log(patchedCode);
      console.log('--- AFTER PATCH END ---');
      
      console.log(`[CANVAS FIX] Applied ${patches.length} patch(es) inline`);
      console.log('[CANVAS FIX] Patched code preview:', patchedCode.substring(0, 200) + '...');
      
      // Create a new version with the patched code
      const newVersion = { code: patchedCode, timestamp: Date.now() };
      const updatedVersions = [...canvasVersions.slice(0, canvasVersionIndex + 1), newVersion];
      
      console.log('[CANVAS FIX] Creating new version...');
      console.log('[CANVAS FIX] Previous versions count:', canvasVersions.length);
      console.log('[CANVAS FIX] New versions count:', updatedVersions.length);
      console.log('[CANVAS FIX] New version index:', updatedVersions.length - 1);
      
      // Update versions and index
      setCanvasVersions(updatedVersions);
      setCanvasVersionIndex(updatedVersions.length - 1);
      
      // Update canvas code to trigger re-render
      setCanvasCode(patchedCode);
      setCanvasError(null);
      
      console.log('[CANVAS FIX] Canvas state updated successfully');
      console.log('========================================');
      console.log('[CANVAS FIX] FIX PROCESS COMPLETED');
      console.log('========================================');
      
    } else {
      console.log('[CANVAS FIX] No patches found, trying fallback...');
      // Fallback: try to extract full code if AI didn't follow patch format
      const codeMatch = accumulatedText.match(/```(?:jsx|tsx|js|typescript)?\s*\n([\s\S]*?)```/);
      if (codeMatch) {
        const fixedCode = codeMatch[1].trim();
        
        console.log('[CANVAS FIX] Found code block in AI response');
        console.log('[CANVAS FIX] Fixed code:');
        console.log('--- FIXED CODE ---');
        console.log(fixedCode);
        console.log('--- FIXED CODE END ---');
        
        // Create a new version with the fixed code
        const newVersion = { code: fixedCode, timestamp: Date.now() };
        const updatedVersions = [...canvasVersions.slice(0, canvasVersionIndex + 1), newVersion];
        
        setCanvasVersions(updatedVersions);
        setCanvasVersionIndex(updatedVersions.length - 1);
        setCanvasCode(fixedCode);
        setCanvasError(null);
        console.log('[CANVAS FIX] Applied full code replacement (fallback)');
        console.log('========================================');
        console.log('[CANVAS FIX] FIX PROCESS COMPLETED (FALLBACK)');
        console.log('========================================');
      } else {
        console.warn('[CANVAS FIX] No patches or code found in AI response');
        console.warn('[CANVAS FIX] AI response was:', accumulatedText);
        console.log('========================================');
        console.log('[CANVAS FIX] FIX PROCESS FAILED - NO PATCHES');
        console.log('========================================');
      }
    }

    // Mark message as complete
    setMessages(prev => prev.map(msg => 
      msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
    ));
    
  } catch (error) {
    console.error('========================================');
    console.error('[CANVAS FIX] ERROR IN FIX PROCESS');
    console.error('========================================');
    console.error('[handleFixCanvasError] Error:', error);
    console.error('[handleFixCanvasError] Error stack:', error instanceof Error ? error.stack : 'No stack');
    alert('Failed to fix error: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    console.log('[CANVAS FIX] Cleaning up...');
    setIsFixingError(false);
    setIsStreaming(false);
    console.log('[CANVAS FIX] Cleanup complete');
  }
};
```

### 2. Patch Parser Function

```typescript
// Parse PATCH format from AI response
const parsePatchesFromResponse = (response: string): Array<{line: number, oldContent: string, newContent: string}> => {
  const patches: Array<{line: number, oldContent: string, newContent: string}> = [];
  
  console.log('========================================');
  console.log('[PATCH PARSER] Starting patch parsing');
  console.log('========================================');
  console.log('[Patch Parser] Raw response length:', response.length);
  console.log('[Patch Parser] Raw response:', response);
  
  // Clean up response - remove code blocks if present
  let cleanResponse = response.replace(/```[a-z]*\n?/gi, '').trim();
  console.log('[Patch Parser] Cleaned response:', cleanResponse);
  
  // Try standard format first (with newlines) - STRICT 3-line format
  // Match: PATCH @@ line X @@ \n old \n new
  const standardRegex = /PATCH\s+@@\s+line\s+(\d+)\s+@@\s*\n([^\n]+)\n([^\n]+)/gi;
  
  console.log('[Patch Parser] Trying standard format regex...');
  let match;
  while ((match = standardRegex.exec(cleanResponse)) !== null) {
    const lineNum = parseInt(match[1]);
    let oldContent = match[2].trim();
    let newContent = match[3].trim();
    
    console.log('[Patch Parser] Found match:', match[0]);
    console.log('[Patch Parser] Line number:', lineNum);
    console.log('[Patch Parser] Old content (raw):', match[2]);
    console.log('[Patch Parser] New content (raw):', match[3]);
    
    // Remove +/- prefixes and labels if present
    oldContent = oldContent.replace(/^[-]\s*/, '').replace(/^old line content:\s*/i, '');
    newContent = newContent.replace(/^[+]\s*/, '').replace(/^new line content:\s*/i, '');
    
    patches.push({
      line: lineNum,
      oldContent,
      newContent
    });
    console.log(`[Patch Parsed] Line ${lineNum}:`);
    console.log(`  Old: "${oldContent}"`);
    console.log(`  New: "${newContent}"`);
  }
  
  // If no patches found, try compact format (all on one line) - FALLBACK
  if (patches.length === 0) {
    console.log('[Patch Parser] No patches found with standard format');
    console.log('[Patch Parser] Trying compact format (fallback)...');
    
    // Match: PATCH @@ line X @@oldnew (everything on one line)
    const compactRegex = /PATCH\s+@@\s+line\s+(\d+)\s+@@([^\n]+)/gi;
    
    while ((match = compactRegex.exec(cleanResponse)) !== null) {
      const lineNum = parseInt(match[1]);
      const content = match[2].trim();
      
      console.log('[Patch Parser] Found compact match:', match[0]);
      console.log('[Patch Parser] Line number:', lineNum);
      console.log('[Patch Parser] Content:', content);
      
      // Try to split the content - look for common patterns
      // Pattern 1: </tag</tag> or <tag<tag>
      const tagMatch = content.match(/^(<[^>]*)(><[^>]*>)$/);
      if (tagMatch) {
        const oldContent = tagMatch[1];
        const newContent = tagMatch[1] + '>';
        
        patches.push({
          line: lineNum,
          oldContent,
          newContent
        });
        console.log(`[Patch Parsed - Compact] Line ${lineNum}:`);
        console.log(`  Old: "${oldContent}"`);
        console.log(`  New: "${newContent}"`);
        continue;
      }
      
      // Pattern 2: Look for duplicate content (old and new are similar)
      const halfLen = Math.floor(content.length / 2);
      const firstHalf = content.substring(0, halfLen);
      const secondHalf = content.substring(halfLen);
      
      console.log('[Patch Parser] Trying to split content in half...');
      console.log('[Patch Parser] First half:', firstHalf);
      console.log('[Patch Parser] Second half:', secondHalf);
      
      if (firstHalf.length > 0 && secondHalf.startsWith(firstHalf.substring(0, Math.min(10, firstHalf.length)))) {
        patches.push({
          line: lineNum,
          oldContent: firstHalf,
          newContent: secondHalf
        });
        console.log(`[Patch Parsed - Compact Split] Line ${lineNum}:`);
        console.log(`  Old: "${firstHalf}"`);
        console.log(`  New: "${secondHalf}"`);
      }
    }
  }
  
  console.log(`[Patch Parser] Found ${patches.length} patch(es)`);
  console.log('========================================');
  console.log('[PATCH PARSER] Parsing complete');
  console.log('========================================');
  return patches;
};
```

### 3. Patch Applier Function

```typescript
// Apply patches to code inline
const applyPatchesToCode = (code: string, patches: Array<{line: number, oldContent: string, newContent: string}>): string => {
  const lines = code.split('\n');
  
  console.log(`[Patch Applier] Total lines in code: ${lines.length}`);
  
  // Sort patches by line number (descending) to avoid offset issues
  const sortedPatches = [...patches].sort((a, b) => b.line - a.line);
  
  for (const patch of sortedPatches) {
    const lineIndex = patch.line - 1; // Convert to 0-based index
    
    // First try exact line number
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const currentLine = lines[lineIndex].trim();
      const expectedLine = patch.oldContent.trim();
      
      console.log(`[Patch Applier] Line ${patch.line}:`);
      console.log(`  Current: "${lines[lineIndex]}"`);
      console.log(`  Expected: "${patch.oldContent}"`);
      console.log(`  New: "${patch.newContent}"`);
      
      // Check if line matches (trim whitespace for comparison)
      if (currentLine === expectedLine) {
        lines[lineIndex] = patch.newContent;
        console.log(`[Patch Applied] Line ${patch.line} replaced (exact match)`);
        continue;
      }
    }
    
    // If exact line doesn't match, search for the line in nearby area (±10 lines)
    const searchStart = Math.max(0, lineIndex - 10);
    const searchEnd = Math.min(lines.length, lineIndex + 10);
    let found = false;
    
    for (let i = searchStart; i < searchEnd; i++) {
      if (lines[i].trim() === patch.oldContent.trim()) {
        console.log(`[Patch Applied] Found matching line at ${i + 1} (searched near ${patch.line})`);
        lines[i] = patch.newContent;
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.warn(`[Patch Skipped] Could not find line matching: "${patch.oldContent}"`);
    }
  }
  
  return lines.join('\n');
};
```

---

## Key Issues to Fix

### Issue 1: AI Misidentifying the Error Line
The AI is confusing opening tags `<div>` with closing tags `</div>`. When the error says line 55 has `</div` (missing `>`), the AI is providing a patch for `<div className="...">` instead.

**Suggested Fix:**
- Improve the prompt to explicitly tell the AI to look at the EXACT line number
- Add examples showing closing tag fixes vs opening tag fixes
- Emphasize that "jsxTagEnd" errors are about CLOSING tags

### Issue 2: Patch Format Inconsistency
The AI sometimes puts everything on one line instead of 3 separate lines.

**Current Handling:**
- Parser has fallback for compact format
- But it's not reliable for all cases

**Suggested Fix:**
- Make the prompt even more explicit about the 3-line format
- Show multiple examples of correct vs incorrect format
- Add validation in the parser to reject malformed patches

### Issue 3: Line Number Mismatch
The error line numbers from transpiled code don't match source code line numbers.

**Current Solution:**
- Send the ENTIRE source code with line numbers
- Tell AI to use source code line numbers, not error line numbers

**Potential Issue:**
- AI might still be confused by the error message showing different line numbers

---

## Testing Scenario

1. Create a React component in Canvas
2. Delete a `>` from a closing tag (e.g., `</div` instead of `</div>`)
3. Error appears
4. Click "Ask AI to Fix"
5. Check console logs to see:
   - What prompt was sent
   - What AI responded
   - What patches were parsed
   - What code was applied

**Expected Result:**
- AI should identify the correct line with the missing `>`
- AI should provide patch: `</div` → `</div>`
- Patch should be applied to the correct line
- Error should be fixed

**Current Result:**
- AI identifies wrong line (opening tag instead of closing tag)
- Patch is applied to wrong line
- Error persists

---

## Questions for Assistant

1. How can we make the AI better understand the difference between opening and closing tags?
2. Should we parse the error message differently to extract the actual broken line?
3. Would it help to show the AI the specific line that has the error, highlighted?
4. Should we add more validation to reject patches that don't make sense?
5. Is there a better way to map transpiled error line numbers to source line numbers?
