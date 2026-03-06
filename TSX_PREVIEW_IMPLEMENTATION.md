# TSX/React Component Preview Implementation

## Overview
Implemented a browser-based TSX/React component preview system that compiles and renders React components directly in the chat interface, similar to Gemini Canvas.

## Features Implemented

### 1. TSX Compilation
- **Babel Standalone Integration**: Added `@babel/standalone` for in-browser TypeScript/JSX compilation
- **Presets**: Uses `typescript` and `react` presets for full TSX support
- **Error Handling**: Displays compilation errors in the preview panel with clear error messages

### 2. Component Detection
- Automatically detects TSX/JSX/TypeScript/JavaScript code blocks
- Identifies React components by checking for:
  - `export default` statements
  - Function declarations
  - Component patterns

### 3. Preview Runtime Environment
The iframe preview includes preloaded globals:
- **React 18**: Full React library from CDN
- **ReactDOM 18**: For rendering components
- **Framer Motion**: Animation library support
- **Lucide React**: Icon library support
- **Tailwind CSS**: Styling via CDN

### 4. Rendering System
- Components render using `ReactDOM.createRoot()`
- Expects default export: `export default function Component() {}`
- Sandboxed execution in iframe (security)
- Runtime error handling with user-friendly error display

### 5. Version History Integration
- TSX code versions tracked independently
- Undo/Redo automatically recompiles TSX
- Each version maintains original source code
- Compilation happens on-demand during preview

### 6. Canvas Editor Support
- Edit TSX code in canvas side panel
- Live preview updates on "UPDATE" button
- Toggle between code view and rendered preview
- Syntax highlighting for TSX code

## Code Structure

### Key Functions

#### `compileTSXToJS(tsxCode: string)`
Compiles TSX to JavaScript using Babel Standalone
- Returns: `{success: boolean, code?: string, error?: string}`

#### `generateReactPreviewHtml(compiledJS: string, error?: string)`
Generates complete HTML document for iframe preview
- Includes all CDN dependencies
- Sets up React rendering environment
- Handles both success and error states

### Detection Logic
```typescript
const isTsx = language === 'tsx' || language === 'jsx' || 
              language === 'typescript' || language === 'javascript';
const isReactComponent = isTsx && 
  (code.includes('export default') || 
   code.includes('function') || 
   code.includes('const'));
```

## Supported Use Cases

### ✅ Supported
- Single-file React components
- Functional components with hooks (useState, useEffect, etc.)
- Tailwind CSS styling
- Framer Motion animations
- Lucide React icons
- TypeScript syntax
- JSX syntax

### ❌ Not Supported (By Design)
- npm package installation
- Multi-file imports
- Module resolution
- node_modules
- Backend compilation
- Full project bundling
- Custom webpack/vite config

## Example Usage

### Simple Component
```tsx
export default function Card() {
  return (
    <div className="p-4 bg-white border rounded shadow">
      <h2 className="text-xl font-bold">Hello World</h2>
      <p className="text-gray-600">This is a React component!</p>
    </div>
  );
}
```

### Component with Hooks
```tsx
export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Count: {count}</h1>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Increment
      </button>
    </div>
  );
}
```

### With Framer Motion
```tsx
export default function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-gradient-to-r from-purple-500 to-pink-500"
    >
      <h1 className="text-white text-3xl">Animated!</h1>
    </motion.div>
  );
}
```

## Security

- All code execution happens inside sandboxed iframe
- No access to parent window context
- No file system access
- No network requests (except CDN resources)
- Isolated from main application state

## Dependencies Added

```json
{
  "@babel/standalone": "^7.x.x",
  "framer-motion": "^11.x.x"
}
```

## Testing

1. Start dev server: `npm run dev`
2. Ask AI to generate a React component in TSX
3. Click "PREVIEW" button on code block
4. Or click "Maximize" to open in canvas
5. Edit code and click "UPDATE" to see changes

## Error Handling

### Compilation Errors
- Syntax errors in TSX
- Invalid TypeScript
- Missing exports

### Runtime Errors
- Component crashes
- Invalid React hooks usage
- Missing dependencies

Both types display user-friendly error messages in the preview panel.

## Future Enhancements (Optional)

- Add more CDN libraries on demand
- Support for CSS modules
- Component props editor
- Export to CodeSandbox/StackBlitz
- Screenshot/export functionality
- Mobile responsive preview toggle
