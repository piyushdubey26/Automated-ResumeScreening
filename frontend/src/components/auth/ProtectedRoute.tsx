import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const intendedPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${intendedPath}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
