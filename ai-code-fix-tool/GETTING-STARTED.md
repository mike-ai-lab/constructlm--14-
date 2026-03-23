# Getting Started with AI Code Fix Pro V3

## For End Users (Quick & Easy)

### Step 1: Get Your API Key
1. Go to https://console.groq.com
2. Sign up for a free account
3. Copy your API key

### Step 2: Configure the Tool
1. Double-click `SETUP-API-KEY.html`
2. Paste your API key
3. Click "Save Key"

### Step 3: Start Using
1. Double-click `QUICK-START.bat` (or open `standalone.html`)
2. Paste your React/JSX code
3. Click "Detect Errors"
4. Click "AI Fix" if errors are found
5. Review and accept/reject the fix

That's it! No installation, no server, no complexity.

## For Developers (Modular Version)

### Prerequisites
Install either:
- Python 3: https://www.python.org/downloads/
- Node.js: https://nodejs.org/

### Step 1: Start the Server
```bash
LAUNCH-MODULAR.bat
```

This will:
- Start a local server on port 8000
- Open http://localhost:8000/src/ in your browser
- Keep the terminal open (don't close it)

### Step 2: Develop
The modular version has clean separation:
- Edit CSS in `src/styles/`
- Edit JavaScript in `src/js/`
- Changes require browser refresh
- Check browser console for errors

### Step 3: Debug
- Click the debug panel at the bottom
- View real-time logs
- Copy or download logs for troubleshooting

## Common Issues

### Issue: "Cannot load ES6 modules"
**Solution**: Use `LAUNCH-MODULAR.bat` instead of opening index.html directly.
Or use `standalone.html` which doesn't need a server.

### Issue: "API key not found"
**Solution**: Run `SETUP-API-KEY.html` and enter your Groq API key.

### Issue: "Rate limit exceeded"
**Solution**: Wait 2-3 seconds between requests. Free tier has limits:
- 30 requests per minute
- 14,400 tokens per minute

### Issue: Debug panel not expanding
**Solution**: Make sure JavaScript is enabled and you're using a modern browser.

## Tips for Best Results

1. **Start Small**: Test with small code snippets first
2. **Use Detect First**: Always click "Detect Errors" before "AI Fix"
3. **Review Changes**: Check the diff carefully before accepting
4. **Save Your Work**: Copy your code before accepting fixes
5. **Check Debug Log**: If something goes wrong, check the debug panel

## What Can It Fix?

- Missing semicolons
- Unclosed brackets/braces/parentheses
- JSX syntax errors
- TypeScript type annotation issues
- Import/export problems
- React component errors
- And more!

## What It Cannot Fix

- Logic errors (wrong algorithm)
- Runtime errors (only syntax errors)
- API integration issues
- Complex architectural problems

## Need Help?

1. Check the debug log (click panel at bottom)
2. Copy the log and share it
3. Check browser console for errors
4. Make sure API key is configured
5. Verify you have internet connection (for AI fixes)

## File Overview

- `standalone.html` - Use this! (no server needed)
- `QUICK-START.bat` - Launches standalone.html
- `LAUNCH-MODULAR.bat` - For developers (needs server)
- `SETUP-API-KEY.html` - Configure your API key
- `src/` - Modular version source code
- `archived_dev_files/` - Old versions (ignore)

## Quick Reference

| Action | File to Use | Needs Server? |
|--------|-------------|---------------|
| Just use the tool | standalone.html | No |
| Configure API key | SETUP-API-KEY.html | No |
| Develop/modify | src/index.html | Yes |
| Quick launch | QUICK-START.bat | No |
| Dev launch | LAUNCH-MODULAR.bat | Yes |

## Next Steps

1. Configure your API key (SETUP-API-KEY.html)
2. Launch the tool (QUICK-START.bat)
3. Try fixing some code!
4. Check out the debug panel
5. Explore the modular version if you want to customize

Happy coding!
