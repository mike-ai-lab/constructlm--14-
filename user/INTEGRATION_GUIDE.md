# Integration Guide - Universal Module Resolution

## Quick Start

### Step 1: Update App.tsx

Replace the old runtime bundler import:

```typescript
// OLD
import { generateBundledPreview } from './services/runtimeBundler';

// NEW
import { generateBundledPreviewV2 } from './services/runtimeBundlerV2';
```

### Step 2: Update Canvas Rendering

Make the function async:

```typescript
// OLD (sync)
const handleRenderCanvas = (code: string, language: string) => {
  const result = generateBundledPreview(code, language);
  if (result.error) {
    console.error('Bundle error:', result.error);
  } else {
    setCanvasHtml(result.html);
  }
};

// NEW (async)
const handleRenderCanvas = async (code: string, language: string) => {
  const result = await generateBundledPreviewV2(code, language);
  if (result.error) {
    console.error('Bundle error:', result.error);
  } else {
    setCanvasHtml(result.html);
  }
};
```

### Step 3: Test with COVID Dashboard

Paste this code and render:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart } from 'react-google-charts';
import { FaGlobe } from 'react-icons/fa';

export default function CovidDashboard() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    axios.get('https://api.covid19api.com/summary')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);
  
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <FaGlobe size={24} />
        <h1 className="text-2xl font-bold">COVID-19 Dashboard</h1>
      </div>
      <Chart 
        chartType="LineChart" 
        data={[['Date', 'Cases'], ['Day 1', 100], ['Day 2', 150]]}
        options={{ title: 'Cases Over Time' }}
      />
    </div>
  );
}
```

**Expected Result:**
- ✅ axios loads from CDN
- ✅ react-google-charts loads from CDN
- ✅ FaGlobe renders as icon
- ✅ Chart displays with data
- ✅ No errors

## Advanced Configuration

### Local Module Support (RAWGraphs Example)

```typescript
const result = await generateBundledPreviewV2(code, 'tsx', {
  localModules: {
    'rawgraphs-charts': {
      localPath: 'C:/Users/Administrator/rawgraphs-charts/index.js',
      hostedUrl: 'https://yourdomain.com/libs/rawgraphs-charts.js'
    }
  },
  isProduction: process.env.NODE_ENV === 'production'
});
```

### Production Deployment

Set environment variable:

```bash
# .env.production
VITE_IS_PRODUCTION=true
```

Update code:

```typescript
const result = await generateBundledPreviewV2(code, 'tsx', {
  isProduction: import.meta.env.VITE_IS_PRODUCTION === 'true'
});
```

## Backward Compatibility

The old `generateBundledPreview` is still available:

```typescript
import { generateBundledPreview } from './services/runtimeBundler';

// Still works for simple cases
const result = generateBundledPreview(code, 'tsx');
```

But it's recommended to migrate to V2 for:
- Automatic module resolution
- Better error handling
- CDN fallbacks
- Future-proof architecture

## Testing Checklist

- [ ] COVID Dashboard renders
- [ ] axios requests work
- [ ] Charts display
- [ ] Icons render
- [ ] Framer Motion animations work
- [ ] Unknown libraries don't crash
- [ ] Local modules load (if configured)
- [ ] Production build works

## Rollback Plan

If issues occur, revert to old bundler:

```typescript
// Revert import
import { generateBundledPreview } from './services/runtimeBundler';

// Revert usage (remove async/await)
const result = generateBundledPreview(code, language);
```

## Support

Check console for module resolution logs:

```
[Module Resolver] Parsed imports: [...]
[Module Resolver] ✓ Core module: react
[Module Resolver] Attempting CDN: https://esm.sh/axios
[Module Resolver] ✓ Loaded from https://esm.sh/
[Module Resolver] Using proxy fallback for: unknown-lib
```

---

**Ready to integrate!** Start with Step 1 and test with the COVID Dashboard example.
