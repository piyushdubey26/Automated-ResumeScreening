import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccessDeniedPageProps {
  requiredRole?: 'seeker' | 'recruiter' | 'admin';
  message?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ requiredRole, message }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleTitle = (r?: string) => {
    if (r === 'admin') return 'Platform Administrator';
    if (r === 'recruiter') return 'Recruiter';
    if (r === 'seeker') return 'Job Seeker / Candidate';
    return 'Authorized User';
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 rounded-full filter blur-3xl"></div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Access Restricted
          </span>
          <h1 className="font-serif text-2xl font-bold text-white mt-2">
            Workspace Restricted
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {message || `You do not have authorization to access this area. This workspace is restricted to ${getRoleTitle(requiredRole)} accounts.`}
          </p>
        </div>

        {isAuthenticated && user && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-300">
            Current Account: <strong className="text-white">{user.name}</strong> ({user.userType} mode)
          </div>
        )}

        <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row gap-2 justify-center">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  if (user?.userType === 'recruiter') navigate('/recruiter');
                  else if (user?.userType === 'admin') navigate('/admin');
                  else navigate('/dashboard');
                }}
                className="w-full py-2.5 bg-[#a84c38] hover:bg-[#8e3f2e] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Go to Your Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Sign In with Different Account
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full py-2.5 bg-[#a84c38] hover:bg-[#8e3f2e] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Log In to Continue</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default AccessDeniedPage;
