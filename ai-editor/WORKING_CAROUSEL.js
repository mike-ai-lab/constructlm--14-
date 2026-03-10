import React, { useState } from 'react';

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Simple, reliable image URLs
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

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div style={styles.container}>
      <div style={styles.carouselWrapper}>
        <div style={styles.carousel}>
          {images.map((image, index) => (
            <div
              key={index}
              style={{
                ...styles.slide,
                backgroundImage: `url(${image})`,
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out'
              }}
            />
          ))}
        </div>

        {/* Previous Button */}
        <button
          onClick={prevSlide}
          style={styles.prevButton}
        >
          ❮
        </button>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          style={styles.nextButton}
        >
          ❯
        </button>
      </div>

      {/* Indicators */}
      <div style={styles.indicators}>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              ...styles.indicator,
              backgroundColor: index === currentSlide ? '#333' : '#ccc'
            }}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  carouselWrapper: {
    position: 'relative',
    width: '100%',
    paddingBottom: '50%',
    overflow: 'hidden',
    borderRadius: '8px',
    backgroundColor: '#f0f0f0'
  },
  carousel: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  },
  prevButton: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    fontSize: '20px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  },
  nextButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    fontSize: '20px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
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
    transition: 'background-color 0.3s'
  }
};
