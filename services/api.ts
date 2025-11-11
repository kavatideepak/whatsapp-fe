/**
 * API Service Layer
 * Handles all API calls to the backend
 */

import { API_ENDPOINTS, buildUrl } from '@/config/api';
import {
  ApiError,
  CreateChatRequest,
  CreateChatResponse,
  GetUsersResponse,
  RequestOtpRequest,
  RequestOtpResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/api';

/**
 * Base fetch function with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(buildUrl(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        error: data.error || 'Request failed',
        message: data.message,
        statusCode: response.status,
      } as ApiError;
    }

    return data as T;
  } catch (error) {
    // If it's already an ApiError, re-throw it
    if ((error as ApiError).error) {
      throw error;
    }
    
    // Handle network errors
    throw {
      error: 'Network error',
      message: 'Failed to connect to the server. Please check your connection.',
    } as ApiError;
  }
}

/**
 * Request OTP for phone number
 */
export async function requestOtp(
  phoneNumber: string
): Promise<RequestOtpResponse> {
  const body: RequestOtpRequest = {
    phone_number: phoneNumber,
  };

  return fetchApi<RequestOtpResponse>(API_ENDPOINTS.users.requestOtp, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Verify OTP and login
 */
export async function verifyOtp(
  phoneNumber: string,
  otp: string
): Promise<VerifyOtpResponse> {
  const body: VerifyOtpRequest = {
    phone_number: phoneNumber,
    otp: otp,
  };

  return fetchApi<VerifyOtpResponse>(API_ENDPOINTS.users.verifyOtp, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update user profile (name, about, etc.)
 */
export async function updateUser(
  phoneNumber: string,
  updates: Omit<UpdateUserRequest, 'phone_number'>
): Promise<UpdateUserResponse> {
  const body: UpdateUserRequest = {
    phone_number: phoneNumber,
    ...updates,
  };

  const token = await getAuthToken();
  
  return fetchApi<UpdateUserResponse>(API_ENDPOINTS.users.update, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
}

/**
 * Get all users from the directory
 */
export async function getUsers(): Promise<GetUsersResponse> {
  const token = await getAuthToken();
  
  return fetchApi<GetUsersResponse>(API_ENDPOINTS.users.list, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
}

/**
 * Store authentication token and user data
 */
export async function storeAuthToken(token: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Failed to store auth token:', error);
    throw new Error('Failed to store authentication token');
  }
}

/**
 * Store user data
 */
export async function storeUserData(user: User): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user data:', error);
    throw new Error('Failed to store user data');
  }
}

/**
 * Store both auth token and user data (convenience function)
 */
export async function storeAuthData(token: string, user: User): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.multiSet([
      ['auth_token', token],
      ['user_data', JSON.stringify(user)],
    ]);
  } catch (error) {
    console.error('Failed to store auth data:', error);
    throw new Error('Failed to store authentication data');
  }
}

/**
 * Get stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Get stored user data
 */
export async function getUserData(): Promise<User | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

/**
 * Clear authentication token and user data (logout)
 */
export async function clearAuthToken(): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.multiRemove(['auth_token', 'user_data']);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    return token !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new chat between two users
 */
export async function createChat(
  otherUserId: number,
  isGroup: boolean = false
): Promise<CreateChatResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw {
      error: 'Unauthorized',
      message: 'Authentication token not found',
      statusCode: 401,
    } as ApiError;
  }

  const body: CreateChatRequest = {
    other_user_id: otherUserId,
    is_group: isGroup,
  };

  return fetchApi<CreateChatResponse>(API_ENDPOINTS.chats.create, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Get all chats for a user
 */
export async function getChats(): Promise<any> {
  const token = await getAuthToken();
  
  if (!token) {
    throw {
      error: 'Unauthorized',
      message: 'Authentication token not found',
      statusCode: 401,
    } as ApiError;
  }

  return fetchApi<any>(API_ENDPOINTS.chats.list, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
