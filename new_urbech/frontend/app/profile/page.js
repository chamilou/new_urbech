'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setLocalUser(JSON.parse(savedUser));
    }
  }, []);

  // Use cached user data if available, even if context is loading
  const displayUser = user || localUser;
  const displayIsAuthenticated = isAuthenticated || !!localUser;

  // Only redirect if definitely not authenticated after loading
  useEffect(() => {
    if (!loading && !displayIsAuthenticated) {
      console.log('❌ No auth found, redirecting to login');
      router.push('/login');
    }
  }, [loading, displayIsAuthenticated, router]);

  if (loading && !displayUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка профиля...</div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Перенаправление на страницу входа...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Ваш профиль</h1>
        <div className={styles.profileInfo}>
          <div className={styles.infoRow}>
            <label>Имя:</label>
            <span>{displayUser.name}</span>
          </div>
          <div className={styles.infoRow}>
            <label>Email:</label>
            <span>{displayUser.email}</span>
          </div>
          <div className={styles.infoRow}>
            <label>Роль:</label>
            <span>{displayUser.role}</span>
          </div>
          <div className={styles.note}>
            <small>Используются {user ? 'актуальные' : 'сохранённые'} данные пользователя</small>
          </div>
        </div>
      </div>
    </div>
  );
}
