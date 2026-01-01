
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
      console.error('Failed to fetch categories:', response.status);
      setErrors(prev => ({ ...prev, categories: 'Failed to load categories' }));
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    setErrors(prev => ({ ...prev, categories: 'Network error loading categories' }));
  } finally {
    setCategoriesLoading(false);
  }
};

 const handleCategorySaved = async (createdCategory) => {
  setShowCategoryForm(false);

  // refresh categories list
  await fetchCategories();

  // auto-select the new category (this is the UX part you're missing)
  if (createdCategory?.id) {
    setFormData(prev => ({
      ...prev,
      categoryIds: [createdCategory.id],
    }));
  }
};


  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Price must be a valid positive number';
      }
    }

    // Stock validation
    if (!formData.stock) {
      newErrors.stock = 'Stock is required';
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'Stock must be a valid positive number';
      }
    }

    // Min Stock validation
    if (!formData.minStock) {
      newErrors.minStock = 'Minimum stock is required';
    } else {
      const minStock = parseInt(formData.minStock);
      if (isNaN(minStock) || minStock < 0) {
        newErrors.minStock = 'Minimum stock must be a valid positive number';
      }
    }

    // Image URL validation (if provided)
    if (formData.mainImageUrl && !isValidUrl(formData.mainImageUrl)) {
      newErrors.mainImageUrl = 'Please enter a valid image URL';
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
        setErrors(prev => ({ ...prev, image: 'Failed to upload image' }));
        console.error('Image upload failed:', errorText);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({ ...prev, image: 'Network error during upload' }));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, or WebP)' }));
      return;
    }

    // File size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
      return;
    }

    // Clear previous errors
    setErrors(prev => ({ ...prev, image: '' }));

    // Create preview
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
    
    // Validate URL in real-time
    if (url && !isValidUrl(url)) {
      setErrors(prev => ({ ...prev, mainImageUrl: 'Please enter a valid URL' }));
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
    
    // Validate form before submission
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

      // Handle response
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: Failed to save product`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Cleanup
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      onSave(result);
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
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
    
    // Allow only numbers and decimal point for price
    if (name === 'price') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        handleChange(e);
      }
    } else {
      // For stock fields, allow only integers
      if (value === '' || /^\d+$/.test(value)) {
        handleChange(e);
      }
    }
  };

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          
          {/* Global error message */}
          {errors.submit && (
            <div className={styles.errorBanner}>
              {errors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Product Name */}
            <div className={styles.formGroup}>
              <label htmlFor="product-name">Product Name *</label>
              <input
                id="product-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
                disabled={loading}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <div id="name-error" className={styles.fieldError}>
                  {errors.name}
                </div>
              )}
            </div>

            {/* Price */}
            <div className={styles.formGroup}>
              <label htmlFor="product-price">Price *</label>
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

            {/* Description */}
            <div className={styles.formGroup}>
              <label htmlFor="product-description">Description</label>
              <textarea
                id="product-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Product description (optional)"
                disabled={loading}
              />
            </div>

            {/* Stock Fields */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="product-stock">Stock *</label>
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
                <label htmlFor="product-minstock">Min Stock *</label>
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

            {/* Category Selection */}
            <div className={styles.formGroup}>
              <div className={styles.categoryHeader}>
                <label htmlFor="product-category">Category</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(true)}
                  className={styles.addCategoryBtn}
                  disabled={loading}
                >
                  + Add New Category
                </button>
              </div>
              
              {categoriesLoading ? (
                <div className={styles.loadingText}>Loading categories...</div>
              ) : categories.length > 0 ? (
                <>
                  <select
                    id="product-category"
                    name="categoryIds"
                    value={formData.categoryIds[0] || ''}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">No Category</option>
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
                    No categories available
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryForm(true)}
                    className={styles.addCategoryBtnInline}
                    disabled={loading}
                  >
                    Create First Category
                  </button>
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div className={styles.formGroup}>
              <label>Product Image (Optional)</label>
              
              {imagePreview && (
                <div className={styles.imagePreview}>
                  <div className={styles.imageContainer}>
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      width={200}
                      height={200}
                      className={styles.previewImage}
                      onError={(e) => {
                        console.error('Image failed to load:', imagePreview);
                        e.target.style.display = 'none';
                        setErrors(prev => ({ ...prev, image: 'Failed to load image' }));
                      }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleRemoveImage}
                    className={styles.removeImageBtn}
                    disabled={loading}
                  >
                    Remove Image
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
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </span>
                  </label>
                  <small>JPEG, PNG, or WebP (max 5MB)</small>
                  {errors.image && (
                    <div className={styles.fieldError}>
                      {errors.image}
                    </div>
                  )}
                </div>

                <div className={styles.urlOption}>
                  <span className={styles.urlLabel}>Or enter image URL:</span>
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

            {/* Form Actions */}
            <div className={styles.formActions}>
              <button 
                type="button" 
                onClick={onClose}
                className={styles.cancelBtn}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || uploading}
                className={styles.saveBtn}
              >
                {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm
          onClose={() => setShowCategoryForm(false)}
          onSave={handleCategorySaved}
        />
      )}
    </>
  );
}