# AI Code Fix Pro V3

AI-powered code error detection and fixing tool for React/JSX/TSX code with a modern professional interface featuring Monaco Editor.

## Quick Start

### Option 1: Standalone Version (Easiest - No Server Required)
```bash
QUICK-START.bat
```
Or simply open `standalone.html` in your browser.
- Works with file:// protocol
- Single HTML file with everything bundled
- No installation needed

### Option 2: Modular Version (For Development)
```bash
LAUNCH-MODULAR.bat
```
Or use npm:
```bash
npm start
```
- Opens http://localhost:8001/src/
- Clean modular architecture
- Separate CSS and JS files for easy development

## API Key Setup

This tool supports multiple AI providers. Choose one option:

### Option 1: Use Main App (Recommended)
1. Set API keys in `.env.local` (in root folder):
   - `VITE_GROQ_API_KEY=your_groq_key`
   - `VITE_GEMINI_API_KEY=your_gemini_key`
   - `VITE_CEREBRAS_API_KEY=your_cerebras_key`
   - `VITE_OPENROUTER_API_KEY=your_openrouter_key`
2. Run the main ConstructLM app once
3. API keys will be automatically synced to localStorage

### Option 2: Manual Setup
1. Open `SETUP-API-KEY.html` in your browser
2. Enter your API keys for desired providers
3. Click "Save Keys"

### Option 3: Settings Panel
1. Open the app
2. Click the Settings button (gear icon)
3. Enter API keys in the settings modal
4. Select your preferred provider and model

Get free API keys:
- Groq: https://console.groq.com
- Gemini: https://makersuite.google.com/app/apikey
- Cerebras: https://cloud.cerebras.ai
- OpenRouter: https://openrouter.ai/keys

## Features

- **Monaco Editor**: Professional VS Code-style code editor with syntax highlighting
- **Multi-Provider Support**: Choose from Groq, Gemini, Cerebras, OpenRouter, or Ollama
- **Model Selection**: Dropdown menu to switch between AI models on the fly
- **Real-time Error Detection**: Babel-based parsing with cascade prevention
- **AI-Powered Fixing**: Streaming responses with inline diff decorations
- **Modern Interface**: Split-panel design (Monaco editor + AI chat)
- **GitHub-Style Diffs**: Inline diff decorations with accept/reject buttons
- **Debug Panel**: Comprehensive logging with export/download
- **History Management**: Full undo/redo support
- **React Preview**: Live rendering of React components
- **TypeScript Support**: Handles both JSX and TSX code
- **Multi-Error Detection**: Finds all errors, not just the first one
- **Dark/Light Theme**: Smooth theme switching with CSS variables

## Supported AI Providers

### Groq (Default)
- Fast inference with Llama models
- Free tier: 30 req/min, 14,400 tokens/min
- Models: Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B

### Google Gemini
- Multimodal capabilities
- Free tier available
- Models: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2.0 Flash

### Cerebras
- Ultra-fast inference
- Free tier available
- Models: Llama 3.3 70B, Llama 3.1 8B/70B

### OpenRouter
- Access to multiple providers
- Pay-per-use pricing
- Models: GPT-4, Claude, Gemini, and more

### Ollama
- Local and cloud models
- No API key needed for local
- Run models on your machine

## Project Structure

```
ai-code-fix-tool/
├── standalone.html              # Single-file version (no server needed)
├── QUICK-START.bat             # Launch standalone version
├── LAUNCH-MODULAR.bat          # Launch modular version with server
├── SETUP-API-KEY.html          # API key configuration tool
├── server.js                   # Node.js development server
├── package.json                # Project dependencies
├── README.md                   # This file
├── src/                        # Modular version (requires server)
│   ├── index.html             # Main HTML entry point
│   ├── styles/                # CSS modules
│   │   ├── main.css          # Core layout & imports
│   │   ├── chat.css          # Chat interface
│   │   ├── diff.css          # Diff overlay
│   │   ├── debug.css         # Debug panel
│   │   ├── errors.css        # Error display
│   │   ├── settings.css      # Settings modal
│   │   ├── modelSelector.css # Model dropdown
│   │   └── preview.css       # React preview
│   └── js/                    # JavaScript modules
│       ├── app.js            # Main entry point
│       ├── state.js          # State management
│       ├── logger.js         # Debug logging
│       ├── monacoEditor.js   # Monaco integration
│       ├── editor.js         # Editor operations
│       ├── errorDetector.js  # Error detection
│       ├── chat.js           # Chat interface
│       ├── aiService.js      # AI integration
│       ├── diff.js           # Diff viewer
│       ├── preview.js        # React preview
│       ├── settings.js       # Settings modal
│       ├── modelSelector.js  # Model dropdown
│       ├── ReactComponentRenderer.js # React rendering
│       └── services/         # AI provider services
│           ├── groqService.js
│           ├── geminiService.js
│           ├── cerebrasService.js
│           ├── openrouterService.js
│           └── ollamaService.js
└── archived_dev_files/        # Old versions and test files
```

## Usage

1. **Open the tool** (standalone.html or run LAUNCH-MODULAR.bat)
2. **Select AI provider** - Click the provider badge in header to choose model
3. **Paste your code** in the Monaco editor
4. **Click "Detect Errors"** - Instant, no API call
5. **Click "AI Fix"** - Uses selected AI provider to generate fix
6. **Review changes** - Inline diff decorations show additions/removals
7. **Accept or Reject** - Click buttons next to each change or use batch actions

## Monaco Editor Features

- **Syntax Highlighting**: Full JSX/TSX support
- **Auto-completion**: IntelliSense for JavaScript/TypeScript
- **Error Markers**: Red squiggles for syntax errors
- **Line Numbers**: Professional gutter with line numbers
- **Minimap**: Code overview on the right side
- **Find & Replace**: Ctrl+F to search, Ctrl+H to replace
- **Multi-cursor**: Alt+Click for multiple cursors
- **Command Palette**: F1 or Ctrl+Shift+P

## Debug Panel

The tool includes a comprehensive debug log:
- **Problems Tab**: VS Code-style error list with click-to-navigate
- **Debug Logs Tab**: Real-time workflow trace with hierarchical view
- Click the header to expand/collapse
- Copy log to clipboard
- Color-coded log levels (info, success, warning, error, debug)

## Development

### Modular Version
The `src/` folder contains the modular version with clean separation:
- **CSS Modules**: Separate files for different UI components
- **JS Modules**: ES6 modules with single responsibility
- **Event-Driven**: Modern addEventListener pattern
- **No Inline Handlers**: Clean HTML without onclick attributes
- **Service Pattern**: Each AI provider has its own service module

### Adding Features
1. Create new module in `src/js/` or `src/styles/`
2. Import in `app.js` or `main.css`
3. Export functions that need to be used elsewhere
4. Attach event listeners in `app.js`

### Adding AI Providers
1. Create service file in `src/js/services/`
2. Export model list and `sendMessage` function
3. Import in `aiService.js` and add to provider map
4. Add models to `modelSelector.js`

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires ES6 module support and modern JavaScript features.

## Security

- API keys stored in localStorage only
- No hardcoded keys in files
- Keys never sent to any server except chosen AI provider
- All processing happens in your browser
- No data leaves your machine (except AI API calls)

## Troubleshooting

### "Cannot load ES6 modules from file://"
Use `LAUNCH-MODULAR.bat` to start a local server, or use `standalone.html` instead.

### "API key not found"
Run `SETUP-API-KEY.html`, use the Settings panel, or set keys in `.env.local`.

### "Rate limit exceeded"
Wait 2-3 seconds between requests. Free tiers have strict limits. Consider switching providers.

### Monaco editor not loading
Make sure you have internet connection (Monaco loads from CDN) or check browser console for errors.

### Model dropdown not showing
Refresh the page. The dropdown requires `main.css` to be loaded properly.

## Files Overview

- `standalone.html` - Complete tool in one file (recommended for users)
- `QUICK-START.bat` - Launch standalone version
- `LAUNCH-MODULAR.bat` - Launch development version with server
- `SETUP-API-KEY.html` - Configure API keys
- `server.js` - Node.js development server (port 8001)
- `src/` - Modular version for development
- `archived_dev_files/` - Old versions and test files

## No Conflicts

This tool is completely isolated from the main ConstructLM application:
- Runs on different port (8001 vs main app)
- No dependencies on main app
- Standalone HTML files available
- Uses AI APIs directly from browser

## License

Part of the ConstructLM project.
