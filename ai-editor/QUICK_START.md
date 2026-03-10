# 🚀 Preview System - Quick Start

## Start the Server

```bash
cd ai-editor
node server.js
```

Open: `http://localhost:3000`

---

## Create Your First Preview

### 1. Create a Component

Click **"New File"** → Name it `Button.tsx`

```tsx
export default function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Click Me!
    </button>
  );
}
```

### 2. Preview It

**Right-click** on `Button.tsx` → Click **"👁 Preview Component"**

✅ Modal opens with rendered button!

---

## Multi-File Component Example

### Create Folder Structure

1. Create: `card/Card.tsx`
2. Create: `card/CardHeader.tsx`
3. Create: `card/CardBody.tsx`

### card/Card.tsx
```tsx
import CardHeader from './CardHeader';
import CardBody from './CardBody';

export default function Card() {
  return (
    <div className="max-w-md border rounded-lg shadow-lg">
      <CardHeader title="My Card" />
      <CardBody text="This is a multi-file component!" />
    </div>
  );
}
```

### card/CardHeader.tsx
```tsx
export default function CardHeader({ title }) {
  return (
    <div className="bg-blue-600 text-white p-4">
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}
```

### card/CardBody.tsx
```tsx
export default function CardBody({ text }) {
  return (
    <div className="p-4">
      <p>{text}</p>
    </div>
  );
}
```

### Preview It

**Right-click** on any file in `card/` folder → Click **"👁 Preview Component"**

✅ Complete card renders with all imports resolved!

---

## Interactive Component Example

### Counter.tsx
```tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Count: {count}</h1>
      <div className="flex gap-4 justify-center">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -
        </button>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}
```

✅ Fully interactive with working state!

---

## Keyboard Shortcuts

- **Escape** - Close preview modal
- **Right-click** - Open context menu

---

## What Files Can Be Previewed?

### ✅ Yes
- `.tsx` files with `export default`
- `.jsx` files with `export default`
- `.ts` files with JSX and `export default`
- `.js` files with JSX and `export default`

### ❌ No
- `.css` files
- `.json` files
- `.md` files
- Files without `export default`
- Utility files without JSX

---

## Troubleshooting

### Preview option doesn't appear?
→ File must have `export default` and JSX syntax

### "Module not found" error?
→ Check import paths match actual file names

### Blank preview?
→ Check browser console for errors

### Styles not working?
→ Use Tailwind classes (included by default)

---

## Features

✅ Multi-file components
✅ Import resolution
✅ Tailwind CSS included
✅ React 18 included
✅ Error handling
✅ Loading states
✅ Responsive modal
✅ Keyboard shortcuts

---

## Need More Help?

📖 Read: `PREVIEW_TESTING_GUIDE.md` - Comprehensive testing scenarios
📖 Read: `IMPLEMENTATION_COMPLETE.md` - Full implementation details
📖 Read: `IMPLEMENTATION_VALIDATION.md` - Validation checklist

---

**Status:** ✅ Ready to use!
