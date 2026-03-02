'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Change this if your backend is mounted differently.
// If your FastAPI routes are /api/auth/*, keep "/api".
// If they are /auth/*, set API_BASE = "".
const API_BASE = '/api';

const normalizeError = (err) => {
  if (!err) return 'Неизвестная ошибка';

  if (typeof err === 'string') return err;

  // FastAPI style: { detail: ... }
  if (err.detail !== undefined) {
    const d = err.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(', ');
    if (typeof d === 'object' && d) return d.msg || JSON.stringify(d);
  }

  // Pydantic array directly
  if (Array.isArray(err)) {
    return err.map((e) => e?.msg || JSON.stringify(e)).join(', ');
  }

  // Generic object
  if (typeof err === 'object') {
    return err.msg || err.message || JSON.stringify(err);
  }

  return String(err);
};

/**
 * Read response body ONCE and attempt JSON parse safely.
 */
const readJsonSafe = async (response) => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const trimmed = (text || '').trim();

  if (!trimmed) return { text: '', json: null };

  const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  const canParseJson = contentType.includes('application/json') || looksLikeJson;

  if (!canParseJson) return { text, json: null };

  try {
    return { text, json: JSON.parse(trimmed) };
  } catch {
    return { text, json: null };
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  const isVerified = !!user?.isVerified;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { text, json } = await readJsonSafe(res);

      if (!res.ok || !json) {
        console.error('❌ Auth check failed:', res.status, text);
        logout();
        return;
      }

      setUser(json);
      localStorage.setItem('user', JSON.stringify(json));
    } catch (e) {
      console.error('❌ Auth check error:', e);
      logout();
    }
  }, [logout]);

  // Initial load: hydrate from storage, then validate with server
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    (async () => {
      await checkAuth();
      setLoading(false);
    })();
  }, [checkAuth]);

  /**
   * LOGIN (expects backend JSON body { email, password })
   * Returns: { access_token, token_type, user }
   */
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const { text, json } = await readJsonSafe(res);

      if (!res.ok) {
        return {
          success: false,
          error: normalizeError(json || text || `Ошибка входа (${res.status})`),
          status: res.status,
          verificationRequired: res.status === 403 && res.headers.get('X-Verification-Required') === 'true',
        };
      }

      if (!json?.access_token || !json?.user) {
        return { success: false, error: 'Некорректный ответ от сервера' };
      }

      localStorage.setItem('token', json.access_token);
      localStorage.setItem('user', JSON.stringify(json.user));
      setUser(json.user);

      return { success: true, data: json };
    } catch (e) {
      console.error('❌ Login error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }, []);

  /**
   * REGISTER (expects backend JSON body { name, email, password })
   * Backend returns: { message, requiresVerification, user }
   * IMPORTANT: no token stored here.
   */
  const register = useCallback(async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const { text, json } = await readJsonSafe(res);

      if (!res.ok) {
        return {
          success: false,
          error: normalizeError(json || text || `Ошибка регистрации (${res.status})`),
          status: res.status,
        };
      }

      // Do not set token/user yet (verification required)
      return { success: true, data: json };
    } catch (e) {
      console.error('❌ Register error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }, []);

  /**
   * VERIFY EMAIL (expects backend JSON { email, code })
   * Backend returns token + user on success -> we store token and user
   */
  const verifyEmail = useCallback(async (email, code) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const { text, json } = await readJsonSafe(res);

      if (!res.ok) {
        return {
          success: false,
          error: normalizeError(json || text || `Ошибка подтверждения (${res.status})`),
          status: res.status,
        };
      }

      // Should return token + user
      if (json?.access_token && json?.user) {
        localStorage.setItem('token', json.access_token);
        localStorage.setItem('user', JSON.stringify(json.user));
        setUser(json.user);
      }

      return { success: true, data: json };
    } catch (e) {
      console.error('❌ Verify error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }, []);

  /**
   * FORGOT PASSWORD (expects backend JSON { email })
   * Backend responds 200 with generic message.
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });

      const { text, json } = await readJsonSafe(res);
      if (!res.ok) {
        return {
          success: false,
          error: normalizeError(json || text || `Ошибка запроса (${res.status})`),
          status: res.status,
        };
      }

      return { success: true, data: json };
    } catch (e) {
      console.error('❌ Forgot password error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }, []);

  /**
   * RESET PASSWORD (expects backend JSON { token, password })
   */
  const resetPassword = useCallback(async (token, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const { text, json } = await readJsonSafe(res);
      if (!res.ok) {
        return {
          success: false,
          error: normalizeError(json || text || `Ошибка сброса пароля (${res.status})`),
          status: res.status,
        };
      }

      return { success: true, data: json };
    } catch (e) {
      console.error('❌ Reset password error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }, []);

  /**
   * RESEND VERIFICATION CODE (expects JSON { email })
   */
  const resendVerification = useCallback(async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });

      const { text, json } = await readJsonSafe(res);

      if (!res.ok) {
        return {
          success: false,
          error: normalizeError(json || text || `Ошибка повторной отправки (${res.status})`),
          status: res.status,
        };
      }

      return { success: true, data: json };
    } catch (e) {
      console.error('❌ Resend error:', e);
      return { success: false, error: 'Ошибка сети' };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      isVerified,
      login,
      register,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      checkAuth,
      logout,
    }),
    [user, loading, isAuthenticated, isVerified, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, checkAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
