import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sparkles,
  FileSearch,
  Users,
  Sun,
  Moon,
  LogOut,
  Zap,
  ChevronRight,
  Shield,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'py-2 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl'
        : 'py-4 bg-slate-950/60 backdrop-blur-sm border-b border-slate-800/40'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
                ResumeAI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                2.0
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">Automated Screening Ecosystem</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-full border border-slate-800">
          <Link
            to="/"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isCurrent('/') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Home
          </Link>
          <Link
            to="/features"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isCurrent('/features') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isCurrent('/pricing') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Pricing
          </Link>
          {isAuthenticated && (
            <>
              {user?.userType === 'seeker' && (
                <Link
                  to="/dashboard"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center space-x-1.5 transition-all ${
                    isCurrent('/dashboard') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileSearch className="w-4 h-4 text-indigo-400" />
                  <span>Seeker Dashboard</span>
                </Link>
              )}
              {user?.userType === 'recruiter' && (
                <Link
                  to="/recruiter"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center space-x-1.5 transition-all ${
                    isCurrent('/recruiter') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Recruiter Hub</span>
                </Link>
              )}
              {user?.userType === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center space-x-1.5 transition-all ${
                    isCurrent('/admin') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Admin</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right Actions & User Bar */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Switch */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span
                className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </span>
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-white">{user?.name}</span>
                <span className="text-[11px] text-slate-400 capitalize flex items-center justify-end space-x-1">
                  <span className={`w-2 h-2 rounded-full ${user?.userType === 'recruiter' ? 'bg-purple-400' : 'bg-emerald-400'}`}></span>
                  <span>{user?.userType} Mode</span>
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Demo Logins Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 rounded-xl hover:bg-indigo-900/80 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Demo Logins</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shadow-xl z-50">
                    <button
                      onClick={() => demoLogin('seeker')}
                      className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-left cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Demo Seeker</span>
                    </button>
                    <button
                      onClick={() => demoLogin('recruiter')}
                      className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-left cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Demo Recruiter</span>
                    </button>
                    <button
                      onClick={async () => {
                        await demoLogin('admin');
                        navigate('/admin');
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-left cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Demo Admin</span>
                    </button>
                  </div>
                )}
              </div>

              <Link
                to="/login"
                className="inline-flex items-center space-x-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all"
              >
                <span>Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
