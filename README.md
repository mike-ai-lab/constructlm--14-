# ConstructLM

A privacy-first RAG (Retrieval-Augmented Generation) workspace built with React, TypeScript, and local embeddings. Upload documents, ask questions, and get AI-powered answers with source citations.

## Features

- **🔒 Privacy-First Embeddings** - Uses Transformers.js (Xenova/all-MiniLM-L6-v2) for 100% local, browser-based embeddings
- **🤖 Dual AI Models** - Switch between Gemini and Cerebras AI for chat responses
- **📚 Multi-Document RAG** - Upload multiple files (TXT, MD, CSV, JSON) and query across all sources
- **🎯 Smart Retrieval** - Diversified search results ensure coverage from all uploaded documents
- **💬 Markdown Support** - Rich formatting in AI responses with tables, lists, code blocks, and more
- **📱 Responsive Design** - Resizable sidebar on desktop, mobile-friendly overlay menu
- **🔍 Source Citations** - Hover over citation badges to see the exact source text with markdown rendering
- **💾 IndexedDB Storage** - All documents and embeddings stored locally in your browser

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

3. Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_CEREBRAS_API_KEY=your_cerebras_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:3001`

### Getting API Keys

- **Gemini API**: Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Cerebras API**: Get your key from [Cerebras Cloud](https://cloud.cerebras.ai/)

## Usage

1. **Upload Documents**: Click "+ ADD SOURCE" to upload TXT, MD, CSV, or JSON files
2. **Select AI Model**: Toggle between Gemini and Cerebras in the sidebar
3. **Ask Questions**: Type your question in the input field and press Enter
4. **View Citations**: Hover over source badges to see the exact text used for the answer
5. **Resize Sidebar**: Drag the handle between sidebar and chat area (desktop only)

## Project Structure

```
constructlm/
├── components/
│   ├── ChatInterface.tsx    # Main chat UI with markdown rendering
│   ├── Sidebar.tsx           # File management and model selection
│   └── ui/
│       └── Button.tsx        # Reusable button component
├── services/
│   ├── embeddingService.ts   # Local Transformers.js embeddings
│   ├── geminiService.ts      # Gemini API integration
│   ├── cerebrasService.ts    # Cerebras API integration
│   └── vectorDb.ts           # IndexedDB vector storage
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

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 15+)

Note: First-time model download (~25MB) is cached for offline use.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
