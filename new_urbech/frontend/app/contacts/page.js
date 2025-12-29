'use client';
import styles from './contacts.module.css';

export default function Contacts() {
  const phoneNumber = "+79679379376";
  const whatsappLink = `https://wa.me/${phoneNumber.replace('+', '')}`;
  const telegramLink = `https://t.me/${phoneNumber.replace('+', '')}`;
  const email = "shikhmirzaev2000@mail.ru";
  const address = "368933 Чирката, Гумбетовский район, Республика Дагестан";

  const handleOpenChat = () => {
    if (typeof window !== 'undefined') {
      alert("Чат скоро будет доступен!");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Здесь будет логика отправки формы
    alert("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
    e.target.reset();
  };

  return (
    <div className={styles.container}>
      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Свяжитесь с нами</h1>
          <p className={styles.heroSubtitle}>
            Мы всегда готовы помочь вам! Свяжитесь с нами по любым вопросам о нашем урбече
          </p>
          <div className={styles.heroDecoration}>
            <span className={styles.decorationIcon}>📞</span>
            <span className={styles.decorationIcon}>✉️</span>
            <span className={styles.decorationIcon}>📍</span>
          </div>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Контактная информация */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Наши контакты</h2>
            <p className={styles.sectionText}>
              Мы — семейный бизнес по производству традиционного дагестанского урбеча. 
              Ценим каждого клиента и готовы помочь с выбором и ответить на все вопросы.
            </p>
          </div>

          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📞</div>
              <h3 className={styles.contactTitle}>Телефон</h3>
              <p className={styles.contactInfo}>{phoneNumber}</p>
              <p className={styles.contactDescription}>
                Доступно с 9:00 до 21:00 по московскому времени
              </p>
              <div className={styles.messengerButtons}>
                <a href={whatsappLink} className={styles.messengerButton} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                <a href={telegramLink} className={styles.messengerButton} target="_blank" rel="noopener noreferrer">
                  Telegram
                </a>
              </div>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>✉️</div>
              <h3 className={styles.contactTitle}>Email</h3>
              <p className={styles.contactInfo}>{email}</p>
              <p className={styles.contactDescription}>
                Ответим в течение 24 часов
              </p>
              <a href={`mailto:${email}`} className={styles.emailButton}>
                Написать письмо
              </a>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📍</div>
              <h3 className={styles.contactTitle}>Адрес производства</h3>
              <p className={styles.contactInfo}>{address}</p>
              <p className={styles.contactDescription}>
                Мы находимся в живописной горной местности Дагестана
              </p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>👨‍👩‍👧‍👦</div>
              <h3 className={styles.contactTitle}>Семейный бизнес</h3>
              <p className={styles.contactInfo}>Работаем с 2023 года</p>
              <p className={styles.contactDescription}>
                Вся наша семья участвует в производстве традиционного урбеча
              </p>
            </div>
          </div>
        </section>

        {/* Форма обратной связи */}
        <section className={styles.section}>
          <div className={styles.formContainer}>
            <h2 className={styles.sectionTitle}>Форма обратной связи</h2>
            <p className={styles.sectionText}>
              Заполните форму ниже, и мы свяжемся с вами в ближайшее время
            </p>

            <form className={styles.contactForm} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.formLabel}>
                    Имя *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className={styles.formInput}
                    placeholder="Введите ваше имя"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={styles.formInput}
                    placeholder="Введите ваш email"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.formLabel}>
                  Тема сообщения
                </label>
                <input
                  type="text"
                  id="subject"
                  className={styles.formInput}
                  placeholder="Например: Заказ урбеча, Вопрос о доставке"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.formLabel}>
                  Сообщение *
                </label>
                <textarea
                  id="message"
                  className={styles.formTextarea}
                  rows="6"
                  placeholder="Опишите ваш вопрос или оставьте пожелания..."
                  required
                ></textarea>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} required />
                  <span>Я соглашаюсь с обработкой персональных данных</span>
                </label>
              </div>

              <button type="submit" className={styles.submitButton}>
                Отправить сообщение
              </button>
            </form>
          </div>
        </section>

        {/* Часто задаваемые вопросы */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Часто задаваемые вопросы</h2>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как происходит доставка урбеча?</h3>
                <p className={styles.faqAnswer}>
                  Доставляем по всей России через Почту России и СДЭК. 
                  Сроки и стоимость доставки рассчитываются индивидуально.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Сколько хранится урбеч?</h3>
                <p className={styles.faqAnswer}>
                  Наш урбеч хранится 6 месяцев при комнатной температуре и 
                  до 12 месяцев в холодильнике. Не содержит консервантов.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Какой урбеч вы рекомендуете?</h3>
                <p className={styles.faqAnswer}>
                  Все зависит от ваших предпочтений! Классический — из льна, 
                  насыщенный — из кунжута, сладковатый — из миндаля. Поможем с выбором!
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Есть ли оптовые заказы?</h3>
                <p className={styles.faqAnswer}>
                  Да, мы работаем с оптовыми покупателями. 
                  Свяжитесь с нами для обсуждения условий и цен.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Попробуйте настоящий дагестанский урбеч!</h2>
            <p className={styles.ctaText}>
              Каждая баночка готовится с любовью по старинным рецептам из натуральных горных ингредиентов
            </p>
            <div className={styles.ctaButtons}>
              <a href="/products" className={styles.ctaButtonPrimary}>
                Выбрать урбеч
              </a>
              <a href={`tel:${phoneNumber}`} className={styles.ctaButtonSecondary}>
                Позвонить нам
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}