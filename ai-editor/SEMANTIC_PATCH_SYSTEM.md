# Semantic Patch Editing System

## Overview

The Semantic Patch System enables intelligent code modification without sending the entire project to the AI model. It uses semantic analysis to identify relevant files, extract dependencies, and apply targeted patches.

## Architecture

### Components

1. **Backend (Node.js/Express)**
   - `semanticFileFinder()` - Searches for relevant files based on keywords
   - `dependencyExtractor()` - Builds minimal dependency graph (1 level deep)
   - `contextBuilder()` - Creates optimized context payload
   - `aiPatchRequester()` - Sends context to AI model
   - `parsePatches()` - Parses AI response into structured patches
   - `patchApplier()` - Applies patches with context validation
   - `debugLogger` - Comprehensive logging for debugging

2. **Frontend (JavaScript)**
   - `SemanticPatchClient` - Client-side API wrapper
   - `handleSemanticPatch()` - Detects and routes patch requests
   - `handleFullGeneration()` - Falls back to full code generation

3. **API Endpoint**
   - `POST /semantic-patch` - Main semantic patch endpoint

## Workflow

### User Request Flow

```
User: "Add parallax effect to carousel"
         ↓
[Instruction Detection]
  - Detects modification keywords (add, modify, update, etc.)
  - Routes to semantic patch system
         ↓
[Semantic File Finding]
  - Searches filenames for "carousel"
  - Scores by relevance
  - Returns: Carousel.js, Carousel.css
         ↓
[Dependency Extraction]
  - Parses imports in matched files
  - Includes direct dependencies only (1 level)
  - Returns: Carousel.js, Carousel.css
         ↓
[Context Building]
  - Formats files for AI
  - Includes instruction
  - Specifies patch format requirements
         ↓
[AI Processing]
  - AI receives minimal context
  - Returns structured patches
         ↓
[Patch Parsing]
  - Extracts PATCH blocks
  - Validates format
  - Builds patch objects
         ↓
[Patch Application]
  - Verifies context matches
  - Applies line-level diffs
  - Updates only modified lines
         ↓
[Result]
  - Files updated in editor
  - Summary shown to user
```

## Patch Format

### Request Format

```
POST /semantic-patch
{
  "instruction": "Add parallax effect to carousel",
  "files": {
    "Carousel.js": "...",
    "Carousel.css": "..."
  }
}
```

### Response Format

```json
{
  "success": true,
  "message": "Applied 3 patches",
  "results": {
    "applied": [
      {
        "filePath": "Carousel.js",
        "changes": 5
      }
    ],
    "failed": [],
    "filesModified": ["Carousel.js", "Carousel.css"]
  },
  "files": {
    "Carousel.js": "...",
    "Carousel.css": "..."
  }
}
```

### AI Patch Format

The AI must return patches in this format:

```
PATCH Carousel.js @@ line 42 @@
old line content
new line content

PATCH Carousel.css @@ line 18 @@
transform: translateZ(0);
transform: translateZ(0) perspective(1000px);
```

## Semantic File Detection

### Scoring Algorithm

Files are scored based on:

1. **Filename matches** (+10 points per keyword)
   - "carousel" in "Carousel.js" = +10

2. **Component name matches** (+8 points per keyword)
   - `export function Carousel` = +8

3. **Content keyword frequency** (+0.5 per occurrence)
   - "parallax" mentioned 3 times = +1.5

### Example

```
User: "Add parallax effect to carousel"
Keywords: ["add", "parallax", "effect", "carousel"]

Carousel.js:
  - Filename match: "carousel" = +10
  - Component: "Carousel" = +8
  - Content: "parallax" (0 times) = 0
  - Total: 18 ✓ MATCH

Carousel.css:
  - Filename match: "carousel" = +10
  - Content: "parallax" (0 times) = 0
  - Total: 10 ✓ MATCH

utils.js:
  - No matches = 0 ✗ SKIP
```

## Dependency Graph

### 1-Level Deep Strategy

Only direct imports are included:

```
Carousel.js (matched)
  ├── import Carousel from './Carousel.css' → INCLUDE
  └── import { motion } from 'framer-motion' → SKIP (external)

Carousel.css (matched)
  └── No imports → SKIP
```

### Why 1-Level?

- Keeps context minimal
- Reduces token usage
- Prevents cascading dependencies
- Focuses on relevant code

## Error Handling

### Context Mismatch

If patch context doesn't match:

```
[AI-EDITOR] Patch failed – context mismatch at line 41
Expected: const [slide, setSlide] = useState(0)
Found:    const [currentSlide, setCurrentSlide] = useState(0)
```

**Action**: Abort patch, request full file replacement

### Missing Files

If a file in patch doesn't exist:

```
[AI-EDITOR] ❌ File not found: Carousel.js
```

**Action**: Return error, suggest creating file first

### Invalid Patch Format

If AI response doesn't match expected format:

```
[AI-EDITOR] No patches found in AI response
```

**Action**: Return raw response, let user decide

## Debug Logging

All operations are logged with timestamps:

```
[08:34:12] [AI-EDITOR] User instruction received: "Add parallax effect"
[08:34:12] [AI-EDITOR] Searching semantic matches for: "add parallax effect carousel"
[08:34:12] [AI-EDITOR] Matched files: Carousel.js (score: 18), Carousel.css (score: 10)
[08:34:12] [AI-EDITOR] Parsing imports for 2 matched files
[08:34:12] [AI-EDITOR] Dependency graph built: 2 files to send
[08:34:12] [AI-EDITOR] Building context payload
[08:34:12] [AI-EDITOR] Context payload built: 2 files, 1245 chars
[08:34:12] [AI-EDITOR] Awaiting AI patch response...
[08:34:15] [AI-EDITOR] ✓ AI response received
[08:34:15] [AI-EDITOR] Patches parsed: 3 patches found
[08:34:15] [AI-EDITOR] Applying patches...
[08:34:15] [AI-EDITOR] Applying patch to Carousel.js
[08:34:15] [AI-EDITOR] ✓ Patch applied to Carousel.js
[08:34:15] [AI-EDITOR] Applying patch to Carousel.css
[08:34:15] [AI-EDITOR] ✓ Patch applied to Carousel.css
[08:34:15] [AI-EDITOR] ✅ Patches applied successfully
```

## Usage Examples

### Example 1: Add Feature

```
User: "Add smooth parallax effect to carousel images"

System:
  1. Finds: Carousel.js, Carousel.css
  2. Sends: Both files (~1.5KB)
  3. AI returns: 3 patches
  4. Result: Parallax effect added
```

### Example 2: Fix Bug

```
User: "Fix the carousel not stopping at the last slide"

System:
  1. Finds: Carousel.js
  2. Sends: Carousel.js (~2KB)
  3. AI returns: 1 patch
  4. Result: Bug fixed
```

### Example 3: Refactor

```
User: "Refactor carousel to use hooks instead of state"

System:
  1. Finds: Carousel.js
  2. Sends: Carousel.js (~2KB)
  3. AI returns: 5 patches
  4. Result: Refactored to hooks
```

## Performance Metrics

### Token Savings

**Without Semantic Patches:**
- Send entire project: 50KB = ~12,500 tokens
- AI response: ~2,000 tokens
- Total: ~14,500 tokens

**With Semantic Patches:**
- Send matched files: 2KB = ~500 tokens
- AI response: ~500 tokens
- Total: ~1,000 tokens

**Savings: 93% reduction** ✓

### Speed

- File matching: <10ms
- Dependency extraction: <20ms
- Context building: <50ms
- AI request: 2-5 seconds
- Patch application: <100ms

**Total: 2-5 seconds** (vs 5-10 seconds with full project)

## Configuration

### API Endpoint

```javascript
const client = new SemanticPatchClient('http://localhost:5000')
```

### AI Model

Currently uses: `mixtral-8x7b-32768` (Groq)

Can be changed in `server.js`:

```javascript
body: JSON.stringify({
  model: 'mixtral-8x7b-32768', // Change here
  messages: [...]
})
```

### Temperature

Set to `0.3` for deterministic patches (low creativity)

## Limitations

1. **1-Level Dependencies Only**
   - Doesn't follow deep import chains
   - Solution: User can request specific files

2. **Keyword-Based Matching**
   - May miss files with different naming
   - Solution: Use descriptive component names

3. **Line-Based Patches**
   - Doesn't handle structural changes well
   - Solution: Request full file replacement if needed

4. **Context Validation**
   - Requires exact line matches
   - Solution: Abort and request full replacement

## Future Enhancements

1. **Multi-Level Dependencies**
   - Follow imports recursively
   - Configurable depth limit

2. **Semantic Code Analysis**
   - Parse AST for better matching
   - Understand component relationships

3. **Patch Conflict Resolution**
   - Handle overlapping patches
   - Merge conflicting changes

4. **Incremental Updates**
   - Cache dependency graphs
   - Reuse for similar requests

5. **Patch History**
   - Track all patches applied
   - Undo/redo support

## Troubleshooting

### No Files Matched

**Problem**: "No matching files found"

**Solution**:
- Use more specific keywords
- Check file naming conventions
- Try full generation instead

### Patch Context Mismatch

**Problem**: "Context mismatch at line 41"

**Solution**:
- File was modified since request
- Request full file replacement
- Refresh and try again

### AI Response Invalid

**Problem**: "No patches found in AI response"

**Solution**:
- AI didn't follow patch format
- Check console for raw response
- Try simpler instruction

### Performance Issues

**Problem**: Slow patch application

**Solution**:
- Check network latency
- Verify AI model availability
- Try with fewer files

## API Reference

### SemanticPatchClient

```javascript
// Initialize
const client = new SemanticPatchClient('http://localhost:5000')

// Request patches
const result = await client.requestPatches(instruction, files)

// Get summary
const summary = client.getSummary(result)
```

### Server Endpoints

```
POST /semantic-patch
  - Request: { instruction, files }
  - Response: { success, results, files }

POST /edit
  - Request: { instruction, files, currentFile }
  - Response: { code } or { files }

GET /health
  - Response: { status, groqConfigured }
```

## Contributing

To improve the semantic patch system:

1. Enhance `semanticFileFinder()` for better matching
2. Improve `parsePatches()` for more formats
3. Add more error handling in `patchApplier()`
4. Optimize dependency extraction
5. Add support for more file types

## License

Part of AI Code Editor project
