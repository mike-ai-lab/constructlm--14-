# Preview Tab Implementation Plan

## Architecture Decision: Hybrid Approach (Option B Enhanced)

### Why This Approach?
1. **Leverages existing `/runtime-bundle` endpoint** - No duplication
2. **Server-side bundling** - More reliable than client-side hacks
3. **Multi-file support** - Can resolve imports between files
4. **Performance** - Lightweight modal, no heavy client-side processing

---

## Component Structure

### 1. PreviewModal Component (New)
**Location:** `ai-editor/components/PreviewModal.html`

**Features:**
- Lightweight floating modal (720x425px)
- No backdrop blur (performance)
- Draggable header
- Close button
- Loading state
- Error display
- Iframe sandbox

**Props (passed via global state):**
```javascript
{
  files: Object,        // All project files
  entryFile: string,    // File to render
  isOpen: boolean,      // Modal visibility
  onClose: function     // Close handler
}
```

---

### 2. Enhanced Server Endpoint
**Location:** `ai-editor/server.js` (modify existing `/runtime-bundle`)

**New Features:**
- Accept multiple files
- Resolve relative imports
- Create virtual module system
- Inject helper files as inline modules
- Better error messages

**Request Format:**
```javascript
{
  files: {
    'Carousel.tsx': '...',
    'CarouselSlide.tsx': '...',
    'images.ts': '...'
  },
  entry: 'Carousel.tsx'
}
```

**Response:**
```javascript
{
  html: '<!DOCTYPE html>...'  // Complete HTML with all files bundled
}
```

---

### 3. Context Menu Integration
**Location:** `ai-editor/js/app.js` (modify existing context menu)

**Features:**
- "Preview Component" option
- Only enabled for renderable files (.tsx, .jsx, .ts with JSX, .js with JSX)
- Detects if file has `export default`
- Gathers related files from same folder

---

## File Detection Logic

### Renderable File Detection
```javascript
function isRenderableFile(filename, content) {
  // Check extension
  if (!/\.(tsx?|jsx?)$/i.test(filename)) return false;
  
  // Check for export default
  if (!/export\s+default\s+/m.test(content)) return false;
  
  // Check for JSX/TSX syntax
  if (/<[A-Z]/.test(content) || /React\.createElement/.test(content)) return true;
  
  return false;
}
```

### Entry File Detection
```javascript
function findEntryFile(files, currentFile) {
  // If current file is renderable, use it
  if (isRenderableFile(currentFile, files[currentFile])) {
    return currentFile;
  }
  
  // Otherwise, find first renderable file in same folder
  const folder = currentFile.split('/').slice(0, -1).join('/');
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith(folder) && isRenderableFile(path, content)) {
      return path;
    }
  }
  
  return null;
}
```

### Related Files Gathering
```javascript
function getRelatedFiles(files, entryFile) {
  const folder = entryFile.split('/').slice(0, -1).join('/');
  const related = {};
  
  // Include all files from same folder
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith(folder)) {
      related[path] = content;
    }
  }
  
  return related;
}
```

---

## Enhanced Server Bundler

### Multi-File Resolution Strategy

1. **Parse all imports** from entry file
2. **Resolve relative imports** to actual files
3. **Inject files as inline modules** using data URIs or inline scripts
4. **Create virtual module system** in iframe
5. **Handle missing imports** with mock components

### Virtual Module System
```javascript
// In iframe, before main code execution
window.__modules = {
  './CarouselSlide': { default: CarouselSlideComponent },
  './images': { img1: 'data:image/...', img2: '...' }
};

// Custom require function
function require(path) {
  if (window.__modules[path]) return window.__modules[path];
  throw new Error(`Module not found: ${path}`);
}
```

---

## UI Flow

### User Interaction
1. User right-clicks on `Carousel.tsx`
2. Context menu shows "Preview Component"
3. Click triggers `openPreview('Carousel.tsx')`
4. System gathers all files from `carousel/` folder
5. Sends to `/runtime-bundle` endpoint
6. Receives HTML
7. Opens modal with iframe
8. Iframe displays rendered component

### Error Handling
- **No entry file found**: Show message "No renderable component found"
- **Compilation error**: Show Babel error with line number
- **Runtime error**: Show React error boundary message
- **Network error**: Show "Failed to load preview"

---

## Performance Considerations

### Modal
- No backdrop (saves DOM node + CSS)
- No blur effect (saves GPU)
- Fixed positioning (no layout recalc)
- Single iframe (reuse for multiple previews)

### Bundling
- Cache compiled modules on server (optional)
- Minimize HTML size
- Use production React builds
- Lazy load Babel only when needed

---

## Edge Cases Handled

### 1. Multi-file Components
✅ Gathers all files from same folder
✅ Resolves relative imports
✅ Injects as virtual modules

### 2. Image/Asset Imports
✅ Converts to data URIs or placeholders
✅ Handles missing assets gracefully

### 3. CSS Imports
✅ Strips CSS imports
✅ Includes Tailwind CSS by default
✅ Optionally inline CSS content

### 4. External Dependencies
✅ React/ReactDOM available globally
✅ Common libraries via CDN (framer-motion, etc.)
✅ Unknown imports → mock components

### 5. Malformed Code
✅ Babel compilation errors caught
✅ Runtime errors caught by error boundary
✅ Helpful error messages displayed

### 6. Non-renderable Files
✅ Context menu disabled for .css, .json, .md
✅ Helper files (utils.ts) don't show preview option
✅ Only files with `export default` + JSX

---

## Implementation Checklist

### Phase 1: Server Enhancement
- [ ] Modify `/runtime-bundle` to accept multiple files
- [ ] Implement import resolution logic
- [ ] Create virtual module system in HTML template
- [ ] Add better error handling
- [ ] Test with multi-file examples

### Phase 2: Client-Side Detection
- [ ] Add `isRenderableFile()` function
- [ ] Add `findEntryFile()` function
- [ ] Add `getRelatedFiles()` function
- [ ] Test detection logic

### Phase 3: UI Components
- [ ] Create PreviewModal HTML component
- [ ] Add modal CSS (lightweight)
- [ ] Add modal open/close logic
- [ ] Add loading state
- [ ] Add error display

### Phase 4: Context Menu Integration
- [ ] Modify existing context menu
- [ ] Add "Preview Component" option
- [ ] Add conditional enabling logic
- [ ] Wire up to preview system

### Phase 5: Testing
- [ ] Test single-file component
- [ ] Test multi-file component (carousel example)
- [ ] Test with images/assets
- [ ] Test error cases
- [ ] Test performance

---

## Code Structure

```
ai-editor/
├── components/
│   └── PreviewModal.html          (NEW)
├── js/
│   ├── app.js                     (MODIFY - add preview logic)
│   └── previewManager.js          (NEW - preview utilities)
├── css/
│   └── styles.css                 (MODIFY - add modal styles)
└── server.js                      (MODIFY - enhance bundler)
```

---

## Testing Scenarios

### Scenario 1: Simple Component
```javascript
// Button.tsx
export default function Button() {
  return <button>Click me</button>;
}
```
**Expected:** Renders button in modal

### Scenario 2: Multi-file Component
```javascript
// Carousel.tsx
import Slide from './CarouselSlide';
export default function Carousel() {
  return <div><Slide /></div>;
}

// CarouselSlide.tsx
export default function Slide() {
  return <div>Slide</div>;
}
```
**Expected:** Resolves import, renders carousel

### Scenario 3: With Assets
```javascript
// Card.tsx
import { img1 } from './images';
export default function Card() {
  return <img src={img1} />;
}

// images.ts
export const img1 = 'https://...';
```
**Expected:** Resolves import, displays image

### Scenario 4: Error Case
```javascript
// Broken.tsx
export default function Broken() {
  return <div>{undefinedVar}</div>;
}
```
**Expected:** Shows runtime error in modal

---

## Next Steps

1. **Review this plan** - Confirm approach
2. **Refine if needed** - Adjust based on feedback
3. **Implement Phase 1** - Server enhancement first
4. **Test incrementally** - Validate each phase
5. **Integrate UI** - Add modal and context menu
6. **Final testing** - End-to-end validation

---

## Questions to Confirm

1. Should the modal be draggable? (adds complexity)
2. Should we cache previews? (performance vs memory)
3. Should we support hot reload? (advanced feature)
4. Should we show a "Copy Code" button in preview?
5. Should we allow editing in preview? (live coding)

