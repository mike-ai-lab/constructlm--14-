# Canvas Error Fix - Implementation Plan

## Summary
Replace the current over-complex implementation with a SIMPLE version that accepts BOTH patch formats (simple and git diff).

## Changes Required

### 1. Simplify the Prompt (Line ~720)
**Current**: 150+ lines of complex instructions
**New**: 20 lines, clear and simple

```typescript
const errorFixPrompt = `Fix this error:

Error: ${errorMsg}

Context (lines around error):
${contextLines}

Return patches in this format (you can use either):

Format 1 (simple):
PATCH @@ line 133 @@
</div
</div>

Format 2 (git diff):
PATCH @@ -133,1 +133,1 @@
-</div
+</div>

Just return the patches, nothing else.`;
```

### 2. Replace parsePatchesFromResponse (Line ~987)
**Current**: 100+ lines with complex fallbacks
**New**: 40 lines, accepts BOTH formats

```typescript
const parsePatchesFromResponse = (response: string): Array<{line: number, oldContent: string, newContent: string}> => {
  const patches: Array<{line: number, oldContent: string, newContent: string}> = [];
  
  // Format 1: Simple format - PATCH @@ line X @@
  const simpleRegex = /PATCH\s+@@\s+line\s+(\d+)\s+@@\s*\n([^\n]+)\n([^\n]+)/gi;
  let match;
  
  while ((match = simpleRegex.exec(response)) !== null) {
    patches.push({
      line: parseInt(match[1]),
      oldContent: match[2].trim().replace(/^[-]\s*/, ''),
      newContent: match[3].trim().replace(/^[+]\s*/, '')
    });
  }
  
  // Format 2: Git diff format - PATCH @@ -X,Y +X,Y @@
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
```

### 3. Replace applyPatchesToCode (Line ~1030)
**Current**: 80+ lines with complex validation
**New**: 30 lines, simple fuzzy matching

```typescript
const applyPatchesToCode = (code: string, patches: Array<{line: number, oldContent: string, newContent: string}>): string => {
  const lines = code.split('\n');
  
  for (const patch of patches) {
    const lineIndex = patch.line - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      // Try exact match first
      if (lines[lineIndex].trim() === patch.oldContent.trim()) {
        lines[lineIndex] = patch.newContent;
      } else {
        // Fuzzy match - search ±2 lines
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

### 4. Simplify Logging
Remove excessive console.log statements, keep only essential ones:
- Start/end of process
- Error line number
- Patches found
- Patches applied

## Benefits

1. **Accepts Git Diff Format** - AI naturally outputs this format
2. **Simpler Code** - 90 lines vs 300+ lines
3. **Easier to Debug** - Clear, minimal logging
4. **Fuzzy Matching** - Handles line number mismatches
5. **Fallback** - Still extracts full code if needed

## Testing Plan

1. Create component with syntax error (delete `>` from closing tag)
2. Click "Ask AI to Fix"
3. Verify AI response is parsed correctly
4. Verify patches are applied
5. Verify code is fixed in editor
6. Verify Canvas updates and error clears

## Risk Assessment

**Low Risk** - The changes are:
- Replacing existing functions with simpler versions
- No changes to state management
- No changes to UI components
- Fallback mechanism still in place

## Rollback Plan

If it doesn't work:
```bash
git checkout App.tsx
```

## Status

✅ Plan created
⏳ Ready for implementation
⏳ Awaiting user approval
