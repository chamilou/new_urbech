'use client';
import { useState, useEffect } from 'react';
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
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <h1>Admin Dashboard</h1>
        <div className={styles.loading}>Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <h1>Admin Dashboard</h1>
        <div className={styles.error}>
          Error loading stats: {error}
          <button onClick={fetchStats} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1>Admin Dashboard</h1>
      
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Products</h3>
          <p className={styles.number}>{stats.total_products}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Total Orders</h3>
          <p className={styles.number}>{stats.total_orders}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Total Customers</h3>
          <p className={styles.number}>{stats.total_customers}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Low Stock Products</h3>
          <p className={styles.number}>{stats.low_stock_products}</p>
        </div>
        
        <div className={styles.statCard}>
          <h3>Orders (Last 7 Days)</h3>
          <p className={styles.number}>{stats.recent_orders}</p>
        </div>
        
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionButtons}>
          <a href="/admin/products" className={styles.actionBtn}>
            Manage Products
          </a>
          <a href="/admin/orders" className={styles.actionBtn}>
            View Orders
          </a>
          <a href="/admin/customers" className={styles.actionBtn}>
            Manage Customers
          </a>
          <a href="/admin/categories" className={styles.actionBtn}>
            Manage Categories
          </a>
          <a href="/admin/settings/seo" className={styles.actionBtn}>
  Sitemap Settings
</a>

        </div>
      </div>
    </div>
  );
}