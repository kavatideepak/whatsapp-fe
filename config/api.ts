/**
 * API Configuration
 * Centralized configuration for API base URL and endpoints
 */

// Base URL for the API
export const API_BASE_URL = 'http://192.168.29.6:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // User Authentication
  users: {
    requestOtp: '/users/request-otp',
    verifyOtp: '/users/verify-otp',
    update: '/users/update',
    list: '/users',
  },
  // Add more endpoint categories as needed
  // messages: {
  //   send: '/messages/send',
  //   list: '/messages/list',
  // },
} as const;

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
