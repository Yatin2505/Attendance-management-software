import React from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  return <Dashboard />;
};

export default Index;
