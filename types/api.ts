/**
 * API Types and Interfaces
 * Type definitions for API requests and responses
 */

// User Types
export interface User {
  id: number;
  phone_number: string;
  name: string | null;
  profile_pic: string | null;
  about: string | null;
  email: string | null;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
}

// Get Users
export interface GetUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    count: number;
  };
}

// Request OTP
export interface RequestOtpRequest {
  phone_number: string;
}

export interface RequestOtpResponse {
  message: string;
  phone_number: string;
  otp: string; // Note: In production, OTP should not be returned
}

// Verify OTP
export interface VerifyOtpRequest {
  phone_number: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  token: string;
  user: User;
}

// Update User
export interface UpdateUserRequest {
  phone_number: string;
  name?: string;
  profile_pic?: string;
  about?: string;
  email?: string;
}

export interface UpdateUserResponse {
  message: string;
  user: User;
}

// Generic API Error
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}
