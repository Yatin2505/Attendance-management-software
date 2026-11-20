import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import MainLayout from './layouts/MainLayout';

// Code-splitting with dynamic lazy loading for sub-second initial bundle
const Index = lazy(() => import('./pages/Index'));
const Students = lazy(() => import('./pages/Students'));
const Batches = lazy(() => import('./pages/Batches'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Reports = lazy(() => import('./pages/Reports'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const Fees = lazy(() => import('./pages/Fees'));
const StudentFees = lazy(() => import('./pages/StudentFees'));
const Institutes = lazy(() => import('./pages/Institutes'));

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="w-8 h-8 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"    element={<Login />} />
            {/* Public registration is now disabled for SaaS model */}
            <Route path="/register" element={<Navigate to="/login" replace />} />

            <Route path="/" element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index           element={<Index />} />
              <Route path="students" element={<RoleRoute role={['superadmin', 'admin', 'teacher']}><Students /></RoleRoute>} />
              <Route path="batches"  element={<RoleRoute role={['superadmin', 'admin', 'teacher']}><Batches /></RoleRoute>} />
              <Route path="attendance" element={<RoleRoute role={['superadmin', 'admin', 'teacher']}><Attendance /></RoleRoute>} />
              <Route path="leave"      element={<RoleRoute role={['superadmin', 'admin', 'teacher']}><LeaveManagement /></RoleRoute>} />
              <Route path="profile"  element={<Profile />} />
              <Route path="institutes" element={<RoleRoute role="superadmin"><Institutes /></RoleRoute>} />

              {/* Admin-only routes */}
              <Route path="reports"  element={<RoleRoute role={['superadmin', 'admin']}><Reports /></RoleRoute>} />
              <Route path="teachers" element={<RoleRoute role={['superadmin', 'admin']}><Teachers /></RoleRoute>} />
              
              {/* Fees: Admin view or Student/Parent view */}
              <Route path="fees" element={
                <RoleRoute role={['superadmin', 'admin', 'student', 'parent']}>
                  <FeesSwitcher />
                </RoleRoute>
              } />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Simple switcher for Fees page
const FeesSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.role === 'superadmin') return <Fees />;
  return <StudentFees />;
};

export default App;
