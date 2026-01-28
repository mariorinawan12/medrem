import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';


const BASE_URL = 'https://api.srvrpotato.online'; 


async function handleUnauthorized() {
  console.log('[API] Unauthorized - clearing session and redirecting to login');
  
  try {
    // Clear all auth data
    await AsyncStorage.multiRemove(['token', 'name', 'role', 'resetToken', 'fcm_token', 'fcm_token_sent']);
    
    // Redirect to login
    router.replace('/auth/login');
  } catch (error) {
    console.error('[API] Error during auto-logout:', error);
    // Force redirect even if clear fails
    router.replace('/auth/login');
  }
}


// export async function apiFetch(path, options = {}) {
//   const token = await AsyncStorage.getItem('token'); // Get token from AsyncStorage

//   console.log('Token in apiFetch', token); // Log the token for debugging

//   const headers = {
//     'Content-Type': 'application/json',
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...options.headers,
//   };

//   const response = await fetch(`${BASE_URL}${path}`, {
//     ...options,
//     headers,
//   });

//   if (!response.ok) {
//     let errorText = 'API Error';
//     try {
//       const errorBody = await response.text(); // safer than .json()
//       console.error("API Error Response:", errorBody);
//       const parsed = JSON.parse(errorBody);
//       errorText = parsed.message || parsed.error || errorText;
//     } catch (err) {
//       console.error("Failed to parse error body:", err);
//     }
//     throw new Error(errorText);
//   }

//   return response.json();
// }

export async function apiFetch(path, options = {}) {
  const token = await AsyncStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - auto logout
    if (response.status === 401) {
      await handleUnauthorized();
      throw new Error('Session expired. Please login again.');
    }
    
    let errorText = 'API Error';
    try {
      const errorBody = await response.text();
      const parsed = JSON.parse(errorBody);
      errorText = parsed.message || parsed.error || errorText;
    } catch (err) {
      // No logging here (removed console.error)
    }
    throw new Error(errorText); // Still throws, but no logging
  }

  return response.json();
}

export async function unauthFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }

  return response.json();
}
