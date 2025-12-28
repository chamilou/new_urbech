'use client';
import styles from './privacy.module.css';

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Политика конфиденциальности</h1>
          <p className={styles.heroSubtitle}>
            Ваша конфиденциальность важна для нас. Ознакомьтесь с нашей политикой обработки персональных данных
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Общая информация */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Общие положения</h2>
            <div className={styles.textContent}>
              <p className={styles.textParagraph}>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты информации 
                о физических лицах (далее — Пользователи), которая может быть получена интернет-магазином 
                MyShop (далее — Администрация) при использовании Пользователем сайта myshop.ru (далее — Сайт).
              </p>
              <p className={styles.textParagraph}>
                Используя Сайт, Пользователь выражает свое согласие с условиями настоящей Политики 
                конфиденциальности. Если Пользователь не согласен с условиями Политики конфиденциальности, 
                он должен прекратить использование Сайта.
              </p>
            </div>
          </div>
        </section>

        {/* Собираемая информация */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Какие данные мы собираем</h2>
            <p className={styles.sectionText}>
              Мы собираем только те данные, которые необходимы для предоставления наших услуг
            </p>
          </div>

          <div className={styles.dataGrid}>
            <div className={styles.dataCard}>
              <div className={styles.dataIcon}>👤</div>
              <h3 className={styles.dataTitle}>Персональные данные</h3>
              <ul className={styles.dataList}>
                <li className={styles.dataItem}>• ФИО</li>
                <li className={styles.dataItem}>• Номер телефона</li>
                <li className={styles.dataItem}>• Адрес электронной почты</li>
                <li className={styles.dataItem}>• Почтовый адрес</li>
              </ul>
            </div>

            <div className={styles.dataCard}>
              <div className={styles.dataIcon}>🛒</div>
              <h3 className={styles.dataTitle}>Данные заказов</h3>
              <ul className={styles.dataList}>
                <li className={styles.dataItem}>• История покупок</li>
                <li className={styles.dataItem}>• Предпочтения в товарах</li>
                <li className={styles.dataItem}>• Корзина покупок</li>
                <li className={styles.dataItem}>• Отзывы о товарах</li>
              </ul>
            </div>

            <div className={styles.dataCard}>
              <div className={styles.dataIcon}>🌐</div>
              <h3 className={styles.dataTitle}>Технические данные</h3>
              <ul className={styles.dataList}>
                <li className={styles.dataItem}>• IP-адрес</li>
                <li className={styles.dataItem}>• Тип браузера</li>
                <li className={styles.dataItem}>• Время посещения</li>
                <li className={styles.dataItem}>• Страницы просмотра</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Цели обработки данных */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Цели обработки данных</h2>
            <div className={styles.purposeGrid}>
              <div className={styles.purposeItem}>
                <div className={styles.purposeIcon}>🎯</div>
                <div className={styles.purposeContent}>
                  <h3 className={styles.purposeTitle}>Обработка заказов</h3>
                  <p className={styles.purposeDescription}>
                    Для оформления, обработки и доставки ваших заказов
                  </p>
                </div>
              </div>

              <div className={styles.purposeItem}>
                <div className={styles.purposeIcon}>📞</div>
                <div className={styles.purposeContent}>
                  <h3 className={styles.purposeTitle}>Служба поддержки</h3>
                  <p className={styles.purposeDescription}>
                    Для оказания помощи и ответов на ваши вопросы
                  </p>
                </div>
              </div>

              <div className={styles.purposeItem}>
                <div className={styles.purposeIcon}>📧</div>
                <div className={styles.purposeContent}>
                  <h3 className={styles.purposeTitle}>Информирование</h3>
                  <p className={styles.purposeDescription}>
                    Для отправки информации о заказах и специальных предложениях
                  </p>
                </div>
              </div>

              <div className={styles.purposeItem}>
                <div className={styles.purposeIcon}>📊</div>
                <div className={styles.purposeContent}>
                  <h3 className={styles.purposeTitle}>Аналитика</h3>
                  <p className={styles.purposeDescription}>
                    Для улучшения работы сайта и качества обслуживания
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Политика cookies */}
        <section className={styles.section}>
          <div className={styles.cookieSection}>
            <div className={styles.cookieHeader}>
              <div className={styles.cookieIcon}>🍪</div>
              <h2 className={styles.cookieTitle}>Политика использования cookies</h2>
            </div>
            
            <div className={styles.textContent}>
              <p className={styles.textParagraph}>
                Мы используем файлы cookie для улучшения пользовательского опыта. 
                Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве.
              </p>
              
              <div className={styles.cookieTypes}>
                <div className={styles.cookieType}>
                  <h3 className={styles.cookieTypeTitle}>Обязательные cookies</h3>
                  <p className={styles.cookieTypeDescription}>
                    Необходимы для работы сайта. Без них сайт не может функционировать правильно
                  </p>
                </div>
                
                <div className={styles.cookieType}>
                  <h3 className={styles.cookieTypeTitle}>Аналитические cookies</h3>
                  <p className={styles.cookieTypeDescription}>
                    Помогают нам анализировать использование сайта для улучшения его работы
                  </p>
                </div>
                
                <div className={styles.cookieType}>
                  <h3 className={styles.cookieTypeTitle}>Функциональные cookies</h3>
                  <p className={styles.cookieTypeDescription}>
                    Запоминают ваши предпочтения и настройки для удобства использования
                  </p>
                </div>
              </div>
              
              <p className={styles.textParagraph}>
                Вы можете управлять использованием cookies в настройках вашего браузера. 
                Однако отключение некоторых cookies может повлиять на работу сайта.
              </p>
            </div>
          </div>
        </section>

        {/* Защита данных */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Защита ваших данных</h2>
            <div className={styles.protectionGrid}>
              <div className={styles.protectionCard}>
                <div className={styles.protectionIcon}>🔒</div>
                <h3 className={styles.protectionTitle}>Шифрование данных</h3>
                <p className={styles.protectionDescription}>
                  Все передаваемые данные защищены современными протоколами шифрования SSL/TLS
                </p>
              </div>

              <div className={styles.protectionCard}>
                <div className={styles.protectionIcon}>🛡️</div>
                <h3 className={styles.protectionTitle}>Контроль доступа</h3>
                <p className={styles.protectionDescription}>
                  Строгий контроль доступа сотрудников к персональным данным пользователей
                </p>
              </div>

              <div className={styles.protectionCard}>
                <div className={styles.protectionIcon}>📋</div>
                <h3 className={styles.protectionTitle}>Политики безопасности</h3>
                <p className={styles.protectionDescription}>
                  Внутренние политики и процедуры для обеспечения безопасности данных
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Права пользователей */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Ваши права</h2>
            <div className={styles.rightsTable}>
              <div className={styles.rightRow}>
                <div className={styles.rightCell}>
                  <span className={styles.rightName}>Право на доступ</span>
                </div>
                <div className={styles.rightCell}>
                  <span className={styles.rightDescription}>
                    Вы можете запросить информацию о том, какие ваши данные мы обрабатываем
                  </span>
                </div>
              </div>
              
              <div className={styles.rightRow}>
                <div className={styles.rightCell}>
                  <span className={styles.rightName}>Право на исправление</span>
                </div>
                <div className={styles.rightCell}>
                  <span className={styles.rightDescription}>
                    Вы можете исправить неточные или неполные персональные данные
                  </span>
                </div>
              </div>
              
              <div className={styles.rightRow}>
                <div className={styles.rightCell}>
                  <span className={styles.rightName}>Право на удаление</span>
                </div>
                <div className={styles.rightCell}>
                  <span className={styles.rightDescription}>
                    Вы можете запросить удаление ваших персональных данных
                  </span>
                </div>
              </div>
              
              <div className={styles.rightRow}>
                <div className={styles.rightCell}>
                  <span className={styles.rightName}>Право на ограничение</span>
                </div>
                <div className={styles.rightCell}>
                  <span className={styles.rightDescription}>
                    Вы можете ограничить обработку ваших персональных данных
                  </span>
                </div>
              </div>
              
              <div className={styles.rightRow}>
                <div className={styles.rightCell}>
                  <span className={styles.rightName}>Право на возражение</span>
                </div>
                <div className={styles.rightCell}>
                  <span className={styles.rightDescription}>
                    Вы можете возражать против обработки ваших персональных данных
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Контакты */}
        <section className={styles.section}>
          <div className={styles.contactSection}>
            <div className={styles.contactHeader}>
              <h2 className={styles.contactTitle}>Контакты по вопросам защиты данных</h2>
              <p className={styles.contactSubtitle}>
                По всем вопросам, связанным с обработкой ваших персональных данных, обращайтесь:
              </p>
            </div>
            
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <div className={styles.contactItemIcon}>📧</div>
                <div className={styles.contactItemContent}>
                  <h3 className={styles.contactItemTitle}>Электронная почта</h3>
                  <p className={styles.contactItemText}>privacy@myshop.ru</p>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.contactItemIcon}>📞</div>
                <div className={styles.contactItemContent}>
                  <h3 className={styles.contactItemTitle}>Телефон</h3>
                  <p className={styles.contactItemText}>+7 (495) 123-45-68</p>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.contactItemIcon}>📍</div>
                <div className={styles.contactItemContent}>
                  <h3 className={styles.contactItemTitle}>Почтовый адрес</h3>
                  <p className={styles.contactItemText}>
                    123456, г. Москва, ул. Примерная, д. 123, оф. 45
                  </p>
                </div>
              </div>
            </div>
            
            <div className={styles.updateInfo}>
              <div className={styles.updateIcon}>🔄</div>
              <div className={styles.updateContent}>
                <h3 className={styles.updateTitle}>Обновление политики</h3>
                <p className={styles.updateText}>
                  Мы можем периодически обновлять настоящую Политику конфиденциальности. 
                  Актуальная версия всегда доступна на этой странице.
                </p>
                <p className={styles.updateDate}>
                  <strong>Дата последнего обновления:</strong> 15 января 2024 года
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Остались вопросы?</h2>
            <p className={styles.ctaText}>
              Наша команда по защите данных готова ответить на все ваши вопросы о конфиденциальности
            </p>
            <div className={styles.ctaButtons}>
              <a href="mailto:privacy@myshop.ru" className={styles.ctaButtonPrimary}>
                Написать письмо
              </a>
              <a href="/contacts" className={styles.ctaButtonSecondary}>
                Другие контакты
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}