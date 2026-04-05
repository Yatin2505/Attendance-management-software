import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, loginUser, logoutUser as logoutService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await getMe();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (err) {
          console.error("Failed to fetch fresh profile", err);
          const cachedUser = getCurrentUser();
          if (cachedUser) setUser(cachedUser);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      setUser(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
    toast.success('Signed out successfully');
  };

  // Allow profile page / other components to refresh in-memory user
  const updateUser = (updates) => {
    const merged = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
