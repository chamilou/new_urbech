'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

const PLACEHOLDER = '/placeholder-image.jpg';

const defaultSlides = [
  {
    id: 1,
    image: '/hero-1.jpg',
    title: 'Добро пожаловать в магазин урбеча',
    description: 'Откройте для себя натуральные пасты и продукты по честным ценам',
    buttonText: 'К покупкам',
    buttonLink: '/products'
  },
  {
    id: 2,
    image: '/hero-2.jpg',
    title: 'Новые поступления',
    description: 'Посмотрите последние новинки в каталоге',
    buttonText: 'Смотреть новинки',
    buttonLink: '/products?new=true'
  },
  {
    id: 3,
    image: '/hero-3.jpg',
    title: 'Рекомендуемые товары',
    description: 'Подборка лучших позиций для вас',
    buttonText: 'Смотреть подборку',
    buttonLink: '/products?featured=true'
  }
];

export default function ImageCarousel({ slides = defaultSlides, autoPlay = true, interval = 5000 }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index) => {
    setIsTransitioning(true);
    setCurrentSlide(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(nextSlide, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, nextSlide]);

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
        aria-label="Предыдущий слайд"
      >
        ‹
      </button>
      <button 
        className={`${styles.arrow} ${styles.next}`} 
        onClick={nextSlide}
        aria-label="Следующий слайд"
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
            aria-label={`Перейти к слайду ${index + 1}`}
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
