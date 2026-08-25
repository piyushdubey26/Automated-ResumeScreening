import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
              <Navbar />
              <div className="flex-1">
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* PROTECTED SEEKER DASHBOARD */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={['seeker']}>
                          <DashboardPage />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* PROTECTED RECRUITER HUB */}
                  <Route
                    path="/recruiter"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={['recruiter']}>
                          <RecruiterDashboardPage />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* PROTECTED ADMIN DASHBOARD */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={['admin']}>
                          <AdminDashboardPage />
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* FALLBACK */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
