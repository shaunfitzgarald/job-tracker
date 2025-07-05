import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, mockOnAuthStateChanged } from '../services/firebase';

// Using real Firebase with environment variables
const USE_MOCK_FIREBASE = false;

// Create auth context
const AuthContext = createContext();

// Auth context provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register a new user
  const register = async (email, password, displayName) => {
    try {
      // First create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Then update the user profile with display name
      if (userCredential && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        return userCredential.user;
      } else {
        throw new Error('User creation succeeded but user object is undefined');
      }
    } catch (error) {
      console.error('Error in register function:', error);
      throw error; // Re-throw the error to be handled by the component
    }
  };

  // Login existing user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout current user
  const logout = () => {
    return signOut(auth);
  };

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribe;
    
    if (USE_MOCK_FIREBASE) {
      // Use mock auth state change listener
      unsubscribe = mockOnAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });
    } else {
      // Use real Firebase auth state change listener
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });
    }

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Context value
  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}
