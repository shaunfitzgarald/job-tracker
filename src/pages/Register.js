import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  Alert 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, displayName });
    
    // Form validation
    if (!displayName.trim()) {
      console.log('Validation failed: Name is required');
      return setError('Name is required');
    }
    
    if (!email.trim()) {
      console.log('Validation failed: Email is required');
      return setError('Email is required');
    }
    
    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return setError('Password must be at least 6 characters');
    }
    
    if (password !== confirmPassword) {
      console.log('Validation failed: Passwords do not match');
      return setError('Passwords do not match');
    }
    
    try {
      console.log('Attempting to register user...');
      setError('');
      setLoading(true);
      
      // Check if register function exists
      console.log('Register function exists:', typeof register === 'function');
      console.log('Auth context values:', { register });
      
      // Add a timeout to ensure UI updates before potentially heavy operation
      setTimeout(async () => {
        try {
          console.log('Calling register function...');
          // Add a direct try/catch around the register call
          try {
            const user = await register(email, password, displayName);
            console.log('Registration successful:', user);
            
            // Explicitly navigate to dashboard after successful registration
            console.log('Redirecting to dashboard...');
            window.location.href = '/dashboard';
          } catch (registerError) {
            console.error('Direct register function error:', registerError);
            throw registerError; // Re-throw to be caught by outer catch
          }
        } catch (error) {
          console.error('Registration error details:', error.code, error.message);
          console.error('Full error object:', error);
          
          // Handle specific Firebase auth errors
          if (error.code === 'auth/email-already-in-use') {
            setError('Email is already in use. Please use a different email or try logging in.');
          } else if (error.code === 'auth/invalid-email') {
            setError('Invalid email address format.');
          } else if (error.code === 'auth/weak-password') {
            setError('Password is too weak. Please use a stronger password.');
          } else if (error.code === 'auth/network-request-failed') {
            setError('Network error. Please check your internet connection.');
          } else {
            setError(`Failed to create an account: ${error.message || error}`);
          }
          setLoading(false);
        }
      }, 100);
    } catch (outerError) {
      console.error('Outer try-catch error:', outerError);
      setError(`Unexpected error: ${outerError.message || outerError}`);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Job Tracker - Create Account
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="Full Name"
              name="displayName"
              autoComplete="name"
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Sign Up
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/login" variant="body2">
                {"Already have an account? Sign In"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
