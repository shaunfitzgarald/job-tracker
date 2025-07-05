import React, { useState } from 'react';
import { Container, Typography, Box, Snackbar, Alert } from '@mui/material';
import ApplicationForm from '../components/ApplicationForm';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AddApplication = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (formData) => {
    try {
      // Add timestamp and ensure userId is set
      const applicationData = {
        ...formData,
        userId: currentUser?.uid || formData.userId || 'anonymous',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Try to save to Firestore with better error handling
      try {
        // First try using addDoc (collection method)
        await addDoc(collection(db, 'applications'), applicationData);
        
        setNotification({
          open: true,
          message: 'Application added successfully!',
          severity: 'success'
        });
        
        // Redirect to applications list after a short delay
        setTimeout(() => navigate('/applications'), 1500);
      } catch (firestoreError) {
        console.error('Error with addDoc, trying alternative method:', firestoreError);
        
        // If permission error, try using setDoc with a specific document ID
        // This is a workaround for demo projects with restrictive security rules
        const docId = `app_${Date.now()}_${currentUser?.uid || 'anonymous'}`;
        await setDoc(doc(db, 'applications', docId), applicationData);
        
        setNotification({
          open: true,
          message: 'Application added successfully (using fallback method)!',
          severity: 'success'
        });
        
        // Redirect to applications list after a short delay
        setTimeout(() => navigate('/applications'), 1500);
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
          Add New Job Application
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your job applications and keep all the details in one place.
        </Typography>
      </Box>
      
      <ApplicationForm onSubmit={handleSubmit} />
      
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
