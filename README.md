# ConstructLM

A privacy-first, browser-based RAG (Retrieval-Augmented Generation) workspace for construction professionals and technical documentation. Upload documents, ask questions, and get AI-powered responses with source citations—all running locally in your browser.

## Core Features

### 🔒 Privacy-First Architecture
- **Local embeddings**: All document vectorization happens in-browser using Transformers.js (Xenova/all-MiniLM-L6-v2)
- **No data leakage**: Documents and embeddings stored in browser IndexedDB
- **API keys stored locally**: Keys never leave your device

### 🤖 Multi-Model AI Support
- **Gemini 2.5 Flash/Pro**: Google's latest models with vision and multimodal support
- **Cerebras Llama 3.1/3.3**: Ultra-fast inference for text-only queries
- **Groq**: High-speed inference with vision models (Llama 3.2)
- **OpenRouter**: Access to 15+ free models including reasoning and vision models
- **Ollama**: Local and cloud deployment options
- **Model switching**: Toggle between providers in real-time
- **Vision support**: Upload images for analysis (Gemini, Groq, OpenRouter select models)

### 📚 Document Management
- **Supported formats**: TXT, MD, CSV, JSON, PDF
- **Smart chunking**: 1000-character chunks with 200-character overlap
- **Selective indexing**: Enable/disable sources per query
- **Token tracking**: Real-time context usage monitoring (up to 1M tokens)
- **File preview**: View document contents with PDF rendering, markdown formatting, and text display
- **Download**: Export files directly from preview modal
- **Persistent storage**: Model files cached in IndexedDB, survives cache clearing

### 💬 Advanced Chat Interface
- **Session management**: Create, save, and switch between multiple chat sessions
- **Auto-save**: Conversations persist automatically in localStorage
- **Export chats**: Download sessions as formatted Markdown
- **Streaming responses**: Real-time token-by-token output
- **Token estimation**: Preview input/output token usage
- **Reasoning display**: Shows thinking process for reasoning models (Cerebras, DeepSeek-R1)
- **Progress feedback**: Detailed status updates during document processing with chunk progress

### 🎨 Interactive Code Canvas (Production-Grade Runtime Bundler)
- **Robust import handling**: Handles malformed imports, missing commas, syntax errors gracefully
- **Line-by-line processing**: Reliable import removal without regex edge cases
- **TSX/JSX compilation**: Full Babel transpilation with TypeScript support
- **Path alias support**: Handles `@/components/...` imports with intelligent mocking
- **Smart mocking**: Missing imports replaced with functional fallback components (Button, Card, Input, Icons)
- **Dependency injection**: Auto-loads React, Framer Motion, Wouter, Lucide React
- **Deduplication**: Prevents "already declared" errors with identifier validation
- **Live preview**: Render HTML and React components in isolated sandbox
- **Code editing**: Edit and re-render code blocks with instant updates
- **Version history**: Full undo/redo with version tracking
- **Error boundaries**: Readable error overlays with stack traces and debugging tips
- **Multi-language**: HTML, JSX, TSX, JavaScript, TypeScript
- **React sandbox**: Full React 18 + Babel + Tailwind CSS environment
- **Real-world ready**: Successfully renders AI-generated code from Gemini, Claude, ChatGPT

### 📖 Source Citations
- **Inline citations**: Every response includes source references
- **Hover tooltips**: Preview source text without leaving chat
- **Pin citations**: Keep important sources visible
- **Similarity scores**: See relevance ranking for each source
- **Multi-source synthesis**: AI combines information from multiple documents

### 📱 Responsive Design
- **Mobile-optimized**: Touch gestures, swipe navigation, always-visible controls
- **Collapsible sidebar**: Maximize chat space on desktop
- **Resizable panels**: Drag to adjust sidebar width
- **Safe area support**: iOS notch/island compatibility with proper insets
- **Adaptive modals**: Full-screen on mobile, windowed on desktop
- **Touch-friendly**: Large tap targets, no confirmation dialogs on mobile

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 6** for blazing-fast builds
- **Tailwind CSS 4** for utility-first styling
- **Lucide React** for icons
- **Framer Motion** for animations

### AI & ML
- **@xenova/transformers**: Local browser-based embeddings (25MB model, cached)
- **@google/genai**: Google Gemini API integration
- **Cerebras API**: Fast inference for text generation

### Data & Storage
- **IndexedDB**: Document and vector storage
- **localStorage**: API keys and chat sessions
- **pdfjs-dist**: PDF parsing and text extraction

### Rendering & Markdown
- **react-markdown**: GitHub Flavored Markdown support
- **remark-gfm**: Tables, strikethrough, task lists
- **rehype-raw**: HTML in markdown
- **Babel Standalone**: In-browser JSX/TSX compilation

## Project Structure

```
constructlm/
├── components/
│   ├── ChatInterface.tsx      # Main chat UI with canvas
│   ├── Sidebar.tsx             # File/chat session management
│   ├── SettingsModal.tsx       # API key configuration
│   └── ui/
│       └── Button.tsx          # Reusable button component
├── services/
│   ├── embeddingService.ts     # Local Transformers.js embeddings
│   ├── vectorDb.ts             # IndexedDB vector operations
│   ├── geminiService.ts        # Gemini API integration
│   ├── cerebrasService.ts      # Cerebras API integration
│   ├── chatStorage.ts          # Chat session persistence
│   ├── pdfParser.ts            # PDF text extraction
│   └── runtimeBundler.ts       # Canvas TSX/JSX compilation & import resolution
├── App.tsx                     # Root component & state management
├── types.ts                    # TypeScript definitions
├── index.tsx                   # React entry point
├── vite.config.ts              # Build configuration
└── docs/                       # User documentation
```

## Installation & Setup

### Prerequisites
- Node.js 18+ (for development)
- Modern browser (Chrome, Firefox, Safari, Edge)

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env.local` (optional, keys can be set in UI):

```env
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_CEREBRAS_API_KEY=your_cerebras_key_here
```

## Architecture Deep Dive

### RAG Pipeline

1. **Document Upload** → `vectorDb.processFile()`
   - Parse file (text or PDF)
   - Chunk into 1000-char segments with 200-char overlap
   - Generate embeddings using local Transformers.js model
   - Store in IndexedDB with metadata

2. **Query Processing** → `vectorDb.searchVectors()`
   - Generate query embedding locally
   - Calculate cosine similarity across all chunks
   - Filter by relevance threshold (0.15)
   - Diversify results across multiple sources
   - Return top 8 chunks with similarity scores

3. **AI Response** → `geminiService.streamChatResponse()`
   - Format context with source markers
   - Build system instruction with RAG context
   - Stream response token-by-token
   - Display citations with hover tooltips

### State Management

- **App.tsx**: Central state container
  - Files, messages, chat sessions
  - API keys, model selection
  - Sidebar width, mobile state
- **Components**: Presentational, receive props
- **Services**: Pure functions, no state

### Storage Strategy

- **IndexedDB**: Documents, chunks, embeddings (persistent)
- **localStorage**: API keys, chat sessions (persistent)
- **React state**: UI state, current session (ephemeral)

### Code Canvas Implementation

The canvas feature provides a production-grade runtime bundler for AI-generated React components:

1. **Import Parsing**: Extracts all import statements using line-by-line processing
2. **Robust Removal**: Handles malformed imports (missing commas, syntax errors) gracefully
3. **Dependency Resolution**: Maps imports to mock components with intelligent fallbacks
4. **Code Transformation**: Removes imports, injects dependencies as globals, validates identifiers
5. **Compilation**: Babel transpiles TSX/JSX to executable JavaScript
6. **Sandbox Execution**: Runs in isolated iframe with comprehensive error boundaries
7. **Rendering**: React 18 with full hooks and library support
8. **Error Handling**: Catches compilation, runtime, and async errors with detailed overlays

**Import Resolution Strategy**:
- NPM packages → Mock components (Button, Card, Input, Link)
- Path aliases (`@/...`) → Mock components with className support
- React ecosystem → Preloaded globals (`window.React`)
- Lucide icons → SVG mock components with size/fill props
- Framer Motion → Optional CDN load with fallbacks
- Missing deps → Generic div wrappers

**Supported Libraries** (auto-loaded or mocked):
- React 18 (production build)
- ReactDOM 18
- Babel Standalone (TSX compilation)
- Tailwind CSS (full framework)
- Framer Motion (animations, optional)
- Lucide React (icons, mocked as SVG)
- Wouter (routing, mocked)

**Real-World Compatibility**:
The bundler successfully renders complex AI-generated code from:
- Google Gemini (including code with import errors)
- Anthropic Claude
- OpenAI ChatGPT
- GitHub Copilot

**Example**: AI generates code with `import { Link } from "wouter"` and a missing comma in icon imports → Bundler removes malformed imports, injects Link mock, validates all identifiers, component renders successfully.

See `CANVAS_RUNTIME_BUNDLER.md` for complete technical documentation.

### Vision Support

Gemini models support image analysis:

1. **Upload**: Drag-and-drop or file picker
2. **Preview**: Thumbnail grid with token estimation
3. **Encoding**: Base64 conversion for API
4. **Multi-image**: Support for multiple images per query
5. **Token tracking**: Accurate token estimation for images

## API Integration

### Gemini API

```typescript
// Text + RAG context
streamChatResponse(message, history, citations, onChunk, apiKey, model)

// With vision
streamChatResponse(message, history, citations, onChunk, apiKey, model, imageBase64)
```

Models:
- `gemini-2.5-flash`: Fast, 1M context, vision
- `gemini-2.5-pro`: Advanced, 2M context, vision
- `gemini-2.0-flash`: Legacy, 1M context, vision

### Cerebras API

```typescript
// Text-only (no vision)
streamChatResponse(message, history, citations, onChunk, apiKey, model)
```

Models:
- `llama3.1-8b`: Fast, 128K context
- `gpt-oss-120b`: Advanced, 128K context

## Performance Optimizations

- **Lazy loading**: GoogleGenAI SDK loaded on-demand
- **Batch embeddings**: Process 5 chunks in parallel
- **Chunk caching**: Embeddings persist in IndexedDB
- **Streaming**: Token-by-token rendering for perceived speed
- **Code splitting**: PDF.js in separate chunk
- **Worker threads**: Transformers.js runs in Web Worker

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Edge 90+ | ✅ Full | Chromium-based |
| Firefox 88+ | ✅ Full | IndexedDB support |
| Safari 15+ | ✅ Full | iOS 15+ required |

First-time load: ~25MB model download (cached for offline use)

## Security Considerations

- **API keys**: Stored in localStorage, never transmitted except to official APIs
- **Sandboxed iframes**: Code execution isolated with `sandbox="allow-scripts"`
- **CORS**: Proper headers for cross-origin requests
- **Input validation**: File type checking, size limits
- **XSS protection**: React's built-in escaping, markdown sanitization

## Deployment

### Netlify (Recommended)

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (optional)
VITE_GEMINI_API_KEY=xxx
VITE_CEREBRAS_API_KEY=xxx
```

### Vercel

```bash
# Build command
npm run build

# Output directory
dist

# Framework preset
Vite
```

### Static Hosting

Build outputs to `dist/` - deploy to any static host:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Firebase Hosting

## Development Guidelines

### Adding a New AI Provider

1. Create service file: `services/newProviderService.ts`
2. Implement `streamChatResponse()` interface
3. Add model definitions to `geminiService.ts` exports
4. Update `App.tsx` model dropdown
5. Add provider toggle in header

### Adding File Type Support

1. Update `vectorDb.processFile()` parser logic
2. Add MIME type to file input accept attribute
3. Test chunking strategy for new format
4. Update documentation

### Customizing RAG Behavior

Key parameters in `vectorDb.ts`:
- `CHUNK_SIZE`: 1000 (characters per chunk)
- `OVERLAP`: 200 (overlap between chunks)
- `RELEVANCE_THRESHOLD`: 0.15 (minimum similarity score)
- `limit`: 8 (max chunks returned per query)

## Troubleshooting

### Model fails to load
- Check browser console for CORS errors
- Ensure 25MB+ available storage
- Try clearing IndexedDB cache

### API errors
- Verify API keys in Settings
- Check API quota/billing
- Test keys with "TEST" button

### Poor RAG results
- Lower `RELEVANCE_THRESHOLD` in `vectorDb.ts`
- Increase `limit` for more context
- Adjust `CHUNK_SIZE` for your content

### Canvas rendering issues
- Check browser console for compilation errors
- Ensure code has valid React component structure
- Verify `export default` or `const Component` pattern

## Contributing

This is a reference implementation. Key areas for contribution:
- Additional AI providers (OpenAI, Anthropic, etc.)
- More file format support (DOCX, XLSX, etc.)
- Advanced RAG strategies (hybrid search, reranking)
- Collaborative features (shared sessions)
- Mobile app (React Native port)

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Xenova/transformers.js**: Making ML accessible in browsers
- **Google Gemini**: Powerful multimodal AI
- **Cerebras**: Ultra-fast inference
- **Tailwind CSS**: Utility-first styling
- **React Team**: Amazing framework

---

Built with ❤️ for construction professionals and technical documentation workflows.
