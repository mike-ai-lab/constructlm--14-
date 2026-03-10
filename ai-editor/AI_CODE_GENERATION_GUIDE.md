# AI Code Generation Guide for React Components

This guide ensures all AI-generated code is valid, works in the preview environment, and renders correctly.

## ✅ MUST DO

### 1. Always Return Valid React Components

```javascript
// ✅ CORRECT
export default function MyComponent() {
  return <div>Hello</div>;
}

// ❌ WRONG - Returns object
export default {
  render: () => <div>Hello</div>
};

// ❌ WRONG - Returns null
export default function MyComponent() {
  return null;
};
```

### 2. Use Inline Styles (No CSS Files)

```javascript
// ✅ CORRECT
export default function Button() {
  const styles = {
    button: {
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  };
  
  return <button style={styles.button}>Click me</button>;
}

// ❌ WRONG - Imports CSS file
import './Button.css';
export default function Button() {
  return <button className="btn">Click me</button>;
};
```

### 3. Use Reliable Image URLs

```javascript
// ✅ CORRECT - Unsplash (CORS-enabled, reliable)
const imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop';

// ✅ CORRECT - Placeholder with dimensions
const imageUrl = 'https://via.placeholder.com/800x400/cccccc/999999?text=Image';

// ❌ WRONG - Non-existent domain
const imageUrl = 'https://via.placeholder.com/300x600?text=Image+1';

// ❌ WRONG - No CORS support
const imageUrl = 'https://example.com/image.jpg';
```

### 4. Handle State Properly

```javascript
// ✅ CORRECT - Simple state
export default function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// ❌ WRONG - Returning state object
export default function Counter() {
  const state = React.useState(0);
  return state; // Returns array, not JSX
}

// ❌ WRONG - Undefined values
export default function Counter() {
  const [count, setCount] = React.useState();
  return <div>{count}</div>; // Renders "undefined"
}
```

### 5. Only Return JSX Elements

```javascript
// ✅ CORRECT - Returns JSX
export default function Card() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2>Card Title</h2>
      <p>Card content</p>
    </div>
  );
}

// ❌ WRONG - Returns string
export default function Card() {
  return "Card Title";
}

// ❌ WRONG - Returns number
export default function Card() {
  return 42;
}

// ❌ WRONG - Returns object
export default function Card() {
  return { title: "Card", content: "..." };
}

// ❌ WRONG - Returns array of non-JSX
export default function Card() {
  return ["Card", "Title"];
}
```

## ❌ MUST NOT DO

### 1. Don't Import CSS Files
```javascript
// ❌ WRONG
import './styles.css';
import styles from './Button.module.css';
```

### 2. Don't Use External Libraries (Except React)
```javascript
// ❌ WRONG
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import styled from 'styled-components';
```

### 3. Don't Use Placeholder Services That Don't Work
```javascript
// ❌ WRONG - Not CORS-enabled
https://via.placeholder.com/300x600?text=Image+1
https://picsum.photos/1200/600

// ❌ WRONG - Requires API key
https://api.example.com/image
```

### 4. Don't Return Conditional Renders of Non-JSX
```javascript
// ❌ WRONG
export default function Component() {
  if (someCondition) {
    return "Error message"; // String, not JSX
  }
  return <div>Content</div>;
}

// ✅ CORRECT
export default function Component() {
  if (someCondition) {
    return <div>Error message</div>; // JSX
  }
  return <div>Content</div>;
}
```

### 5. Don't Use Async/Await in Render
```javascript
// ❌ WRONG
export default async function Component() {
  const data = await fetch('/api/data');
  return <div>{data}</div>;
}

// ✅ CORRECT - Use useEffect
export default function Component() {
  const [data, setData] = React.useState(null);
  
  React.useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData);
  }, []);
  
  return <div>{data}</div>;
}
```

## 📋 Component Template

Use this template for all components:

```javascript
import React, { useState, useEffect } from 'react';

export default function ComponentName() {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Side effects here
  }, []);

  // Styles (inline only)
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '10px'
    }
  };

  // Handlers
  const handleClick = () => {
    setState(newValue);
  };

  // Render (MUST return JSX)
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Title</h1>
      <p>Content here</p>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

## 🎨 Styling Best Practices

### ✅ DO Use Inline Styles

```javascript
const styles = {
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  buttonHover: {
    backgroundColor: '#0056b3'
  }
};

export default function Button() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      style={isHovered ? { ...styles.button, ...styles.buttonHover } : styles.button}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      Click me
    </button>
  );
}
```

### ❌ DON'T Use CSS Files

```javascript
// ❌ WRONG
import './Button.css';

export default function Button() {
  return <button className="btn">Click me</button>;
}
```

## 🖼️ Image Guidelines

### ✅ Reliable Image Sources

1. **Unsplash** (Recommended)
   ```
   https://images.unsplash.com/photo-ID?w=WIDTH&h=HEIGHT&fit=crop
   ```

2. **Placeholder Service**
   ```
   https://via.placeholder.com/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=TEXT
   ```

3. **Data URLs** (Small images)
   ```
   data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E...
   ```

### ✅ Example Carousel with Images

```javascript
export default function Carousel() {
  const [current, setCurrent] = useState(0);
  
  const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop'
  ];
  
  const styles = {
    slide: {
      width: '100%',
      height: '400px',
      backgroundImage: `url(${images[current]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  };
  
  return (
    <div>
      <div style={styles.slide} />
      <button onClick={() => setCurrent((current + 1) % images.length)}>Next</button>
    </div>
  );
}
```

## 🧪 Validation Checklist

Before returning code, verify:

- [ ] Component exports default function
- [ ] Function returns JSX (not string, object, array, or null)
- [ ] All state is initialized with values (not undefined)
- [ ] No CSS file imports
- [ ] No external library imports (except React)
- [ ] All styles are inline
- [ ] Image URLs are CORS-enabled
- [ ] No async/await in render function
- [ ] All event handlers are defined
- [ ] Component renders without errors

## 🚨 Common Errors to Avoid

| Error | Cause | Fix |
|-------|-------|-----|
| React error #130 | Returning non-JSX | Return `<div>...</div>` not `"string"` |
| Blank component | Returning null | Return JSX element |
| Image not loading | Bad URL or no CORS | Use Unsplash URLs |
| Styles not applied | CSS file not loaded | Use inline styles |
| State undefined | Not initialized | Use `useState(initialValue)` |
| Component crashes | Async in render | Use useEffect for async |

## 📝 Example: Valid Carousel Component

```javascript
import React, { useState } from 'react';

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=400&fit=crop'
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto'
    },
    carousel: {
      position: 'relative',
      width: '100%',
      height: '400px',
      overflow: 'hidden',
      borderRadius: '8px',
      backgroundColor: '#f0f0f0'
    },
    slide: {
      width: '100%',
      height: '100%',
      backgroundImage: `url(${images[currentSlide]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      transition: 'background-image 0.5s ease-in-out'
    },
    button: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      border: 'none',
      padding: '10px 15px',
      fontSize: '20px',
      cursor: 'pointer',
      borderRadius: '4px',
      zIndex: 10
    },
    prevButton: {
      left: '10px'
    },
    nextButton: {
      right: '10px'
    },
    indicators: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '16px'
    },
    indicator: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: '#ccc',
      transition: 'background-color 0.3s'
    },
    indicatorActive: {
      backgroundColor: '#333'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.carousel}>
        <div style={styles.slide} />
        <button
          style={{ ...styles.button, ...styles.prevButton }}
          onClick={prevSlide}
        >
          ❮
        </button>
        <button
          style={{ ...styles.button, ...styles.nextButton }}
          onClick={nextSlide}
        >
          ❯
        </button>
      </div>
      <div style={styles.indicators}>
        {images.map((_, index) => (
          <button
            key={index}
            style={{
              ...styles.indicator,
              ...(index === currentSlide ? styles.indicatorActive : {})
            }}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

**Use this guide for ALL code generation requests to ensure valid, working components!**
