# Simple Canvas Test

Test these examples one by one to verify the canvas is working:

## Test 1: Absolute Minimal (No Imports)

```tsx
export default function Hello() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-500">
      <h1 className="text-4xl font-bold text-white">Hello Canvas!</h1>
    </div>
  );
}
```

**Expected**: Blue screen with white text "Hello Canvas!"

---

## Test 2: With useState (React Import)

```tsx
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold mb-8">{count}</h1>
      <button
        onClick={() => setCount(count + 1)}
        className="px-8 py-4 bg-blue-500 text-white text-xl rounded-lg hover:bg-blue-600"
      >
        Click Me
      </button>
    </div>
  );
}
```

**Expected**: Counter that increments on click

---

## Test 3: With Mock Button (Path Alias)

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Count: {count}</h1>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  );
}
```

**Expected**: Counter with styled mock button

---

## Test 4: Multiple Components

```tsx
import { useState } from "react";

function Header({ title }) {
  return (
    <header className="bg-blue-600 text-white p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8">
      <p className="text-xl mb-4">Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Add One
      </button>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="My App" />
      <Counter />
    </div>
  );
}
```

**Expected**: App with header and working counter

---

## Debugging Steps

If you see "Script error":

1. **Open browser console** (F12) - look for actual error messages
2. **Check network tab** - verify React/Babel scripts loaded (should be 200 OK)
3. **Look for CORS errors** - red text in console about cross-origin
4. **Check if Babel loaded** - type `window.Babel` in console, should not be undefined

Common issues:
- Ad blocker blocking CDN scripts
- Corporate firewall blocking unpkg.com
- Browser extensions interfering
- Slow internet causing timeout

If scripts are loading but component fails:
- Check console for actual error message
- Look for syntax errors in the transformed code
- Verify the component structure is valid
