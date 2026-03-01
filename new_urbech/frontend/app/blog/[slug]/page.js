'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import styles from './page.module.css';

export default function BlogArticlePage({ params }) {
  const { slug } = params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`/api/blog/slug/${slug}`, { cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.detail || 'Статья не найдена');
        }
        setArticle(data);
      } catch (loadError) {
        setError(loadError.message || 'Статья не найдена');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/blog" className={styles.backLink}>
          ← Назад к блогу
        </Link>

        {loading ? <div className={styles.stateBox}>Загрузка статьи...</div> : null}
        {error ? <div className={styles.errorBox}>{error}</div> : null}

        {!loading && !error && article ? (
          <article className={styles.article}>
            <div className={styles.metaRow}>
              <span className={styles.metaPill}>{article.readingTime}</span>
            </div>
            <h1 className={styles.title}>{article.title}</h1>
            <p className={styles.excerpt}>{article.excerpt}</p>

            {article.coverImageUrl ? (
              <div className={styles.coverWrap}>
                <Image
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  className={styles.coverImage}
                  sizes="(max-width: 900px) 100vw, 900px"
                />
              </div>
            ) : null}

            <div className={styles.body}>
              {article.body.split('\n').filter(Boolean).map((paragraph, index) => (
                <p key={`${article.id}-${index}`}>{paragraph}</p>
              ))}
            </div>

            {article.galleryImageUrls?.length ? (
              <section className={styles.gallerySection}>
                <h2>Фотографии</h2>
                <div className={styles.galleryGrid}>
                  {article.galleryImageUrls.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className={styles.galleryItem}>
                      <Image
                        src={imageUrl}
                        alt={`${article.title} ${index + 1}`}
                        fill
                        className={styles.galleryImage}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        ) : null}
      </div>
    </div>
  );
}
