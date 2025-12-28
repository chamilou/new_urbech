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
        console.error('Error fetching home page data:', error);
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
      image: '/hero-1.jpg', // Replace with your images
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

  // Add to Cart handler for ProductDetail
  const handleAddToCart = (product, quantity) => {
    console.log(`Added ${quantity} of ${product.name} to cart`);
    // You can integrate with your cart context here
    // addToCart(product, quantity);
  };

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
        {/* Hero Carousel */}
        <section className={styles.heroSection}>
          <ImageCarousel 
            slides={carouselSlides}
            autoPlay={true}
            interval={5000} // 5 seconds
          />
        </section>

        {/* Featured Products */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>Featured Products</h2>
            <a href="/products?featured=true" className={styles.viewAllLink}>
              View All →
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
                  onProductClick={handleProductClick} // Use the modal handler
                />
              ))}
            </div>
          )}
        </section>

        {/* New Arrivals */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>New Arrivals</h2>
            <a href="/products?new=true" className={styles.viewAllLink}>
              View All →
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
                  onProductClick={handleProductClick} // Use the modal handler
                />
              ))}
            </div>
          )}
        </section>

        {/* Recently Added */}
        <section className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2>Just Added</h2>
            <a href="/products?recent=true" className={styles.viewAllLink}>
              View All →
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
                  onProductClick={handleProductClick} // Use the modal handler
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Product Detail Modal */}
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