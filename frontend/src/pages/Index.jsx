import React from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import TeacherDashboard from './TeacherDashboard';

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  return <Dashboard />;
};

export default Index;
