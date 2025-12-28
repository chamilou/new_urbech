'use client';
import styles from './shipping.module.css';

export default function ShippingInfo() {
  return (
    <div className={styles.container}>
      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Доставка и оплата</h1>
          <p className={styles.heroSubtitle}>
            Узнайте все о способах доставки, сроках и условиях оплаты ваших заказов
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Способы доставки */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Способы доставки</h2>
            <p className={styles.sectionText}>
              Мы предлагаем различные варианты доставки для вашего удобства. 
              Выберите подходящий способ получения заказа.
            </p>
          </div>

          <div className={styles.deliveryGrid}>
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>🚚</div>
              <h3 className={styles.deliveryTitle}>Курьерская доставка</h3>
              <p className={styles.deliveryInfo}>1-3 дня</p>
              <p className={styles.deliveryDescription}>
                Доставка курьером по адресу. Работаем с понедельника по субботу с 9:00 до 21:00
              </p>
              <div className={styles.deliveryPrice}>
                <span className={styles.price}>от 300 ₽</span>
                <span className={styles.priceNote}>Бесплатно от 3000 ₽</span>
              </div>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>📦</div>
              <h3 className={styles.deliveryTitle}>Пункты выдачи</h3>
              <p className={styles.deliveryInfo}>2-5 дней</p>
              <p className={styles.deliveryDescription}>
                Более 5000 пунктов выдачи по всей России. Выберите удобное для вас место получения
              </p>
              <div className={styles.deliveryPrice}>
                <span className={styles.price}>от 200 ₽</span>
                <span className={styles.priceNote}>Бесплатно от 2500 ₽</span>
              </div>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>🏪</div>
              <h3 className={styles.deliveryTitle}>Самовывоз</h3>
              <p className={styles.deliveryInfo}>1-2 дня</p>
              <p className={styles.deliveryDescription}>
                Заберите заказ из нашего магазина в Москве. Уведомим о готовности заказа
              </p>
              <div className={styles.deliveryPrice}>
                <span className={styles.price}>Бесплатно</span>
                <span className={styles.priceNote}>Всегда бесплатно</span>
              </div>
            </div>

            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIcon}>✈️</div>
              <h3 className={styles.deliveryTitle}>Экспресс-доставка</h3>
              <p className={styles.deliveryInfo}>1 день</p>
              <p className={styles.deliveryDescription}>
                Доставка в течение 24 часов по Москве и Московской области
              </p>
              <div className={styles.deliveryPrice}>
                <span className={styles.price}>от 800 ₽</span>
                <span className={styles.priceNote}>Быстро и надежно</span>
              </div>
            </div>
          </div>
        </section>

        {/* Карта зон доставки */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Зоны и сроки доставки</h2>
            <p className={styles.sectionText}>
              Сроки доставки зависят от вашего региона. Узнайте ориентировочное время доставки
            </p>
          </div>

          <div className={styles.deliveryZones}>
            <div className={styles.zoneCard}>
              <div className={styles.zoneHeader}>
                <div className={styles.zoneColor} style={{ backgroundColor: '#4f46e5' }}></div>
                <h3 className={styles.zoneTitle}>Москва и МО</h3>
              </div>
              <ul className={styles.zoneList}>
                <li className={styles.zoneItem}>• Курьерская доставка: 1-2 дня</li>
                <li className={styles.zoneItem}>• Пункты выдачи: 1-3 дня</li>
                <li className={styles.zoneItem}>• Самовывоз: 1 день</li>
                <li className={styles.zoneItem}>• Экспресс: 24 часа</li>
              </ul>
            </div>

            <div className={styles.zoneCard}>
              <div className={styles.zoneHeader}>
                <div className={styles.zoneColor} style={{ backgroundColor: '#7c3aed' }}></div>
                <h3 className={styles.zoneTitle}>Крупные города</h3>
              </div>
              <ul className={styles.zoneList}>
                <li className={styles.zoneItem}>• Курьерская доставка: 2-4 дня</li>
                <li className={styles.zoneItem}>• Пункты выдачи: 3-5 дней</li>
                <li className={styles.zoneItem}>• Самовывоз: не доступен</li>
                <li className={styles.zoneItem}>• Экспресс: 2-3 дня</li>
              </ul>
            </div>

            <div className={styles.zoneCard}>
              <div className={styles.zoneHeader}>
                <div className={styles.zoneColor} style={{ backgroundColor: '#a78bfa' }}></div>
                <h3 className={styles.zoneTitle}>Регионы России</h3>
              </div>
              <ul className={styles.zoneList}>
                <li className={styles.zoneItem}>• Курьерская доставка: 3-7 дней</li>
                <li className={styles.zoneItem}>• Пункты выдачи: 5-10 дней</li>
                <li className={styles.zoneItem}>• Самовывоз: не доступен</li>
                <li className={styles.zoneItem}>• Экспресс: 3-5 дней</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Способы оплаты */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Способы оплаты</h2>
            <p className={styles.sectionText}>
              Выберите удобный для вас способ оплаты заказа. Мы гарантируем безопасность всех транзакций
            </p>
          </div>

          <div className={styles.paymentGrid}>
            <div className={styles.paymentCard}>
              <div className={styles.paymentIcon}>💳</div>
              <h3 className={styles.paymentTitle}>Онлайн-оплата</h3>
              <p className={styles.paymentDescription}>
                Банковской картой (Visa, MasterCard, МИР) через защищенное соединение
              </p>
            </div>

            <div className={styles.paymentCard}>
              <div className={styles.paymentIcon}>📱</div>
              <h3 className={styles.paymentTitle}>Электронные кошельки</h3>
              <p className={styles.paymentDescription}>
                ЮMoney, QIWI, WebMoney и другие популярные платежные системы
              </p>
            </div>

            <div className={styles.paymentCard}>
              <div className={styles.paymentIcon}>🏦</div>
              <h3 className={styles.paymentTitle}>Наложенный платеж</h3>
              <p className={styles.paymentDescription}>
                Оплата при получении заказа наличными или банковской картой
              </p>
            </div>

            <div className={styles.paymentCard}>
              <div className={styles.paymentIcon}>🧾</div>
              <h3 className={styles.paymentTitle}>Безналичный расчет</h3>
              <p className={styles.paymentDescription}>
                Для юридических лиц с выставлением счета и полным пакетом документов
              </p>
            </div>
          </div>
        </section>

        {/* Часто задаваемые вопросы */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Часто задаваемые вопросы</h2>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как отследить мой заказ?</h3>
                <p className={styles.faqAnswer}>
                  После отправки заказа вы получите трекер-номер на указанную электронную почту. 
                  Вы можете отслеживать статус доставки в личном кабинете или по трекер-номеру на сайте транспортной компании.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Можно ли изменить адрес доставки?</h3>
                <p className={styles.faqAnswer}>
                  Да, вы можете изменить адрес доставки до момента передачи заказа в службу доставки. 
                  Для этого свяжитесь с нашим менеджером по телефону или через онлайн-чат.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Что делать, если меня нет дома при доставке?</h3>
                <p className={styles.faqAnswer}>
                  Курьер свяжется с вами перед выездом. Если вас не будет на месте, курьер оставит уведомление 
                  и перенесет доставку на другой день или предложит забрать заказ из пункта выдачи.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Какова стоимость доставки в регионы?</h3>
                <p className={styles.faqAnswer}>
                  Стоимость доставки в регионы рассчитывается индивидуально в зависимости от веса и габаритов заказа, 
                  а также удаленности региона. Точную стоимость вы увидите при оформлении заказа.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Остались вопросы по доставке?</h2>
            <p className={styles.ctaText}>
              Наша служба поддержки готова ответить на все ваши вопросы и помочь с оформлением заказа
            </p>
            <div className={styles.ctaButtons}>
              <a href="tel:+74951234567" className={styles.ctaButtonPrimary}>
                Позвонить нам
              </a>
              <button className={styles.ctaButtonSecondary}>
                Написать в чат
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}