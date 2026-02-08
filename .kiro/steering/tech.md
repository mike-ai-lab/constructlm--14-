# Tech Stack

## Core Technologies

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (utility-first approach)
- **State Management**: React hooks (useState, useEffect)
- **Storage**: IndexedDB for vector database and document storage

## Key Libraries

- **@xenova/transformers**: Local browser-based embeddings (all-MiniLM-L6-v2 model)
- **@google/genai**: Google Gemini API integration
- **pdfjs-dist**: PDF parsing and text extraction
- **react-markdown**: Markdown rendering with GitHub Flavored Markdown (remark-gfm)
- **rehype-raw**: HTML support in markdown

## AI Services

- **Gemini API**: Google's generative AI model
- **Cerebras API**: Fast inference AI model (default)
- Both support streaming responses

## Common Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## TypeScript Configuration

- Target: ES2022
- Module: ESNext
- JSX: react-jsx
- Path alias: `@/*` maps to workspace root
- Bundler module resolution

## Build Configuration

- Vite dev server: port 3000, host 0.0.0.0
- Path alias support via `@/` prefix
- PDF.js excluded from optimization (loaded separately)
- Environment variables loaded from `.env.local`

## Browser Requirements

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support (iOS 15+)
- First-time model download: ~25MB (cached for offline use)
