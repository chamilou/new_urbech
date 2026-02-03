'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './reset.module.css';
import Link from 'next/link';

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get('token');
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus({ type: 'error', message: 'Отсутствует токен сброса.' });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Пароли не совпадают.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Пароль должен быть не короче 8 символов.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    const result = await resetPassword(token, password);
    if (result.success) {
      setStatus({ type: 'success', message: 'Пароль обновлён. Теперь можно войти.' });
      setTimeout(() => router.push('/login'), 1200);
    } else {
      setStatus({ type: 'error', message: result.error || 'Не удалось обновить пароль.' });
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Новый пароль</h1>
        <p className={styles.lead}>Придумайте новый пароль для входа.</p>

        {status && (
          <div className={status.type === 'success' ? styles.notice : styles.error}>
            {status.message}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="password">Новый пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Минимум 8 символов"
          />

          <label htmlFor="confirm">Повторите пароль</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Повторите пароль"
          />

          <button type="submit" disabled={!token || loading}>
            {loading ? 'Обновляем…' : 'Сохранить пароль'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login">Вернуться ко входу</Link>
        </div>
      </div>
    </div>
  );
}
