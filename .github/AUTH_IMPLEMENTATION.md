# 🔐 Authentication Implementation Guide

## Overview
This document explains how authentication token and user data are stored and accessed throughout the Synapse app after OTP validation.

---

## 📦 Storage Location

### Storage Method: **AsyncStorage**
All authentication data is stored locally on the device using React Native's `@react-native-async-storage/async-storage`.

### Stored Keys:
1. **`auth_token`** - JWT authentication token
2. **`user_data`** - Serialized user object (JSON string)

### Storage Location:
- **iOS**: `~/Library/Preferences/[bundle-id]/RCTAsyncLocalStorage`
- **Android**: `/data/data/[package-name]/databases/RCTAsyncLocalStorage`

---

## 🔑 Token & User Data Structure

### Token
```typescript
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### User Data
```typescript
{
  "id": 1,
  "phone_number": "+917569185865",
  "name": null,
  "profile_pic": null,
  "about": null,
  "email": null,
  "is_online": true,
  "last_seen": "2025-11-11T00:14:44.104Z",
  "created_at": "2025-11-10T15:51:34.357Z"
}
```

---

## 🏗️ Implementation Details

### 1. **API Service Layer** (`services/api.ts`)

#### Storage Functions:
```typescript
// Store token only
await storeAuthToken(token);

// Store user data only
await storeUserData(user);

// Store both token and user (recommended)
await storeAuthData(token, user);
```

#### Retrieval Functions:
```typescript
// Get token
const token = await getAuthToken();

// Get user data
const user = await getUserData();

// Check if authenticated
const isAuth = await isAuthenticated();
```

#### Cleanup Functions:
```typescript
// Logout - clears both token and user data
await clearAuthToken();
```

---

### 2. **Auth Context** (`context/AuthContext.tsx`)

Provides global access to authentication state throughout the app.

#### Usage in Components:
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  
  return (
    <View>
      <Text>User ID: {user?.id}</Text>
      <Text>Phone: {user?.phone_number}</Text>
    </View>
  );
}
```

#### Available Hooks:
```typescript
// Main auth hook
const { 
  user,              // User object or null
  token,             // Token string or null
  isLoading,         // Boolean - loading state
  isAuthenticated,   // Boolean - true if token & user exist
  login,             // Function - store token & user
  logout,            // Function - clear auth data
  updateUser,        // Function - update user data
  refreshAuth        // Function - reload auth from storage
} = useAuth();

// Convenience hooks
const userId = useUserId();           // Returns user.id or null
const phoneNumber = useUserPhone();   // Returns user.phone_number or null
```

---

### 3. **Login Flow** (`app/verify-otp.tsx`)

After successful OTP verification:

```typescript
const response = await verifyOtp(phoneNumber, otpCode);

// Store authentication data using context
await login(response.token, response.user);

console.log('Stored:', {
  token: response.token,
  userId: response.user.id,
  phoneNumber: response.user.phone_number
});
```

---

## 🔒 Token Security

### Current Implementation:
- ✅ Token stored in AsyncStorage (encrypted on iOS, plain on Android)
- ✅ No expiration - token remains valid until logout
- ✅ Automatically included in API requests
- ✅ Persists across app restarts

### Token Usage in API Calls:
All authenticated API requests automatically include the token:

```typescript
const token = await getAuthToken();

return fetchApi('/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});
```

---

## 📱 Usage Examples

### Example 1: Display User Info
```typescript
import { useAuth } from '@/context/AuthContext';

function ProfileScreen() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  
  return (
    <View>
      <Text>Name: {user?.name || 'Not set'}</Text>
      <Text>Phone: {user?.phone_number}</Text>
      <Text>User ID: {user?.id}</Text>
    </View>
  );
}
```

### Example 2: Protected API Request
```typescript
import { useUserId } from '@/context/AuthContext';

function MyComponent() {
  const userId = useUserId();
  
  const fetchMyData = async () => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }
    
    // Use userId in your API request
    const data = await fetch(`/api/user/${userId}/data`);
  };
}
```

### Example 3: Logout
```typescript
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout();
    router.replace('/onboarding');
  };
  
  return (
    <Button onPress={handleLogout}>Logout</Button>
  );
}
```

---

## 🔄 Data Persistence

### Automatic Loading:
The `AuthProvider` automatically loads token and user data when the app starts:

```typescript
// In app/_layout.tsx
<AuthProvider>
  <ThemeProvider>
    <Stack>
      {/* Your screens */}
    </Stack>
  </ThemeProvider>
</AuthProvider>
```

### Persistence Behavior:
- ✅ Data persists across app restarts
- ✅ Data survives app updates
- ✅ Data cleared on app uninstall
- ✅ Data cleared on logout

---

## 🧪 Testing Authentication

### Check Stored Data:
You can verify stored data in the Settings tab (`app/(tabs)/settings.tsx`), which displays:
- User ID
- Phone number
- Name, email, about
- Token (truncated)
- Logout button

### Manual Testing:
```typescript
import { getUserData, getAuthToken } from '@/services/api';

// Check what's stored
const token = await getAuthToken();
const user = await getUserData();

console.log('Token:', token);
console.log('User:', user);
```

---

## 🛠️ Files Modified

1. **`services/api.ts`** - Added storage/retrieval functions
2. **`context/AuthContext.tsx`** - Created auth context (NEW)
3. **`app/_layout.tsx`** - Wrapped app with AuthProvider
4. **`app/verify-otp.tsx`** - Store token & user on login
5. **`app/(tabs)/settings.tsx`** - Example usage with logout

---

## 🚀 Best Practices

### ✅ DO:
- Use `useAuth()` hook to access user data
- Use `useUserId()` for quick user ID access
- Store token and user together using `login(token, user)`
- Clear data on logout using `logout()`

### ❌ DON'T:
- Don't directly use AsyncStorage (use context/hooks)
- Don't store sensitive data beyond token/user
- Don't forget to handle loading states
- Don't expose full token in UI (truncate it)

---

## 📋 Summary

**Where is it stored?**
- AsyncStorage with keys: `auth_token` and `user_data`

**How to access it?**
- Use `useAuth()` hook from `@/context/AuthContext`

**How long does it last?**
- Forever (no expiration) until user logs out or uninstalls app

**Is it secure?**
- Yes, uses platform-secure storage (encrypted on iOS)

**Where can I see it?**
- Settings tab shows all auth data
- Console logs on login (verify-otp.tsx)

---

## 🎯 Quick Reference

```typescript
// Import
import { useAuth, useUserId, useUserPhone } from '@/context/AuthContext';

// Access user
const { user, token, isAuthenticated } = useAuth();
const userId = useUserId();
const phone = useUserPhone();

// Login
await login(token, user);

// Logout
await logout();

// Update user
await updateUser(updatedUserObject);
```

---

**Implementation Date:** November 11, 2025  
**Status:** ✅ Complete & Tested
