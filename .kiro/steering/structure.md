# Project Structure

## Directory Organization

```
constructlm/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── ChatInterface.tsx
│   ├── Sidebar.tsx
│   └── SettingsModal.tsx
├── services/           # Business logic and external integrations
│   ├── embeddingService.ts    # Local Transformers.js embeddings
│   ├── vectorDb.ts            # IndexedDB vector storage
│   ├── geminiService.ts       # Gemini API integration
│   ├── cerebrasService.ts     # Cerebras API integration
│   ├── chatStorage.ts         # Chat session persistence
│   └── pdfParser.ts           # PDF text extraction
├── App.tsx             # Main application component
├── index.tsx           # React entry point
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Build configuration
```

## Architecture Patterns

### Component Structure

- **App.tsx**: Root component managing global state (files, messages, API keys, chat sessions)
- **Components**: Presentational components receiving props from App
- **Services**: Pure functions for external integrations and data operations

### State Management

- Local state with React hooks (useState, useEffect)
- No global state library (Redux, Zustand, etc.)
- State lifted to App.tsx and passed down via props
- localStorage for API keys
- IndexedDB for documents and embeddings

### Service Layer

Services are organized by domain:
- **embeddingService**: Handles local ML model loading and embedding generation
- **vectorDb**: Manages IndexedDB operations (CRUD, vector search)
- **geminiService/cerebrasService**: API integrations with streaming support
- **chatStorage**: Chat session persistence in localStorage
- **pdfParser**: File parsing utilities

### Data Flow

1. User uploads file → vectorDb.processFile()
2. File chunked → embeddingService.getEmbeddings()
3. Chunks + vectors stored in IndexedDB
4. User asks question → vectorDb.searchVectors()
5. Top chunks retrieved → passed to AI service
6. AI streams response → UI updates incrementally

## File Naming Conventions

- Components: PascalCase (e.g., `ChatInterface.tsx`)
- Services: camelCase (e.g., `vectorDb.ts`)
- Types: Centralized in `types.ts`
- Config files: lowercase with dots (e.g., `vite.config.ts`)

## Import Patterns

- Path alias `@/` for workspace root imports
- Relative imports for local files
- Type imports from centralized `types.ts`
- Service imports use wildcard: `import * as VectorDB from './services/vectorDb'`

## Styling Approach

- Tailwind utility classes directly in JSX
- No separate CSS files
- Responsive design with mobile-first breakpoints (md:, lg:)
- Monospace font (font-mono) for technical UI elements
- Black/white/gray color scheme with minimal color accents
