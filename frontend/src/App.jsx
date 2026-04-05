import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import MainLayout from './layouts/MainLayout';
import Index from './pages/Index';
import Students from './pages/Students';
import Batches from './pages/Batches';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Teachers from './pages/Teachers';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import LeaveManagement from './pages/LeaveManagement';
import Fees from './pages/Fees';
import StudentFees from './pages/StudentFees';
import Institutes from './pages/Institutes';

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
