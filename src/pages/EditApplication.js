import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ApplicationForm from '../components/ApplicationForm';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'applications', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if the application belongs to the current user
          if (data.userId !== currentUser.uid) {
            setError('You do not have permission to edit this application');
            setLoading(false);
            return;
          }
          
          // Convert Firestore timestamps to Date objects
          const applicationData = {
            id: docSnap.id,
            ...data,
            applicationDate: data.applicationDate?.toDate?.() || new Date(),
            interviewDateTime: data.interviewDateTime?.toDate?.() || null,
            followUpDate: data.followUpDate?.toDate?.() || null,
            dateHeardBack: data.dateHeardBack?.toDate?.() || null
          };
          
          setApplication(applicationData);
        } else {
          setError('Application not found');
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        setError('Error loading application data');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, currentUser]);

  const handleSubmit = async (formData) => {
    try {
      // Update timestamp
      const applicationData = {
        ...formData,
        updatedAt: new Date()
      };
      
      // Remove id field before updating
      const { id: appId, ...dataToUpdate } = applicationData;
      
      // Update in Firestore
      const docRef = doc(db, 'applications', id);
      await updateDoc(docRef, dataToUpdate);
      
      // Redirect to applications list
      navigate('/applications');
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Job Application
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update the details of your job application.
        </Typography>
      </Box>
      
      {application && <ApplicationForm onSubmit={handleSubmit} initialData={application} />}
    </Container>
  );
};

export default EditApplication;
