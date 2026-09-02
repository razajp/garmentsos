import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../services/api';
import { MOCK_AUTH_TOKEN, MOCK_USER_STORAGE_KEY, mockUsers, withoutPassword } from '../services/mockData';

const AuthContext = createContext(null);
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (USE_MOCKS && token === MOCK_AUTH_TOKEN) {
      const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      setUser(storedUser ? JSON.parse(storedUser) : withoutPassword(mockUsers[0]));
      setLoading(false);
      return;
    }
    
    try {
      const response = await authAPI.getMe(); // Use authAPI here
      setUser(response.data.data);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    if (USE_MOCKS) {
      const normalizedUsername = username.trim().toLowerCase();
      const matchedUser = mockUsers.find(
        (mockUser) =>
          mockUser.username.toLowerCase() === normalizedUsername &&
          mockUser.password === password
      );

      if (!matchedUser) {
        throw new Error('Use demo / demo123 for prototype login');
      }

      const userData = withoutPassword(matchedUser);
      localStorage.setItem('token', MOCK_AUTH_TOKEN);
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      return userData;
    }

    const response = await authAPI.login({ username, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = async (data) => {
    if (USE_MOCKS) {
      const updatedUser = { ...user, ...data };
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { data: updatedUser };
    }

    const response = await api.put('/auth/profile', data);
    setUser(prev => ({ ...prev, ...response.data.data }));
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
