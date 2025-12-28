'use client';
import styles from './return.module.css';

export default function ReturnPolicy() {
  return (
    <div className={styles.container}>
      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Возврат и обмен</h1>
          <p className={styles.heroSubtitle}>
            Условия возврата и обмена товаров. Мы гарантируем соблюдение ваших прав как потребителя
          </p>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Общая информация */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Условия возврата</h2>
            <p className={styles.sectionText}>
              Мы стремимся к тому, чтобы каждый покупатель остался доволен своей покупкой. 
              Если товар вам не подошел, вы можете вернуть или обменять его в соответствии с законом.
            </p>
          </div>

          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>📅</div>
              <h3 className={styles.infoTitle}>Срок возврата</h3>
              <div className={styles.infoDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Обычные товары:</span>
                  <span className={styles.detailValue}>14 дней</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Техника:</span>
                  <span className={styles.detailValue}>7 дней</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Товары надлежащего качества:</span>
                  <span className={styles.detailValue}>14 дней</span>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>✅</div>
              <h3 className={styles.infoTitle}>Условия возврата</h3>
              <ul className={styles.conditionList}>
                <li className={styles.conditionItem}>✓ Сохранен товарный вид</li>
                <li className={styles.conditionItem}>✓ Сохранены ярлыки и бирки</li>
                <li className={styles.conditionItem}>✓ Нет следов использования</li>
                <li className={styles.conditionItem}>✓ Полная комплектация</li>
                <li className={styles.conditionItem}>✓ Наличие чека или документа о покупке</li>
              </ul>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>💰</div>
              <h3 className={styles.infoTitle}>Возврат денег</h3>
              <div className={styles.refundInfo}>
                <div className={styles.refundDetail}>
                  <div className={styles.refundLabel}>Срок возврата средств:</div>
                  <div className={styles.refundValue}>3-10 рабочих дней</div>
                </div>
                <div className={styles.refundDetail}>
                  <div className={styles.refundLabel}>Способ возврата:</div>
                  <div className={styles.refundValue}>Тем же способом, что и оплата</div>
                </div>
                <div className={styles.refundDetail}>
                  <div className={styles.refundLabel}>Стоимость доставки:</div>
                  <div className={styles.refundValue}>Не возвращается</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Процесс возврата */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Как вернуть товар</h2>
            <p className={styles.sectionText}>
              Процесс возврата прост и понятен. Следуйте этим шагам для быстрого оформления возврата
            </p>
          </div>

          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Оформление заявки</h3>
                <p className={styles.stepDescription}>
                  Заполните форму возврата в личном кабинете или свяжитесь с нашей службой поддержки
                </p>
              </div>
            </div>

            <div className={styles.processStep}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Подготовка товара</h3>
                <p className={styles.stepDescription}>
                  Упакуйте товар в оригинальную упаковку со всеми аксессуарами и документами
                </p>
              </div>
            </div>

            <div className={styles.processStep}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Отправка товара</h3>
                <p className={styles.stepDescription}>
                  Отправьте товар курьерской службой или привезите в наш пункт выдачи
                </p>
              </div>
            </div>

            <div className={styles.processStep}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Проверка и возврат</h3>
                <p className={styles.stepDescription}>
                  Мы проверяем товар в течение 3 дней и возвращаем деньги на ваш счет
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Обмен товара */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Условия обмена</h2>
            <p className={styles.sectionText}>
              Если товар вам не подошел по размеру, цвету или другим параметрам, вы можете обменять его
            </p>
          </div>

          <div className={styles.exchangeInfo}>
            <div className={styles.exchangeCard}>
              <div className={styles.exchangeHeader}>
                <div className={styles.exchangeIcon}>🔄</div>
                <h3 className={styles.exchangeTitle}>Обмен на другой товар</h3>
              </div>
              <div className={styles.exchangeDetails}>
                <div className={styles.exchangeDetail}>
                  <span className={styles.detailLabel}>Срок обмена:</span>
                  <span className={styles.detailValue}>14 дней с момента покупки</span>
                </div>
                <div className={styles.exchangeDetail}>
                  <span className={styles.detailLabel}>Условия:</span>
                  <span className={styles.detailValue}>Товар не был в употреблении</span>
                </div>
                <div className={styles.exchangeDetail}>
                  <span className={styles.detailLabel}>Разница в цене:</span>
                  <span className={styles.detailValue}>Доплата или возврат разницы</span>
                </div>
              </div>
            </div>

            <div className={styles.exchangeCard}>
              <div className={styles.exchangeHeader}>
                <div className={styles.exchangeIcon}>🚫</div>
                <h3 className={styles.exchangeTitle}>Товары, которые нельзя вернуть</h3>
              </div>
              <ul className={styles.nonReturnableList}>
                <li className={styles.nonReturnableItem}>• Предметы личной гигиены</li>
                <li className={styles.nonReturnableItem}>• Нижнее белье и чулочно-носочные изделия</li>
                <li className={styles.nonReturnableItem}>• Парфюмерия и косметика</li>
                <li className={styles.nonReturnableItem}>• Сложно-технические товары с гарантией</li>
                <li className={styles.nonReturnableItem}>• Товары, сделанные на заказ</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Часто задаваемые вопросы */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Часто задаваемые вопросы</h2>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Можно ли вернуть товар без чека?</h3>
                <p className={styles.faqAnswer}>
                  Да, если у вас нет чека, мы можем найти вашу покупку по номеру заказа или данным банковской карты. 
                  Также можно предоставить другие доказательства покупки.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Кто оплачивает доставку при возврате?</h3>
                <p className={styles.faqAnswer}>
                  При возврате товара надлежащего качества доставку оплачивает покупатель. 
                  Если товар бракованный или не соответствует описанию, мы компенсируем расходы на доставку.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Как быстро вернут деньги?</h3>
                <p className={styles.faqAnswer}>
                  Возврат средств осуществляется в течение 3-10 рабочих дней после получения и проверки товара. 
                  Срок зачисления зависит от вашего банка или платежной системы.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Можно ли вернуть распроданный товар?</h3>
                <p className={styles.faqAnswer}>
                  Если товар был приобретен по акции или распродаже, его также можно вернуть на общих условиях. 
                  Возврат осуществляется по цене покупки, указанной в чеке.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Что делать с бракованным товаром?</h3>
                <p className={styles.faqAnswer}>
                  При обнаружении брака свяжитесь с нашей службой поддержки. Мы организуем возврат, 
                  обмен или ремонт товара в зависимости от характера дефекта и ваших пожеланий.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Можно ли обменять подарок?</h3>
                <p className={styles.faqAnswer}>
                  Да, товар, полученный в качестве подарка, можно обменять при наличии чека или номера заказа. 
                  Возврат денежных средств осуществляется лицу, совершившему покупку.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Форма возврата */}
        <section className={styles.section}>
          <div className={styles.formContainer}>
            <h2 className={styles.sectionTitle}>Форма возврата</h2>
            <p className={styles.sectionText}>
              Заполните форму для оформления возврата. Наш менеджер свяжется с вами в течение 24 часов
            </p>

            <form className={styles.returnForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="orderNumber" className={styles.formLabel}>
                    Номер заказа *
                  </label>
                  <input
                    type="text"
                    id="orderNumber"
                    className={styles.formInput}
                    placeholder="Введите номер вашего заказа"
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
                <label htmlFor="phone" className={styles.formLabel}>
                  Телефон *
                </label>
                <input
                  type="tel"
                  id="phone"
                  className={styles.formInput}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Причина возврата *
                </label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="reason" value="quality" required />
                    <span>Не подошел по размеру/цвету</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="reason" value="defect" />
                    <span>Обнаружен брак/дефект</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="reason" value="description" />
                    <span>Не соответствует описанию</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="reason" value="other" />
                    <span>Другая причина</span>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="details" className={styles.formLabel}>
                  Детали возврата
                </label>
                <textarea
                  id="details"
                  className={styles.formTextarea}
                  rows="4"
                  placeholder="Опишите подробно причину возврата..."
                ></textarea>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} required />
                  <span>Я ознакомлен(а) с условиями возврата и согласен(на) с ними</span>
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Отправить заявку на возврат
                </button>
                <button type="button" className={styles.secondaryButton}>
                  Скачать бланк возврата
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Нужна помощь с возвратом?</h2>
            <p className={styles.ctaText}>
              Наша служба поддержки готова ответить на все вопросы и помочь с оформлением возврата
            </p>
            <div className={styles.ctaButtons}>
              <a href="tel:+74951234567" className={styles.ctaButtonPrimary}>
                Позвонить в поддержку
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