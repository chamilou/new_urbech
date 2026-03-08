'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './CategoryForm.module.css';
import { withAuth } from '../../lib/authFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

// Enhanced slugify function with Cyrillic transliteration
const slugify = (text) => {
  if (!text) return '';
  
  // Cyrillic to Latin transliteration map
  const cyrillicMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
    'Я': 'Ya'
  };

  return text
    .toString()
    .toLowerCase()
    .split('')
    .map(char => cyrillicMap[char] || char) // Transliterate Cyrillic characters
    .join('')
    .normalize('NFKD') // Normalize special characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars (only allow latin letters, numbers, spaces, hyphens)
    .replace(/\s+/g, '-') // Collapse whitespace and replace by -
    .replace(/-+/g, '-') // Collapse dashes
    .replace(/^-+/, '') // Trim dash from start
    .replace(/-+$/, ''); // Trim dash from end
};

// Alternative: More comprehensive Cyrillic transliteration
const advancedSlugify = (text) => {
  if (!text) return '';
  
  // Extended transliteration map for better Cyrillic support
  const transliterationMap = {
    // Basic Cyrillic
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
    
    // Ukrainian specific
    'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g',
    
    // Belarusian specific  
    'ў': 'u', 'і': 'i',
    
    // Uppercase
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
    'Я': 'Ya',
    'Є': 'Ye', 'І': 'I', 'Ї': 'Yi', 'Ґ': 'G',
    'Ў': 'U'
  };

  return text
    .toString()
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export default function CategoryForm({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '', 
    parentId: '',
    defaultSortOrder: 0
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [slugModified, setSlugModified] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        parentId: category.parentId || '',
        defaultSortOrder: category.defaultSortOrder || 0
      });
      setAutoSlug(false);
      setSlugModified(true);
    } else {
      setFormData({ name: '', slug: '', parentId: '', defaultSortOrder: 0 });
      setAutoSlug(true);
      setSlugModified(false);
    }
    fetchCategories();
  }, [category]);

  // Auto-generate slug when name changes and autoSlug is enabled
  useEffect(() => {
    if (autoSlug && formData.name && !slugModified) {
      const newSlug = advancedSlugify(formData.name);
      setFormData(prev => ({ 
        ...prev, 
        slug: newSlug 
      }));
    }
  }, [formData.name, autoSlug, slugModified]);

  const fetchCategories = async () => {
    setFetching(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });

      if (!res.ok) throw new Error(`Не удалось загрузить категории: ${res.status}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки категорий:', e);
      setError(e.message || 'Не удалось загрузить категории');
    } finally {
      setFetching(false);
    }
  };

  const buildIndentedLabel = (c) => {
    const depth = ((c.path || c.slug || '').split('/').filter(Boolean).length || 1) - 1;
    const indents = depth > 0 ? '— '.repeat(depth) : '';
    return `${indents}${c.name} ${c.defaultSortOrder !== 0 ? `(${c.defaultSortOrder})` : ''}`;
  };

  const parentOptions = useMemo(() => {
    const currentPath = category?.path || category?.slug || '';
    const isDescendantOrSelf = (c) =>
      !!category &&
      ((c.id === category.id) ||
        (!!c.path && !!currentPath && (c.path === currentPath || c.path.startsWith(currentPath + '/'))));

    const sorted = [...categories].sort((a, b) =>
      (a.path || a.slug || '').localeCompare(b.path || b.slug || '')
    );

    return sorted.filter((c) => !category || !isDescendantOrSelf(c));
  }, [categories, category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'autoSlug') {
      setAutoSlug(checked);
      // If enabling auto-slug, regenerate slug from current name
      if (checked && formData.name) {
        setFormData(prev => ({ 
          ...prev, 
          slug: advancedSlugify(formData.name) 
        }));
        setSlugModified(false);
      }
      return;
    }
    
    // Handle number inputs
    if (name === 'defaultSortOrder') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSlugChange = (e) => {
    const { value } = e.target;
    // Mark slug as manually modified when user types in it
    if (!slugModified && value !== advancedSlugify(formData.name)) {
      setSlugModified(true);
    }
    setFormData(prev => ({ ...prev, slug: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = category ? `${API_BASE}/categories/${category.id}` : `${API_BASE}/categories`;

      const method = category ? 'PUT' : 'POST';

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Название категории обязательно');
      }

      // Ensure slug is not empty - generate from name if needed
      let finalSlug = formData.slug.trim();
      if (!finalSlug) {
        finalSlug = advancedSlugify(formData.name);
        if (!finalSlug) {
          throw new Error('Не удалось сгенерировать корректный slug из названия категории');
        }
      }

      const payload = {
        name: formData.name.trim(),
        slug: finalSlug,
        parentId: formData.parentId || null,
        defaultSortOrder: formData.defaultSortOrder || 0
      };

      const res = await fetch(
        url,
        withAuth({
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );

      const responseText = await res.text();

      if (!res.ok) {
        let detail = `HTTP ${res.status}: ${res.statusText}`;
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            if (errorData?.detail) detail = errorData.detail;
          } catch {
            detail = responseText || detail;
          }
        }
        
        throw new Error(detail);
      }

      // Success - parse response if exists
      const result = responseText ? JSON.parse(responseText) : {};
      
      // Reset form state
      setSlugModified(false);
      
      onSave?.(result);
    } catch (e) {
      console.error('Ошибка сохранения категории:', e);
      setError(e.message || 'Не удалось сохранить категорию');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSlug = () => {
    if (formData.name) {
      const newSlug = advancedSlugify(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
      setSlugModified(false);
      setAutoSlug(true);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Форма категории">
      <div className={styles.modal}>
        <h2>{category ? 'Редактировать категорию' : 'Добавить новую категорию'}</h2>

        {(error || fetching) && (
          <div className={styles.infoRow}>
            {fetching && <span className={styles.helpText}>Загрузка категорий…</span>}
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label htmlFor="name">Название категории *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Введите название категории (поддерживается кириллица)"
              disabled={loading}
            />
          </div>

          {/* Slug (auto, editable) */}
          <div className={styles.formGroup}>
            <div className={styles.slugHeader}>
              <label htmlFor="slug">URL (slug) *</label>
              {formData.name && (
                <button
                  type="button"
                  onClick={handleRegenerateSlug}
                  className={styles.regenerateSlugBtn}
                  disabled={loading}
                >
                  Сгенерировать из названия
                </button>
              )}
            </div>
            <div className={styles.inlineRow}>
              <input
                id="slug"
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleSlugChange}
                required
                placeholder="автоматически-из-названия"
                disabled={loading}
              />
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name="autoSlug"
                  checked={autoSlug}
                  onChange={handleChange}
                  disabled={loading}
                />
                Автогенерация
              </label>
            </div>
            <small className={styles.helpText}>
              {formData.slug
                ? `URL: /category/${formData.slug}`
                : 'Slug будет сгенерирован из названия (поддерживается кириллица)'}
              {slugModified && ' (изменено вручную)'}
            </small>
          </div>

          {/* Menu Priority */}
          <div className={styles.formGroup}>
            <label htmlFor="defaultSortOrder">Приоритет в меню</label>
            <input
              id="defaultSortOrder"
              type="number"
              name="defaultSortOrder"
              value={formData.defaultSortOrder}
              onChange={handleChange}
              min="0"
              max="1000"
              required
              placeholder="0"
              disabled={loading}
            />
            <small className={styles.helpText}>
              Большее число = выше позиция в меню. Категории сортируются по этому числу (по убыванию).
            </small>
          </div>

          {/* Parent */}
          <div className={styles.formGroup}>
            <label htmlFor="parentId">Родительская категория (необязательно)</label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              disabled={loading || fetching}
            >
              <option value="">Без родителя (корневая категория)</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {buildIndentedLabel(c)}
                </option>
              ))}
            </select>
            <small className={styles.helpText}>
              {category ? "Нельзя выбрать текущую категорию или её подкатегории." : "Выберите родительскую категорию для создания подкатегории."}
            </small>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading || !formData.name.trim() || !formData.slug.trim()}
              className={styles.saveBtn}
            >
              {loading ? 'Сохранение…' : category ? 'Обновить категорию' : 'Создать категорию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
