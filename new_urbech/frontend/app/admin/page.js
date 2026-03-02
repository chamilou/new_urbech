'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_products: 0,
    total_orders: 0,
    total_customers: 0,
    low_stock_products: 0,
    recent_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить статистику');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <h1>Панель администратора</h1>
        <div className={styles.loading}>Загрузка статистики...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <h1>Панель администратора</h1>
        <div className={styles.error}>
          Ошибка загрузки статистики: {error}
          <button onClick={fetchStats} className={styles.retryBtn}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1>Панель администратора</h1>
      
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Всего товаров</h3>
          <p className={styles.number}>{stats.total_products}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Всего заказов</h3>
          <p className={styles.number}>{stats.total_orders}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Всего клиентов</h3>
          <p className={styles.number}>{stats.total_customers}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Мало на складе</h3>
          <p className={styles.number}>{stats.low_stock_products}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Заказы за 7 дней</h3>
          <p className={styles.number}>{stats.recent_orders}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Быстрые действия</h2>
        <div className={styles.actionButtons}>
          <Link href="/admin/products" className={styles.actionBtn}>
            Управление товарами
          </Link>
          <Link href="/admin/orders" className={styles.actionBtn}>
            Заказы
          </Link>
          <Link href="/admin/customers" className={styles.actionBtn}>
            Управление клиентами
          </Link>
          <Link href="/admin/blog" className={styles.actionBtn}>
            Управление блогом
          </Link>
          <Link href="/admin/categories" className={styles.actionBtn}>
            Управление категориями
          </Link>
          <Link href="/admin/settings/seo" className={styles.actionBtn}>
            Настройки карты сайта
          </Link>
        </div>
      </div>
    </div>
  );
}
