'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    console.log('🔐 AuthProvider mount - savedUser:', savedUser ? 'Yes' : 'No', 'savedToken:', savedToken ? 'Yes' : 'No');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔐 Loading user from localStorage:', userData.email);
        setUser(userData);
        // Don't checkAuth immediately - use the cached user first for better UX
        setLoading(false);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    console.log('🔐 checkAuth called');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔐 No token found');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('🔐 Making auth check request with token...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔐 Auth check response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Auth successful, user:', userData.email);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else if (response.status === 422) {
        // Token validation error - don't clear immediately, could be temporary
        console.log('⚠️ Token validation error (422), but keeping user data for now');
        // Keep the existing user state, but mark as needing revalidation
      } else {
        console.log('❌ Auth check failed with status:', response.status);
        // Only clear on definite auth failures (401, 403, etc.)
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('🔐 Auth check failed:', error);
      // Don't clear on network errors - could be temporary
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Login attempt for:', email);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData
      });

      console.log('🔐 Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful, user:', data.user.email);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, data };
      } else {
        const errorData = await response.json();
        console.log('❌ Login failed:', errorData);
        return { success: false, error: errorData.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('🔐 Login network error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (name, email, password) => {
    console.log('🔐 Register attempt for:', email);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      console.log('🔐 Register response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Register successful, user:', data.user.email);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, data };
      } else {
        const errorData = await response.json();
        console.log('❌ Register failed:', errorData);
        return { success: false, error: errorData.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('🔐 Register network error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    console.log('🔐 Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};