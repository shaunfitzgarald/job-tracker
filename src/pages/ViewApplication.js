import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Business, 
  LocationOn, 
  Link as LinkIcon, 
  CalendarToday,
  Person,
  Email,
  Description,
  AttachMoney,
  Edit,
  ArrowBack,
  Work,
  EventAvailable,
  EventBusy,
  Notifications,
  Phone,
  Share,
  PersonAdd,
  Delete,
  Check
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const ViewApplication = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [emailToShare, setEmailToShare] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) {
        setError('No application ID provided');
        setLoading(false);
        return;
      }

      try {
        const applicationRef = doc(db, 'applications', id);
        const applicationSnap = await getDoc(applicationRef);
        
        if (applicationSnap.exists()) {
          const appData = {
            id: applicationSnap.id,
            ...applicationSnap.data(),
            // Convert any timestamps to dates
            applicationDate: applicationSnap.data().applicationDate?.toDate?.() || null,
            interviewDate: applicationSnap.data().interviewDate?.toDate?.() || null,
            followUpDate: applicationSnap.data().followUpDate?.toDate?.() || null,
            dateHeardBack: applicationSnap.data().dateHeardBack?.toDate?.() || null
          };
          
          setApplication(appData);
          
          // Load shared users if they exist
          if (appData.sharedWith && Array.isArray(appData.sharedWith)) {
            setSharedUsers(appData.sharedWith);
          }
        } else {
          setError('Application not found');
        }
      } catch (err) {
        console.error('Error fetching application:', err);
        setError('Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);
  
  const handleShareDialogOpen = () => {
    setShareDialogOpen(true);
  };
  
  const handleShareDialogClose = () => {
    setShareDialogOpen(false);
    setEmailToShare('');
    setSearchResults([]);
  };
  
  const searchUsersByEmail = async () => {
    if (!emailToShare.trim()) return;
    
    setSearchLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', emailToShare.trim()));
      const querySnapshot = await getDocs(q);
      
      const results = [];
      querySnapshot.forEach((doc) => {
        // Don't include current user or already shared users
        if (doc.id !== currentUser.uid && !sharedUsers.some(user => user.id === doc.id)) {
          results.push({
            id: doc.id,
            email: doc.data().email,
            displayName: doc.data().displayName || 'Unknown User'
          });
        }
      });
      
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching users:', err);
      setSnackbar({
        open: true,
        message: 'Error searching for users',
        severity: 'error'
      });
    } finally {
      setSearchLoading(false);
    }
  };
  
  const addSharedUser = async (user) => {
    if (!application) return;
    
    try {
      const newSharedUsers = [...sharedUsers, user];
      
      // Update in Firestore
      const applicationRef = doc(db, 'applications', id);
      await updateDoc(applicationRef, {
        sharedWith: newSharedUsers
      });
      
      // Update local state
      setSharedUsers(newSharedUsers);
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
      
      setSnackbar({
        open: true,
        message: `Shared with ${user.displayName || user.email}`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error sharing application:', err);
      setSnackbar({
        open: true,
        message: 'Failed to share application',
        severity: 'error'
      });
    }
  };
  
  const removeSharedUser = async (userId) => {
    if (!application) return;
    
    try {
      const newSharedUsers = sharedUsers.filter(user => user.id !== userId);
      
      // Update in Firestore
      const applicationRef = doc(db, 'applications', id);
      await updateDoc(applicationRef, {
        sharedWith: newSharedUsers
      });
      
      // Update local state
      setSharedUsers(newSharedUsers);
      
      setSnackbar({
        open: true,
        message: 'User removed from shared access',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error removing shared user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to remove user',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('offer') || statusLower.includes('accepted')) return 'success';
    if (statusLower.includes('interview') || statusLower.includes('screen')) return 'warning';
    if (statusLower.includes('reject') || statusLower.includes('declined')) return 'error';
    if (statusLower.includes('applied')) return 'primary';
    return 'default';
  };

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleEdit = () => {
    navigate(`/edit-application/${id}`);
  };

  const handleBack = () => {
    navigate('/applications');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleBack}
            sx={{ mt: 2 }}
          >
            Back to Applications
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            Application Details
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Edit />}
          onClick={() => navigate(`/edit-application/${application.id}`)}
          sx={{ mr: 1 }}
        >
          Edit
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Share />}
          onClick={handleShareDialogOpen}
          sx={{ mr: 1 }}
        >
          Share
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>

      {/* Company and Job Info */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  mr: 2
                }}
              >
                {application?.companyName?.charAt(0) || 'C'}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {application?.companyName || 'Company Name'}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {application?.jobTitle || 'Job Title'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              {application?.jobLocation && (
                <Chip 
                  icon={<LocationOn />} 
                  label={application.jobLocation}
                  variant="outlined"
                />
              )}
              {application?.employmentType && (
                <Chip 
                  icon={<Work />} 
                  label={application.employmentType}
                  variant="outlined"
                />
              )}
              {application?.salary && (
                <Chip 
                  icon={<AttachMoney />} 
                  label={`$${application.salary}`}
                  variant="outlined"
                  color="success"
                />
              )}
            </Box>
            
            {application?.jobPostingUrl && (
              <Button 
                variant="outlined" 
                startIcon={<LinkIcon />}
                href={application.jobPostingUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mb: 2 }}
              >
                View Job Posting
              </Button>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Application Status
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Chip 
                    label={application?.applicationStatus || 'Not Specified'}
                    color={getStatusColor(application?.applicationStatus)}
                    sx={{ fontSize: '1.2rem', py: 3, px: 2 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" align="center">
                  Last updated: {formatDate(application?.updatedAt || application?.applicationDate)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Timeline and Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Application Timeline
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              pl: 4,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '16px',
                top: 0,
                bottom: 0,
                width: '2px',
                bgcolor: 'divider'
              }
            }}>
              <Box sx={{ position: 'relative', mb: 3, pb: 2 }}>
                <Box sx={{ 
                  position: 'absolute',
                  left: '-24px',
                  top: 0,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'primary.main'
                }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  Application Submitted
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(application?.applicationDate)}
                </Typography>
              </Box>
              
              {application?.interviewDate && (
                <Box sx={{ position: 'relative', mb: 3, pb: 2 }}>
                  <Box sx={{ 
                    position: 'absolute',
                    left: '-24px',
                    top: 0,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: 'warning.main'
                  }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Interview Scheduled
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(application.interviewDate)}
                  </Typography>
                  {application?.interviewType && (
                    <Typography variant="body2">
                      Type: {application.interviewType}
                    </Typography>
                  )}
                </Box>
              )}
              
              {application?.followUpDate && (
                <Box sx={{ position: 'relative', mb: 3, pb: 2 }}>
                  <Box sx={{ 
                    position: 'absolute',
                    left: '-24px',
                    top: 0,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: 'info.main'
                  }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Follow-up Scheduled
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(application.followUpDate)}
                  </Typography>
                </Box>
              )}
              
              {application?.dateHeardBack && (
                <Box sx={{ position: 'relative', mb: 3, pb: 2 }}>
                  <Box sx={{ 
                    position: 'absolute',
                    left: '-24px',
                    top: 0,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: application?.applicationStatus?.toLowerCase().includes('offer') ? 'success.main' : 'error.main'
                  }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Response Received
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(application.dateHeardBack)}
                  </Typography>
                  <Typography variant="body2">
                    Outcome: {application?.outcome || application?.applicationStatus || 'Not specified'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <List>
              {application?.contactPerson && (
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contact Person" 
                    secondary={application.contactPerson} 
                  />
                </ListItem>
              )}
              {application?.contactEmail && (
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={application.contactEmail} 
                  />
                </ListItem>
              )}
              {application?.contactPhone && (
                <ListItem>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={application.contactPhone} 
                  />
                </ListItem>
              )}
            </List>
          </Paper>
          
          {application?.notes && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {application.notes}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={handleShareDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Share Application</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Share this application with other users to allow them to view and edit it.
            </Typography>
            
            {/* Search for users */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Search by email"
                variant="outlined"
                fullWidth
                value={emailToShare}
                onChange={(e) => setEmailToShare(e.target.value)}
                sx={{ mr: 1 }}
              />
              <Button 
                variant="contained" 
                onClick={searchUsersByEmail}
                disabled={searchLoading || !emailToShare.trim()}
              >
                {searchLoading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Box>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Search Results
                </Typography>
                <List dense>
                  {searchResults.map((user) => (
                    <ListItem key={user.id} secondaryAction={
                      <IconButton edge="end" onClick={() => addSharedUser(user)}>
                        <PersonAdd color="primary" />
                      </IconButton>
                    }>
                      <ListItemIcon>
                        <Avatar>{user.displayName?.[0] || user.email[0]}</Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={user.displayName || 'User'} 
                        secondary={user.email} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Currently Shared Users */}
            <Typography variant="subtitle2" gutterBottom>
              Currently Shared With
            </Typography>
            {sharedUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                This application is not shared with anyone yet.
              </Typography>
            ) : (
              <List dense>
                {sharedUsers.map((user) => (
                  <ListItem key={user.id} secondaryAction={
                    <IconButton edge="end" onClick={() => removeSharedUser(user.id)}>
                      <Delete color="error" />
                    </IconButton>
                  }>
                    <ListItemIcon>
                      <Avatar>{user.displayName?.[0] || user.email[0]}</Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.displayName || 'User'} 
                      secondary={user.email} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViewApplication;
