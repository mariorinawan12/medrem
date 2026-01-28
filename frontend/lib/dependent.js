import { apiFetch } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the list of dependents for the current user
export async function getDependents() {
  return apiFetch('/user', {
    method: 'POST',
  });
}

// Create a new dependent user (requires parent to be logged in)
export async function createDependent(dependentData) {
  return apiFetch('/user/create', {
    method: 'POST',
    body: JSON.stringify(dependentData),
  });
}


export async function generateDependentLoginCode(dependentId) {
  return apiFetch(`/user/generate-login-code`, {
    method: 'POST',
    body: JSON.stringify({ dependentId }),
  });
}

export async function deleteDependent(userId) {
  return apiFetch(`/user/delete`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}


export async function loginWithCode(code) {
  const res = await apiFetch('/user/login-with-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
    headers: { 'Content-Type': 'application/json' },
  });

  console.log('Login response:', res);
  
  // Store both token and user data
  await AsyncStorage.setItem('token', res.token);
  await AsyncStorage.setItem('role', res.role);
  await AsyncStorage.setItem('name', res.fullName);

  
  return res;
}

export async function fetchDependentDetails(dependentId) {
  console.log('fetchDependentDetails called with dependentId:', dependentId);
  console.log('body:', JSON.stringify({ dependentId }));
  const res = await apiFetch('/user/dependent-details', {
    method: 'POST',
    body: JSON.stringify({ dependentId }),
    headers: { 'Content-Type': 'application/json' },
  })

  console.log('Dependent details response:', res);
  return res;
}

export async function updateDependentDetails(dependentData) {
  try {
    const response = await apiFetch('/user/update-dependent-details', {
      method: 'POST',
      body: JSON.stringify({
        dependentId: dependentData.userId,
        fullName: dependentData.fullName,
        gender: dependentData.gender,
        dateOfBirth: dependentData.dateOfBirth
      }),
      headers: { 
        'Content-Type': 'application/json',
      },
    });

    // Return the response directly (assuming apiFetch handles error responses)
    return response;
  } catch (error) {
    console.error('Update dependent error:', error.message);
    
    // Transform generic server errors to user-friendly messages
    if (error.message === 'Server error') {
      throw new Error('Failed to update dependent. Please try again later.');
    }
    
    throw error; // Re-throw other errors as-is
  }
}




