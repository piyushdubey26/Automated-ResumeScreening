import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Zap, Users, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect');

  const handleRedirect = (role?: string) => {
    if (redirectTarget) {
      navigate(redirectTarget);
    } else if (role === 'admin' || email.includes('admin')) {
      navigate('/admin');
    } else if (role === 'recruiter' || email.includes('recruiter')) {
      navigate('/recruiter');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    try {
      await login(email, password);
      handleRedirect();
    } catch {
      setError('Authentication failed. Try demo login.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back to ResumeAI</h2>
          <p className="text-xs text-slate-400">Sign in to access your role rubrics, JD matcher, and career tools.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* 1-CLICK DEMO BUTTONS */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">Fast 1-Click Demo Login</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                await demoLogin('seeker');
                handleRedirect('seeker');
              }}
              className="p-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-2xl text-xs font-bold text-indigo-300 transition-all flex flex-col items-center justify-center space-y-1 shadow cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Demo Seeker</span>
            </button>

            <button
              onClick={async () => {
                await demoLogin('recruiter');
                handleRedirect('recruiter');
              }}
              className="p-3 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 rounded-2xl text-xs font-bold text-purple-300 transition-all flex flex-col items-center justify-center space-y-1 shadow cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Demo Recruiter</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Or Account Login</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.rivera@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
