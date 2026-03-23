# AI Code Fix Pro V3 - Modular Structure

This is the refactored, modular version of the AI Code Fix tool. The monolithic HTML file has been split into manageable, maintainable modules.

## Project Structure

```
src/
├── index.html              # Main HTML entry point
├── styles/                 # CSS modules
│   ├── main.css           # Core layout and components
│   ├── chat.css           # Chat interface styles
│   ├── diff.css           # Diff overlay styles
│   ├── debug.css          # Debug panel styles
│   └── errors.css         # Error display styles
└── js/                     # JavaScript modules
    ├── app.js             # Main application entry point
    ├── state.js           # Application state management
    ├── logger.js          # Debug logging system
    ├── editor.js          # Code editor functionality
    ├── errorDetector.js   # Error detection with cascade prevention
    ├── chat.js            # Chat interface management
    ├── aiService.js       # AI service for code fixing
    └── diff.js            # Diff display and management
```

## Module Responsibilities

### JavaScript Modules

- **app.js**: Main entry point, initializes the application and exposes global functions
- **state.js**: Centralized state management and API key loading
- **logger.js**: Debug logging system with export/download capabilities
- **editor.js**: Code editor operations (undo/redo, line numbers, history)
- **errorDetector.js**: Babel-based error detection with cascade prevention
- **chat.js**: Chat UI management and AI response formatting
- **aiService.js**: Groq API integration and streaming response handling
- **diff.js**: Diff visualization and fix acceptance/rejection

### CSS Modules

- **main.css**: Core layout, header, panels, buttons, and imports other CSS
- **chat.css**: Chat messages, bubbles, and AI response formatting
- **diff.css**: Diff overlay, added/removed/unchanged line styles
- **debug.css**: Debug panel, log entries, and log level styling
- **errors.css**: Error display container and error item styling

## Key Features

1. **Modular Architecture**: Clean separation of concerns
2. **ES6 Modules**: Modern JavaScript module system
3. **Cascade Detection**: Smart error detection prevents parser cascades
4. **Streaming AI**: Real-time streaming from Groq API
5. **Undo/Redo**: Full history management
6. **Debug Panel**: Comprehensive logging with export
7. **Diff Viewer**: Visual comparison of original vs fixed code

## Development

### Running Locally

Simply open `index.html` in a modern browser that supports ES6 modules. For best results, use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000
```

Then navigate to `http://localhost:8000/src/`

### API Key Setup

The tool loads the Groq API key from localStorage. You can:

1. Set `VITE_GROQ_API_KEY` in `.env.local` and run the main ConstructLM app
2. Manually set `groq_api_key` in localStorage via browser console
3. Use the `SETUP-API-KEY.html` tool in the parent directory

### Adding New Features

1. Create a new module in `js/` or `styles/`
2. Import it in `app.js` or `main.css`
3. Export functions/classes that need to be used elsewhere
4. Keep modules focused on a single responsibility

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires ES6 module support and modern JavaScript features.

## Dependencies

External dependencies loaded via CDN:

- Babel Standalone (JSX/TSX transpilation)
- diff_match_patch (diff visualization)

## Future Improvements

- [ ] Add TypeScript for better type safety
- [ ] Implement service worker for offline support
- [ ] Add unit tests for each module
- [ ] Support more AI providers
- [ ] Add syntax highlighting in editor
- [ ] Implement code formatting (Prettier)
