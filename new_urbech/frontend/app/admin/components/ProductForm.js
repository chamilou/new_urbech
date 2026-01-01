'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import CategoryForm from './CategoryForm';
import styles from './ProductForm.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function ProductForm({ product, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    minStock: '5',
    categoryIds: [],
    mainImageUrl: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        description: product.description || '',
        stock: product.stock?.toString() || '',
        minStock: product.minStock?.toString() || '5',
        categoryIds: product.categories?.map(cat => cat.categoryId) || [],
        mainImageUrl: product.mainImageUrl || ''
      });
      if (product.mainImageUrl) {
        setImagePreview(product.mainImageUrl);
      }
    }
    fetchCategories();
  }, [product]);

 const fetchCategories = async () => {
  setCategoriesLoading(true);
  try {
    const response = await fetch(`${API_BASE}/categories?includeParent=true&limit=500`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const categoriesData = await response.json();
      setCategories(categoriesData);
    } else {
      console.error('Ошибка загрузки категорий:', response.status);
      setErrors(prev => ({ ...prev, categories: 'Не удалось загрузить категории' }));
    }
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    setErrors(prev => ({ ...prev, categories: 'Ошибка сети при загрузке категорий' }));
  } finally {
    setCategoriesLoading(false);
  }
};

 const handleCategorySaved = async (createdCategory) => {
  setShowCategoryForm(false);

  // Обновить список категорий
  await fetchCategories();

  // Автоматически выбрать новую категорию
  if (createdCategory?.id) {
    setFormData(prev => ({
      ...prev,
      categoryIds: [createdCategory.id],
    }));
  }
};


  const validateForm = () => {
    const newErrors = {};

    // Валидация названия
    if (!formData.name.trim()) {
      newErrors.name = 'Название товара обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно быть не менее 2 символов';
    }

    // Валидация цены
    if (!formData.price) {
      newErrors.price = 'Цена обязательна';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Цена должна быть положительным числом';
      }
    }

    // Валидация количества
    if (!formData.stock) {
      newErrors.stock = 'Количество обязательно';
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'Количество должно быть положительным числом';
      }
    }

    // Валидация минимального запаса
    if (!formData.minStock) {
      newErrors.minStock = 'Минимальный запас обязателен';
    } else {
      const minStock = parseInt(formData.minStock);
      if (isNaN(minStock) || minStock < 0) {
        newErrors.minStock = 'Минимальный запас должен быть положительным числом';
      }
    }

    // Валидация URL изображения (если указан)
    if (formData.mainImageUrl && !isValidUrl(formData.mainImageUrl)) {
      newErrors.mainImageUrl = 'Введите корректный URL изображения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    setErrors(prev => ({ ...prev, image: '' }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/uploads/products', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const result = await response.json();
        const imageUrl = `http://localhost:8000${result.url}`;
        
        setFormData(prev => ({
          ...prev,
          mainImageUrl: imageUrl
        }));
        setImagePreview(imageUrl);
      } else {
        const errorText = await response.text();
        setErrors(prev => ({ ...prev, image: 'Не удалось загрузить изображение' }));
        console.error('Ошибка загрузки изображения:', errorText);
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      setErrors(prev => ({ ...prev, image: 'Ошибка сети при загрузке' }));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Выберите допустимый файл изображения (JPEG, PNG или WebP)' }));
      return;
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Размер изображения должен быть менее 5MB' }));
      return;
    }

    // Очистить предыдущие ошибки
    setErrors(prev => ({ ...prev, image: '' }));

    // Создать превью
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    handleImageUpload(file);
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      mainImageUrl: url
    }));
    
    // Валидация URL в реальном времени
    if (url && !isValidUrl(url)) {
      setErrors(prev => ({ ...prev, mainImageUrl: 'Введите корректный URL' }));
    } else {
      setErrors(prev => ({ ...prev, mainImageUrl: '' }));
    }
    
    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      mainImageUrl: ''
    }));
    setImagePreview('');
    setErrors(prev => ({ ...prev, image: '', mainImageUrl: '' }));
    
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация формы перед отправкой
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const url = product 
        ? `${API_BASE}/products/${product.id}`
        : `${API_BASE}/products`;
      
      const method = product ? 'PUT' : 'POST';

      const submitData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        currencyCode: 'USD',
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

      // Обработка ответа
      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: Не удалось сохранить товар`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Если ответ не JSON, использовать текст статуса
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Очистка
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      onSave(result);
    } catch (error) {
      console.error('Ошибка сохранения товара:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Очистить ошибку при начале ввода
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'categoryIds') {
      setFormData(prev => ({
        ...prev,
        categoryIds: value ? [value] : []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    
    // Разрешить только цифры и точку для цены
    if (name === 'price') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        handleChange(e);
      }
    } else {
      // Для полей количества разрешить только целые числа
      if (value === '' || /^\d+$/.test(value)) {
        handleChange(e);
      }
    }
  };

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2>{product ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
          
          {/* Глобальное сообщение об ошибке */}
          {errors.submit && (
            <div className={styles.errorBanner}>
              {errors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Название товара */}
            <div className={styles.formGroup}>
              <label htmlFor="product-name">Название товара *</label>
              <input
                id="product-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Введите название товара"
                disabled={loading}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <div id="name-error" className={styles.fieldError}>
                  {errors.name}
                </div>
              )}
            </div>

            {/* Цена */}
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
                aria-describedby={errors.price ? "price-error" : undefined}
              />
              {errors.price && (
                <div id="price-error" className={styles.fieldError}>
                  {errors.price}
                </div>
              )}
            </div>

            {/* Описание */}
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

            {/* Поля количества */}
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
                  aria-describedby={errors.stock ? "stock-error" : undefined}
                />
                {errors.stock && (
                  <div id="stock-error" className={styles.fieldError}>
                    {errors.stock}
                  </div>
                )}
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
                  aria-describedby={errors.minStock ? "minstock-error" : undefined}
                />
                {errors.minStock && (
                  <div id="minstock-error" className={styles.fieldError}>
                    {errors.minStock}
                  </div>
                )}
              </div>
            </div>

            {/* Выбор категории */}
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
              ) : categories.length > 0 ? (
                <>
                  <select
                    id="product-category"
                    name="categoryIds"
                    value={formData.categoryIds[0] || ''}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Без категории</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categories && (
                    <div className={styles.fieldError}>
                      {errors.categories}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noCategories}>
                  <div className={styles.errorText}>
                    Нет доступных категорий
                  </div>
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

            {/* Секция загрузки изображения */}
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
                        e.target.style.display = 'none';
                        setErrors(prev => ({ ...prev, image: 'Не удалось загрузить изображение' }));
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
                  {errors.image && (
                    <div className={styles.fieldError}>
                      {errors.image}
                    </div>
                  )}
                </div>

                <div className={styles.urlOption}>
                  <span className={styles.urlLabel}>Или введите URL изображения:</span>
                  <input
                    type="url"
                    name="mainImageUrl"
                    value={formData.mainImageUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/image.jpg"
                    className={styles.urlInput}
                    disabled={loading}
                    aria-describedby={errors.mainImageUrl ? "url-error" : undefined}
                  />
                  {errors.mainImageUrl && (
                    <div id="url-error" className={styles.fieldError}>
                      {errors.mainImageUrl}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Действия формы */}
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
                disabled={loading || uploading}
                className={styles.saveBtn}
              >
                {loading ? 'Сохранение...' : (product ? 'Обновить товар' : 'Создать товар')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Модальное окно формы категории */}
      {showCategoryForm && (
        <CategoryForm
          onClose={() => setShowCategoryForm(false)}
          onSave={handleCategorySaved}
        />
      )}
    </>
  );
}