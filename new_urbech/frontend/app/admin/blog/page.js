'use client';

import { useEffect, useState } from 'react';

import { withAuth } from '../../lib/authFetch';
import styles from '../crud-page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

function emptyArticle() {
  return {
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    coverImageUrl: '',
    galleryImageUrls: [],
    published: false,
  };
}

function articleToForm(article) {
  return {
    title: article.title || '',
    slug: article.slug || '',
    excerpt: article.excerpt || '',
    body: article.body || '',
    coverImageUrl: article.coverImageUrl || '',
    galleryImageUrls: article.galleryImageUrls || [],
    published: !!article.published,
  };
}

async function uploadBlogImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    '/api/uploads/blog',
    withAuth({
      method: 'POST',
      body: formData,
    })
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || 'Не удалось загрузить изображение');
  }
  return data.url;
}

function BlogArticleModal({ article, onClose, onSaved }) {
  const [formData, setFormData] = useState(emptyArticle());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(article ? articleToForm(article) : emptyArticle());
    setError('');
  }, [article]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const url = await uploadBlogImage(file);
      setFormData((current) => ({ ...current, coverImageUrl: url }));
    } catch (uploadError) {
      setError(uploadError.message || 'Не удалось загрузить изображение');
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setUploadingGallery(true);
      const urls = [];
      for (const file of files) {
        urls.push(await uploadBlogImage(file));
      }
      setFormData((current) => ({
        ...current,
        galleryImageUrls: [...current.galleryImageUrls, ...urls],
      }));
    } catch (uploadError) {
      setError(uploadError.message || 'Не удалось загрузить фотографии');
    } finally {
      setUploadingGallery(false);
      event.target.value = '';
    }
  };

  const removeGalleryImage = (index) => {
    setFormData((current) => ({
      ...current,
      galleryImageUrls: current.galleryImageUrls.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        article ? `${API_BASE}/blog/${article.id}` : `${API_BASE}/blog`,
        withAuth({
          method: article ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title.trim(),
            slug: formData.slug.trim() || null,
            excerpt: formData.excerpt.trim(),
            body: formData.body.trim(),
            coverImageUrl: formData.coverImageUrl.trim() || null,
            galleryImageUrls: formData.galleryImageUrls,
            published: formData.published,
          }),
        })
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Не удалось сохранить статью');
      }
      onSaved();
    } catch (submitError) {
      setError(submitError.message || 'Не удалось сохранить статью');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalWide}`}>
        <div className={styles.modalHeader}>
          <h2>{article ? 'Редактировать статью' : 'Новая статья'}</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error ? <div className={styles.error}>{error}</div> : null}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="title">Заголовок</label>
              <input id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Slug</label>
              <input id="slug" name="slug" value={formData.slug} onChange={handleChange} placeholder="Можно оставить пустым" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="excerpt">Короткое описание</label>
              <textarea id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} required />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="body">Текст статьи</label>
              <textarea id="body" name="body" value={formData.body} onChange={handleChange} required />
              <span className={styles.helperText}>Разделяйте абзацы пустой строкой.</span>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="coverImageUrl">Обложка</label>
              <input id="coverImageUrl" name="coverImageUrl" value={formData.coverImageUrl} onChange={handleChange} placeholder="/media/blog/..." />
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} />
              <span className={styles.helperText}>{uploadingCover ? 'Загрузка обложки...' : 'Можно вставить URL или загрузить файл.'}</span>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="galleryUpload">Галерея</label>
              <input id="galleryUpload" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={handleGalleryUpload} />
              <span className={styles.helperText}>{uploadingGallery ? 'Загрузка фотографий...' : 'Добавьте несколько фотографий для статьи.'}</span>
              {formData.galleryImageUrls.length ? (
                <div className={styles.itemPreview}>
                  {formData.galleryImageUrls.map((imageUrl, index) => (
                    <button
                      type="button"
                      key={`${imageUrl}-${index}`}
                      className={styles.smallSecondaryButton}
                      onClick={() => removeGalleryImage(index)}
                    >
                      Фото {index + 1} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className={styles.field}>
              <label>
                <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} /> Опубликовано
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className={styles.button} disabled={saving || uploadingCover || uploadingGallery}>
              {saving ? 'Сохранение...' : article ? 'Обновить статью' : 'Создать статью'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/blog/admin', withAuth({ cache: 'no-store' }));
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

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (articleId) => {
    if (!confirm('Удалить статью?')) return;

    try {
      const response = await fetch(
        `/api/blog/${articleId}`,
        withAuth({ method: 'DELETE' })
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Не удалось удалить статью');
      }
      await loadArticles();
    } catch (deleteError) {
      setError(deleteError.message || 'Не удалось удалить статью');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <h1>Blog</h1>
            <p>Создавайте статьи, добавляйте фотографии и публикуйте материалы о пастах и урбече.</p>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{articles.length}</span>
              <span className={styles.statLabel}>Статей</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statAccent}`}>{articles.filter((article) => article.published).length}</span>
              <span className={styles.statLabel}>Опубликовано</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statDanger}`}>{articles.filter((article) => !article.published).length}</span>
              <span className={styles.statLabel}>Черновики</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.actionGroup}>
            <button type="button" className={styles.secondaryButton} onClick={loadArticles}>
              Обновить
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setEditingArticle(null);
                setShowModal(true);
              }}
            >
              Новая статья
            </button>
          </div>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <div className={styles.loading}>Загрузка статей...</div>
      ) : (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>{articles.length} статья(ей)</div>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Статья</th>
                  <th>Slug</th>
                  <th>Статус</th>
                  <th>Изображения</th>
                  <th>Обновлено</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div className={styles.cellStack}>
                        <span className={styles.strong}>{article.title}</span>
                        <span className={styles.muted}>{article.excerpt}</span>
                      </div>
                    </td>
                    <td className={styles.mono}>{article.slug}</td>
                    <td>
                      <span className={`${styles.badge} ${article.published ? styles.badgeGreen : styles.badgeGray}`}>
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span>{article.coverImageUrl ? 'Обложка' : 'Без обложки'}</span>
                        <span className={styles.muted}>{article.galleryImageUrls?.length || 0} фото</span>
                      </div>
                    </td>
                    <td>{new Date(article.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.smallSecondaryButton}
                          onClick={() => {
                            setEditingArticle(article);
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className={styles.smallDangerButton} onClick={() => handleDelete(article.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!articles.length ? (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Пока нет статей.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal ? (
        <BlogArticleModal
          article={editingArticle}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            setEditingArticle(null);
            await loadArticles();
          }}
        />
      ) : null}
    </div>
  );
}
