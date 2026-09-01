import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useProtectedRouteViewModel } from './hooks/useProtectedRouteViewModel';

interface ProtectedRouteProps {
  readonly children: ReactNode;
  readonly redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { state } = useProtectedRouteViewModel(redirectTo);

  if (state.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!state.canAccess) {
    return <Navigate to={state.redirectTo} replace />;
  }

  return <>{children}</>;
}
