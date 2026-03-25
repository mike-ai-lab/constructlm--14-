# Project Structure

## Directory Layout

```
ai-code-fix-tool/
├── .env.local                  # Environment variables (API keys)
├── .kiro/                      # Kiro configuration
│   └── steering/              # AI assistant steering rules
├── server.js                   # Node.js development server
├── package.json               # Project metadata and dependencies
├── standalone.html            # Single-file version (no server needed)
├── SETUP-API-KEY.html         # API key configuration tool
├── *.bat                      # Windows launch scripts
├── src/                       # Modular version (requires server)
│   ├── index.html            # Main HTML entry point
│   ├── js/                   # JavaScript modules
│   │   ├── app.js           # Main entry point & initialization
│   │   ├── state.js         # Centralized state management
│   │   ├── logger.js        # Debug logging system
│   │   ├── editor.js        # Code editor operations
│   │   ├── errorDetector.js # Babel-based error detection
│   │   ├── chat.js          # Chat interface management
│   │   ├── aiService.js     # Groq API integration
│   │   ├── diff.js          # Diff visualization
│   │   ├── preview.js       # React component preview
│   │   └── ReactComponentRenderer.js # React rendering logic
│   └── styles/               # CSS modules
│       ├── main.css         # Core layout & imports
│       ├── chat.css         # Chat interface styles
│       ├── diff.css         # Diff overlay styles
│       ├── debug.css        # Debug panel styles
│       ├── errors.css       # Error display styles
│       └── preview.css      # Preview panel styles
├── archived_dev_files/        # Old versions and test files
└── node_modules/              # npm dependencies
```

## Module Organization

### JavaScript Modules (src/js/)

Each module has a single responsibility:

- **app.js**: Application initialization, event listener attachment, main workflow orchestration
- **state.js**: Global state object, API key loading from server
- **logger.js**: Debug logging with levels (info, success, warning, error, debug), export/download
- **editor.js**: Code editor functionality (line numbers, history, undo/redo, copy/clear)
- **errorDetector.js**: Babel parser integration, cascade prevention, error extraction
- **chat.js**: Chat UI management, message rendering, panel toggle
- **aiService.js**: Groq API calls, streaming response handling, status updates
- **diff.js**: Diff overlay display, accept/reject fix actions
- **preview.js**: React component rendering in iframe
- **ReactComponentRenderer.js**: React rendering utilities

### CSS Modules (src/styles/)

- **main.css**: Core layout, header, panels, buttons, imports all other CSS
- **chat.css**: Chat messages, bubbles, AI response formatting
- **diff.css**: Diff overlay, line-by-line comparison styles
- **debug.css**: Debug panel, log entries, color-coded log levels
- **errors.css**: Error display container, error items
- **preview.css**: Preview panel and iframe container

## Architecture Patterns

### Module Pattern
- ES6 imports/exports for clean dependencies
- Each module exports only what's needed
- No global namespace pollution

### Event-Driven
- Event listeners attached in app.js
- No inline onclick handlers in HTML
- Clean separation of concerns

### State Management
- Centralized state object in state.js
- Modules import and modify state as needed
- No prop drilling or complex state libraries

### API Integration
- Server endpoint `/api/config` provides API key from .env.local
- Client-side fetch to Groq API with streaming
- Error handling and rate limit awareness

## File Naming Conventions

- JavaScript: camelCase (e.g., `errorDetector.js`)
- CSS: kebab-case (e.g., `main.css`)
- HTML: kebab-case (e.g., `index.html`)
- Batch scripts: UPPERCASE with hyphens (e.g., `QUICK-START.bat`)

## Adding New Features

1. Create new module in appropriate directory (`js/` or `styles/`)
2. Import in `app.js` (JS) or `main.css` (CSS)
3. Export functions/classes that need external access
4. Attach event listeners in `app.js` if needed
5. Keep modules focused on single responsibility
