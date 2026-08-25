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
  ChevronRight,
  Shield,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, switchMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    <header className={`site-header sticky top-0 z-50 transition-all duration-300 ${
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
              {(user?.userType === 'admin' || user?.email === 'admin@resumeai.com' || user?.email === 'piyushdubey447@gmail.com') && (
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

          {isAuthenticated ? (
            /* Profile Dropdown Toggle */
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                onBlur={() => setTimeout(() => setProfileOpen(false), 200)}
                className="profile-trigger flex items-center space-x-2.5 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer text-left focus:outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block pr-1">
                  <p className="text-sm font-semibold text-slate-100 leading-none mb-0.5">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize leading-none">{user?.userType} Mode</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 text-slate-200">
                  {/* Header: Profile info */}
                  <div className="p-3 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">{user?.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                        {user?.userType} Mode
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-800 my-1" />

                  {/* Dark/Light mode toggle switch row */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTheme();
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs font-medium text-slate-300">Dark Mode</span>
                    </div>
                    {/* Switch */}
                    <div className="pointer-events-none">
                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
                          theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                            theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mode switcher option - Only for Platform Admins */}
                  {(user?.userType === 'admin' || user?.email === 'admin@resumeai.com' || user?.email === 'piyushdubey447@gmail.com') && (
                    <>
                      <hr className="border-slate-800 my-1" />
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Switch Mode (Admin Only)</p>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                          <button
                            onClick={() => {
                              switchMode('seeker');
                              navigate('/dashboard');
                            }}
                            className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              user?.userType === 'seeker'
                                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Candidate
                          </button>
                          <button
                            onClick={() => {
                              switchMode('recruiter');
                              navigate('/recruiter');
                            }}
                            className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              user?.userType === 'recruiter'
                                ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Recruiter
                          </button>
                          <button
                            onClick={() => {
                              switchMode('admin');
                              navigate('/admin');
                            }}
                            className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all text-center cursor-pointer ${
                              user?.userType === 'admin'
                                ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <hr className="border-slate-800 my-1" />

                  {/* Sign Out Button */}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Log In
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all"
              >
                <span>Get Started</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
