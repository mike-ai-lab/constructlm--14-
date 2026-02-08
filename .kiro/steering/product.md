# Product Overview

ConstructLM is a privacy-first RAG (Retrieval-Augmented Generation) workspace that runs entirely in the browser. Users upload documents (TXT, MD, CSV, JSON, PDF) and ask questions powered by AI models with source citations.

## Core Value Proposition

- **Privacy-first**: All embeddings generated locally using Transformers.js - no data sent to external servers for vectorization
- **Multi-model support**: Toggle between Gemini and Cerebras AI for chat responses
- **Local storage**: Documents and embeddings stored in browser IndexedDB
- **Source citations**: Every AI response includes citations with hover tooltips showing exact source text

## Key Features

- Multi-document upload and indexing
- Local browser-based embeddings (Xenova/all-MiniLM-L6-v2)
- Diversified RAG search across all sources
- Markdown rendering in responses and citations
- Chat session management with history
- In-app API key configuration
- Responsive design (desktop + mobile)

## User Flow

1. Configure API keys in settings (Cerebras required, Gemini optional)
2. Upload documents via sidebar
3. Select AI model (Gemini or Cerebras)
4. Ask questions in chat interface
5. View AI responses with source citations
6. Hover over citation badges to see source text
