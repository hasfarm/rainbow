import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-foreground-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}