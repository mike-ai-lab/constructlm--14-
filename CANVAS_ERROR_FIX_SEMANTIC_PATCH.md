# Canvas Error Fix - Semantic Patch Implementation

## Problem Identified

When "Ask AI to Fix" was clicked:
1. AI returned explanation + code snippet (not full code)
2. Code extraction regex found the snippet and created a NEW code card
3. Canvas wasn't updated inline
4. User saw duplicate code cards instead of seamless fix

## Solution Implemented

### Semantic Patch Approach

Instead of requesting full code replacement, we now:

1. **Request PATCH format from AI**
   - Minimal prompt with error details
   - Explicit PATCH format specification
   - No full code requested

2. **Parse PATCH format**
   - Extract line-by-line patches
   - Format: `PATCH @@ line X @@`
   - Old content → New content

3. **Apply patches inline**
   - Modify only affected lines
   - Preserve rest of code
   - Update Canvas version automatically

4. **Fallback to full code**
   - If AI doesn't follow PATCH format
   - Extract code block as before
   - Ensures backward compatibility

## PATCH Format Specification

### AI Response Format
```
Fixed [brief description]

PATCH @@ line 131 @@
          </div              
          </div>

PATCH @@ line 145 @@
old content here
new content here
```

### Parsing Logic
- Regex: `/PATCH\s+@@\s+line\s+(\d+)\s+@@\s*\n(.*?)\n(.*?)(?=\n\nPATCH|$)/gs`
- Extracts: line number, old content, new content
- Supports multiple patches in single response

### Application Logic
1. Split code into lines array
2. Sort patches by line number (descending to avoid offset issues)
3. For each patch:
   - Verify line exists
   - Check context matches (fuzzy match)
   - Replace line with new content
   - Log success/skip
4. Join lines back into code string
5. Update Canvas

## Benefits

### Token Efficiency
- **Before**: Full code sent/received (~2000+ tokens)
- **After**: Only patches sent/received (~100-200 tokens)
- **Savings**: 90%+ reduction

### User Experience
- No duplicate code cards
- Seamless inline fix
- Version history updated automatically
- Clear confirmation message

### Performance
- Faster AI response (less tokens to generate)
- Faster rendering (only changed lines)
- Less network bandwidth

## Implementation Details

### New Functions

1. **`parsePatchesFromResponse(response: string)`**
   - Parses PATCH format from AI response
   - Returns array of patch objects
   - Handles multiple patches

2. **`applyPatchesToCode(code: string, patches: Array)`**
   - Applies patches to code inline
   - Context validation (fuzzy matching)
   - Handles out-of-range lines gracefully

### Updated Prompt

```typescript
const errorFixPrompt = `Fix this error using PATCH format (do NOT return full code):

Error: ${errorMsg}
${lineNumber ? `Line: ${lineNumber}` : ''}

Return ONLY patches in this format:
PATCH @@ line X @@
old line content
new line content

Example:
PATCH @@ line 131 @@
          </div              
          </div>

Respond with: "Fixed [brief description]" followed by patches.`;
```

### Fallback Mechanism

If AI doesn't follow PATCH format:
```typescript
// Fallback: try to extract full code
const codeMatch = accumulatedText.match(/```(?:jsx|tsx|js|typescript)?\s*\n([\s\S]*?)```/);
if (codeMatch) {
  const fixedCode = codeMatch[1].trim();
  setCanvasCode(fixedCode);
  console.log('[Canvas Fix] Applied full code replacement (fallback)');
}
```

## Testing Checklist

- [ ] Create component with syntax error
- [ ] Click "Ask AI to Fix"
- [ ] Verify AI returns PATCH format
- [ ] Verify patches applied inline
- [ ] Verify Canvas updates without new code card
- [ ] Verify version history increments
- [ ] Verify error overlay disappears
- [ ] Test fallback with non-PATCH response
- [ ] Test multiple patches in single fix
- [ ] Test out-of-range line numbers
- [ ] Test context mismatch handling

## Console Logs

### Success Case
```
[Canvas Fix] Applied 1 patch(es) inline
[Patch Applied] Line 131: "</div              " -> "</div>"
```

### Context Mismatch
```
[Patch Skipped] Line 131 context mismatch. Expected: "</div>", Found: "</section>"
```

### Out of Range
```
[Patch Skipped] Line 500 out of range (total lines: 150)
```

### Fallback
```
[Canvas Fix] Applied full code replacement (fallback)
```

## Future Enhancements

1. **Diff View**
   - Show before/after comparison
   - Highlight changed lines
   - User can review before applying

2. **Multi-file Patches**
   - Support patches across multiple files
   - Coordinate Canvas + external files

3. **Undo/Redo**
   - Track patch history
   - Allow reverting individual patches

4. **Smart Context Matching**
   - Fuzzy matching with Levenshtein distance
   - Handle whitespace differences
   - Auto-adjust line numbers if nearby match found

5. **Batch Patches**
   - Queue multiple fix requests
   - Apply all patches at once
   - Show combined diff

## Related Files

- `App.tsx` - Main implementation
- `components/Canvas.tsx` - Error overlay UI
- `ai-editor/js/semanticPatchClient.js` - Reference implementation
- `ai-editor/SEMANTIC_PATCH_SYSTEM.md` - Full documentation

## Status

✅ Implemented
✅ Compiles without errors
⏳ Ready for testing
