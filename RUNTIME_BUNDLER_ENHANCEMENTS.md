# Runtime Bundler Enhancements

## What's New

Your `runtimeBundler.ts` has been enhanced to better handle external libraries commonly used in React components.

### Supported External Libraries

#### 1. **Framer Motion** (Animations)
- **Status**: ✅ Loaded from CDN
- **URL**: `https://unpkg.com/framer-motion@11/dist/framer-motion.js`
- **Available**: `motion`, `AnimatePresence`
- **Fallback**: Simple div wrapper if CDN fails

```tsx
import { motion, AnimatePresence } from 'framer-motion';

export default function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Hello
    </motion.div>
  );
}
```

#### 2. **Lucide React** (Icons)
- **Status**: ✅ Loaded from CDN
- **URL**: `https://unpkg.com/lucide@latest`
- **Available**: All icon components (Heart, Star, Menu, etc.)
- **Fallback**: SVG circle placeholder if CDN fails

```tsx
import { Heart, Star, Menu } from 'lucide-react';

export default function IconDemo() {
  return (
    <div>
      <Heart size={24} />
      <Star size={24} />
      <Menu size={24} />
    </div>
  );
}
```

#### 3. **Built-in UI Components** (Mocked)
- `Link` - Anchor tag wrapper
- `Button` - Styled button
- `Card` - Container div
- `Input` - Form input
- `Route`, `Switch` - Router components

### How It Works

1. **Import Parsing**: Detects all imports in your code
2. **Import Removal**: Strips import statements (they won't work in browser)
3. **Mock Injection**: Injects mock/CDN versions of imported components
4. **Code Transformation**: Converts `export default` to `const Component`
5. **Babel Compilation**: Transpiles JSX to React.createElement calls
6. **Execution**: Runs in isolated iframe with error handling

### Best Practices

#### ✅ DO: Use Supported Libraries
```tsx
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState } from 'react';

export default function Good() {
  const [count, setCount] = useState(0);
  return (
    <motion.div onClick={() => setCount(count + 1)}>
      <Heart /> {count}
    </motion.div>
  );
}
```

#### ❌ DON'T: Use Unsupported Libraries
```tsx
// These won't work - no CDN support
import { DataTable } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
```

#### ✅ DO: Vanilla CSS for Styling
```tsx
export default function Styled() {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0' }}>
      Content
    </div>
  );
}
```

#### ✅ DO: Use Tailwind CSS
```tsx
export default function Tailwind() {
  return (
    <div className="p-5 bg-gray-100 rounded-lg">
      Content
    </div>
  );
}
```

### Troubleshooting

#### Issue: "motion is not defined"
**Solution**: Framer Motion CDN may not have loaded. Check:
1. Browser console (F12) for network errors
2. Ad blocker blocking unpkg.com
3. Internet connection

#### Issue: "Icon component not rendering"
**Solution**: Lucide icons show as placeholder circles. Try:
1. Reload the preview
2. Check browser console for errors
3. Use inline SVG instead

#### Issue: "Component not found"
**Solution**: Ensure your code has one of:
- `export default function MyComponent() { ... }`
- `export default MyComponent`
- `const Component = () => { ... }`

### Performance Notes

- **First load**: ~25MB for React + Babel (cached)
- **Framer Motion**: ~50KB (cached)
- **Lucide**: ~30KB (cached)
- **Subsequent loads**: Instant (from browser cache)

### Recommended Component Patterns

#### Animation Pattern
```tsx
import { motion } from 'framer-motion';

export default function Animated() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      Animated content
    </motion.div>
  );
}
```

#### Icon Pattern
```tsx
import { Heart, Star, Menu } from 'lucide-react';

export default function Icons() {
  return (
    <div className="flex gap-4">
      <Heart size={24} color="red" />
      <Star size={24} color="gold" />
      <Menu size={24} />
    </div>
  );
}
```

#### Interactive Pattern
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Interactive() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      animate={{ height: isOpen ? 200 : 0 }}
      onClick={() => setIsOpen(!isOpen)}
    >
      Click to toggle
    </motion.div>
  );
}
```

---

**Status**: ✅ Enhanced and ready to use
**Last Updated**: March 10, 2026
