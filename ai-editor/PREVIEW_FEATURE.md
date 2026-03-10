# Preview Feature Documentation

## Overview

The AI Code Editor now includes a **Live Preview Panel** that allows you to view HTML, React, and JavaScript components in real-time as you write or edit code.

---

## Features

### ✅ Supported File Types

1. **HTML Files (.html)**
   - Direct rendering in iframe
   - Full HTML/CSS/JavaScript support
   - Instant preview updates

2. **React Components (.jsx, .tsx)**
   - Babel transpilation support
   - React 18 with hooks support
   - Auto-renders App or Component exports
   - Error handling with error display

3. **JavaScript Files (.js, .ts)**
   - Code execution in sandbox
   - Console.log capture and display
   - Error handling with stack traces

### 🎯 Preview Controls

- **🔄 Refresh Button** - Manually refresh the preview
- **👁️ Toggle Button** - Show/hide the preview panel
- **Auto-Refresh** - Automatically updates as you type (1 second debounce)

---

## How to Use

### 1. Create an HTML File

```bash
# In the file explorer, click "+ New File"
# Enter: index.html
```

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    h1 { color: #0e639c; }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>This is a live preview.</p>
</body>
</html>
```

The preview panel will automatically render your HTML!

### 2. Create a React Component

```bash
# Click "+ New File"
# Enter: App.jsx
```

```jsx
export default function App() {
  const [count, setCount] = React.useState(0)
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>React Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
```

The preview will render your React component with full interactivity!

### 3. Create a JavaScript File

```bash
# Click "+ New File"
# Enter: script.js
```

```javascript
console.log('Hello from JavaScript!')
console.log('2 + 2 =', 2 + 2)

const greeting = 'Welcome to the preview!'
console.log(greeting)
```

The preview will capture and display all console.log output!

---

## Preview Panel Layout

```
┌─────────────────────────────────────────┐
│ Preview                    🔄 Refresh   │
│                            👁️ Toggle    │
├─────────────────────────────────────────┤
│                                         │
│     Your rendered component here        │
│                                         │
│     (HTML, React, or JS output)         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Functions Reference

### `refreshPreview()`
Manually refresh the preview for the current file.

```javascript
refreshPreview()
```

### `togglePreview()`
Show or hide the preview panel.

```javascript
togglePreview()
```

### `renderHTMLPreview(html)`
Render HTML content in the preview.

```javascript
renderHTMLPreview('<h1>Hello</h1>')
```

### `renderReactPreview(code)`
Render React component code in the preview.

```javascript
renderReactPreview('export default () => <h1>Hello</h1>')
```

### `renderJSPreview(code)`
Execute JavaScript code and display output.

```javascript
renderJSPreview('console.log("Hello")')
```

---

## Auto-Refresh Behavior

The preview automatically updates when you:
- Type in HTML files
- Type in React files (.jsx, .tsx)
- Type in JavaScript files

**Debounce:** 1 second delay to avoid excessive re-renders

**Supported Extensions:**
- `.html` - HTML files
- `.jsx` - React JavaScript
- `.tsx` - React TypeScript
- `.js` - JavaScript
- `.ts` - TypeScript

---

## Error Handling

### HTML Errors
If your HTML has syntax errors, they'll be displayed in the preview.

### React Errors
If your React component has errors:
- Babel compilation errors are shown
- Runtime errors are displayed in red
- Missing exports are reported

### JavaScript Errors
If your JavaScript has errors:
- Syntax errors are caught
- Runtime errors are displayed
- Stack traces are shown

---

## Examples

### Example 1: Simple HTML Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>Portfolio</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <h1>Welcome to My Portfolio</h1>
  <div class="card">
    <h2>Project 1</h2>
    <p>Description of project 1</p>
  </div>
  <div class="card">
    <h2>Project 2</h2>
    <p>Description of project 2</p>
  </div>
</body>
</html>
```

### Example 2: Interactive React Component

```jsx
export default function TodoApp() {
  const [todos, setTodos] = React.useState([])
  const [input, setInput] = React.useState('')
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input])
      setInput('')
    }
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Todo App</h1>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Example 3: JavaScript with Console Output

```javascript
// Calculate factorial
function factorial(n) {
  if (n <= 1) return 1
  return n * factorial(n - 1)
}

console.log('Factorial of 5:', factorial(5))

// Generate Fibonacci sequence
const fib = (n) => n <= 1 ? n : fib(n-1) + fib(n-2)
console.log('Fibonacci sequence:')
for (let i = 0; i < 10; i++) {
  console.log(`fib(${i}) = ${fib(i)}`)
}
```

---

## Limitations

1. **Sandbox Security**: Preview runs in an iframe with limited permissions
2. **External APIs**: Cannot access external APIs due to CORS restrictions
3. **File System**: Cannot access local file system
4. **Node.js**: Cannot use Node.js modules (only browser APIs)
5. **React Versions**: Uses React 18 from CDN

---

## Tips & Tricks

### Tip 1: Use React Hooks
```jsx
export default function Counter() {
  const [count, setCount] = React.useState(0)
  
  React.useEffect(() => {
    console.log('Count changed:', count)
  }, [count])
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Tip 2: Style Your Components
```jsx
export default function StyledComponent() {
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      fontFamily: 'Arial'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#0e639c',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  }
  
  return (
    <div style={styles.container}>
      <h1>Styled Component</h1>
      <button style={styles.button}>Click Me</button>
    </div>
  )
}
```

### Tip 3: Debug with Console
```javascript
const data = { name: 'John', age: 30 }
console.log('Data:', data)
console.log('Keys:', Object.keys(data))
console.log('Values:', Object.values(data))
```

---

## Troubleshooting

### Preview Not Showing?
1. Check file extension (.html, .jsx, .tsx, .js, .ts)
2. Click the Refresh button
3. Check browser console for errors

### React Component Not Rendering?
1. Make sure you export a component named `App` or `Component`
2. Check for syntax errors in your code
3. Verify React syntax is correct

### JavaScript Output Not Showing?
1. Make sure you use `console.log()` to output
2. Check for runtime errors
3. Verify the code executes without errors

---

## Keyboard Shortcuts

- **Ctrl+Enter** (or **Cmd+Enter** on Mac): Send chat message
- **Click Refresh Button**: Manually refresh preview
- **Click Toggle Button**: Show/hide preview panel

---

## Future Enhancements

- [ ] CSS preview panel
- [ ] Component library preview
- [ ] Live reload on file changes
- [ ] Preview device emulation (mobile, tablet)
- [ ] Screenshot export
- [ ] Preview history
- [ ] Responsive design testing

---

**Preview Feature**: ✅ COMPLETE & WORKING
**Supported Types**: HTML, React, JavaScript
**Auto-Refresh**: ✅ ENABLED
**Error Handling**: ✅ COMPREHENSIVE
