import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route index           element={<Index />} />
            <Route path="students" element={<Students />} />
            <Route path="batches"  element={<Batches />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="profile"  element={<Profile />} />

            {/* Admin-only routes */}
            <Route path="reports"  element={<RoleRoute role="admin"><Reports /></RoleRoute>} />
            <Route path="teachers" element={<RoleRoute role="admin"><Teachers /></RoleRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
