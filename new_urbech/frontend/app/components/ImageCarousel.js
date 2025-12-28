'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

const PLACEHOLDER = '/placeholder-image.jpg';

const defaultSlides = [
  {
    id: 1,
    image: '/hero-1.jpg',
    title: 'Welcome to MyShop',
    description: 'Discover amazing products at great prices',
    buttonText: 'Shop Now',
    buttonLink: '/products'
  },
  {
    id: 2,
    image: '/hero-2.jpg',
    title: 'New Arrivals',
    description: 'Check out our latest products',
    buttonText: 'View New',
    buttonLink: '/products?new=true'
  },
  {
    id: 3,
    image: '/hero-3.jpg',
    title: 'Featured Products',
    description: 'Special selections just for you',
    buttonText: 'Explore',
    buttonLink: '/products?featured=true'
  }
];

export default function ImageCarousel({ slides = defaultSlides, autoPlay = true, interval = 5000 }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setIsTransitioning(true);
    setCurrentSlide(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      nextSlide();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval]);

  // Reset transitioning state after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  return (
    <div className={styles.carousel}>
      {/* Slides Container */}
      <div className={styles.slidesContainer}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${
              index === currentSlide ? styles.active : ''
            } ${isTransitioning ? styles.transitioning : ''}`}
          >
            {/* Background Image */}
            <div className={styles.imageContainer}>
              <Image
                src={slide.image || PLACEHOLDER}
                alt={slide.title}
                fill
                className={styles.image}
                priority={index === 0}
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
              {/* Overlay */}
              <div className={styles.overlay}></div>
            </div>

            {/* Content */}
            <div className={styles.content}>
              <h1 className={styles.title}>{slide.title}</h1>
              <p className={styles.description}>{slide.description}</p>
              {slide.buttonText && (
                <a href={slide.buttonLink} className={styles.ctaButton}>
                  {slide.buttonText}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        className={`${styles.arrow} ${styles.prev}`} 
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button 
        className={`${styles.arrow} ${styles.next}`} 
        onClick={nextSlide}
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Indicators/Dots */}
      <div className={styles.indicators}>
        {slides.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${
              index === currentSlide ? styles.active : ''
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {autoPlay && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progress} 
            key={currentSlide}
            style={{ animationDuration: `${interval}ms` }}
          />
        </div>
      )}
    </div>
  );
}