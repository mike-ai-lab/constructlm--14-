# ConstructLM

A privacy-first RAG (Retrieval-Augmented Generation) workspace built with React, TypeScript, and local embeddings. Upload documents, ask questions, and get AI-powered answers with source citations.

## Features

- **Privacy-First Embeddings** - Uses Transformers.js (Xenova/all-MiniLM-L6-v2) for 100% local, browser-based embeddings
- **In-App API Key Management** - Configure and test API keys directly in the UI, stored securely in localStorage
- **Dual AI Models** - Switch between Gemini and Cerebras AI for chat responses
- **Multi-Document RAG** - Upload multiple files (TXT, MD, CSV, JSON, PDF) and query across all sources
- **Smart Retrieval** - Diversified search results ensure coverage from all uploaded documents
- **Markdown Support** - Rich formatting in AI responses with tables, lists, code blocks, and more
- **Responsive Design** - Resizable sidebar on desktop, mobile-friendly overlay menu
- **Source Citations** - Hover over citation badges to see the exact source text with markdown rendering
- **IndexedDB Storage** - All documents and embeddings stored locally in your browser
- **Comprehensive Documentation** - Built-in documentation accessible via the Documentation button in the header

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (utility-first)
- **Embeddings**: Transformers.js (@xenova/transformers)
- **AI Models**: Google Gemini API, Cerebras AI API
- **Storage**: IndexedDB for vector database
- **Markdown**: react-markdown with GitHub Flavored Markdown support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd constructlm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3001`

5. **Configure API Keys** (First-time setup):
   - Click the Settings icon in the header
   - Enter your API keys:
     - **Cerebras API** (required for default model): Get from [Cerebras Cloud](https://cloud.cerebras.ai/)
     - **Gemini API** (optional): Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Test each key to verify it works
   - Click "SAVE"

**Note:** API keys are stored securely in your browser's localStorage and never leave your device.

## Usage

1. **Access Documentation**: Click the Documentation icon in the header to open the comprehensive documentation
2. **Configure API Keys** (first time): Click Settings icon in header to enter and test your API keys
3. **Upload Documents**: Click "+ ADD SOURCE" to upload TXT, MD, CSV, JSON, or PDF files
4. **Select AI Model**: Toggle between Gemini and Cerebras in the header
5. **Ask Questions**: Type your question in the input field and press Enter
6. **View Citations**: Hover over source badges to see the exact text used for the answer
7. **Resize Sidebar**: Drag the handle between sidebar and chat area (desktop only)

## Project Structure

```
constructlm/
├── components/
│   ├── ChatInterface.tsx    # Main chat UI with markdown rendering
│   ├── Sidebar.tsx           # File management and model selection
│   ├── SettingsModal.tsx     # API key configuration
│   └── ui/
│       └── Button.tsx        # Reusable button component
├── services/
│   ├── embeddingService.ts   # Local Transformers.js embeddings
│   ├── geminiService.ts      # Gemini API integration
│   ├── cerebrasService.ts    # Cerebras API integration
│   ├── chatStorage.ts        # Chat session management
│   ├── pdfParser.ts          # PDF text extraction
│   └── vectorDb.ts           # IndexedDB vector storage
├── docs/                     # Comprehensive documentation
│   ├── index.html            # Documentation home
│   ├── quick-start.html      # Setup guide
│   ├── interface.html        # UI reference
│   ├── local-embeddings.html # Embedding system
│   ├── architecture.html     # Technical details
│   ├── troubleshooting.html  # Problem solving
│   ├── tips.html             # Best practices
│   ├── styles.css            # Documentation styling
│   └── docs.js               # Documentation interactivity
├── App.tsx                   # Main app component
├── types.ts                  # TypeScript type definitions
└── index.tsx                 # App entry point
```

## Key Features Explained

### Local Embeddings
Documents are chunked and embedded using Transformers.js, which runs entirely in your browser. No data is sent to external servers for embeddings, ensuring complete privacy.

### Diversified RAG Search
The search algorithm ensures results come from multiple documents when available, preventing bias toward a single source.

### Markdown Rendering
Both AI responses and citation tooltips support full markdown formatting including:
- Headings, bold, italic
- Code blocks (inline and block)
- Tables with proper styling
- Lists (ordered and unordered)
- Links and blockquotes

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 15+)

Note: First-time model download (~25MB) is cached for offline use.

## Documentation

Comprehensive documentation is available in the `docs/` folder and accessible via the Documentation button in the application header. The documentation covers:

- **Getting Started**: Introduction, Quick Start, Interface Overview
- **Core Features**: Local Embeddings, RAG System, AI Models, Chat Management
- **Advanced Features**: API Configuration, Document Management, Citations
- **Reference**: Architecture, Troubleshooting, Tips & Best Practices

To view documentation locally, open `docs/index.html` in your browser.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
