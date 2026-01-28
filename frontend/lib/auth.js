import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, unauthFetch } from './api';

// Login function
export async function login(email, password) {
  const res = await unauthFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' }, // No token required for login
  });

  console.log('Login response:', res);
  console.log('Token:', res.token);

  await AsyncStorage.setItem('token', res.token);
  await AsyncStorage.setItem('role', res.role)
  await AsyncStorage.setItem('name', res.name)// Store token in AsyncStorage
  return res;
}

export async function register(userData) {
  const res = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ ...userData }),
    headers: { 'Content-Type': 'application/json' }, // No token required for registration
  })
  console.log('Register response:', res);
  return res;
}

export async function forgotPassword(email) {
  const res = await unauthFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  });
  console.log('Forgot password response:', res);
  return res;
}

export async function verifyResetCode(resetCode) {
  try {
    const res = await unauthFetch('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ resetCode }),
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Verify reset code response:', res);

    const resetToken = res.resetToken;
    await AsyncStorage.setItem('resetToken', resetToken); // Store the reset token in AsyncStorage

    return res;
  }
  catch (error) {
    console.error('Error verifying reset code:', error);
    throw error; // Rethrow the error for further handling
  }
};

export async function resetPassword(newPassword) {
  const resetToken = await AsyncStorage.getItem('resetToken');
  if (!resetToken) throw new Error('Reset token not found');

  const res = await unauthFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resetToken}`,
    },
  });

  console.log('Reset password response:', res);
  return res;
}

export async function updateFcmToken(fcmToken) {
  if (!fcmToken) throw new Error('FCM token is required');

  const response = await apiFetch('/auth/fcm-token', {
    method: 'POST',
    body: JSON.stringify({ fcmToken }),
  });

  return response;
}

export async function unregisterFcmToken(fcmToken) {
  try {
    const response = await apiFetch('/auth/fcm-token/unregister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken }), // Send specific token to remove
    });
    console.log('FCM token unregistered from backend');
    return response;
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    // Don't throw - logout should continue even if this fails
  }
}


// Logout function
export async function logout() {
  await AsyncStorage.removeItem('token'); // Remove token from AsyncStorage
}

// Retrieve the stored token
export async function getToken() {
  return await AsyncStorage.getItem('token'); // Correct method to get the token
}

export async function fetchUserDetails() {
  const res = await apiFetch('/auth/user-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  return res;
}

export async function updateUserDetails(userData) {
  try {
    const response = await apiFetch('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({
        fullName: userData.fullName,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Since your apiFetch already handles error responses and parsing,
    // we can just return the response directly
    return response;
  } catch (error) {
    console.error('Update profile error:', error.message);

    // Transform generic server errors to more user-friendly messages
    if (error.message === 'Server error') {
      throw new Error('Profile update failed. Please try again later.');
    }

    throw error; // Re-throw other errors as-is
  }
}