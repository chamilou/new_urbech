'use client';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Основное содержимое футера */}
        <div className={styles.footerContent}>
          {/* Информация о компании */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Урбеч Магазин</h3>
            <p className={styles.companyDescription}>
              Наш семейный бизнес по производству традиционного дагестанского урбеча. 
              Каждая баночка готовится с любовью по старинным рецептам из натуральных горных ингредиентов.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://wa.me/79679379376" className={styles.socialLink} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.663 4.1 1.792 5.727L0 24l6.335-1.652A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </a>
              <a href="https://t.me/79679379376" className={styles.socialLink} aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.509l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.333-.373-.121l-6.869 4.326-2.962-.924c-.643-.204-.658-.643.136-.954l11.566-4.458c.537-.196 1.006.128.832.954z"/>
                </svg>
              </a>
              <a href="mailto:shikhmirzaev2000@mail.ru" className={styles.socialLink} aria-label="Email">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
              <p className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.contactIcon}>
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +7 (967) 937-93-76
              </p>
              <p className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.contactIcon}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                shikhmirzaev2000@mail.ru
              </p>
              <p className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.contactIcon}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                368933 Чирката, Гумбетовский район, Дагестан
              </p>
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