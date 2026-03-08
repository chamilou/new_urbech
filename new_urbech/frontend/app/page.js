'use client';
import { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail'; 
import ImageCarousel from './components/ImageCarousel';
import styles from './page.module.css';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // states for ProductDetail modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  // Fetch home page data
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        const [featuredRes, newArrivalsRes, recentRes] = await Promise.all([
          fetch('/api/products/home/featured'),
          fetch('/api/products/home/new-arrivals'),
          fetch('/api/products/home/recent')
        ]);

        if (featuredRes.ok) setFeaturedProducts(await featuredRes.json());
        if (newArrivalsRes.ok) setNewArrivals(await newArrivalsRes.json());
        if (recentRes.ok) setRecentProducts(await recentRes.json());
        
      } catch (error) {
        console.error('Ошибка при загрузке данных главной страницы:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Custom slides for the carousel
  const carouselSlides = [
    {
      id: 1,
      image: '/hero-1.jpg', // Замените на ваши изображения
      title: 'Добро пожаловать в Урбеч Магазин',
      description: 'Откройте для себя натуральный дагестанский урбеч по лучшим ценам',
      buttonText: 'К покупкам',
      buttonLink: '/products'
    },
    {
      id: 2,
      image: '/hero-2.jpg',
      title: 'Новые поступления',
      description: 'Попробуйте наши новинки из горного Дагестана',
      buttonText: 'Смотреть новинки',
      buttonLink: '/products?new=true'
    },
    {
      id: 3,
      image: '/hero-3.jpg',
      title: 'Рекомендуемые товары',
      description: 'Особый выбор для настоящих ценителей',
      buttonText: 'Исследовать',
      buttonLink: '/products?featured=true'
    }
  ];

  // Add to Cart handler for ProductDetail
  const handleAddToCart = () => {};

  // Open ProductDetail modal
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Close ProductDetail modal
  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <main className={styles.main}>
        {/* Герой-карусель */}
        <section className={styles.heroSection}>
          <ImageCarousel 
            slides={carouselSlides}
            autoPlay={true}
            interval={5000} // 5 секунд
          />
        </section>

        {/* Рекомендуемые товары */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>Рекомендуемые товары</h2>
            <a href="/products?featured=true" className={styles.viewAllLink}>
              Смотреть все →
            </a>
          </div>
          
          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.productSkeleton}></div>
              ))}
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick} // Использовать модальное окно
                />
              ))}
            </div>
          )}
        </section>

        {/* Новые поступления */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>Новые поступления</h2>
            <a href="/products?new=true" className={styles.viewAllLink}>
              Смотреть все →
            </a>
          </div>
          
          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.productSkeleton}></div>
              ))}
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick} // Использовать модальное окно
                />
              ))}
            </div>
          )}
        </section>

        {/* Недавно добавленные */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>Недавно добавленные</h2>
            <a href="/products?recent=true" className={styles.viewAllLink}>
              Смотреть все →
            </a>
          </div>
          
          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.productSkeleton}></div>
              ))}
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {recentProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick} // Использовать модальное окно
                />
              ))}
            </div>
          )}
        </section>

        {/* Приветственный текст */}
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h2>Добро пожаловать в наш магазин урбеча!</h2>
            <p>
              Мы предлагаем настоящий дагестанский урбеч, приготовленный по традиционным рецептам 
              из натуральных горных ингредиентов. Каждая баночка — это частичка солнечного Дагестана.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🌿</span>
                <h3>100% натурально</h3>
                <p>Без консервантов и добавок</p>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🏔️</span>
                <h3>Горные ингредиенты</h3>
                <p>Сырьё из экологически чистых районов</p>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>👨‍👩‍👧</span>
                <h3>Семейное производство</h3>
                <p>Рецепты передаются из поколения в поколение</p>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🚚</span>
                <h3>Быстрая доставка</h3>
                <p>По всей России и СНГ</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Модальное окно деталей товара */}
      {showProductDetail && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={handleCloseProductDetail}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}
