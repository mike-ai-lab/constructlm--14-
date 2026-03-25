# Quick Start Guide - AI Code Fix Pro with React Preview
## Getting Started
### 1. Open the Application
Navigate to the application folder and open `src/index.html` in your browser:
```bash
cd "C:\Users\Administrator\constructlm (14)\ai-code-fix-tool"
# Open src/index.html in your browser
```
Or if you have a local server:
```bash
# Using Python
python -m http.server 8000
# Using Node.js http-server
npx http-server src -p 8000
```
Then visit: `http://localhost:8000`
### 2. Basic Workflow
#### Option A: Error Detection + Fix + Preview
1. Paste your React code in the editor
2. Click **"Detect Errors"** to analyze the code
3. If errors found, click **"AI Fix"** to get suggestions
4. Accept or reject the fixes
5. Click **"Render Preview"** to see your component live
#### Option B: Direct Preview
1. Paste working React code in the editor
2. Click **"Render Preview"** immediately
3. See your component rendered in real-time
### 3. Using the Preview Panel
**Show/Hide Preview:**
- Click **"Show Preview"** button in the header
- Panel slides in from the right
- Click **"Hide Preview"** to collapse it
**Render Component:**
- Click **"Render Preview"** button
- Watch the loading indicator
- Component appears in the iframe
**Clear Preview:**
- Click the ??? icon in the preview panel header
- Resets the preview to placeholder state
### 4. Example: Try This Code
Copy and paste this into the editor, then click "Render Preview":
```javascript
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
export default function LikeButton() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(42);
  const handleClick = () => {
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Like This Post
        </h1>
        <button
          onClick={handleClick}
          className={`flex items-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            liked 
              ? 'bg-red-500 text-white scale-105' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Heart 
            size={28} 
            className={liked ? 'fill-current' : ''} 
          />
          {liked ? 'Liked!' : 'Like'}
        </button>
        <p className="text-center mt-4 text-gray-600">
          {count} people liked this
        </p>
      </div>
    </div>
  );
}
```
### 5. Keyboard Shortcuts
- **Ctrl+Z / Cmd+Z**: Undo (use ? button)
- **Ctrl+Y / Cmd+Y**: Redo (use ? button)
- **Ctrl+C / Cmd+C**: Copy (after selecting text)
### 6. Panel Management
**Chat Panel:**
- Shows AI assistant messages
- Displays error analysis
- Shows fix suggestions
- Toggle with "Hide/Show Chat" button
**Console Panel:**
- Click the bottom bar to expand
- Shows error details with line numbers
- Click "Clear" to reset
- Auto-expands when errors detected
**Debug Log:**
- Click "?? Debug" button in header
- Floating window with detailed logs
- Copy logs with ?? button
- Clear with "Clear" button
### 7. Tips for Best Results
**For Error Detection:**
- Paste complete component code
- Include all imports
- Use proper export statements
**For Preview:**
- Ensure valid JSX syntax
- Use Tailwind classes for styling
- Icons are auto-mocked (lucide-react, react-icons)
- Framer Motion components work automatically
**For AI Fix:**
- Let error detection run first
- Review suggested changes in diff view
- Accept changes that make sense
- Reject and manually fix if needed
### 8. Common Use Cases
**Debugging AI-Generated Code:**
1. Paste AI-generated React component
2. Detect errors
3. Use AI fix for quick corrections
4. Preview to verify it works
**Learning React:**
1. Write component code
2. Preview to see results
3. Detect errors to learn mistakes
4. Iterate and improve
**Rapid Prototyping:**
1. Write component quickly
2. Preview immediately
3. Adjust and re-render
4. No build step needed
### 9. Troubleshooting
**Preview shows blank:**
- Check browser console (F12)
- Ensure code has export statement
- Try "Detect Errors" first
**Errors not detected:**
- Check if code is valid JavaScript
- Ensure Babel is loaded (check console)
- Try refreshing the page
**AI Fix not working:**
- Ensure API key is configured
- Check network connection
- Review debug log for details
### 10. Next Steps
- Read `REACT_PREVIEW_INTEGRATION.md` for technical details
- Experiment with different React patterns
- Try components with hooks, icons, and animations
- Combine error detection, fixing, and preview workflows
## Support
For issues or questions:
1. Check the debug log (?? Debug button)
2. Review browser console (F12)
3. Read the integration documentation
4. Check that all CDN resources loaded
Enjoy building React components with AI Code Fix Pro! ??
