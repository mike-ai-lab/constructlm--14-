# Product Overview

AI Code Fix Pro V3 is an AI-powered code error detection and fixing tool for React/JSX/TSX code with a modern interface.

## Core Features

- Real-time error detection using Babel parser with cascade prevention
- AI-powered code fixing via Groq API with streaming responses
- Split-panel interface: code editor + AI chat assistant
- Visual diff viewer for comparing original vs fixed code
- Debug panel with comprehensive logging and export capabilities
- Full undo/redo history management
- React component preview with live rendering
- TypeScript/TSX support

## Deployment Modes

1. **Standalone Version**: Single HTML file, no server required, works with file:// protocol
2. **Modular Version**: Development-friendly with separate CSS/JS modules, requires local server

## API Integration

Uses Groq API for AI-powered code fixing. API key can be:
- Loaded from `.env.local` file (VITE_GROQ_API_KEY)
- Set via SETUP-API-KEY.html tool
- Synced from main ConstructLM app via localStorage

## Rate Limits (Groq Free Tier)

- 30 requests per minute
- 14,400 tokens per minute
- 14,400 requests per day
