# AI Code Fix Pro V3

AI-powered code error detection and fixing tool for React/JSX/TSX code with a modern Gemini/Claude-style interface.

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
Requires Python 3 or Node.js installed.
- Opens http://localhost:8000/src/
- Clean modular architecture
- Separate CSS and JS files for easy development

## API Key Setup

This tool requires a Groq API key. Choose one option:

### Option 1: Use Main App (Recommended)
1. Set `VITE_GROQ_API_KEY` in `.env.local` (in root folder)
2. Run the main ConstructLM app once
3. The API key will be automatically synced to localStorage

### Option 2: Manual Setup
1. Open `SETUP-API-KEY.html` in your browser
2. Enter your Groq API key
3. Click "Save Key"

Get your free API key from: https://console.groq.com

## Features

- **Real-time Error Detection**: Babel-based parsing with cascade prevention
- **AI-Powered Fixing**: Groq API integration with streaming responses
- **Modern Interface**: Split-panel design (code editor + AI chat)
- **Diff Viewer**: Line-by-line comparison of original vs fixed code
- **Debug Panel**: Comprehensive logging with export/download
- **History Management**: Full undo/redo support
- **TypeScript Support**: Handles both JSX and TSX code
- **Multi-Error Detection**: Finds all errors, not just the first one

## Project Structure

```
ai-code-fix-tool/
├── standalone.html              # Single-file version (no server needed)
├── QUICK-START.bat             # Launch standalone version
├── LAUNCH-MODULAR.bat          # Launch modular version with server
├── SETUP-API-KEY.html          # API key configuration tool
├── README.md                   # This file
├── src/                        # Modular version (requires server)
│   ├── index.html             # Main HTML entry point
│   ├── styles/                # CSS modules
│   │   ├── main.css          # Core layout
│   │   ├── chat.css          # Chat interface
│   │   ├── diff.css          # Diff overlay
│   │   ├── debug.css         # Debug panel
│   │   └── errors.css        # Error display
│   └── js/                    # JavaScript modules
│       ├── app.js            # Main entry point
│       ├── state.js          # State management
│       ├── logger.js         # Debug logging
│       ├── editor.js         # Code editor
│       ├── errorDetector.js  # Error detection
│       ├── chat.js           # Chat interface
│       ├── aiService.js      # AI integration
│       └── diff.js           # Diff viewer
└── archived_dev_files/        # Old versions and test files
```

## Usage

1. **Open the tool** (standalone.html or run LAUNCH-MODULAR.bat)
2. **Paste your code** in the editor
3. **Click "Detect Errors"** - Instant, no API call
4. **Click "AI Fix"** - Uses Groq API to generate fix
5. **Review changes** in the diff overlay
6. **Accept or Reject** the suggested fix

## Groq API Limits (Free Tier)

Be aware of these limits to avoid 429 errors:
- **30 requests per minute**
- **14,400 tokens per minute**
- **14,400 requests per day**

**Tips to avoid rate limits:**
- Wait 2-3 seconds between requests
- Keep code samples under 200 lines
- Use "Detect Errors" first (no API call)
- Only click "AI Fix" when needed

## Debug Panel

The tool includes a comprehensive debug log:
- Click the header to expand/collapse
- View real-time workflow trace
- Copy log to clipboard
- Download log as .txt file
- Color-coded log levels (info, success, warning, error, debug)

## Development

### Modular Version
The `src/` folder contains the modular version with clean separation:
- **CSS Modules**: Separate files for different UI components
- **JS Modules**: ES6 modules with single responsibility
- **Event-Driven**: Modern addEventListener pattern
- **No Inline Handlers**: Clean HTML without onclick attributes

See `src/README.md` for detailed module documentation.

### Adding Features
1. Create new module in `src/js/` or `src/styles/`
2. Import in `app.js` or `main.css`
3. Export functions that need to be used elsewhere
4. Attach event listeners in `app.js`

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires ES6 module support (modular version) or modern JavaScript features (standalone).

## Security

- API key stored in localStorage only
- No hardcoded keys in files
- Keys never sent to any server except Groq API
- All processing happens in your browser
- No data leaves your machine

## Troubleshooting

### "Cannot load ES6 modules from file://"
Use `LAUNCH-MODULAR.bat` to start a local server, or use `standalone.html` instead.

### "API key not found"
Run `SETUP-API-KEY.html` or set the key in the main ConstructLM app.

### "Rate limit exceeded"
Wait 2-3 seconds between requests. The free tier has strict limits.

### Debug panel not working
Make sure you're using the standalone version or running the modular version with a server.

## Files Overview

- `standalone.html` - Complete tool in one file (recommended for users)
- `QUICK-START.bat` - Launch standalone version
- `LAUNCH-MODULAR.bat` - Launch development version with server
- `SETUP-API-KEY.html` - Configure Groq API key
- `src/` - Modular version for development
- `archived_dev_files/` - Old versions and test files

## No Conflicts

This tool is completely isolated from the main ConstructLM application:
- No port conflicts (standalone runs in browser)
- No dependencies on main app
- Standalone HTML files
- Uses Groq API directly from browser

## License

Part of the ConstructLM project.
