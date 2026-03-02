'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './forgot.module.css';
import Link from 'next/link';

export default function ForgotPasswordClient() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const result = await forgotPassword(email);
    if (result.success) {
      setStatus({ type: 'success', message: 'Если аккаунт существует, мы отправили письмо с инструкциями.' });
    } else {
      setStatus({ type: 'error', message: result.error || 'Не удалось отправить письмо.' });
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Восстановление доступа</h1>
        <p className={styles.lead}>Введите email, и мы отправим ссылку для сброса пароля.</p>

        {status && (
          <div className={status.type === 'success' ? styles.notice : styles.error}>
            {status.message}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="email">Электронная почта</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@mail.ru"
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Отправляем…' : 'Отправить ссылку'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login">Вернуться ко входу</Link>
        </div>
      </div>
    </div>
  );
}
