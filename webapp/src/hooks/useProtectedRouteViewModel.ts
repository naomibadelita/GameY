import { useAuth } from '../Auth';

export interface ProtectedRouteState {
  isLoading: boolean;
  canAccess: boolean;
  redirectTo: string;
}

export function useProtectedRouteViewModel(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    state: {
      isLoading,
      canAccess: isAuthenticated,
      redirectTo,
    },
  };
}
