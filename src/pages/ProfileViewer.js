import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, Avatar, 
  Button, Grid, Card, CardContent, Divider,
  Chip, CircularProgress, Alert, Link
} from '@mui/material';
import { 
  Person, LocationOn, Work, Description, 
  BarChart, Share, Lock, ArrowBack
} from '@mui/icons-material';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { ref, getDownloadURL } from 'firebase/storage';

const ProfileViewer = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviews: 0,
    offers: 0,
    rejections: 0
  });

  const isOwnProfile = currentUser && userId === currentUser.uid;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch user profile
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        setProfile(userData);
        
        // Check if user has a resume
        try {
          const resumeRef = ref(storage, `resumes/${userId}`);
          const url = await getDownloadURL(resumeRef);
          setResumeUrl(url);
        } catch (storageError) {
          console.log('No resume found or error fetching resume:', storageError);
          // Not setting error since resume is optional
        }
        
        // Fetch user's applications (only if they share stats or it's the current user)
        if (userData.shareStats || isOwnProfile) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('userId', '==', userId),
            limit(100)
          );
          
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsData = applicationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Calculate statistics
          const totalApplications = applicationsData.length;
          const interviews = applicationsData.filter(app => 
            app.applicationStatus?.toLowerCase().includes('interview')).length;
          const offers = applicationsData.filter(app => 
            app.applicationStatus?.toLowerCase().includes('offer')).length;
          const rejections = applicationsData.filter(app => 
            app.applicationStatus?.toLowerCase().includes('reject')).length;
          
          setStats({
            totalApplications,
            interviews,
            offers,
            rejections
          });
          
          // Get 5 most recent applications
          const sortedApplications = [...applicationsData].sort((a, b) => {
            const dateA = a.dateApplied ? new Date(a.dateApplied) : new Date(0);
            const dateB = b.dateApplied ? new Date(b.dateApplied) : new Date(0);
            return dateB - dateA; // Sort in descending order (newest first)
          });
          
          setApplications(sortedApplications.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchProfile();
    }
  }, [userId, isOwnProfile, currentUser]);
  
  const getStatusColor = (status) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('offer')) return 'success';
    if (statusLower.includes('interview')) return 'warning';
    if (statusLower.includes('reject')) return 'error';
    return 'primary';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading profile...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBack />} 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBack />} 
        variant="outlined" 
        sx={{ mb: 2 }}
        onClick={() => navigate(-1)}
      >
        Go Back
      </Button>
      
      {profile && (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                src={profile.photoURL} 
                alt={profile.displayName || 'User'} 
                sx={{ width: 100, height: 100, mr: 3 }}
              >
                {profile.displayName?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {profile.displayName || 'User'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Work sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body1">
                    {profile.title || 'No job title specified'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1 }} fontSize="small" />
                  <Typography variant="body1">
                    {profile.location || 'No location specified'}
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  {profile.shareStats ? (
                    <Chip 
                      icon={<Share fontSize="small" />} 
                      label="Shares application stats" 
                      color="primary" 
                      size="small" 
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      icon={<Lock fontSize="small" />} 
                      label="Private stats" 
                      color="default" 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />
              Bio
            </Typography>
            <Typography variant="body1" paragraph>
              {profile.bio || 'No bio provided'}
            </Typography>
            
            {resumeUrl && (
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Resume
                </Button>
              </Box>
            )}
          </Paper>
          
          {(profile.shareStats || isOwnProfile) && (
            <>
              <Typography variant="h5" gutterBottom sx={{ mt: 4, display: 'flex', alignItems: 'center' }}>
                <BarChart sx={{ mr: 1 }} />
                Application Statistics
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Applications
                      </Typography>
                      <Typography variant="h3">
                        {stats.totalApplications}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Interviews
                      </Typography>
                      <Typography variant="h3">
                        {stats.interviews}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Offers
                      </Typography>
                      <Typography variant="h3" color="success.main">
                        {stats.offers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Rejections
                      </Typography>
                      <Typography variant="h3" color="error.main">
                        {stats.rejections}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Recent Applications
              </Typography>
              
              {applications.length > 0 ? (
                <Paper elevation={2} sx={{ p: 0, overflow: 'hidden' }}>
                  {applications.map((app, index) => (
                    <React.Fragment key={app.id}>
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6">{app.companyName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {app.jobTitle} • Applied on {formatDate(app.dateApplied)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={app.applicationStatus || 'Applied'} 
                          color={getStatusColor(app.applicationStatus)}
                          size="small"
                        />
                      </Box>
                      {index < applications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </Paper>
              ) : (
                <Alert severity="info">No recent applications to display</Alert>
              )}
            </>
          )}
          
          {!profile.shareStats && !isOwnProfile && (
            <Alert severity="info" sx={{ mt: 3 }}>
              This user has chosen not to share their application statistics.
            </Alert>
          )}
          
          {isOwnProfile && (
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/profile')}
              >
                Edit Your Profile
              </Button>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProfileViewer;
