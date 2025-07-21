import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Description,
  Download,
  Person,
  ArrowBack,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const ResumeViewer = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  // Determine if we're viewing our own resumes or someone else's
  const isOwnProfile = !userId || (currentUser && userId === currentUser.uid);
  
  useEffect(() => {
    // Don't try to fetch data until we know if user is authenticated or not
    if (currentUser === undefined) {
      return; // Auth is still initializing, wait
    }
    
    const fetchUserAndResumes = async () => {
      try {
        setLoading(true);
        
        // Determine which user ID to use
        const targetUserId = userId || (currentUser ? currentUser.uid : null);
        
        if (!targetUserId) {
          setError('You need to be logged in to view resumes');
          setLoading(false);
          return;
        }
        
        // Fetch user data
        const userDocRef = doc(db, 'users', targetUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        
        // Create a safe user object without any potential circular references
        const safeUser = {
          id: targetUserId,
          displayName: userData.displayName || 'User',
          photoURL: userData.photoURL || '',
          title: userData.title || '',
          email: userData.email || '',
          bio: userData.bio || '',
          location: userData.location || '',
          shareStats: userData.shareStats || false
        };
        
        setUser(safeUser);
        
        // Fetch resumes - ensure we're dealing with a valid array
        if (userData.resumes && Array.isArray(userData.resumes)) {
          // Create a safe copy of the resumes array with plain objects
          const safeResumes = userData.resumes.map(resume => ({
            id: resume.id || '',
            title: resume.title || 'Untitled Resume',
            fileName: resume.fileName || '',
            storedFileName: resume.storedFileName || '',
            url: resume.url || '',
            uploadedAt: resume.uploadedAt || Date.now()
          }));
          
          setResumes(safeResumes);
          
          // If there are resumes, select the first one by default
          if (safeResumes.length > 0) {
            setSelectedResume(safeResumes[0]);
          }
        } else {
          // Initialize with empty array if no resumes or invalid format
          setResumes([]);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndResumes();
  }, [userId, currentUser]);
  
  const handleResumeSelect = (resume) => {
    setSelectedResume(resume);
  };
  
  const handleViewResume = () => {
    if (selectedResume) {
      // For PDF files, open in viewer
      if (selectedResume.fileName.toLowerCase().endsWith('.pdf')) {
        setViewerOpen(true);
      } else {
        // For other file types, open in a new tab
        window.open(selectedResume.url, '_blank');
      }
    }
  };
  
  const handleCloseViewer = () => {
    setViewerOpen(false);
  };
  
  const handleBack = () => {
    if (userId && userId !== currentUser?.uid) {
      navigate(`/user-view/${userId}`);
    } else {
      navigate('/profile');
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
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />} 
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isOwnProfile ? 'My Resumes' : `${user?.displayName}'s Resumes`}
        </Typography>
      </Box>
      
      {resumes.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            {isOwnProfile 
              ? 'You haven\'t uploaded any resumes yet. Go to your profile to add resumes.'
              : `${user?.displayName} hasn't uploaded any resumes yet.`
            }
          </Typography>
          {isOwnProfile && (
            <Button 
              variant="contained" 
              component={Link} 
              to="/profile" 
              sx={{ mt: 2 }}
            >
              Go to Profile
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Resumes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {resumes.map((resume) => (
                  <ListItem 
                    key={resume.id}
                    button
                    selected={selectedResume && selectedResume.id === resume.id}
                    onClick={() => handleResumeSelect(resume)}
                  >
                    <ListItemIcon>
                      <Description />
                    </ListItemIcon>
                    <ListItemText 
                      primary={resume.title} 
                      secondary={resume.fileName}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              {selectedResume ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {selectedResume.title}
                    </Typography>
                    <Box>
                      <Tooltip title="View Resume">
                        <IconButton 
                          color="primary" 
                          onClick={handleViewResume}
                          sx={{ mr: 1 }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Resume">
                        <IconButton 
                          component="a" 
                          href={selectedResume.url} 
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Filename: {selectedResume.fileName}
                    </Typography>
                    {selectedResume.uploadedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Uploaded: {new Date(selectedResume.uploadedAt).toLocaleDateString()}
                      </Typography>
                    )}
                    <Chip 
                      label={selectedResume.fileName.split('.').pop().toUpperCase()} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Click "View Resume" to open the document
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Visibility />}
                      onClick={handleViewResume}
                      sx={{ mt: 1 }}
                    >
                      View Resume
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Select a resume from the list to view details
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* PDF Viewer Dialog */}
      <Dialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {selectedResume?.title}
            <IconButton onClick={handleCloseViewer}>
              <ArrowBack />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedResume && (
            <Box sx={{ height: '70vh' }}>
              <iframe
                src={`${selectedResume.url}#toolbar=0&navpanes=0`}
                width="100%"
                height="100%"
                title={selectedResume.title}
                style={{ border: 'none' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewer}>Close</Button>
          <Button 
            component="a" 
            href={selectedResume?.url} 
            download
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            startIcon={<Download />}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ResumeViewer;
