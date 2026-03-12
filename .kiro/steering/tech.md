---
inclusion: always
---

# Tech Stack

## Build System

- **Vite 6**: Fast build tool and dev server
- **TypeScript 5.8**: Type-safe development
- **Node.js 18+**: Required for development

## Frontend Framework

- **React 19** with TypeScript
- **React DOM 19**
- **JSX/TSX**: react-jsx transform

## Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **Autoprefixer**: Browser compatibility
- Custom dark mode with `class` strategy

## AI & ML Libraries

- **@xenova/transformers**: Local browser-based embeddings (Xenova/all-MiniLM-L6-v2)
- **@google/genai**: Google Gemini API integration
- Cerebras API (via fetch)
- Groq API (via fetch)
- OpenRouter API (via fetch)
- Ollama API (local and cloud modes)

## Code Processing

- **Monaco Editor**: Code editor component
- **Babel Standalone**: In-browser JSX/TSX compilation
- **esbuild-wasm**: WebAssembly-based bundling
- **react-markdown**: Markdown rendering with GitHub Flavored Markdown
- **remark-gfm**: Tables, strikethrough, task lists
- **rehype-raw**: HTML in markdown support

## Data & Storage

- **IndexedDB**: Document and vector storage (persistent)
- **localStorage**: API keys and chat sessions (persistent)
- **pdfjs-dist**: PDF parsing and text extraction

## UI Components

- **Lucide React**: Icon library
- **Framer Motion**: Animation library

## Common Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
```

### Environment Setup
Create `.env.local` for optional API key defaults:
```env
VITE_GEMINI_API_KEY=your_key_here
VITE_CEREBRAS_API_KEY=your_key_here
```

## Build Configuration

- **Dev server**: Port 3000, host 0.0.0.0
- **Path aliases**: `@/` maps to project root
- **Code splitting**: Separate chunks for pdfjs-dist and monaco-editor
- **CORS headers**: Unsafe-none for local embeddings model
- **Worker format**: ES modules

## Browser Requirements

- Modern browsers with IndexedDB support (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- First-time load downloads ~25MB embedding model (cached for offline use)
- WebAssembly support required for esbuild-wasm

## TypeScript Configuration

- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Bundler module resolution
- Experimental decorators enabled
- Path aliases configured for `@/*`
