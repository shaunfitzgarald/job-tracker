// Mock Firebase Authentication Service
// This file provides mock implementations of Firebase Auth functions
// for development and testing purposes when a real Firebase project is not available

// Mock user storage (simulates a database)
const mockUsers = [];

// Mock authentication state
let currentUser = null;

// Mock Firebase Auth functions
export const mockAuth = {
  // Current user getter
  get currentUser() {
    return currentUser;
  },
  
  // Mock sign up function
  createUserWithEmailAndPassword: async (auth, email, password) => {
    // Check if email already exists
    if (mockUsers.some(user => user.email === email)) {
      const error = new Error('Email already in use');
      error.code = 'auth/email-already-in-use';
      throw error;
    }
    
    // Create new user
    const newUser = {
      uid: `mock-uid-${Date.now()}`,
      email,
      emailVerified: false,
      displayName: null,
      photoURL: null,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
    
    // Add to mock database
    mockUsers.push({...newUser, password});
    
    // Set as current user
    currentUser = newUser;
    
    return {
      user: newUser
    };
  },
  
  // Mock sign in function
  signInWithEmailAndPassword: async (auth, email, password) => {
    // Find user
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      const error = new Error('Invalid email or password');
      error.code = 'auth/wrong-password';
      throw error;
    }
    
    // Update last sign in
    user.metadata.lastSignInTime = new Date().toISOString();
    
    // Set as current user
    currentUser = {...user};
    delete currentUser.password;
    
    return {
      user: currentUser
    };
  },
  
  // Mock sign out function
  signOut: async (auth) => {
    currentUser = null;
    return Promise.resolve();
  },
  
  // Mock update profile function
  updateProfile: async (user, profileData) => {
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update user in mock database
    const mockUser = mockUsers.find(u => u.uid === user.uid);
    if (mockUser) {
      Object.assign(mockUser, profileData);
      // Also update current user if it's the same user
      if (currentUser && currentUser.uid === user.uid) {
        Object.assign(currentUser, profileData);
      }
    }
    
    return Promise.resolve();
  }
};

// Mock onAuthStateChanged listener
export const mockOnAuthStateChanged = (auth, callback) => {
  // Call immediately with current user
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {};
};

// Mock Firestore
export const mockFirestore = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({
        exists: false,
        data: () => null
      }),
      set: async (data) => Promise.resolve(),
      update: async (data) => Promise.resolve()
    }),
    add: async (data) => ({
      id: `mock-doc-${Date.now()}`
    }),
    where: () => ({
      get: async () => ({
        empty: true,
        docs: []
      })
    })
  })
};
