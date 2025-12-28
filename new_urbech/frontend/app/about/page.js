// 'use client';
// import styles from './about.module.css';

// export default function About() {
//   return (
//     <div className={styles.container}>
//       {/* Hero Section */}
//       <section className={styles.hero}>
//         <div className={styles.heroContent}>
//           <h1 className={styles.heroTitle}>About MyShop</h1>
//           <p className={styles.heroSubtitle}>
//             Your trusted destination for quality products and exceptional shopping experience
//           </p>
//         </div>
//       </section>

//       {/* Main Content */}
//       <div className={styles.content}>
//         {/* Our Story */}
//         <section className={styles.section}>
//           <div className={styles.sectionContent}>
//             <h2 className={styles.sectionTitle}>Our Story</h2>
//             <p className={styles.sectionText}>
//               Founded with a passion for excellence, MyShop has been revolutionizing 
//               the online shopping experience since day one. We believe that everyone 
//               deserves access to high-quality products at affordable prices.
//             </p>
//             <p className={styles.sectionText}>
//               What started as a small dream has grown into a trusted platform 
//               serving thousands of satisfied customers worldwide. Our commitment 
//               to quality, customer satisfaction, and innovation drives everything we do.
//             </p>
//           </div>
//         </section>

//         {/* Our Values */}
//         <section className={styles.section}>
//           <h2 className={styles.sectionTitle}>Our Values</h2>
//           <div className={styles.valuesGrid}>
//             <div className={styles.valueCard}>
//               <div className={styles.valueIcon}>⭐</div>
//               <h3 className={styles.valueTitle}>Quality First</h3>
//               <p className={styles.valueText}>
//                 We carefully curate every product to ensure it meets our high standards of quality and reliability.
//               </p>
//             </div>
            
//             <div className={styles.valueCard}>
//               <div className={styles.valueIcon}>🚀</div>
//               <h3 className={styles.valueTitle}>Fast Delivery</h3>
//               <p className={styles.valueText}>
//                 Quick and reliable shipping to get your products to you when you need them.
//               </p>
//             </div>
            
//             <div className={styles.valueCard}>
//               <div className={styles.valueIcon}>💝</div>
//               <h3 className={styles.valueTitle}>Customer Focus</h3>
//               <p className={styles.valueText}>
//                 Your satisfaction is our priority. We're here to make your shopping experience exceptional.
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* Why Choose Us */}
//         <section className={styles.section}>
//           <div className={styles.sectionContent}>
//             <h2 className={styles.sectionTitle}>Why Choose MyShop?</h2>
//             <div className={styles.featuresList}>
//               <div className={styles.feature}>
//                 <span className={styles.featureBullet}>✓</span>
//                 <span>Wide selection of quality products</span>
//               </div>
//               <div className={styles.feature}>
//                 <span className={styles.featureBullet}>✓</span>
//                 <span>Competitive prices and great deals</span>
//               </div>
//               <div className={styles.feature}>
//                 <span className={styles.featureBullet}>✓</span>
//                 <span>Secure and easy shopping experience</span>
//               </div>
//               <div className={styles.feature}>
//                 <span className={styles.featureBullet}>✓</span>
//                 <span>Fast and reliable delivery</span>
//               </div>
//               <div className={styles.feature}>
//                 <span className={styles.featureBullet}>✓</span>
//                 <span>Excellent customer support</span>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* CTA Section */}
//         <section className={styles.ctaSection}>
//           <div className={styles.ctaContent}>
//             <h2 className={styles.ctaTitle}>Ready to Shop?</h2>
//             <p className={styles.ctaText}>
//               Join thousands of satisfied customers and discover why MyShop is the preferred choice for online shopping.
//             </p>
//             <div className={styles.ctaButtons}>
//               <a href="/products" className={styles.ctaButtonPrimary}>
//                 Shop Now
//               </a>
//               <a href="/contact" className={styles.ctaButtonSecondary}>
//                 Contact Us
//               </a>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }


'use client';
import styles from './about.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      {/* Герой секция */}
     
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}> MyShop</h1>
          <p className={styles.heroSubtitle}>
            Ваш надежный партнер в мире качественных товаров и исключительного покупательского опыта
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Наша история */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Наша история</h2>
            <p className={styles.sectionText}>
              Основанный с страстью к совершенству, MyShop революционизирует онлайн-шоппинг 
              с самого первого дня. Мы верим, что каждый заслуживает доступ к высококачественным 
              товарам по доступным ценам.
            </p>
            <p className={styles.sectionText}>
              То, что начиналось как небольшая мечта, превратилось в надежную платформу, 
              обслуживающую тысячи довольных клиентов по всему миру. Наша приверженность 
              качеству, удовлетворенности клиентов и инновациям движет всем, что мы делаем.
            </p>
          </div>
        </section>

        {/* Наши ценности */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Наши ценности</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>⭐</div>
              <h3 className={styles.valueTitle}>Качество прежде всего</h3>
              <p className={styles.valueText}>
                Мы тщательно отбираем каждый товар, чтобы гарантировать соответствие нашим высоким стандартам качества и надежности.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🚀</div>
              <h3 className={styles.valueTitle}>Быстрая доставка</h3>
              <p className={styles.valueText}>
                Быстрая и надежная доставка, чтобы вы получили свои товары именно тогда, когда они вам нужны.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💝</div>
              <h3 className={styles.valueTitle}>Клиентоориентированность</h3>
              <p className={styles.valueText}>
                Ваше удовлетворение - наш приоритет. Мы здесь, чтобы сделать ваш покупательский опыт исключительным.
              </p>
            </div>
          </div>
        </section>

        {/* Почему выбирают нас */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Почему выбирают MyShop?</h2>
            <div className={styles.featuresList}>
              <div className={styles.feature}>
                <span className={styles.featureBullet}>✓</span>
                <span>Широкий выбор качественных товаров</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureBullet}>✓</span>
                <span>Конкурентные цены и выгодные предложения</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureBullet}>✓</span>
                <span>Безопасный и удобный процесс покупок</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureBullet}>✓</span>
                <span>Быстрая и надежная доставка</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureBullet}>✓</span>
                <span>Отличная служба поддержки клиентов</span>
              </div>
            </div>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Готовы совершать покупки?</h2>
            <p className={styles.ctaText}>
              Присоединяйтесь к тысячам довольных клиентов и узнайте, почему MyShop - предпочтительный выбор для онлайн-шоппинга.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/products" className={styles.ctaButtonPrimary}>
                Начать покупки
              </a>
              <a href="/contact" className={styles.ctaButtonSecondary}>
                Связаться с нами
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}