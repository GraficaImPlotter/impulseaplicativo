import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isProfileLoaded, hasRole, can, user } = useAuth();
  const location = useLocation();

  // Consider authenticated if we have a session OR a cached user profile (offline)
  const isEffectivelyAuthenticated = isAuthenticated || !!user;

  if (isLoading || (isEffectivelyAuthenticated && !isProfileLoaded)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-12 h-12 gradient-gold rounded-full" />
        </div>
      </div>
    );
  }

  if (!isEffectivelyAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission-based check (Primary)
  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Legacy Role-based check (Secondary)
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
