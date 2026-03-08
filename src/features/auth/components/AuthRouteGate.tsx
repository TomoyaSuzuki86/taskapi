import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthBootstrapScreen } from '@/features/auth/components/AuthBootstrapScreen';
import { AuthErrorScreen } from '@/features/auth/components/AuthErrorScreen';
import { useAuth } from '@/features/auth/useAuth';

export function AuthRouteGate() {
  const { errorMessage, status } = useAuth();

  if (status === 'loading') {
    return <AuthBootstrapScreen />;
  }

  if (status === 'error') {
    return (
      <AuthErrorScreen
        message={errorMessage ?? 'Authentication startup failed unexpectedly.'}
      />
    );
  }

  return <Outlet />;
}

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status !== 'authenticated') {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const auth = useAuth();
  const location = useLocation();
  const destination =
    typeof location.state?.from === 'string' ? location.state.from : '/';

  if (auth.status === 'authenticated') {
    return <Navigate replace to={destination} />;
  }

  return <Outlet />;
}
