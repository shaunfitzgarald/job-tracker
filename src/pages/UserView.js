import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search,
  Person,
  Edit,
  Visibility,
  Add,
  CheckCircle,
  Cancel,
  AccessTime,
  WorkOutline,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  AccumulationChartComponent, 
  AccumulationSeriesCollectionDirective, 
  AccumulationSeriesDirective,
  PieSeries,
  AccumulationLegend,
  AccumulationTooltip,
  AccumulationDataLabel,
  Inject
} from '@syncfusion/ej2-react-charts';

const UserView = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // User data
  const [selectedUser, setSelectedUser] = useState(null);
  const [userList, setUserList] = useState([]);
  
  // Application data
  const [applications, setApplications] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviews: 0,
    offers: 0,
    rejections: 0,
    notYetApplied: 0,
    applicationStarted: 0,
    pending: 0
  });
  const [applicationData, setApplicationData] = useState([]);
  
  // Load users who have opted to share their stats and applications shared with current user
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('shareStats', '==', true));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
          // Don't include current user in the list
          if (doc.id !== currentUser.uid) {
            users.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        
        setUserList(users);
        
        // Fetch applications shared with the current user
        await fetchSharedWithMeApplications();
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users who share their stats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentUser]);
  
  // Fetch applications that have been shared with the current user
  const fetchSharedWithMeApplications = async () => {
    if (!currentUser) return;
    
    try {
      const applicationsRef = collection(db, 'applications');
      const querySnapshot = await getDocs(applicationsRef);
      
      const sharedApps = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if this application has been shared with the current user
        if (data.sharedWith && 
            Array.isArray(data.sharedWith) && 
            data.sharedWith.some(user => user.id === currentUser.uid)) {
          sharedApps.push({
            id: doc.id,
            ...data,
            applicationDate: data.applicationDate?.toDate?.() || new Date(),
            interviewDateTime: data.interviewDateTime?.toDate?.() || null,
            followUpDate: data.followUpDate?.toDate?.() || null,
            dateHeardBack: data.dateHeardBack?.toDate?.() || null
          });
        }
      });
      
      // Sort by application date
      sharedApps.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
      
      setSharedWithMe(sharedApps);
    } catch (error) {
      console.error('Error fetching shared applications:', error);
    }
  };
  
  // Load specific user data if userId is provided in URL
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Get user profile
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        const userData = {
          id: userDoc.id,
          ...userDoc.data()
        };
        
        // Check if user has opted to share stats
        if (!userData.shareStats) {
          setError('This user has not opted to share their application statistics');
          setLoading(false);
          return;
        }
        
        setSelectedUser(userData);
        
        // Fetch user's applications
        await fetchUserApplications(userId);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Fetch applications for a specific user
  const fetchUserApplications = async (uid) => {
    try {
      const applicationsRef = collection(db, 'applications');
      // Remove orderBy to avoid composite index requirement
      const q = query(
        applicationsRef,
        where('userId', '==', uid)
      );
      
      const querySnapshot = await getDocs(q);
      const appData = [];
      
      querySnapshot.forEach((doc) => {
        appData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort in memory by applicationDate descending
      const sortedAppData = [...appData].sort((a, b) => {
        const dateA = a.applicationDate ? new Date(a.applicationDate) : new Date(0);
        const dateB = b.applicationDate ? new Date(b.applicationDate) : new Date(0);
        return dateB - dateA; // Sort in descending order (newest first)
      });
      
      setApplications(sortedAppData);
      
      // Calculate statistics
      const totalApplications = appData.length;
      const interviews = appData.filter(app => 
        app.applicationStatus?.toLowerCase().includes('interview')).length;
      const offers = appData.filter(app => 
        app.applicationStatus?.toLowerCase().includes('offer')).length;
      const rejections = appData.filter(app => 
        app.applicationStatus?.toLowerCase().includes('reject')).length;
      const notYetApplied = appData.filter(app => 
        app.applicationStatus?.toLowerCase().includes('not yet applied')).length;
      const applicationStarted = appData.filter(app => 
        app.applicationStatus?.toLowerCase().includes('application started')).length;
      const pending = totalApplications - interviews - offers - rejections - notYetApplied - applicationStarted;
      
      // Update stats
      setStats({
        totalApplications,
        interviews,
        offers,
        rejections,
        notYetApplied,
        applicationStarted,
        pending
      });
      
      // Prepare chart data
      const chartData = [
        { status: 'Not Yet Applied', count: notYetApplied, color: '#9c27b0' },
        { status: 'Application Started', count: applicationStarted, color: '#2196f3' },
        { status: 'Applied', count: pending, color: '#1976d2' },
        { status: 'Interview', count: interviews, color: '#ff9800' },
        { status: 'Offer', count: offers, color: '#4caf50' },
        { status: 'Rejected', count: rejections, color: '#f44336' }
      ];
      
      // Filter out zero counts
      let filteredChartData = chartData.filter(item => item.count > 0);
      
      // If no data, add a placeholder
      if (filteredChartData.length === 0) {
        filteredChartData = [{ status: 'No Data', count: 1, color: '#9e9e9e' }];
      }
      
      setApplicationData(filteredChartData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user applications:', error);
      setError('Failed to load application data');
      setLoading(false);
    }
  };
  
  // Handle user selection from the list
  const handleUserSelect = (userId) => {
    navigate(`/user-view/${userId}`);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Filter users based on search query
  const filteredUsers = userList.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.title?.toLowerCase().includes(searchLower) ||
      user.location?.toLowerCase().includes(searchLower)
    );
  });
  
  // Handle application action (complete/edit on behalf of user)
  const handleApplicationAction = (applicationId, action) => {
    if (action === 'edit') {
      navigate(`/edit-application/${applicationId}?userId=${selectedUser.id}`);
    } else if (action === 'view') {
      navigate(`/view-application/${applicationId}?userId=${selectedUser.id}`);
    }
  };
  
  // Handle add application for user
  const handleAddApplication = () => {
    navigate(`/add-application?userId=${selectedUser.id}`);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Dashboard View
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* User List Panel */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Users
            </Typography>
            
            <TextField
              fullWidth
              label="Search Users"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />
              }}
            />
            
            <List sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    disablePadding
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleUserSelect(user.id)}>
                        <Visibility />
                      </IconButton>
                    }
                  >
                    <ListItemButton 
                      selected={selectedUser?.id === user.id}
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.photoURL}>
                          {user.displayName?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.displayName || 'Anonymous User'} 
                        secondary={user.title || user.email}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No users found" 
                    secondary="Users who share their stats will appear here"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* User Dashboard Panel */}
        <Grid item xs={12} md={8} lg={9}>
          {selectedUser ? (
            <Box>
              {/* User Profile Header */}
              <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={selectedUser.photoURL}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  >
                    {selectedUser.displayName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      {selectedUser.displayName || 'Anonymous User'}
                    </Typography>
                    {selectedUser.title && (
                      <Typography variant="body1" color="text.secondary">
                        {selectedUser.title}
                      </Typography>
                    )}
                    {selectedUser.location && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.location}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddApplication}
                    >
                      Add Application
                    </Button>
                  </Box>
                </Box>
              </Paper>
              
              {/* Tabs for different sections */}
              <Box sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                  <Tab label="Users" />
                  <Tab label="Applications" disabled={!selectedUser} />
                  <Tab label="Shared With Me" disabled={sharedWithMe.length === 0} />
                </Tabs>
              </Box>
              
              {/* Dashboard Tab */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  {/* Stats Cards */}
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4} md={2}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText'
                          }}
                        >
                          <Typography variant="h5">{stats.totalApplications}</Typography>
                          <Typography variant="body2">Total Applications</Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6} sm={4} md={2}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: '#ff9800',
                            color: 'white'
                          }}
                        >
                          <Typography variant="h5">{stats.interviews}</Typography>
                          <Typography variant="body2">Interviews</Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6} sm={4} md={2}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: '#4caf50',
                            color: 'white'
                          }}
                        >
                          <Typography variant="h5">{stats.offers}</Typography>
                          <Typography variant="body2">Offers</Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6} sm={4} md={2}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: '#f44336',
                            color: 'white'
                          }}
                        >
                          <Typography variant="h5">{stats.rejections}</Typography>
                          <Typography variant="body2">Rejections</Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6} sm={4} md={2}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: '#9c27b0',
                            color: 'white'
                          }}
                        >
                          <Typography variant="h5">{stats.notYetApplied}</Typography>
                          <Typography variant="body2">Not Yet Applied</Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6} sm={4} md={2}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: '#2196f3',
                            color: 'white'
                          }}
                        >
                          <Typography variant="h5">{stats.applicationStarted}</Typography>
                          <Typography variant="body2">Started</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  {/* Application Status Chart */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Application Status
                      </Typography>
                      <Box sx={{ height: 300, width: '100%' }}>
                        {applicationData.length > 0 && (
                          <AccumulationChartComponent
                            id="user-application-chart"
                            tooltip={{ enable: true }}
                            legendSettings={{ visible: true, position: 'Bottom' }}
                            height="100%"
                            width="100%"
                          >
                            <Inject services={[PieSeries, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel]} />
                            <AccumulationSeriesCollectionDirective>
                              <AccumulationSeriesDirective
                                dataSource={applicationData}
                                xName='status'
                                yName='count'
                                pointColorMapping='color'
                                dataLabel={{
                                  visible: true,
                                  position: 'Inside',
                                  name: 'status',
                                  font: { fontWeight: '600' }
                                }}
                                radius='70%'
                              />
                            </AccumulationSeriesCollectionDirective>
                          </AccumulationChartComponent>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Recent Applications */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Applications
                      </Typography>
                      <List>
                        {applications.slice(0, 5).map((app) => (
                          <ListItem 
                            key={app.id}
                            secondaryAction={
                              <IconButton 
                                edge="end" 
                                onClick={() => handleApplicationAction(app.id, 'view')}
                              >
                                <Visibility />
                              </IconButton>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 
                                app.applicationStatus?.toLowerCase().includes('interview') ? '#ff9800' :
                                app.applicationStatus?.toLowerCase().includes('offer') ? '#4caf50' :
                                app.applicationStatus?.toLowerCase().includes('reject') ? '#f44336' :
                                app.applicationStatus?.toLowerCase().includes('not yet') ? '#9c27b0' :
                                app.applicationStatus?.toLowerCase().includes('started') ? '#2196f3' :
                                '#1976d2'
                              }}>
                                <WorkOutline />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={app.companyName}
                              secondary={
                                <React.Fragment>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {app.jobTitle}
                                  </Typography>
                                  {` — ${app.applicationStatus}`}
                                </React.Fragment>
                              }
                            />
                          </ListItem>
                        ))}
                        {applications.length === 0 && (
                          <ListItem>
                            <ListItemText
                              primary="No applications found"
                              secondary="This user hasn't added any applications yet"
                            />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              
              {/* Applications Tab */}
              {tabValue === 1 && (
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      All Applications
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddApplication}
                    >
                      Add Application
                    </Button>
                  </Box>
                  
                  {applications.length > 0 ? (
                    <List>
                      {applications.map((app) => (
                        <ListItem 
                          key={app.id}
                          sx={{ 
                            mb: 1, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="subtitle1" component="span">
                                  {app.companyName}
                                </Typography>
                                <Chip 
                                  label={app.applicationStatus} 
                                  size="small" 
                                  sx={{ ml: 1 }}
                                  color={
                                    app.applicationStatus?.toLowerCase().includes('interview') ? 'warning' :
                                    app.applicationStatus?.toLowerCase().includes('offer') ? 'success' :
                                    app.applicationStatus?.toLowerCase().includes('reject') ? 'error' :
                                    'primary'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" component="span">
                                  {app.jobTitle} {app.jobLocation && `• ${app.jobLocation}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Applied: {app.applicationDate ? new Date(app.applicationDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="View Details">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleApplicationAction(app.id, 'view')}
                                sx={{ mr: 1 }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Application">
                              <IconButton 
                                edge="end" 
                                onClick={() => handleApplicationAction(app.id, 'edit')}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No applications found for this user
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddApplication}
                        sx={{ mt: 2 }}
                      >
                        Add Their First Application
                      </Button>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          ) : (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Person sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Select a User
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose a user from the list to view their dashboard and applications
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserView;
