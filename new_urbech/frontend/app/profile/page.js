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
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Your Profile</h1>
        <div className={styles.profileInfo}>
          <div className={styles.infoRow}>
            <label>Name:</label>
            <span>{displayUser.name}</span>
          </div>
          <div className={styles.infoRow}>
            <label>Email:</label>
            <span>{displayUser.email}</span>
          </div>
          <div className={styles.infoRow}>
            <label>Role:</label>
            <span>{displayUser.role}</span>
          </div>
          <div className={styles.note}>
            <small>Using {user ? 'context' : 'cached'} user data</small>
          </div>
        </div>
      </div>
    </div>
  );
}