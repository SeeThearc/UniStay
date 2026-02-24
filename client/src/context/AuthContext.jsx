import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.log('\n=== AUTH CHECK ===');
      console.log('Token exists:', !!token);
      console.log('User exists:', !!storedUser);

      if (token && storedUser && token !== 'undefined' && token !== 'null') {
        console.log('Token length:', token.length);
        console.log('Token preview:', token.substring(0, 30) + '...');
        
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('User set from localStorage:', parsedUser.email);
        
        // Don't verify on initial load to avoid the error
        // User can still use the app with cached data
      } else {
        console.log('No valid auth data found');
      }
      console.log('=== END AUTH CHECK ===\n');
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('\n=== LOGIN ATTEMPT ===');
      console.log('Email:', email);
      
      const response = await axios.post('/auth/login', { email, password });
      const { data } = response.data;

      console.log('Login response received');
      console.log('User:', data.name, data.email);
      console.log('Token exists:', !!data.token);
      console.log('Token type:', typeof data.token);
      console.log('Token length:', data.token?.length);
      console.log('Token preview:', data.token?.substring(0, 30) + '...');

      if (!data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
        console.error('❌ Invalid token received');
        throw new Error('Invalid token received from server');
      }

      console.log('✅ Token is valid JWT format');
      
      // Store token as-is, no JSON.stringify
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Verify storage
      const storedToken = localStorage.getItem('token');
      console.log('Token stored:', storedToken === data.token ? '✅ Matches' : '❌ Mismatch');
      console.log('Stored token length:', storedToken?.length);
      
      setUser(data);
      console.log('=== LOGIN SUCCESS ===\n');

      toast.success('Login successful!');
      return data;
    } catch (error) {
      console.error('=== LOGIN FAILED ===');
      console.error(error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('\n=== REGISTER ATTEMPT ===');
      
      const response = await axios.post('/auth/register', userData);
      const { data } = response.data;

      console.log('Register response received');
      console.log('Token exists:', !!data.token);
      console.log('Token length:', data.token?.length);

      if (!data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
        console.error('❌ Invalid token received');
        throw new Error('Invalid token received from server');
      }

      console.log('✅ Token is valid JWT format');

      // Store token as-is
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      setUser(data);
      console.log('=== REGISTER SUCCESS ===\n');

      toast.success('Registration successful!');
      return data;
    } catch (error) {
      console.error('=== REGISTER FAILED ===');
      console.error(error);
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    console.log('=== LOGOUT ===');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};