import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  console.log('\n=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Authorization header:', req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      console.log('Token extracted:', token);
      console.log('Token length:', token?.length);
      console.log('Token type:', typeof token);
      console.log('Token starts with:', token?.substring(0, 20));
      console.log('Token ends with:', token?.substring(token.length - 20));
      
      // Check for common issues
      if (!token || token === 'undefined' || token === 'null') {
        console.log('❌ Token is invalid string');
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }

      // Check JWT format (should have 3 parts)
      const parts = token.split('.');
      console.log('Token parts count:', parts.length);
      if (parts.length !== 3) {
        console.log('❌ Token does not have 3 parts');
        return res.status(401).json({
          success: false,
          message: 'Invalid token structure'
        });
      }

      console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
      console.log('Attempting to verify token...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('✅ Token verified successfully');
      console.log('Decoded:', decoded);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log('❌ User not found');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        console.log('❌ User is inactive');
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      console.log('✅ Authentication successful for user:', req.user.email);
      console.log('=== END AUTH DEBUG ===\n');

      next();
    } catch (error) {
      console.error('❌ Token verification failed');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      console.log('=== END AUTH DEBUG ===\n');
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    console.log('❌ No Authorization header or invalid format');
    console.log('=== END AUTH DEBUG ===\n');
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};