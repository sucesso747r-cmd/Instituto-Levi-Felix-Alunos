import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSensei?: boolean;
}

export default function ProtectedRoute({ children, requireSensei = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation('/');
      return;
    }
    if (requireSensei && !user.is_sensei) {
      setLocation('/home');
    }
  }, [isLoading, user, requireSensei, setLocation]);

  if (isLoading) return null;
  if (!user) return null;
  if (requireSensei && !user.is_sensei) return null;

  return <>{children}</>;
}
