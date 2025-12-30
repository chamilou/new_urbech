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
      return 'Name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Email is invalid';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
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
      
      console.log('Registration result:', result);
      
      if (result.success) {
        // Успешная регистрация - перенаправляем на главную
        router.push('/');
      } else {
        // Ошибка регистрации - показываем сообщение
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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
        return !formData.name.trim() ? 'Name is required' : null;
      case 'email':
        if (!formData.email.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email is invalid';
        return null;
      case 'password':
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        return null;
      case 'confirmPassword':
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join MyShop today and start shopping</p>

        {error && (
          <div className={styles.error}>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your full name"
              className={getFieldError('name') ? styles.inputError : ''}
            />
            {getFieldError('name') && (
              <span className={styles.fieldError}>{getFieldError('name')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
              className={getFieldError('email') ? styles.inputError : ''}
            />
            {getFieldError('email') && (
              <span className={styles.fieldError}>{getFieldError('email')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="At least 6 characters"
              minLength="6"
              className={getFieldError('password') ? styles.inputError : ''}
            />
            {getFieldError('password') && (
              <span className={styles.fieldError}>{getFieldError('password')}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm your password"
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
                Creating Account<span className={styles.loadingDots}></span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}