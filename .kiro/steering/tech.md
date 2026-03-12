---
inclusion: always
---

# Tech Stack

## Core Stack

- **Vite 6**: Build tool and dev server (port 3000)
- **React 19** with TypeScript 5.8
- **Tailwind CSS 4**: Utility-first styling with dark mode (class strategy)
- **Node.js 18+**: Required for development

## AI & ML

- **@xenova/transformers**: Local browser embeddings (Xenova/all-MiniLM-L6-v2, ~25MB download)
- **@google/genai**: Gemini API (lazy-loaded)
- **Cerebras, Groq, OpenRouter, Ollama**: Via fetch APIs

## Code Processing & Rendering

- **Monaco Editor**: Code editing
- **Babel Standalone**: In-browser JSX/TSX compilation
- **esbuild-wasm**: WebAssembly bundling for Canvas runtime
- **react-markdown + remark-gfm + rehype-raw**: Markdown with tables, strikethrough, HTML

## Storage

- **IndexedDB**: Documents, chunks, embeddings (persistent)
- **localStorage**: API keys, chat sessions (persistent)
- **pdfjs-dist**: PDF text extraction

## UI

- **Lucide React**: Icons
- **Framer Motion**: Animations

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build
```

## Environment Variables

Create `.env.local` for optional API key defaults:
```env
VITE_GEMINI_API_KEY=your_key_here
VITE_CEREBRAS_API_KEY=your_key_here
```

## Build Configuration

- **Dev server**: 0.0.0.0:3000
- **Path aliases**: `@/` maps to project root
- **Code splitting**: pdfjs-dist and monaco-editor in separate chunks
- **CORS**: Unsafe-none for local embeddings
- **Worker format**: ES modules
- **TypeScript target**: ES2022, ESNext modules, react-jsx transform

## Browser Requirements

- IndexedDB support (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- WebAssembly support (for esbuild-wasm)
- First load caches ~25MB embedding model for offline use

## Key Architectural Patterns

### State Management
- Centralized state in App.tsx
- Props drilling (no context/redux)
- Pure functions in services layer

### Data Flow
User interaction → Component → App.tsx callback → Service function → API/Storage → State update → Re-render

### RAG Pipeline
Document upload → Text chunking (1000 chars, 200 overlap) → Local embeddings → IndexedDB storage → Query search → Top results → AI context

### Code Canvas
Extract code blocks → Parse imports → Remove imports/inject globals → Babel transpile → Sandbox iframe execution → Version history tracking

## Import Patterns

```typescript
// Absolute imports (preferred)
import { Component } from '@/components/Component';
import { service } from '@/services/service';

// Relative imports for nearby files
import { helper } from './helper';
import type { MyType } from '../types';
```

## Component Structure

```typescript
interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks first
  const [state, setState] = useState();
  const ref = useRef();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleAction = () => {};
  
  // Render
  return <div>...</div>;
};
```

## Service Structure

Pure functions with no React dependencies:

```typescript
// Constants at top
const CONSTANT = value;

// Exported functions
export const functionName = async (params): Promise<ReturnType> => {
  // Implementation
};
```

## File Naming

- React components: PascalCase (e.g., `ChatInterface.tsx`)
- Services: camelCase (e.g., `vectorDb.ts`)
- Types: PascalCase interfaces in `types.ts`
- Config files: kebab-case (e.g., `vite.config.ts`)
