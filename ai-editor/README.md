# AI Code Editor with Groq

A minimal AI-powered code editor using Monaco Editor and Groq API for intelligent code modifications via unified diffs.

## Features

- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **Groq Integration**: Fast AI-powered code suggestions using Mixtral 8x7B
- **Unified Diff Patches**: Minimal, precise code modifications
- **Real-time Feedback**: Visual status indicators and error messages
- **Keyboard Shortcuts**: Ctrl+Enter to trigger AI edits

## Setup

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

## How It Works

1. Write code in the editor
2. Enter an instruction (e.g., "Add error handling")
3. Click "Edit with AI" or press Ctrl+Enter
4. Groq API generates a unified diff patch
5. Patch is applied to your code automatically

## Environment

The `.env.local` file contains your Groq API key. Keep it secure.

```
VITE_GROQ_API_KEY=your_key_here
```

## API Endpoint

**POST** `/edit`

Request:
```json
{
  "instruction": "Add error handling",
  "code": "function hello() { console.log('hi') }"
}
```

Response:
```json
{
  "code": "updated code here",
  "patch": "unified diff patch"
}
```

## Tech Stack

- **Frontend**: Monaco Editor, Vanilla JS
- **Backend**: Express.js, Node.js
- **AI**: Groq API (Mixtral 8x7B)
- **Diff Engine**: diff library
