'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  // Don't render anything on server to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Основное содержимое футера */}
        <div className={styles.footerContent}>
          {/* Информация о компании */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Урбеч Магазин</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/privacy" className={styles.footerLink}>Главная</Link></li>
              </ul>
            <p className={styles.companyDescription}>
              Наш семейный бизнес по производству традиционного дагестанского урбеча. 
              Каждая баночка готовится с любовью по старинным рецептам из натуральных горных ингредиентов.
            </p>
            <div className={styles.socialLinks}>
              <a 
                href="https://wa.me/79679379376" 
                className={styles.socialLink} 
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* Simplified WhatsApp SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.032 0a12 12 0 00-10.29 18.2L0 24l5.8-1.742A12 12 0 1012.032 0zm6.446 17.713c-.3.858-1.748 1.568-2.883 1.777-.344.064-.792.1-1.316.1a10.8 10.8 0 01-5.395-1.446 9.06 9.06 0 01-4.968-8.1c0-5 4.047-9.06 9.06-9.06 5.01 0 9.06 4.047 9.06 9.06 0 3.416-1.89 6.446-4.968 8.1-.171.107-.343.214-.514.314-.171.107-.343.214-.514.257zm-3.76-3.093c.3 0 .6-.257.686-.6.086-.343.343-1.202.429-1.46.086-.257.172-.514.086-.772 0-.257-.086-.429-.257-.6-.172-.171-.515-.343-.857-.515-.343-.171-.6-.343-.772-.6-.171-.257-.343-.6-.172-.943.172-.343.515-.6.943-.686.428-.086.857-.086 1.285.086.429.171.686.515.857.858.172.343.343.686.515 1.029.172.343.429.686.6.943.172.257.343.6.6.772.257.171.6.343.857.429.258.086.515.086.686.086.172 0 .429-.086.686-.257.257-.172.515-.343.686-.6l.429-.686c.086-.171.172-.343.086-.515 0-.172-.086-.343-.257-.429-.172-.086-.343-.172-.515-.257-.172-.086-.343-.172-.515-.257l-1.029-.429c-.343-.172-.686-.343-1.029-.6-.343-.257-.6-.6-.857-.943-.257-.343-.429-.772-.6-1.202-.172-.429-.257-.943-.257-1.46 0-1.028.343-2.056.943-2.827.6-.772 1.372-1.286 2.4-1.63 1.029-.343 2.143-.343 3.171.086 1.029.429 1.886 1.115 2.485 2.056.6.943.857 2.056.857 3.171 0 1.115-.343 2.23-.857 3.172-.515.942-1.2 1.714-2.057 2.313-.857.6-1.8 1.029-2.828 1.286-1.029.257-2.057.343-3.086.257z"/>
                </svg>
              </a>
              <a 
                href="https://t.me/79679379376" 
                className={styles.socialLink} 
                aria-label="Telegram"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* Simplified Telegram SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.509l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.333-.373-.121l-6.869 4.326-2.962-.924c-.643-.204-.658-.643.136-.954l11.566-4.458c.537-.196 1.006.128.832.954z"/>
                </svg>
              </a>
              <a 
                href="mailto:shikhmirzaev2000@mail.ru" 
                className={styles.socialLink} 
                aria-label="Email"
              >
                {/* Simple Email SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Навигация</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/" className={styles.footerLink}>Главная</Link></li>
              <li><Link href="/products" className={styles.footerLink}>Все товары</Link></li>
              <li><Link href="/about" className={styles.footerLink}>О нас</Link></li>
              <li><Link href="/contact" className={styles.footerLink}>Контакты</Link></li>
            </ul>
          </div>

          {/* Информация для покупателей */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Покупателям</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/shipping" className={styles.footerLink}>Доставка и оплата</Link></li>
              <li><Link href="/returns" className={styles.footerLink}>Возврат и обмен</Link></li>
              <li><Link href="/faq" className={styles.footerLink}>Частые вопросы</Link></li>
              <li><Link href="/blog" className={styles.footerLink}>Статьи об урбече</Link></li>
            </ul>
          </div>

          {/* Контактная информация */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>Контакты</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.contactIcon}>
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>+7 (967) 937-93-76</span>
              </div>
              <div className={styles.contactItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.contactIcon}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>shikhmirzaev2000@mail.ru</span>
              </div>
              <div className={styles.contactItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.contactIcon}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>368933 Чирката, Гумбетовский район, Дагестан</span>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя часть футера */}
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <p>&copy; {currentYear} Урбеч Магазин. Все права защищены.</p>
            <div className={styles.paymentMethods}>
              <span className={styles.paymentText}>Принимаем:</span>
              <div className={styles.paymentIcons}>
                <span className={styles.paymentIcon} title="Банковские карты">💳</span>
                <span className={styles.paymentIcon} title="СБП">📱</span>
                <span className={styles.paymentIcon} title="ЮMoney">💰</span>
                <span className={styles.paymentIcon} title="Наличные">💵</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}