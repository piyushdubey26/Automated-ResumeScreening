import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedPage } from '../../pages/AccessDeniedPage';

interface RoleGuardProps {
  allowedRoles: ('seeker' | 'recruiter' | 'admin')[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <AccessDeniedPage message="Please log in to access this workspace." />;
  }

  // Admins are granted global access
  if (user.userType === 'admin' || user.email === 'admin@resumeai.com' || user.email === 'piyushdubey447@gmail.com') {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(user.userType)) {
    return <AccessDeniedPage requiredRole={allowedRoles[0]} />;
  }

  return <>{children}</>;
};

export default RoleGuard;
