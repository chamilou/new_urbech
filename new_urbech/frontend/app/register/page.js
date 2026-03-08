'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Memoized change handler
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Clear error when user starts typing
    if (error) setError('');
  }, [error]);

  // Validation function
  const validateForm = useCallback(() => {
    if (!formData.name.trim()) {
      return 'Имя обязательно для заполнения';
    }
    if (!formData.email.trim()) {
      return 'Email обязателен для заполнения';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Неверный формат email';
    }
    if (formData.password.length < 6) {
      return 'Пароль должен содержать не менее 6 символов';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Пароли не совпадают';
    }
    return null;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    // Validate all fields
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // register возвращает объект {success: boolean, data/error}
      const result = await register(
        formData.name, 
        formData.email, 
        formData.password
      );
      
      if (result.success) {
        // Успешная регистрация - перенаправляем на главную
         router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Ошибка регистрации - показываем сообщение
        setError(result.error || 'Ошибка регистрации. Пожалуйста, попробуйте снова.');
      }
    } catch (err) {
      setError(err.message || 'Ошибка регистрации. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // If authenticated, don't render the form while redirecting
  if (isAuthenticated) {
    return null;
  }

  // Helper to show field error
  const getFieldError = (fieldName) => {
    if (!touched[fieldName]) return null;
    
    switch (fieldName) {
      case 'name':
        return !formData.name.trim() ? 'Имя обязательно для заполнения' : null;
      case 'email':
        if (!formData.email.trim()) return 'Email обязателен для заполнения';
        if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Неверный формат email';
        return null;
      case 'password':
        if (formData.password.length < 6) return 'Пароль должен содержать не менее 6 символов';
        return null;
      case 'confirmPassword':
        if (formData.password !== formData.confirmPassword) return 'Пароли не совпадают';
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Создать аккаунт</h1>
        <p className={styles.subtitle}>Создайте аккаунт, чтобы оформлять заказы и управлять покупками</p>

        {error && (
          <div className={styles.error}>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="name">Имя и фамилия</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Введите имя и фамилию"
              className={getFieldError('name') ? styles.inputError : ''}
            />
            {getFieldError('name') && (
              <span className={styles.fieldError}>{getFieldError('name')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Адрес электронной почты</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Введите email"
              className={getFieldError('email') ? styles.inputError : ''}
            />
            {getFieldError('email') && (
              <span className={styles.fieldError}>{getFieldError('email')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Не менее 6 символов"
              minLength="6"
              className={getFieldError('password') ? styles.inputError : ''}
            />
            {getFieldError('password') && (
              <span className={styles.fieldError}>{getFieldError('password')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Подтвердите ваш пароль"
              minLength="6"
              className={getFieldError('confirmPassword') ? styles.inputError : ''}
            />
            {getFieldError('confirmPassword') && (
              <span className={styles.fieldError}>{getFieldError('confirmPassword')}</span>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span>
                Создание аккаунта<span className={styles.loadingDots}></span>
              </span>
            ) : (
              'Создать аккаунт'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Уже есть аккаунт?{' '}
            <Link href="/login" className={styles.link}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
