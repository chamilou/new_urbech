'use client';
import styles from './contacts.module.css';

export default function Contacts() {
  return (
    <div className={styles.container}>
      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Свяжитесь с нами</h1>
          <p className={styles.heroSubtitle}>
            Мы всегда готовы помочь вам! Свяжитесь с нашей командой поддержки для любых вопросов или запросов
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Контактная информация */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Наши контакты</h2>
            <p className={styles.sectionText}>
              Мы ценим каждого клиента и готовы предоставить вам наилучший сервис. 
              Не стесняйтесь обращаться к нам любым удобным для вас способом.
            </p>
          </div>

          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📞</div>
              <h3 className={styles.contactTitle}>Телефон</h3>
              <p className={styles.contactInfo}>+7 (495) 123-45-67</p>
              <p className={styles.contactDescription}>
                Доступно с 9:00 до 21:00 ежедневно
              </p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>✉️</div>
              <h3 className={styles.contactTitle}>Email</h3>
              <p className={styles.contactInfo}>support@myshop.ru</p>
              <p className={styles.contactDescription}>
                Ответим в течение 2 часов в рабочее время
              </p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>💬</div>
              <h3 className={styles.contactTitle}>Онлайн-чат</h3>
              <p className={styles.contactInfo}>Доступен 24/7</p>
              <p className={styles.contactDescription}>
                Мгновенная помощь через встроенный чат
              </p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>📍</div>
              <h3 className={styles.contactTitle}>Адрес</h3>
              <p className={styles.contactInfo}>Москва, ул. Примерная, д. 123</p>
              <p className={styles.contactDescription}>
                Пн-Пт с 10:00 до 19:00 для личных визитов
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

            <form className={styles.contactForm}>
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
                  placeholder="О чем вы хотите спросить?"
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
                  placeholder="Опишите ваш вопрос или проблему..."
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
                <h3 className={styles.faqQuestion}>Как оформить возврат товара?</h3>
                <p className={styles.faqAnswer}>
                  Вы можете оформить возврат в течение 14 дней с момента получения заказа. 
                  Для этого свяжитесь с нашей службой поддержки.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Сколько стоит доставка?</h3>
                <p className={styles.faqAnswer}>
                  Доставка бесплатна при заказе от 3000 рублей. Для заказов до этой суммы 
                  стоимость доставки рассчитывается индивидуально.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как отследить мой заказ?</h3>
                <p className={styles.faqAnswer}>
                  После отправки заказа мы вышлем вам трекер-номер для отслеживания 
                  на указанную электронную почту.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Есть ли у вас самовывоз?</h3>
                <p className={styles.faqAnswer}>
                  Да, вы можете забрать ваш заказ из нашего пункта выдачи в Москве 
                  по адресу: ул. Примерная, д. 123.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Нужна немедленная помощь?</h2>
            <p className={styles.ctaText}>
              Наша служба поддержки готова помочь вам прямо сейчас через онлайн-чат или по телефону
            </p>
            <div className={styles.ctaButtons}>
              <a href="tel:+74951234567" className={styles.ctaButtonPrimary}>
                Позвонить нам
              </a>
              <button className={styles.ctaButtonSecondary}>
                Открыть онлайн-чат
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}