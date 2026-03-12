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
- `ChatInterface.tsx`: Main chat UI with message display, image upload, thinking process collapsible, code artifact cards
- `Canvas.tsx`: Interactive code preview/editor with version history, error handling, and AI-powered error fixing
- `Sidebar.tsx`: File and session management with upload, toggle, delete
- `SettingsModal.tsx`: API key configuration for all providers
- `CodeEditor.tsx`: Monaco-based code editor
- `ui/`: Reusable UI primitives (Button, etc.)

### `/services/`
Pure functions and API integrations (no React state):
- `vectorDb.ts`: IndexedDB operations for RAG (chunks, embeddings, search)
- `embeddingService.ts`: Local Transformers.js embeddings
- `geminiService.ts`: Google Gemini API integration with vision support
- `cerebrasService.ts`: Cerebras API integration with reasoning tag detection
- `groqService.ts`: Groq API integration with vision models
- `openrouterService.ts`: OpenRouter API integration with free model access
- `ollamaService.ts`: Ollama local/cloud integration with dual-mode support
- `chatStorage.ts`: Chat session persistence (localStorage) with export/import
- `pdfParser.ts`: PDF text extraction
- `runtimeBundler.ts`: TSX/JSX compilation and import resolution for Canvas
- `citationService.ts`: Citation extraction and validation from AI responses
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
1. Extract code blocks from markdown (regex: ` ```jsx?|tsx?|html|css ` )
2. Parse imports (line-by-line processing)
3. Remove imports and inject dependencies as globals
4. Babel transpilation (TSX → JS)
5. Sandbox execution in iframe with error boundary
6. Version history tracking (undo/redo with timestamps)
7. Error detection and AI-powered error fixing
8. Code editing with live preview toggle

### Thinking Process Display
- Extract `<think>` tags from AI responses
- Display in collapsible "Thinking Process" section
- Positioned before main message content
- Supports both `msg.reasoning` property and extracted thinking blocks
- Expandable/collapsible with chevron indicator

### Canvas Error Handling
- Iframe error detection via postMessage
- Error state tracking with message and code
- AI-powered error fixing with model selection
- Error recovery without losing code history

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

## ChatMessage Properties

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  citations?: Citation[];
  inputTokens?: number;
  outputTokens?: number;
  reasoning?: string;  // Thinking/reasoning process for reasoning models
  metadata?: {
    imageBase64?: string;  // Comma-separated base64 images
    activeSources?: string[];  // Document names used in RAG
  };
}
```

## ChatSession Properties

```typescript
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  aiModel: 'gemini' | 'cerebras' | 'groq' | 'openrouter' | 'ollama';
  canvasState?: {
    isOpen: boolean;
    content: { html: string; code: string; language: string; blockId: string } | null;
    showCode: boolean;
    editedCode: string;
  };
}
```
