import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth';

export function useMainMenuViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [error, setError] = useState<string | null>(() => {
    const state = location.state as { error?: unknown } | null;
    return typeof state?.error === 'string' ? state.error : null;
  });

  useEffect(() => {
    if (!error) return;

    navigate(location.pathname, { replace: true, state: null });
    const timeoutId = window.setTimeout(() => setError(null), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [error, location.pathname, navigate]);

  const startPublicGame = useCallback(() => {
    navigate('/board-size');
  }, [navigate]);

  const startPrivateGame = useCallback(() => {
    navigate('/board-size', { state: { privateGame: true } });
  }, [navigate]);

  const startBotGame = useCallback(() => {
    navigate('/board-size', { state: { botGame: true } });
  }, [navigate]);

  const viewLeaderboard = useCallback(() => {
    navigate('/leaderboard');
  }, [navigate]);

  const viewStatistics = useCallback(() => {
    navigate('/statistics');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    state: {
      displayName: user?.displayName ?? 'Guest',
      error,
    },
    actions: {
      startPublicGame,
      startPrivateGame,
      startBotGame,
      viewLeaderboard,
      viewStatistics,
      handleLogout,
    },
  };
}
