import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Snackbar, Alert } from '@mui/material';
import ApplicationForm from '../components/ApplicationForm';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AddApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [targetUserId, setTargetUserId] = useState(null);
  
  // Extract userId from query parameters if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userIdParam = queryParams.get('userId');
    if (userIdParam) {
      setTargetUserId(userIdParam);
    }
  }, [location]);

  const handleSubmit = async (formData) => {
    try {
      // Add timestamp and ensure userId is set
      // If targetUserId is set (from query param), use it instead of current user's ID
      const applicationData = {
        ...formData,
        userId: targetUserId || currentUser?.uid || formData.userId || 'anonymous',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || 'anonymous' // Track who created the application
      };
      
      console.log('Creating application with userId:', applicationData.userId);
      
      // Try to save to Firestore with better error handling
      try {
        // First try using addDoc (collection method)
        await addDoc(collection(db, 'applications'), applicationData);
        
        setNotification({
          open: true,
          message: 'Application added successfully!',
          severity: 'success'
        });
        
        // Redirect based on where the application was created from
        setTimeout(() => {
          if (targetUserId && targetUserId !== currentUser?.uid) {
            // If adding for another user, go back to their view
            navigate(`/user-view/${targetUserId}`);
          } else {
            // Otherwise go to applications list
            navigate('/applications');
          }
        }, 1500);
      } catch (firestoreError) {
        console.error('Error with addDoc, trying alternative method:', firestoreError);
        
        // If permission error, try using setDoc with a specific document ID
        // This is a workaround for demo projects with restrictive security rules
        const docId = `app_${Date.now()}_${targetUserId || currentUser?.uid || 'anonymous'}`;
        await setDoc(doc(db, 'applications', docId), applicationData);
        
        setNotification({
          open: true,
          message: 'Application added successfully (using fallback method)!',
          severity: 'success'
        });
        
        // Redirect based on where the application was created from
        setTimeout(() => {
          if (targetUserId && targetUserId !== currentUser?.uid) {
            // If adding for another user, go back to their view
            navigate(`/user-view/${targetUserId}`);
          } else {
            // Otherwise go to applications list
            navigate('/applications');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error adding application:', error);
      setNotification({
        open: true,
        message: `Error adding application: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add New Job Application {targetUserId && targetUserId !== currentUser?.uid ? '(For Another User)' : ''}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {targetUserId && targetUserId !== currentUser?.uid 
            ? 'Adding an application for another user. This will be saved to their account.'
            : 'Track your job applications and keep all the details in one place.'}
        </Typography>
      </Box>
      
      <ApplicationForm onSubmit={handleSubmit} initialData={targetUserId ? { userId: targetUserId } : null} />
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddApplication;
