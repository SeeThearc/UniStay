import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    console.log('\n=== AXIOS REQUEST DEBUG ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Token from localStorage:', token ? 'Found' : 'Not found');
    
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token type:', typeof token);
      console.log('Token starts with:', token.substring(0, 20));
      console.log('Token ends with:', token.substring(token.length - 20));
      console.log('Token has quotes:', token.includes('"') || token.includes("'"));
      
      // Remove any quotes that might have been added
      const cleanToken = token.replace(/^["']|["']$/g, '');
      console.log('Clean token length:', cleanToken.length);
      console.log('Clean token starts:', cleanToken.substring(0, 20));
      
      // Check if token has 3 parts
      const parts = cleanToken.split('.');
      console.log('Token parts:', parts.length);
      
      if (parts.length === 3) {
        config.headers.Authorization = `Bearer ${cleanToken}`;
        console.log('✅ Authorization header set');
      } else {
        console.log('❌ Invalid token structure');
      }
    } else {
      console.log('❌ No token in localStorage');
    }
    
    console.log('Final Authorization header:', config.headers.Authorization);
    console.log('=== END AXIOS DEBUG ===\n');
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.config?.url, error.response?.status);
    console.error('Error message:', error.response?.data?.message);
    
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;