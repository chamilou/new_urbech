'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import CategoryForm from './CategoryForm';
import styles from './ProductForm.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

// --- Cyrillic-friendly slug helper (same idea as CategoryForm) ---
const advancedSlugify = (text) => {
  if (!text) return '';

  const transliterationMap = {
    // Russian basic
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',

    // Ukrainian
    'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g',

    // Belarusian
    'ў': 'u',

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
    .map((char) => transliterationMap[char] || char)
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

export default function ProductForm({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    articleNumber: '',
    price: '',
    currencyCode: 'USD',
    description: '',
    stock: '',
    minStock: '5',
    categoryIds: [],
    mainImageUrl: ''
  });

  const [autoSlug, setAutoSlug] = useState(true);
  const [slugModified, setSlugModified] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      // ProductResponse.categories is usually [{id,name,slug}] (your schema),
      // but prisma include can be nested. Handle both safely.
      const categoryIds =
        product.categories?.map((x) => x?.categoryId || x?.id || x?.category?.id).filter(Boolean) || [];

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        articleNumber: product.articleNumber || '',
        price: product.price ?? '',
        currencyCode: (product.currencyCode || 'USD').toString().trim().toUpperCase(),
        description: product.description || '',
        stock: product.stock?.toString() || '',
        minStock: product.minStock?.toString() || '5',
        categoryIds,
        mainImageUrl: product.mainImageUrl || ''
      });

      if (product.mainImageUrl) setImagePreview(product.mainImageUrl);

      setAutoSlug(false);
      setSlugModified(true);
    } else {
      setFormData({
        name: '',
        slug: '',
        articleNumber: '',
        price: '',
        currencyCode: 'USD',
        description: '',
        stock: '',
        minStock: '5',
        categoryIds: [],
        mainImageUrl: ''
      });
      setAutoSlug(true);
      setSlugModified(false);

      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && formData.name && !slugModified) {
      const newSlug = advancedSlugify(formData.name);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  }, [formData.name, autoSlug, slugModified]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories?includeParent=true&limit=500`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        console.error('Ошибка загрузки категорий:', response.status);
        setErrors((prev) => ({ ...prev, categories: 'Не удалось загрузить категории' }));
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setErrors((prev) => ({ ...prev, categories: 'Ошибка сети при загрузке категорий' }));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategorySaved = async (createdCategory) => {
    setShowCategoryForm(false);
    await fetchCategories();

    if (createdCategory?.id) {
      setFormData((prev) => ({
        ...prev,
        categoryIds: [createdCategory.id],
      }));
    }
  };

  const isValidUrl = (value) => {
  if (!value) return true;

  // allow your local public media paths
  if (value.startsWith('/media/')) return true;

  // allow absolute URLs
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};


  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = 'Название товара обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно быть не менее 2 символов';
    }

    // Slug
    const finalSlug = formData.slug?.trim() || advancedSlugify(formData.name);
    if (!finalSlug) {
      newErrors.slug = 'Slug обязателен (не удалось сгенерировать из названия)';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
      newErrors.slug = 'Slug должен содержать только латиницу, цифры и дефисы';
    }

    // Currency code
    const cc = (formData.currencyCode || '').toString().trim().toUpperCase();
    if (!cc) {
      newErrors.currencyCode = 'Валюта обязательна';
    } else if (!/^[A-Z]{3}$/.test(cc)) {
      newErrors.currencyCode = 'Валюта должна быть 3 буквы (например USD, EUR, CHF)';
    }

    // Price
    if (formData.price === '' || formData.price === null || formData.price === undefined) {
      newErrors.price = 'Цена обязательна';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Цена должна быть положительным числом';
      }
    }

    // Stock
    if (formData.stock === '' || formData.stock === null || formData.stock === undefined) {
      newErrors.stock = 'Количество обязательно';
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'Количество должно быть положительным числом';
      }
    }

    // Min stock
    if (formData.minStock === '' || formData.minStock === null || formData.minStock === undefined) {
      newErrors.minStock = 'Минимальный запас обязателен';
    } else {
      const minStock = parseInt(formData.minStock);
      if (isNaN(minStock) || minStock < 0) {
        newErrors.minStock = 'Минимальный запас должен быть положительным числом';
      }
    }

    // Image URL
    if (formData.mainImageUrl && !isValidUrl(formData.mainImageUrl)) {
      newErrors.mainImageUrl = 'Введите корректный URL изображения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file) => {
  setUploading(true);
  setErrors((prev) => ({ ...prev, image: '' }));

  try {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch('/api/uploads/products', {
      method: 'POST',
      body: uploadFormData,
    });

    // Read as text first so we can handle both JSON and non-JSON error bodies
    const responseText = await response.text();

    if (!response.ok) {
      console.error('Ошибка загрузки изображения:', response.status, responseText);
      setErrors((prev) => ({
        ...prev,
        image: responseText || 'Не удалось загрузить изображение',
      }));
      return;
    }

    let result = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Upload response is not JSON:', responseText);
      throw new Error('Ответ загрузки не является корректным JSON');
    }

    if (!result?.url) {
      throw new Error('В ответе загрузки отсутствует поле url');
    }

    // IMPORTANT: store PUBLIC media url directly (do NOT prefix /api)
    const imageUrl = result.url; // e.g. "/media/products/xxx.webp"

    setFormData((prev) => ({
      ...prev,
      mainImageUrl: imageUrl,
    }));
    setImagePreview(imageUrl);
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    setErrors((prev) => ({
      ...prev,
      image: error?.message || 'Ошибка сети при загрузке',
    }));
  } finally {
    setUploading(false);
  }
};


  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'Выберите допустимый файл изображения (JPEG, PNG или WebP)' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Размер изображения должен быть менее 5MB' }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: '' }));

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    handleImageUpload(file);
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, mainImageUrl: url }));

    if (url && !isValidUrl(url)) {
      setErrors((prev) => ({ ...prev, mainImageUrl: 'Введите корректный URL' }));
    } else {
      setErrors((prev) => ({ ...prev, mainImageUrl: '' }));
    }

    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, mainImageUrl: '' }));

    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);

    setImagePreview('');
    setErrors((prev) => ({ ...prev, image: '', mainImageUrl: '' }));
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));

    if (name === 'autoSlug') {
      setAutoSlug(checked);
      if (checked && formData.name) {
        setFormData((prev) => ({ ...prev, slug: advancedSlugify(formData.name) }));
        setSlugModified(false);
      }
      return;
    }

    if (name === 'categoryIds') {
      setFormData((prev) => ({ ...prev, categoryIds: value ? [value] : [] }));
      return;
    }

    if (name === 'currencyCode') {
      setFormData((prev) => ({ ...prev, currencyCode: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) handleChange(e);
    } else {
      if (value === '' || /^\d+$/.test(value)) handleChange(e);
    }
  };

  const handleSlugChange = (e) => {
    const { value } = e.target;

    if (!slugModified && value !== advancedSlugify(formData.name)) {
      setSlugModified(true);
    }

    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleRegenerateSlug = () => {
    if (!formData.name) return;
    const newSlug = advancedSlugify(formData.name);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    setSlugModified(false);
    setAutoSlug(true);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const url = product ? `${API_BASE}/products/${product.id}` : `${API_BASE}/products`;
      const method = product ? 'PUT' : 'POST';

      let finalSlug = formData.slug?.trim();
      if (!finalSlug) finalSlug = advancedSlugify(formData.name);

      const currencyCode = (formData.currencyCode || 'USD').toString().trim().toUpperCase();

      const submitData = {
        name: formData.name.trim(),
        slug: finalSlug,
        articleNumber: formData.articleNumber?.trim() || null,
        price: parseFloat(formData.price),
        currencyCode,
        description: formData.description?.trim() || null,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : null,
        mainImageUrl: formData.mainImageUrl?.trim() || null
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: Не удалось сохранить товар`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);

      onSave?.(result);
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      setErrors((prev) => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    return [...categories].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categories]);

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2>{product ? 'Редактировать товар' : 'Добавить новый товар'}</h2>

          {errors.submit && <div className={styles.errorBanner}>{errors.submit}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Name */}
            <div className={styles.formGroup}>
              <label htmlFor="product-name">Название товара *</label>
              <input
                id="product-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Введите название товара (поддерживается кириллица)"
                disabled={loading}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <div id="name-error" className={styles.fieldError}>{errors.name}</div>}
            </div>

            {/* Slug */}
            <div className={styles.formGroup}>
              <div className={styles.slugHeader}>
                <label htmlFor="product-slug">URL (slug) *</label>
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
                  id="product-slug"
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  required
                  placeholder="avtomaticheski-iz-nazvaniya"
                  disabled={loading}
                  aria-describedby={errors.slug ? 'slug-error' : undefined}
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
                {formData.slug ? `URL: /product/${formData.slug}` : 'Slug будет сгенерирован из названия (поддерживается кириллица)'}
                {slugModified && ' (изменено вручную)'}
              </small>

              {errors.slug && <div id="slug-error" className={styles.fieldError}>{errors.slug}</div>}
            </div>

            {/* Article Number (unique in Prisma) */}
            <div className={styles.formGroup}>
              <label htmlFor="product-article">Артикул (articleNumber)</label>
              <input
                id="product-article"
                type="text"
                name="articleNumber"
                value={formData.articleNumber}
                onChange={handleChange}
                placeholder="Например: SKU-001 (уникально)"
                disabled={loading}
              />
              <small className={styles.helpText}>
                Артикул должен быть уникальным. Можно на латинице/цифрах (ENA — ок).
              </small>
            </div>

            {/* Currency */}
            <div className={styles.formGroup}>
              <label htmlFor="product-currency">Валюта *</label>
              <select
                id="product-currency"
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleChange}
                disabled={loading}
                aria-describedby={errors.currencyCode ? 'currency-error' : undefined}
              >
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CHF">CHF</option>
                <option value="GBP">GBP</option>
              </select>
              {errors.currencyCode && (
                <div id="currency-error" className={styles.fieldError}>
                  {errors.currencyCode}
                </div>
              )}
              <small className={styles.helpText}>ISO код из 3 букв (USD, EUR, CHF...)</small>
            </div>

            {/* Price */}
            <div className={styles.formGroup}>
              <label htmlFor="product-price">Цена *</label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleNumberChange}
                required
                placeholder="0.00"
                disabled={loading}
                aria-describedby={errors.price ? 'price-error' : undefined}
              />
              {errors.price && <div id="price-error" className={styles.fieldError}>{errors.price}</div>}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label htmlFor="product-description">Описание</label>
              <textarea
                id="product-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Описание товара (необязательно)"
                disabled={loading}
              />
            </div>

            {/* Stock + minStock */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="product-stock">Количество *</label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleNumberChange}
                  required
                  disabled={loading}
                  aria-describedby={errors.stock ? 'stock-error' : undefined}
                />
                {errors.stock && <div id="stock-error" className={styles.fieldError}>{errors.stock}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="product-minstock">Мин. запас *</label>
                <input
                  id="product-minstock"
                  type="number"
                  min="0"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleNumberChange}
                  required
                  disabled={loading}
                  aria-describedby={errors.minStock ? 'minstock-error' : undefined}
                />
                {errors.minStock && <div id="minstock-error" className={styles.fieldError}>{errors.minStock}</div>}
              </div>
            </div>

            {/* Category */}
            <div className={styles.formGroup}>
              <div className={styles.categoryHeader}>
                <label htmlFor="product-category">Категория</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(true)}
                  className={styles.addCategoryBtn}
                  disabled={loading}
                >
                  + Добавить категорию
                </button>
              </div>

              {categoriesLoading ? (
                <div className={styles.loadingText}>Загрузка категорий...</div>
              ) : categoryOptions.length > 0 ? (
                <>
                  <select
                    id="product-category"
                    name="categoryIds"
                    value={formData.categoryIds[0] || ''}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Без категории</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {errors.categories && <div className={styles.fieldError}>{errors.categories}</div>}
                </>
              ) : (
                <div className={styles.noCategories}>
                  <div className={styles.errorText}>Нет доступных категорий</div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(true)}
                    className={styles.addCategoryBtnInline}
                    disabled={loading}
                  >
                    Создать первую категорию
                  </button>
                </div>
              )}
            </div>

            {/* Image */}
            <div className={styles.formGroup}>
              <label>Изображение товара (необязательно)</label>

              {imagePreview && (
                <div className={styles.imagePreview}>
                  <div className={styles.imageContainer}>
                    <Image
                      src={imagePreview}
                      alt="Превью товара"
                      width={200}
                      height={200}
                      className={styles.previewImage}
                      onError={(e) => {
                        console.error('Изображение не загрузилось:', imagePreview);
                        try {
                          e.currentTarget.style.display = 'none';
                        } catch {}
                        setErrors((prev) => ({ ...prev, image: 'Не удалось загрузить изображение' }));
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={styles.removeImageBtn}
                    disabled={loading}
                  >
                    Удалить изображение
                  </button>
                </div>
              )}

              <div className={styles.uploadOptions}>
                <div className={styles.uploadOption}>
                  <label className={styles.uploadLabel}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={loading || uploading}
                      className={styles.fileInput}
                    />
                    <span className={styles.uploadButton}>
                      {uploading ? 'Загрузка...' : 'Загрузить изображение'}
                    </span>
                  </label>
                  <small>JPEG, PNG или WebP (макс. 5MB)</small>
                  {errors.image && <div className={styles.fieldError}>{errors.image}</div>}
                </div>

                <div className={styles.urlOption}>
                  <span className={styles.urlLabel}>Или введите URL изображения:</span>
                  <input
                    type="text"
                    name="mainImageUrl"
                    value={formData.mainImageUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className={styles.urlInput}
                    disabled={loading}
                    aria-describedby={errors.mainImageUrl ? 'url-error' : undefined}
                  />
                  {errors.mainImageUrl && (
                    <div id="url-error" className={styles.fieldError}>
                      {errors.mainImageUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.formActions}>
              <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
                Отмена
              </button>
              <button type="submit" disabled={loading || uploading} className={styles.saveBtn}>
                {loading ? 'Сохранение...' : (product ? 'Обновить товар' : 'Создать товар')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCategoryForm && (
        <CategoryForm onClose={() => setShowCategoryForm(false)} onSave={handleCategorySaved} />
      )}
    </>
  );
}
