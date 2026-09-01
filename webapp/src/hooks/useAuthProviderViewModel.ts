import { useState, useEffect, useCallback, useMemo } from 'react';
import { authService, type User } from '../services/authService';

export function useAuthProviderViewModel() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
      }
    } catch (e) {
      console.error('Failed to parse stored user session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    const userData: User = {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const data = await authService.register(email, password, displayName);
    const userData: User = {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }, []);

  return useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout]
  );
}
