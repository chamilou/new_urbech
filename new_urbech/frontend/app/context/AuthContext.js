'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

/**
 * Safely read response body ONCE and try to parse JSON only when possible.
 * Never throws.
 */
const readJsonSafe = async (response) => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const trimmed = (text || '').trim();

  if (!trimmed) {
    return { text: '', json: null };
  }

  const looksLikeJson =
    trimmed.startsWith('{') || trimmed.startsWith('[');

  const canParseJson =
    contentType.includes('application/json') || looksLikeJson;

  if (!canParseJson) {
    return { text, json: null };
  }

  try {
    return { text, json: JSON.parse(trimmed) };
  } catch {
    return { text, json: null };
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* --------------------------------------------------
   * INITIAL LOAD
   * -------------------------------------------------- */
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    checkAuth();
  }, []);

  /* --------------------------------------------------
   * CHECK AUTH
   * -------------------------------------------------- */
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { text, json } = await readJsonSafe(response);

      if (response.ok && json) {
        setUser(json);
        localStorage.setItem('user', JSON.stringify(json));
      } else {
        console.error('❌ Auth check failed:', text);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (err) {
      console.error('❌ Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
   * LOGIN
   * -------------------------------------------------- */
  const login = async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      const { text, json } = await readJsonSafe(response);

      if (!response.ok) {
        return {
          success: false,
          error:
            json?.detail ||
            json?.message ||
            `Login failed (${response.status}): ${text.slice(0, 200)}`,
        };
      }

      if (!json?.user || !json?.access_token) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      localStorage.setItem('token', json.access_token);
      localStorage.setItem('user', JSON.stringify(json.user));
      setUser(json.user);

      return { success: true, data: json };
    } catch (err) {
      console.error('❌ Login error:', err);
      return { success: false, error: 'Network error' };
    }
  };

  /* --------------------------------------------------
   * REGISTER
   * -------------------------------------------------- */
 const register = async (name, email, password, phone, address, companyInfo) => {
  console.log('🔐 Register attempt for:', email);
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        email, 
        password,
        phone: phone || '',
        address: address || '',
        company_info: companyInfo || null
      })
    });

    console.log('🔐 Response status:', response.status);
    
    // Всегда получаем как текст
    const text = await response.text();
    console.log('🔐 Response text (preview):', text.substring(0, 300));
    
    // Проверяем что это JSON
    const isJson = response.headers.get('content-type')?.includes('application/json');
    
    if (response.ok && isJson) {
      try {
        const data = JSON.parse(text);
        console.log('✅ Registration successful:', data.user?.email);
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        return { success: true, data };
      } catch (e) {
        console.error('❌ Failed to parse success JSON:', e);
        return { success: false, error: 'Server returned invalid data' };
      }
    } else {
      // Обработка ошибок
      let errorMsg = `Registration failed (${response.status})`;
      
      if (text && isJson) {
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch (e) {
          // Не JSON ошибка
          if (text.includes('Internal Server Error')) {
            errorMsg = 'Internal server error - please try again later';
          } else if (text.includes('<html') || text.includes('<!DOCTYPE')) {
            errorMsg = 'Server error - returned HTML instead of JSON';
          }
        }
      }
      
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('🔐 Network error:', error);
    return { success: false, error: 'Network error - check your connection' };
  }
};
  /* --------------------------------------------------
   * LOGOUT
   * -------------------------------------------------- */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* --------------------------------------------------
 * HOOK
 * -------------------------------------------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
