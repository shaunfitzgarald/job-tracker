import React, { useState, useEffect, useRef } from 'react';
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
  FormControlLabel,
  IconButton,
  Tooltip,
  Chip,
  Link as MuiLink,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  Edit,
  Delete,
  Description,
  Download,
  PhotoCamera,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    email: '',
    bio: '',
    location: '',
    title: '',
    shareStats: false,
    photoURL: '',
    resumes: []
  });
  
  // Refs for file inputs
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  
  // State for resume upload dialog
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('');
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);

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
            shareStats: userData.shareStats || false,
            photoURL: currentUser.photoURL || userData.photoURL || '',
            resumes: userData.resumes || []
          });
        } else {
          // If no profile exists yet, initialize with auth data
          setUserProfile({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            bio: '',
            location: '',
            title: '',
            shareStats: false,
            photoURL: currentUser.photoURL || '',
            resumes: []
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

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size should be less than 5MB');
      return;
    }
    
    setUploadingPhoto(true);
    setError('');
    
    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const photoURL = await getDownloadURL(storageRef);
      
      // Update user profile in Firebase Auth
      await updateProfile(currentUser, { photoURL });
      
      // Update user profile in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { photoURL });
      
      // Update local state
      setUserProfile(prev => ({ ...prev, photoURL }));
      setSuccess('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setError('Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  // Handle resume file selection
  const handleResumeFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid resume file (PDF, DOC, DOCX)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Resume size should be less than 10MB');
      return;
    }
    
    setSelectedResumeFile(file);
    setResumeDialogOpen(true);
  };
  
  // Handle resume upload with title
  const handleResumeUpload = async () => {
    if (!selectedResumeFile || !resumeTitle.trim()) {
      setError('Please provide a title for your resume');
      return;
    }
    
    setUploadingResume(true);
    setError('');
    
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedResumeFile.name}`;
      
      // Create a reference to the storage location
      const storageRef = ref(storage, `resumes/${currentUser.uid}/${fileName}`);
      
      // Upload the file
      await uploadBytes(storageRef, selectedResumeFile);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create a plain JavaScript object for the new resume
      // Avoid using Date objects which can cause issues with Firestore serialization
      const newResume = {
        id: timestamp.toString(),
        title: resumeTitle,
        fileName: selectedResumeFile.name,
        storedFileName: fileName,
        url: downloadURL,
        uploadedAt: timestamp
      };
      
      // Update user profile in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Ensure resumes array exists and is an array
      const currentResumes = Array.isArray(userProfile.resumes) ? userProfile.resumes : [];
      const updatedResumes = [...currentResumes, newResume];
      
      // Check if user document exists first
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        await updateDoc(userDocRef, { resumes: updatedResumes });
      } else {
        // Create the document if it doesn't exist
        await setDoc(userDocRef, { 
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          resumes: updatedResumes
        });
      }
      
      // Update local state
      setUserProfile(prev => ({ 
        ...prev, 
        resumes: updatedResumes
      }));
      
      setSuccess('Resume uploaded successfully');
      setResumeDialogOpen(false);
      setResumeTitle('');
      setSelectedResumeFile(null);
      
      // Force reload the page after a short delay to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };
  
  // Handle resume deletion
  const handleResumeDelete = async (resumeId, storedFileName) => {
    setUploadingResume(true);
    setError('');
    
    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `resumes/${currentUser.uid}/${storedFileName}`);
      
      // Delete the file
      await deleteObject(storageRef);
      
      // Update user profile in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedResumes = userProfile.resumes.filter(resume => resume.id !== resumeId);
      
      await updateDoc(userDocRef, { resumes: updatedResumes });
      
      // Update local state
      setUserProfile(prev => ({ 
        ...prev, 
        resumes: updatedResumes
      }));
      
      setSuccess('Resume deleted successfully');
    } catch (error) {
      console.error('Error deleting resume:', error);
      setError('Failed to delete resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Update display name in Firebase Auth
      if (currentUser.displayName !== userProfile.displayName) {
        try {
          await updateProfile(currentUser, {
            displayName: userProfile.displayName
          });
          console.log('Auth profile updated successfully');
        } catch (authError) {
          console.error('Error updating auth profile:', authError);
          // Continue with Firestore update even if auth update fails
        }
      }
      
      // Update profile in Firestore
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Create profile data object
        const profileData = {
          bio: userProfile.bio || '',
          location: userProfile.location || '',
          title: userProfile.title || '',
          shareStats: userProfile.shareStats || false,
          displayName: userProfile.displayName || currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: userProfile.photoURL || '',
          updatedAt: new Date()
        };
        
        // Use setDoc with merge option to handle both create and update scenarios
        await setDoc(userDocRef, profileData, { merge: true });
        console.log('Firestore profile updated successfully');
        
        // Refresh the current user to get updated profile
        if (currentUser.displayName !== userProfile.displayName) {
          // Force a refresh of the user object
          await currentUser.reload();
        }
        
        setSuccess('Profile updated successfully');
      } catch (firestoreError) {
        console.error('Error updating Firestore profile:', firestoreError);
        throw firestoreError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(`Failed to update profile: ${error.message || 'Unknown error'}`);
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
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar 
              src={userProfile.photoURL}
              sx={{ width: 120, height: 120, fontSize: '3rem' }}
            >
              {userProfile.displayName?.charAt(0) || 'U'}
            </Avatar>
            <input
              accept="image/*"
              type="file"
              style={{ display: 'none' }}
              ref={photoInputRef}
              onChange={handlePhotoUpload}
            />
            <Tooltip title="Upload profile picture">
              <IconButton 
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={() => photoInputRef.current.click()}
                disabled={uploadingPhoto}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'background.paper',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                {uploadingPhoto ? <CircularProgress size={24} /> : <PhotoCamera />}
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="h5">
            {userProfile.displayName || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userProfile.email}
          </Typography>
          {userProfile.title && (
            <Chip 
              label={userProfile.title} 
              color="primary" 
              variant="outlined" 
              size="small" 
              sx={{ mt: 1 }} 
            />
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Resume Upload Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Resumes</span>
            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Visibility />}
                component={Link}
                to="/resumes"
                sx={{ mr: 1 }}
              >
                View All
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUpload />}
                onClick={() => resumeInputRef.current.click()}
                disabled={uploadingResume}
              >
                Add Resume
              </Button>
            </Box>
          </Typography>
          
          <input
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            type="file"
            style={{ display: 'none' }}
            ref={resumeInputRef}
            onChange={handleResumeFileSelect}
          />
          
          {userProfile.resumes.length > 0 ? (
            <Box>
              {userProfile.resumes.map(resume => (
                <Card key={resume.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <Description color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="subtitle2">
                          {resume.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {resume.fileName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Tooltip title="Download Resume">
                        <IconButton 
                          component={MuiLink} 
                          href={resume.url} 
                          target="_blank" 
                          rel="noopener"
                          download
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Resume">
                        <IconButton 
                          color="error" 
                          onClick={() => handleResumeDelete(resume.id, resume.storedFileName)}
                          disabled={uploadingResume}
                        >
                          {uploadingResume ? <CircularProgress size={24} /> : <Delete />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You haven't uploaded any resumes yet. Add different resumes for different job types!
            </Typography>
          )}
          
          {/* Resume Upload Dialog */}
          <Dialog open={resumeDialogOpen} onClose={() => !uploadingResume && setResumeDialogOpen(false)}>
            <DialogTitle>Add Resume</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Resume Title"
                fullWidth
                variant="outlined"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder="e.g., Software Engineer Resume, Marketing Resume"
                helperText="Give your resume a descriptive title"
                sx={{ mb: 2, mt: 1 }}
              />
              {selectedResumeFile && (
                <Typography variant="body2">
                  Selected file: {selectedResumeFile.name}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setResumeDialogOpen(false)} disabled={uploadingResume}>Cancel</Button>
              <Button 
                onClick={handleResumeUpload} 
                variant="contained" 
                disabled={uploadingResume || !resumeTitle.trim()}
              >
                {uploadingResume ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                Upload
              </Button>
            </DialogActions>
          </Dialog>
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
