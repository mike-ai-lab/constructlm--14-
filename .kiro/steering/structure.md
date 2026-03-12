---
inclusion: always
---

# Project Structure

## Root Directory Organization

```
constructlm/
├── components/          # React UI components
├── services/           # Business logic and API integrations
├── docs/              # User documentation (static HTML)
├── ai-editor/         # Separate AI editor sub-project
├── user/              # User-specific files and examples
├── projects_tests/    # Test project structures
├── themes/            # UI theme configurations
├── .kiro/             # Kiro AI assistant configuration
│   ├── settings/      # MCP and other settings
│   └── steering/      # AI steering rules (this file)
└── [config files]     # Build and tooling configs
```

## Core Application Structure

### `/components/`
React components following a flat structure:
- `ChatInterface.tsx`: Main chat UI with canvas integration
- `Sidebar.tsx`: File and session management
- `SettingsModal.tsx`: API key configuration
- `CodeEditor.tsx`: Monaco-based code editor
- `ui/`: Reusable UI primitives (Button, etc.)

### `/services/`
Pure functions and API integrations (no React state):
- `vectorDb.ts`: IndexedDB operations for RAG (chunks, embeddings, search)
- `embeddingService.ts`: Local Transformers.js embeddings
- `geminiService.ts`: Google Gemini API integration
- `cerebrasService.ts`: Cerebras API integration
- `groqService.ts`: Groq API integration
- `openrouterService.ts`: OpenRouter API integration
- `ollamaService.ts`: Ollama local/cloud integration
- `chatStorage.ts`: Chat session persistence (localStorage)
- `pdfParser.ts`: PDF text extraction
- `runtimeBundler.ts`: TSX/JSX compilation and import resolution
- `citationService.ts`: Citation extraction and validation
- `syntaxHighlighter.ts`: Code syntax highlighting

### Root Files
- `App.tsx`: Root component with central state management
- `types.ts`: TypeScript type definitions (shared across app)
- `index.tsx`: React entry point
- `index.html`: HTML template
- `index.css`: Global styles

## Architecture Patterns

### State Management
- **Centralized state**: App.tsx holds all application state
- **Props drilling**: Components receive data via props (no context/redux)
- **Service layer**: Pure functions in `/services/` for business logic

### Data Flow
1. User interaction → Component event handler
2. Component calls App.tsx callback
3. App.tsx updates state and calls service functions
4. Service functions interact with APIs/storage
5. State update triggers re-render

### Storage Strategy
- **IndexedDB** (`vectorDb.ts`): Documents, text chunks, embeddings
- **localStorage** (`chatStorage.ts`): API keys, chat sessions
- **React state**: Ephemeral UI state

### RAG Pipeline
1. Document upload → `vectorDb.processFile()`
2. Text chunking (1000 chars, 200 overlap)
3. Local embedding generation (Transformers.js)
4. IndexedDB storage
5. Query → `vectorDb.searchVectors()` → cosine similarity
6. Top results → AI context → streaming response

### Code Canvas Architecture
1. Extract code blocks from markdown
2. Parse imports (line-by-line processing)
3. Remove imports and inject dependencies as globals
4. Babel transpilation (TSX → JS)
5. Sandbox execution in iframe
6. Version history tracking (undo/redo)

## File Naming Conventions

- React components: PascalCase (e.g., `ChatInterface.tsx`)
- Services: camelCase (e.g., `vectorDb.ts`)
- Types: PascalCase interfaces in `types.ts`
- Config files: kebab-case (e.g., `vite.config.ts`)

## Import Patterns

```typescript
// Absolute imports using @ alias
import { Component } from '@/components/Component';
import { service } from '@/services/service';

// Relative imports for nearby files
import { helper } from './helper';
import type { MyType } from '../types';
```

## Component Structure

```typescript
// Standard component pattern
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

```typescript
// Pure functions, no React dependencies
export const functionName = async (params): Promise<ReturnType> => {
  // Implementation
};

// Constants at top
const CONSTANT = value;
```

## Documentation Location

- User-facing docs: `/docs/` (static HTML)
- Implementation notes: Markdown files in root (e.g., `CANVAS_RUNTIME_BUNDLER.md`)
- Session notes: `/user/` directory
