'use client';
import styles from './about.module.css';

export default function About() {
  return (
    <div className={styles.container}>
      {/* Герой секция */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Наш семейный урбеч</h1>
          <p className={styles.heroSubtitle}>
            Традиционные дагестанские пасты ручной работы, приготовленные с любовью по старинным рецептам
          </p>
          <div className={styles.heroDecoration}>
            <span className={styles.decorationIcon}>🏔️</span>
            <span className={styles.decorationIcon}>🌿</span>
            <span className={styles.decorationIcon}>👨‍👩‍👧‍👦</span>
            <span className={styles.decorationIcon}>🥜</span>
          </div>
        </div>
      </section>

      {/* Основной контент */}
      <div className={styles.content}>
        {/* Наша история */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Наша семейная история</h2>
            <div className={styles.familyStory}>
              <p className={styles.sectionText}>
                Мы — молодая семья, хранители древней традиции приготовления <strong>урбеча</strong> — 
                натуральной дагестанской пасты из обжаренных и перемолотых семян, орехов и трав. 
                Наш путь начался с желания сохранить и поделиться с миром этой уникальной частью кавказской культуры.
              </p>
              <p className={styles.sectionText}>
                Каждая баночка нашего урбеча — это результат кропотливой работы, уходящей корнями в традиции предков. 
                Мы бережно собираем лучшие семена, сушим их на горном воздухе, обжариваем на открытом огне 
                и перемалываем на каменных жерновах, обработанных по древней технологии.
              </p>
            </div>
          </div>
        </section>

        {/* Наш процесс */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Искусство приготовления урбеча</h2>
          <div className={styles.processGrid}>
            <div className={styles.processStep}>
              <div className={styles.processIcon}>🌄</div>
              <h3 className={styles.processTitle}>Горное сырьё</h3>
              <p className={styles.processText}>
                Используем только местные, экологически чистые семена, орехи и травы, 
                выращенные в горной местности
              </p>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.processIcon}>🔥</div>
              <h3 className={styles.processTitle}>Традиционная обжарка</h3>
              <p className={styles.processText}>
                Медленная обжарка на открытом огне для раскрытия естественного вкуса 
                и аромата каждого ингредиента
              </p>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.processIcon}>🪨</div>
              <h3 className={styles.processTitle}>Каменные жернова</h3>
              <p className={styles.processText}>
                Перемалываем на каменных жерновах, обработанных с учётом природной 
                структуры горной породы, как делали наши предки
              </p>
            </div>
            
            <div className={styles.processStep}>
              <div className={styles.processIcon}>👐</div>
              <h3 className={styles.processTitle}>Ручная работа</h3>
              <p className={styles.processText}>
                Каждая партия готовится вручную с вниманием к деталям и любовью к традиции
              </p>
            </div>
          </div>
        </section>

        {/* Наши ценности */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Наши ценности</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🏡</div>
              <h3 className={styles.valueTitle}>Семейные традиции</h3>
              <p className={styles.valueText}>
                Сохраняем и передаём древние рецепты урбеча из поколения в поколение
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🌱</div>
              <h3 className={styles.valueTitle}>100% натуральность</h3>
              <p className={styles.valueText}>
                Никаких консервантов, красителей или добавок. Только чистые, природные ингредиенты
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💝</div>
              <h3 className={styles.valueTitle}>Индивидуальный подход</h3>
              <p className={styles.valueText}>
                Каждому клиенту — особое внимание. Мы верим, что счастье клиента — наш главный успех
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>🌍</div>
              <h3 className={styles.valueTitle}>Забота о природе</h3>
              <p className={styles.processText}>
                Используем местное сырьё, минимизируем отходы и уважаем природные циклы
              </p>
            </div>
          </div>
        </section>

        {/* Польза урбеча */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Почему наш урбеч особенный?</h2>
            <div className={styles.benefitsList}>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>💪</span>
                <div>
                  <h4>Богат природными питательными веществами</h4>
                  <p>Источник белка, полезных жиров, витаминов и минералов в естественной форме</p>
                </div>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>❤️</span>
                <div>
                  <h4>Поддержка здоровья</h4>
                  <p>Натуральный продукт для укрепления иммунитета и общего благополучия</p>
                </div>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>👨‍🍳</span>
                <div>
                  <h4>Универсальность использования</h4>
                  <p>Идеально для завтраков, десертов, соусов или как полезный перекус</p>
                </div>
              </div>
              <div className={styles.benefit}>
                <span className={styles.benefitIcon}>📜</span>
                <div>
                  <h4>Связь с культурным наследием</h4>
                  <p>Каждая ложка — вкус древней дагестанской традиции</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Секция призыва к действию */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Попробуйте настоящий урбеч!</h2>
            <p className={styles.ctaText}>
              Присоединяйтесь к тем, кто уже открыл для себя уникальный вкус и пользу традиционных дагестанских паст. 
              Каждая баночка — это частичка нашей семьи и нашей любви к природе.
            </p>
            <div className={styles.ctaButtons}>
              <a href="/products" className={styles.ctaButtonPrimary}>
                Выбрать урбеч
              </a>
              <a href="/contact" className={styles.ctaButtonSecondary}>
                Задать вопрос
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}