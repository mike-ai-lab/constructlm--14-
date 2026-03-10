# Semantic Patch System - Quick Start

## What It Does

Instead of sending your entire project to the AI, the semantic patch system:

1. **Finds relevant files** based on your instruction
2. **Extracts only dependencies** (1 level deep)
3. **Sends minimal context** to the AI
4. **Applies targeted patches** to specific files
5. **Updates only changed lines** in your editor

## How to Use

### Step 1: Create Your Project

Create some files in the editor:

```
Carousel.js
Carousel.css
App.js
```

### Step 2: Ask for Modifications

Instead of "Create a carousel", ask for modifications:

```
"Add parallax effect to carousel"
"Fix carousel not stopping at last slide"
"Make carousel images fade in smoothly"
"Add keyboard navigation to carousel"
```

### Step 3: Watch It Work

The system will:
- 🔍 Search for "carousel" files
- 📦 Find Carousel.js and Carousel.css
- 📤 Send only those files to AI
- ⚡ Get patches back
- ✅ Apply changes automatically

## Examples

### Example 1: Add Feature

**You say:**
```
"Add smooth parallax effect to carousel images as they slide"
```

**System does:**
1. Finds: Carousel.js, Carousel.css
2. Sends: ~1.5KB (vs 50KB full project)
3. AI returns: 3 patches
4. Result: Parallax effect added ✓

**Console output:**
```
[08:34:12] [AI-EDITOR] User instruction received
[08:34:12] [AI-EDITOR] Searching semantic matches for: "parallax carousel"
[08:34:12] [AI-EDITOR] Matched files: Carousel.js (score: 18), Carousel.css (score: 10)
[08:34:12] [AI-EDITOR] Dependency graph built: 2 files to send
[08:34:15] [AI-EDITOR] ✓ AI response received
[08:34:15] [AI-EDITOR] Patches parsed: 3 patches found
[08:34:15] [AI-EDITOR] ✓ Patch applied to Carousel.js
[08:34:15] [AI-EDITOR] ✓ Patch applied to Carousel.css
```

### Example 2: Fix Bug

**You say:**
```
"Fix carousel not stopping at the last slide"
```

**System does:**
1. Finds: Carousel.js
2. Sends: ~2KB
3. AI returns: 1 patch
4. Result: Bug fixed ✓

### Example 3: Refactor

**You say:**
```
"Refactor carousel to use React hooks"
```

**System does:**
1. Finds: Carousel.js
2. Sends: ~2KB
3. AI returns: 5 patches
4. Result: Refactored ✓

## What Triggers Semantic Patches?

The system automatically detects modification requests with keywords:

✅ **Triggers semantic patches:**
- "Add parallax effect"
- "Modify carousel behavior"
- "Update carousel styling"
- "Fix carousel bug"
- "Improve carousel performance"
- "Refactor carousel code"
- "Change carousel animation"
- "Remove carousel delay"

❌ **Falls back to full generation:**
- "Create a carousel component"
- "Build a new dashboard"
- "Generate a form"
- (No existing files to modify)

## Performance Benefits

### Token Usage

| Approach | Tokens | Time |
|----------|--------|------|
| Full Project | 12,500 | 5-10s |
| Semantic Patches | 1,000 | 2-5s |
| **Savings** | **92%** | **50-75%** |

### Example

**Full project approach:**
```
Project files: 50KB
  → 12,500 tokens
  → 5-10 seconds
  → Expensive
```

**Semantic patch approach:**
```
Matched files: 2KB
  → 500 tokens
  → 2-5 seconds
  → Efficient ✓
```

## Troubleshooting

### Problem: "No matching files found"

**Cause:** System couldn't find relevant files

**Solution:**
- Use more specific keywords
- Check file naming (use "Carousel" not "carousel")
- Try full generation instead

**Example:**
```
❌ "Add effect"
✅ "Add parallax effect to carousel"
```

### Problem: "Patch failed – context mismatch"

**Cause:** File changed since request was sent

**Solution:**
- Save your work first
- Try again
- Or request full file replacement

### Problem: Patches not applying

**Cause:** AI response format incorrect

**Solution:**
- Check browser console for details
- Try simpler instruction
- Fall back to full generation

## Advanced Usage

### Semantic File Matching

The system scores files by:

1. **Filename matches** (+10 points)
   - "carousel" in "Carousel.js"

2. **Component name matches** (+8 points)
   - `export function Carousel`

3. **Content keywords** (+0.5 per mention)
   - "parallax" mentioned in code

### Example Scoring

```
Instruction: "Add parallax to carousel"
Keywords: ["add", "parallax", "carousel"]

Carousel.js:
  - Filename: "carousel" = +10
  - Component: "Carousel" = +8
  - Content: "parallax" (0x) = 0
  - Total: 18 ✓ MATCH

Carousel.css:
  - Filename: "carousel" = +10
  - Content: "parallax" (0x) = 0
  - Total: 10 ✓ MATCH

utils.js:
  - No matches = 0 ✗ SKIP
```

### Dependency Extraction

Only 1 level of imports included:

```
Carousel.js (matched)
  ├── ./Carousel.css → INCLUDE
  └── framer-motion → SKIP (external)

Carousel.css (matched)
  └── No imports → SKIP

Result: Send Carousel.js + Carousel.css only
```

## Patch Format (For Reference)

AI returns patches like this:

```
PATCH Carousel.js @@ line 42 @@
const [slide, setSlide] = useState(0)
const [slide, setSlide] = useState(0)
const [parallaxOffset, setParallaxOffset] = useState(0)

PATCH Carousel.css @@ line 18 @@
transform: translateX(${offset}px);
transform: translateX(${offset}px) perspective(1000px);
```

The system automatically:
- Parses these patches
- Validates context
- Applies line-by-line changes
- Updates your editor

## Tips & Tricks

### 1. Use Descriptive Names

```
✅ Carousel.js, CarouselSlide.js, CarouselControls.js
❌ comp.js, slide.js, ctrl.js
```

### 2. Keep Related Files Together

```
✅ Carousel.js + Carousel.css in same folder
❌ Carousel.js in /components, styles.css in /styles
```

### 3. Be Specific in Instructions

```
✅ "Add smooth parallax effect to carousel images"
❌ "Make it better"
```

### 4. Check Console Logs

Open DevTools (F12) to see:
- Which files were matched
- Dependency graph
- Patches applied
- Any errors

### 5. Save Before Requesting

Always save your work before asking for modifications:
```
Ctrl+S (or Cmd+S on Mac)
```

## Limitations

1. **1-Level Dependencies Only**
   - Doesn't follow deep import chains
   - Workaround: Request specific files

2. **Keyword-Based Matching**
   - May miss files with different names
   - Workaround: Use descriptive names

3. **Line-Based Patches**
   - Doesn't handle structural changes well
   - Workaround: Request full file replacement

4. **Context Validation**
   - Requires exact line matches
   - Workaround: Save and try again

## Next Steps

1. **Create a carousel component** in the editor
2. **Ask for modifications** using semantic patches
3. **Watch the console** to see the workflow
4. **Check the results** in your editor
5. **Preview the component** using the preview system

## Support

For issues or questions:

1. Check `SEMANTIC_PATCH_SYSTEM.md` for detailed docs
2. Open browser console (F12) for debug logs
3. Check file naming and structure
4. Try simpler instructions first

## Summary

| Feature | Benefit |
|---------|---------|
| Semantic matching | Find relevant files automatically |
| Minimal context | 92% fewer tokens sent |
| Targeted patches | Only modified lines updated |
| Fast processing | 2-5 seconds vs 5-10 seconds |
| Automatic detection | Works with natural language |
| Fallback support | Full generation if needed |

**Result: Efficient, fast, intelligent code modification** ✓
