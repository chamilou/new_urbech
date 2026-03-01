'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import styles from './blog.module.css';

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/blog', { cache: 'no-store' });
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data?.detail || 'Не удалось загрузить статьи');
        }
        setArticles(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || 'Не удалось загрузить статьи');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const featured = articles[0];
  const remaining = articles.slice(1);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.kicker}>Блог о пастах и урбече</span>
          <h1 className={styles.title}>Заметки о помоле, сырье и пастах</h1>
          <p className={styles.subtitle}>
            Здесь мы собираем простые материалы о мельницах, орехах, семенах и том,
            как меняется вкус пасты в зависимости от помола.
          </p>
        </div>
      </section>

      <main className={styles.content}>
        {loading ? <div className={styles.stateBox}>Загрузка статей...</div> : null}
        {error ? <div className={styles.errorBox}>{error}</div> : null}

        {!loading && !error && featured ? (
          <section className={styles.featuredArticle}>
            <div className={styles.featuredCopy}>
              <div className={styles.articleMeta}>
                <span className={styles.metaPill}>Свежая статья</span>
                <span className={styles.metaText}>{featured.readingTime}</span>
              </div>
              <h2 className={styles.articleTitle}>{featured.title}</h2>
              <p className={styles.articleLead}>{featured.excerpt}</p>
              <Link href={`/blog/${featured.slug}`} className={styles.readButton}>
                Читать статью
              </Link>
            </div>

            {featured.coverImageUrl ? (
              <div className={styles.featuredImageWrap}>
                <Image
                  src={featured.coverImageUrl}
                  alt={featured.title}
                  fill
                  className={styles.featuredImage}
                  sizes="(max-width: 900px) 100vw, 42vw"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && remaining.length ? (
          <section className={styles.gridSection}>
            <h2 className={styles.sectionHeading}>Все статьи</h2>
            <div className={styles.articleGrid}>
              {remaining.map((article) => (
                <Link key={article.id} href={`/blog/${article.slug}`} className={styles.card}>
                  {article.coverImageUrl ? (
                    <div className={styles.cardImageWrap}>
                      <Image
                        src={article.coverImageUrl}
                        alt={article.title}
                        fill
                        className={styles.cardImage}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                    </div>
                  ) : null}
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span>{article.readingTime}</span>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && !error && !articles.length ? (
          <div className={styles.stateBox}>Пока нет опубликованных статей.</div>
        ) : null}
      </main>
    </div>
  );
}
