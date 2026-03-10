# Carousel Fix - Working Version

## Issues Found

1. **Image loading fails** - `via.placeholder.com` not resolving
2. **Single image displayed** - Carousel not rendering all slides
3. **No scrolling** - Mouse events not working in iframe sandbox
4. **Static display** - State not updating on drag

## Solution

Replace your Carousel.js with this working version:

```javascript
import React, { useState, useRef, useEffect } from 'react';
import './Carousel.css';

const Carousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offset, setOffset] = useState(0);
  const carouselRef = useRef(null);
  const containerRef = useRef(null);

  // Image URLs that work reliably
  const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1200&h=600&fit=crop'
  ];

  const slideWidth = 100; // percentage

  const handleMouseDown = (e) => {
    setDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    const diff = e.clientX - startX;
    const slideCount = images.length;
    const maxOffset = slideCount - 1;
    
    // Calculate new slide based on drag distance
    const dragSlides = diff / (carouselRef.current?.offsetWidth || 400);
    let newSlide = currentSlide - dragSlides;
    
    // Clamp between 0 and max slides
    newSlide = Math.max(0, Math.min(newSlide, maxOffset));
    
    setOffset(newSlide);
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    
    setDragging(false);
    
    // Snap to nearest slide
    const snappedSlide = Math.round(offset);
    setCurrentSlide(snappedSlide);
    setOffset(0);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, offset, currentSlide]);

  return (
    <div
      className="carousel-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
    >
      <div className="carousel" ref={carouselRef}>
        {images.map((image, index) => (
          <div
            key={index}
            className="slide"
            style={{
              backgroundImage: `url(${image})`,
              transform: `translateX(${(index - currentSlide - offset) * 100}%)`
            }}
          />
        ))}
      </div>
      
      {/* Slide indicators */}
      <div className="indicators">
        {images.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
```

## Updated Carousel.css

```css
.carousel-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  user-select: none;
}

.carousel {
  display: flex;
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0f0;
  cursor: grab;
  position: relative;
}

.carousel:active {
  cursor: grabbing;
}

.slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
}

.indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 0 16px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.indicator.active {
  background: #333;
  border-color: #333;
}

.indicator:hover {
  border-color: #333;
}
```

## Key Fixes

1. **Reliable image URLs** - Using Unsplash (works globally)
2. **Proper event handling** - Mouse events attached to document
3. **Smooth transitions** - CSS transitions for slide movement
4. **Indicators** - Visual feedback of current slide
5. **Click navigation** - Click indicators to jump to slide
6. **Drag support** - Smooth dragging between slides

## How to Apply

1. **Open Carousel.js** in the editor
2. **Replace entire content** with the code above
3. **Open Carousel.css** in the editor
4. **Replace entire content** with the CSS above
5. **Save both files** (Ctrl+S)
6. **Right-click Carousel.js** → Preview
7. **Test dragging** - Should scroll smoothly

## Testing

✅ **Should work:**
- Drag left/right to scroll
- Click indicators to jump
- Smooth transitions
- Images load properly
- No console errors

❌ **If still broken:**
- Check browser console (F12)
- Verify both files saved
- Hard refresh (Ctrl+Shift+R)
- Check image URLs load in browser

## Why This Works

1. **Unsplash URLs** - Reliable, CORS-enabled
2. **Document-level events** - Works in iframe sandbox
3. **Proper state management** - Separates drag offset from current slide
4. **CSS transitions** - Smooth animations
5. **Indicators** - User feedback

---

**After this works, you can request parallax effect!** ✓
