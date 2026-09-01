import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';

export function useAuthFormViewModel() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const toggleMode = useCallback(() => {
    setIsLogin((prev) => !prev);
    setError('');
  }, []);

  const handleSubmit = useCallback(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Display name is required');
          setIsLoading(false);
          return;
        }
        await register(email, password, displayName.trim());
      }
      navigate('/menu');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isLogin, email, password, displayName, login, register, navigate]);

  const getButtonLabel = () => {
    if (isLoading) return 'Loading...';
    return isLogin ? 'Login' : 'Register';
  };
  const buttonLabel = getButtonLabel();

  return {
    state: {
      isLogin,
      email,
      password,
      displayName,
      error,
      isLoading,
      buttonLabel,
    },
    actions: {
      setEmail,
      setPassword,
      setDisplayName,
      toggleMode,
      handleSubmit,
    },
  };
}
