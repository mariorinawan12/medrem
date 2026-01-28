import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('role'); // Using AsyncStorage
        if (userData) {
          setUserRole(userData);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, []);

  return userRole;
};