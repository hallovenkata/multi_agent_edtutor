import { useState, useEffect } from 'react';

export interface UserData {
  name: string;
  location: string;
  gradeLevel: string;
  stemLevel: string;
  preferredSubjects: string[];
  lastSession?: number;
}

const USER_DATA_KEY = 'stemTutorUserData';

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(USER_DATA_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Validate the data
        if (
          parsedData.name &&
          parsedData.gradeLevel &&
          parsedData.stemLevel
        ) {
          setUserData(parsedData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user data to localStorage
  const saveUserData = (data: Omit<UserData, 'lastSession'>) => {
    const newUserData = {
      ...data,
      lastSession: Date.now(),
    };
    
    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(newUserData));
      setUserData(newUserData);
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  };

  // Clear user data (for logout or reset)
  const clearUserData = () => {
    try {
      localStorage.removeItem(USER_DATA_KEY);
      setUserData(null);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  };

  return {
    userData,
    isLoading,
    saveUserData,
    clearUserData,
  };
}
