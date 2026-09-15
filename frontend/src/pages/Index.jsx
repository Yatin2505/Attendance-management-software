import React from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './ParentDashboard';

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  if (user?.role === 'parent') {
    return <ParentDashboard />;
  }

  return <Dashboard />;
};

export default Index;
