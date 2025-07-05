import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    email: '',
    bio: '',
    location: '',
    title: '',
    shareStats: false
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get user profile from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            bio: userData.bio || '',
            location: userData.location || '',
            title: userData.title || '',
            shareStats: userData.shareStats || false
          });
        } else {
          // If no profile exists yet, initialize with auth data
          setUserProfile({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            bio: '',
            location: '',
            title: '',
            shareStats: false
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Update display name in Firebase Auth
      if (currentUser.displayName !== userProfile.displayName) {
        await updateProfile(currentUser, {
          displayName: userProfile.displayName
        });
      }
      
      // Update profile in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        bio: userProfile.bio,
        location: userProfile.location,
        title: userProfile.title,
        shareStats: userProfile.shareStats,
        updatedAt: new Date()
      }, { merge: true });
      
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Profile
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ width: 100, height: 100, mb: 2, fontSize: '3rem' }}
          >
            {userProfile.displayName?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h5">
            {userProfile.displayName || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userProfile.email}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                name="displayName"
                value={userProfile.displayName}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={userProfile.title}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={userProfile.bio}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Tell us a bit about yourself..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={userProfile.location}
                onChange={handleChange}
                placeholder="e.g. San Francisco, CA"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.shareStats}
                    onChange={handleSwitchChange}
                    name="shareStats"
                    color="primary"
                  />
                }
                label="Share my application statistics with the community"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Your personal information will remain private, only aggregate statistics will be shared.
              </Typography>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={updating}
                sx={{ mr: 2 }}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
