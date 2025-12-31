'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; // adjust path if yours differs
import styles from './verify.module.css';


export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerification, isAuthenticated, user } = useAuth();

  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  // If already logged in & verified, go home
  useEffect(() => {
    if (isAuthenticated && user?.isVerified) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const onVerify = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!code.trim()) {
      setError('Verification code is required');
      return;
    }

    setLoadingVerify(true);
    const result = await verifyEmail(email.trim(), code.trim());
    setLoadingVerify(false);

    if (result.success) {
      setStatusMsg(result.data?.message || 'Verified successfully!');
      // After verification backend returns token+user, AuthContext stores it.
      router.push('/');
    } else {
      setError(result.error || 'Verification failed');
    }
  };

  const onResend = async () => {
    setError('');
    setStatusMsg('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoadingResend(true);
    const result = await resendVerification(email.trim());
    setLoadingResend(false);

    if (result.success) {
      setStatusMsg(result.data?.message || 'Verification code sent.');
    } else {
      setError(result.error || 'Failed to resend verification code');
    }
  };

  return (
  <div className={styles.container}>
    <div className={styles.card}>
      <h1 className={styles.title}>Verify your email</h1>
      <p className={styles.subtitle}>
        Enter the 6-digit code we sent to your email.
      </p>

      {error && <div className={styles.alertError}>{error}</div>}
      {statusMsg && <div className={styles.alertSuccess}>{statusMsg}</div>}

      <form onSubmit={onVerify} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Verification code</label>
          <input
            className={`${styles.input} ${styles.codeInput}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            inputMode="numeric"
            placeholder="123456"
          />
        </div>

        <button
          type="submit"
          disabled={loadingVerify}
          className={styles.primaryButton}
        >
          {loadingVerify ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onResend}
          disabled={loadingResend}
          className={styles.secondaryButton}
        >
          {loadingResend ? 'Sending…' : 'Resend code'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className={styles.secondaryButton}
        >
          Back to login
        </button>
      </div>
    </div>
  </div>
);

}
