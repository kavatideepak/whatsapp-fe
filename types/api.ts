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

// Create Chat
export interface CreateChatRequest {
  other_user_id: number;
  is_group: boolean;
}

export interface Chat {
  id: number;
  is_group: boolean;
  created_by: number;
  created_at: string;
}

export interface CreateChatResponse {
  success: boolean;
  message: string;
  data: {
    chat: Chat;
  };
}

// Message Types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video';

export interface Message {
  id: string | number;
  chat_id: number;
  sender_id: number;
  content: string;
  message_type: MessageType;
  sent_at: string; // Backend uses sent_at, not created_at
  created_at?: string; // Keep for backwards compatibility
  status?: MessageStatus;
  is_deleted?: boolean;
  tempId?: string; // For optimistic UI updates
}

export interface SendMessageRequest {
  chat_id: number;
  content: string;
  message_type?: MessageType;
  tempId?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: Message[];
    count: number;
  };
}

// Socket Events
export interface SocketJoinChatPayload {
  chatId: number;
}

export interface SocketMessageSentPayload {
  tempId?: string;
  message: Message;
}

export interface SocketNewMessagePayload {
  message: Message;
}

export interface SocketMessageDeliveredPayload {
  message_id: number;
}

// Generic API Error
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}
