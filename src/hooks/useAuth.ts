import { useState, useEffect } from 'react';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('cms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('cms_token')
  );

  useEffect(() => {
    const onStorage = () => {
      const stored = localStorage.getItem('cms_user');
      setUser(stored ? JSON.parse(stored) : null);
      setToken(localStorage.getItem('cms_token'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_user');
    setUser(null);
    setToken(null);
    window.location.href = '/';
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    logout,
  };
}