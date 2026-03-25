# Technology Stack

## Runtime & Build

- **Runtime**: Browser-based (no build step required)
- **Server**: Node.js with native http module (development only)
- **Module System**: ES6 modules (native browser support)

## Core Dependencies

### Production
- `dotenv` (^16.0.3) - Environment variable management

### External Libraries (CDN)
- Babel Standalone - JSX/TSX transpilation and parsing
- React 18 (UMD) - Component preview rendering
- React DOM 18 (UMD) - DOM rendering
- diff_match_patch - Diff visualization

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Error Detection**: Babel parser (@babel/standalone)
- **AI Service**: Groq API (streaming responses)
- **State Management**: Centralized state object (state.js)
- **Module Pattern**: ES6 imports/exports

## Common Commands

### Start Development Server
```bash
npm start
# Runs on http://localhost:8001
```

### Quick Launch Scripts
```bash
# Standalone version (no server)
QUICK-START.bat

# Modular version (with server)
LAUNCH-MODULAR.bat
```

### Alternative Servers
```bash
# Python 3
python -m http.server 8000

# Node.js http-server
npx http-server -p 8000
```

## Environment Configuration

Create `.env.local` in project root:
```
VITE_GROQ_API_KEY=your_api_key_here
```

## Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires ES6 module support and modern JavaScript features.

## Security

- API keys stored in localStorage only
- No hardcoded credentials
- Keys only sent to Groq API
- All processing happens client-side
- CORS headers configured for local development
