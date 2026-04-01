import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Renders children only if logged-in user has the required role.
 * Otherwise redirects to "/" (dashboard).
 */
const RoleRoute = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default RoleRoute;
