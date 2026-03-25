# React Component Preview Integration
## Overview
The AI Code Fix Pro tool has been enhanced with React component rendering capabilities from the React Playground. This allows you to not only detect and fix errors in React code but also see live previews of your components.
## New Features
### 1. React Component Renderer
- **File**: `src/js/ReactComponentRenderer.js`
- In-browser JSX/TypeScript compilation using Babel Standalone
- Automatic library mocking (icons, Framer Motion, etc.)
- Iframe-based sandboxed rendering
- Error handling with visual feedback
### 2. Preview Panel
- Toggle-able preview panel on the right side
- Live component rendering
- Responsive design that adapts to screen size
- Loading states and error overlays
### 3. New Buttons
- **Render Preview**: Compiles and renders the React component in the editor
- **Show/Hide Preview**: Toggles the preview panel visibility
- **Clear Preview** (???): Clears the preview iframe
## How to Use
1. **Write or paste React component code** in the editor
2. **Click "Render Preview"** to see your component live
3. **Toggle preview panel** using "Show/Hide Preview" button
4. **Use existing features** like error detection and AI fix alongside preview
## Technical Implementation
### Files Added/Modified
#### New Files:
- `src/js/ReactComponentRenderer.js` - Core rendering engine
- `src/js/preview.js` - Preview panel management
- `src/styles/preview.css` - Preview panel styles
- `REACT_PREVIEW_INTEGRATION.md` - This documentation
#### Modified Files:
- `src/index.html` - Added preview panel HTML and CDN links
- `src/js/app.js` - Integrated preview functionality
- `src/styles/main.css` - Imported preview styles
### Architecture
```
+---------------------------------------------------------+
¦                    AI Code Fix Pro                       ¦
+---------------------------------------------------------¦
¦                                                          ¦
¦  +--------------+  +--------------+  +--------------+ ¦
¦  ¦   Editor     ¦  ¦  AI Service  ¦  ¦   Preview    ¦ ¦
¦  ¦   Panel      ¦  ¦              ¦  ¦   Panel      ¦ ¦
¦  ¦              ¦  ¦              ¦  ¦              ¦ ¦
¦  ¦  - Code      ¦  ¦  - Detect    ¦  ¦  - Render    ¦ ¦
¦  ¦  - History   ¦  ¦  - Fix       ¦  ¦  - Mock      ¦ ¦
¦  ¦  - Diff      ¦  ¦  - Chat      ¦  ¦  - Iframe    ¦ ¦
¦  +--------------+  +--------------+  +--------------+ ¦
¦                                                          ¦
¦  +--------------------------------------------------+  ¦
¦  ¦         ReactComponentRenderer.js                 ¦  ¦
¦  ¦  - Import parsing                                 ¦  ¦
¦  ¦  - Babel compilation                              ¦  ¦
¦  ¦  - Mock generation (icons, Framer Motion)        ¦  ¦
¦  ¦  - HTML generation for iframe                    ¦  ¦
¦  +--------------------------------------------------+  ¦
+---------------------------------------------------------+
```
### Key Components
#### ReactComponentRenderer
- Parses imports and generates mocks for external libraries
- Compiles JSX/TypeScript using Babel Standalone
- Handles export statements (default and named exports)
- Generates complete HTML for iframe rendering
- Provides error handling and validation
#### Preview Module (`preview.js`)
- Initializes the React renderer
- Manages preview panel visibility
- Handles rendering lifecycle
- Displays errors in user-friendly format
- Integrates with logging system
#### Preview Panel UI
- Fixed position on right side
- Collapsible with smooth animations
- Responsive design for different screen sizes
- Loading indicators
- Error overlays
## Supported Features
### React Features
- ? JSX syntax
- ? TypeScript syntax
- ? React Hooks (useState, useEffect, useRef, etc.)
- ? Component exports (default and named)
- ? Multi-line imports
### Library Mocking
- ? lucide-react icons
- ? react-icons (all icon sets)
- ? Framer Motion (motion components, AnimatePresence)
- ? Custom icon SVG generation
### Styling
- ? Tailwind CSS (via CDN in iframe)
- ? Inline styles
- ? className attributes
## Example Usage
### Simple Counter Component
```javascript
import React, { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="p-8 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Counter: {count}</h1>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg"
      >
        Increment
      </button>
    </div>
  );
}
```
### Component with Icons
```javascript
import React from 'react';
import { Heart, Star } from 'lucide-react';
export default function IconDemo() {
  return (
    <div className="p-8">
      <Heart className="text-red-500" size={48} />
      <Star className="text-yellow-500" size={48} />
    </div>
  );
}
```
## Workflow Integration
The preview feature integrates seamlessly with existing workflows:
1. **Error Detection** ? **AI Fix** ? **Render Preview**
2. **Write Code** ? **Render Preview** ? **Detect Errors** ? **AI Fix**
3. **Paste Code** ? **Render Preview** (instant feedback)
## Browser Compatibility
- ? Chrome/Edge (recommended)
- ? Firefox
- ? Safari
- ?? Requires modern browser with ES6+ support
## Performance Notes
- Babel compilation happens in-browser (no server required)
- First render initializes Babel (~1-2 seconds)
- Subsequent renders are fast (<100ms)
- Iframe isolation prevents memory leaks
## Troubleshooting
### Preview not showing
- Check browser console for errors
- Ensure Babel CDN is loaded
- Verify React/ReactDOM CDN links
### Component not rendering
- Check for syntax errors first
- Use "Detect Errors" before rendering
- Review error overlay in preview panel
### Icons not displaying
- Icons are automatically mocked
- Check icon name matches library conventions
- Review console for mock generation logs
## Future Enhancements
Potential improvements:
- [ ] Dynamic CDN dependency loading (esm.sh)
- [ ] Component props editor
- [ ] Multiple component tabs
- [ ] Export rendered component as HTML
- [ ] Screenshot/share functionality
- [ ] Mobile device preview modes
## Credits
React rendering engine adapted from the React Playground project, integrated with AI Code Fix Pro V3 to provide a comprehensive code editing and preview experience.
