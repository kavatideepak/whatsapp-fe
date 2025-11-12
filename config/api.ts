/**
 * API Configuration
 * Centralized configuration for API base URL and endpoints
 */

// Base URL for the API
// export const API_BASE_URL = 'http://192.168.29.6:3000/api';
// export const API_BASE_URL = 'http://localhost:3000/api';
export const API_BASE_URL = 'https://dev-api.synapsebygraviti.com/api';

// Socket URL (without /api path)
// export const SOCKET_URL = 'http://192.168.29.6:3000';
export const SOCKET_URL = 'https://dev-api.synapsebygraviti.com';

// API Endpoints
export const API_ENDPOINTS = {
  // User Authentication
  users: {
    requestOtp: '/users/request-otp',
    verifyOtp: '/users/verify-otp',
    update: '/users/update',
    list: '/users',
  },
  // Chats
  chats: {
    create: '/chats',
    list: '/chats',
  },
  // Messages
  messages: {
    list: (chatId: number) => `/messages/${chatId}`,
  },
  // Add more endpoint categories as needed
} as const;

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
