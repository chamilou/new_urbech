'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Header.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function Header() {
  const { getTotalItems } = useCart();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const mobileMenuRef = useRef(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Get user from localStorage as fallback
  const [localUser, setLocalUser] = useState(null);
  
  // Set client state after mount and get cart count
  useEffect(() => {
    setIsClient(true);
    setCartCount(getTotalItems());
  }, [getTotalItems]);

  // Update cart count when it changes
  useEffect(() => {
    if (isClient) {
      setCartCount(getTotalItems());
    }
  }, [getTotalItems, isClient]);

  // Initialize search query after component mounts
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Clear search when on home page
  useEffect(() => {
    if (pathname === '/') {
      setSearchQuery('');
    }
  }, [pathname]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setLocalUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`${API_BASE}/categories?includeProducts=true&includeParent=true`);
        
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Use context user or localStorage fallback - only on client
  const displayUser = isClient ? (user || localUser) : null;
  const displayIsAuthenticated = isClient ? (isAuthenticated || !!localUser) : false;
  const isAdmin = displayUser?.role === 'ADMIN';

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest(`.${styles.menuButton}`)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (query) {
      router.push(`/products?search=${encodeURIComponent(query)}&page=1`);
    } else {
      router.push('/products');
    }
    
    setIsMenuOpen(false);
  }, [searchQuery, router]);

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleLogout = () => {
    logout();
    setLocalUser(null);
    router.push('/');
  };

  const handleHomeClick = () => {
    setSearchQuery('');
    setIsMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  // Get category icon based on category name or slug
  const getCategoryIcon = (category) => {
    if (!category) return '📦';
    
    const name = category.name?.toLowerCase() || '';
    const slug = category.slug?.toLowerCase() || '';
    
    // Адаптированные иконки для магазина урбеча
    if (name.includes('орех') || slug.includes('nut')) return '🌰';
    if (name.includes('семя') || slug.includes('seed')) return '🌱';
    if (name.includes('лен') || slug.includes('flax')) return '🟤';
    if (name.includes('кунжут') || slug.includes('sesame')) return '⚪';
    if (name.includes('подсолнеч') || slug.includes('sunflower')) return '🌻';
    if (name.includes('тыкв') || slug.includes('pumpkin')) return '🎃';
    if (name.includes('кокос') || slug.includes('coconut')) return '🥥';
    if (name.includes('миндал') || slug.includes('almond')) return '🌰';
    if (name.includes('арахис') || slug.includes('peanut')) return '🥜';
    if (name.includes('фисташк') || slug.includes('pistachio')) return '🟢';
    if (name.includes('фундук') || slug.includes('hazelnut')) return '🌰';
    if (name.includes('специ') || slug.includes('spice')) return '🌶️';
    if (name.includes('мед') || slug.includes('honey')) return '🍯';
    if (name.includes('масло') || slug.includes('oil')) return '🫒';
    if (name.includes('паста') || slug.includes('paste')) return '🥣';
    if (name.includes('натур') || slug.includes('natural')) return '🌿';
    
    return '📦'; // Default icon
  };

  // Filter out parent categories and get first 5 for main menu
  const mainCategories = categories
    .filter(category => !category.parent || category.parent === null)
    .sort((a, b) => {
      if (b.defaultSortOrder !== a.defaultSortOrder) {
        return b.defaultSortOrder - a.defaultSortOrder;
      }
      if (b.productCount !== a.productCount) {
        return b.productCount - a.productCount;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);

  // Get remaining categories for "Еще +" dropdown
  const moreCategories = categories
    .filter(category => !category.parent || category.parent === null)
    .sort((a, b) => {
      if (b.defaultSortOrder !== a.defaultSortOrder) {
        return b.defaultSortOrder - a.defaultSortOrder;
      }
      if (b.productCount !== a.productCount) {
        return b.productCount - a.productCount;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(5);

  return (
    <header className={styles.header} ref={mobileMenuRef}>
      {/* Top Bar - Navigation with Auth */}
      <div className={styles.topBar}>
        <div className={styles.container}>
          <nav className={styles.topNav}>
            <Link href="/about" className={styles.topNavLink}>О нас</Link>
            <Link href="/contacts" className={styles.topNavLink}>Контакты</Link>
            
            {/* SIMPLIFIED FIX: Only render auth links after client mount */}
            {isClient ? (
              displayIsAuthenticated && displayUser ? (
                <>
                  <span className={styles.welcomeText}>Привет, {displayUser.name}!</span>
                  <Link href="/profile" className={styles.topNavLink}>Профиль</Link>
                  <button onClick={handleLogout} className={styles.logoutBtn}>
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.topNavLink}>Войти</Link>
                  <Link href="/register" className={styles.topNavLink}>Регистрация</Link>
                </>
              )
            ) : (
              // Show empty space during SSR to maintain layout
              <div style={{ display: 'none' }}></div>
            )}
            
            {isAdmin && isClient && (
              <Link 
                href="/admin" 
                className={`${styles.topNavLink} ${pathname.startsWith('/admin') ? styles.adminActive : ''}`}
              >
                Админ-панель
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.container}>
          <form onSubmit={handleSearch} className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Поиск по каталогу урбеча..."
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              🔍
            </button>
            <div className={styles.cartIcon}>
              <Link href="/cart" className={styles.cartLink}>
                🛒
                {isClient && cartCount > 0 && (
                  <span className={styles.cartCount}>{cartCount}</span>
                )}
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Main Header with Logo and Navigation */}
      <div className={styles.mainHeader}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            {/* Logo */}
            <div className={styles.logo}>
              <Link href="/" onClick={handleHomeClick}>
                <h1>Урбеч Магазин</h1>
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className={styles.desktopNav}>
              <Link href="/products" className={styles.navLink}>Все товары</Link>
              {!isClient || categoriesLoading ? (
                <div className={styles.navLoading}>
                  <span>Загрузка категорий...</span>
                </div>
              ) : (
                <>
                  {mainCategories.map((category) => {
                    const childCategories = categories.filter(
                      cat => cat.parentId === category.id
                    );
                    
                    const hasChildren = childCategories.length > 0;

                    return hasChildren ? (
                      <div key={category.id} className={styles.dropdown}>
                        <Link
                          href={`/products?category=${category.slug}&category_scope=tree`}
                          className={`${styles.navLink} ${
                            searchParams.get('category') === category.slug ? styles.active : ''
                          }`}
                        >
                          <span className={styles.navIcon}>
                            {getCategoryIcon(category)}
                          </span>
                          {category.name}
                          <span className={styles.dropdownArrow}>▼</span>
                        </Link>
                        
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownDivider}></div>
                          
                          {childCategories.map((childCategory) => (
                            <Link 
                              key={childCategory.id} 
                              href={`/products?category=${childCategory.slug}&category_scope=exact`}
                              className={styles.dropdownItem}
                            >
                              <span className={styles.dropdownIcon}>
                                {getCategoryIcon(childCategory)}
                              </span>
                              {childCategory.name}
                              {childCategory.productCount > 0 && (
                                <span className={styles.productCount}>
                                  ({childCategory.productCount})
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className={`${styles.navLink} ${
                          searchParams.get('category') === category.slug ? styles.active : ''
                        }`}
                      >
                        <span className={styles.navIcon}>
                          {getCategoryIcon(category)}
                        </span>
                        {category.name}
                      </Link>
                    );
                  })}

                  {moreCategories.length > 0 && (
                    <div className={styles.dropdown}>
                      <button className={`${styles.dropdownToggle} ${styles.moreDropdown}`}>
                        Ещё +
                        <span className={styles.dropdownArrow}>▼</span>
                      </button>
                      <div className={styles.dropdownMenu}>
                        {moreCategories.map((category) => {
                          const childCategories = categories.filter(
                            cat => cat.parentId === category.id
                          );
                          
                          return (
                            <div key={category.id}>
                              <Link 
                                href={`/products?category=${category.slug}`}
                                className={styles.dropdownItem}
                              >
                                <span className={styles.dropdownIcon}>
                                  {getCategoryIcon(category)}
                                </span>
                                {category.name}
                                {category.productCount > 0 && (
                                  <span className={styles.productCount}>
                                    ({category.productCount})
                                  </span>
                                )}
                              </Link>
                              
                              {childCategories.map((childCategory) => (
                                <Link 
                                  key={childCategory.id} 
                                  href={`/products?category=${childCategory.slug}`}
                                  className={`${styles.dropdownItem} ${styles.childItem}`}
                                >
                                  <span className={styles.dropdownIcon}>
                                    {getCategoryIcon(childCategory)}
                                  </span>
                                  {childCategory.name}
                                  {childCategory.productCount > 0 && (
                                    <span className={styles.productCount}>
                                      ({childCategory.productCount})
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </nav>

            {/* Mobile Menu Button - Hidden on desktop */}
            <button 
              className={styles.menuButton}
              onClick={toggleMobileMenu}
              aria-label="Открыть меню"
            >
              <span className={styles.menuIcon}>
                {isMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>

          {/* Mobile Navigation Menu - Slides in from top */}
          <div className={`${styles.mobileNav} ${isMenuOpen ? styles.mobileNavOpen : ''}`}>
            <div className={styles.mobileNavContent}>
              {!isClient || categoriesLoading ? (
                <div className={styles.mobileLoading}>
                  <span>Загрузка категорий...</span>
                </div>
              ) : (
                categories
                  .filter(category => !category.parent || category.parent === null)
                  .slice(0, 15)
                  .map((category) => (
                    <Link 
                      key={category.id}
                      href={`/products?category=${category.slug}`}
                      className={`${styles.mobileLink} ${
                        searchParams.get('category') === category.slug ? styles.active : ''
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <span className={styles.mobileIcon}>
                        {getCategoryIcon(category)}
                      </span>
                      {category.name}
                      {category.productCount > 0 && (
                        <span className={styles.mobileProductCount}>
                          ({category.productCount})
                        </span>
                      )}
                    </Link>
                  ))
              )}
              
              <div className={styles.mobileMenuLinks}>
                <Link href="/about" className={styles.mobileLink} onClick={closeMobileMenu}>
                  О нас
                </Link>
                <Link href="/contacts" className={styles.mobileLink} onClick={closeMobileMenu}>
                  Контакты
                </Link>
                
                {/* SIMPLIFIED: Only render auth links after client mount */}
                {isClient ? (
                  displayIsAuthenticated ? (
                    <>
                      <Link href="/profile" className={styles.mobileLink} onClick={closeMobileMenu}>
                        Профиль
                      </Link>
                      <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
                        Выйти
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className={styles.mobileLink} onClick={closeMobileMenu}>
                        Войти
                      </Link>
                      <Link href="/register" className={styles.mobileLink} onClick={closeMobileMenu}>
                        Регистрация
                      </Link>
                    </>
                  )
                ) : (
                  // Empty div during SSR to maintain layout
                  <div style={{ display: 'none' }}></div>
                )}
                
                {isAdmin && isClient && (
                  <Link href="/admin" className={styles.mobileLink} onClick={closeMobileMenu}>
                    Админ-панель
                  </Link>  
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
