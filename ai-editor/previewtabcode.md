## Use this preview code for react components previewing, make it renders the code related only :

```
is this good as a preview tab for react compoenents?


import { useEffect, useRef, useState } from 'react'; 

interface PreviewModalProps {
  code: string;
}

export default function PreviewModal({ code }: PreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script type="importmap">
            {
              "imports": {
                "react": "https://esm.sh/react@18",
                "react-dom/client": "https://esm.sh/react-dom@18/client",
                "react-dom": "https://esm.sh/react-dom@18"
              }
            }
          </script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; font-family: sans-serif; background: #ffffff; color: #000000; }
            #root { min-height: 100vh; }
            /* Hide scrollbar for cleaner look */
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #999; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            window.onerror = function(msg, url, line, col, error) {
              window.parent.postMessage({ type: 'ERROR', message: msg }, '*');
              return true;
            };
            window.addEventListener('unhandledrejection', function(event) {
              window.parent.postMessage({ type: 'ERROR', message: event.reason?.message || 'Unhandled Promise Rejection' }, '*');
            });
          </script>
          <script type="text/babel" data-type="module" data-presets="typescript,react">
            ${processCode(code)}
          </script>
        </body>
      </html>
    `;

    iframe.srcdoc = html;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ERROR') {
        setError(event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code]);

  const processCode = (rawCode: string) => {
    let processed = rawCode;

    // Strip CSS imports
    processed = processed.replace(/import\s+['"][^'"]+\.css['"];?/g, '');

    // Rewrite other imports to esm.sh
    processed = processed.replace(/(from|import)\s+['"]([^'"]+)['"]/g, (match, type, pkg) => {
      if (pkg === 'react' || pkg.startsWith('react-dom')) return match;
      if (pkg.startsWith('.')) return match;
      return `${type} 'https://esm.sh/${pkg}?external=react,react-dom'`;
    });

    // Ensure React is imported
    if (!processed.match(/import\s+(?:\*\s+as\s+)?React\b/)) {
      processed = `import React from 'react';\n` + processed;
    }
    
    // Handle inline export default function
    const funcMatch = processed.match(/export\s+default\s+function\s+(\w+)/);
    let compName = '__PreviewApp';
    
    // Handle inline export default class
    const classMatch = processed.match(/export\s+default\s+class\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/);
    if (classMatch) {
      compName = classMatch[1];
      processed = processed.replace(/export\s+default\s+class\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/, 'class $1');
    } else if (funcMatch) {
      compName = funcMatch[1];
      processed = processed.replace(/export\s+default\s+function\s+(\w+)/, 'function $1');
    } else {
      // Handle export default <Identifier>
      const idMatch = processed.match(/export\s+default\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*(?:;|$)/);
      if (idMatch) {
        compName = idMatch[1];
        processed = processed.replace(new RegExp(`export\\s+default\\s+${compName}\\s*(?:;|$)`), '');
      } else {
        // Handle export default <Expression>
        processed = processed.replace(/export\s+default\s+/, `const ${compName} = `);
      }
    }

    processed += `\n\nimport { createRoot as __createRoot } from 'react-dom/client';\nconst __root = __createRoot(document.getElementById('root'));\n__root.render(<${compName} />);`;
    return processed.replace(/<\/script>/g, '<\\/script>');
  };

  return (
    <div className="w-full h-full bg-white relative">
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-mono z-10 shadow-lg flex justify-between items-start">
          <div className="overflow-auto max-h-32">{error}</div>
          <button className="text-red-400 hover:text-red-600 ml-2" onClick={() => setError(null)}>×</button>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="preview"
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
```

## **The key** For multi-file components, the preview tab must **render only the “entry” file** (the one that exports the main component) and **ignore auxiliary files** like images, CSS, or helpers. Here’s what you need to handle:

---

### 1. Identify the renderable file

* Look for files with **`export default`** of a React component.
* Ignore files that:

  * only export constants, types, or utility functions
  * are `.css`, `.scss`, `.json`, or images
  * are clearly helpers like `utils.ts` or `hooks.ts`

Example:

```
carousel/
 ├─ Carousel.tsx       ← entry file, contains export default Carousel
 ├─ CarouselSlide.tsx  ← helper component, not rendered directly
 ├─ images.ts          ← data file
 └─ styles.css         ← styling
```

The preview should only render **`Carousel.tsx`**.

---

### 2. Resolve imports correctly

* Keep the imports in the entry file.
* If they are **local relative imports** (`./CarouselSlide` or `../images`), make sure your preview can **load them inline** or mock them.
* For images or non-JS assets, you can replace imports with placeholders:

```ts
import img1 from './img1.jpg';  // replace with placeholder URL
```

---

### 3. Maintain a mapping of “current file → previewable file”

* When the user selects a file in the editor, check:

  1. Is it the main component file (`export default ...`)?
  2. If yes, allow preview.
  3. If not, gray out the preview button or show “Cannot render this file.”

---

### 4. Auto-detect entry file in a folder

* Scan all `.tsx` files in a folder for `export default`.
* Pick the first match as the preview entry.
* This is useful when the user is editing a helper file but wants to preview the full component.

---

### 5. Keep your preview sandboxed

* Only inject the **entry file**’s code into the iframe.
* Keep your `processCode` function logic the same for imports and `export default` replacement.
* Ignore irrelevant files entirely.

---
