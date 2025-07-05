import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  WorkOutline, 
  CheckCircleOutline, 
  PendingOutlined, 
  CancelOutlined,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviews: 0,
    offers: 0,
    rejections: 0,
    pending: 0
  });
  const [applicationData, setApplicationData] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all applications
        let applicationsSnapshot;
        
        try {
          // First try to get applications with matching userId
          const userQuery = query(
            collection(db, 'applications')
          );
          applicationsSnapshot = await getDocs(userQuery);
        } catch (fetchError) {
          console.error('Error fetching applications:', fetchError);
          setError('Failed to fetch application data. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Process the data
        const applications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate statistics
        const totalApplications = applications.length;
        const interviews = applications.filter(app => 
          app.applicationStatus?.toLowerCase().includes('interview')).length;
        const offers = applications.filter(app => 
          app.applicationStatus?.toLowerCase().includes('offer')).length;
        const rejections = applications.filter(app => 
          app.applicationStatus?.toLowerCase().includes('reject')).length;
        const pending = totalApplications - interviews - offers - rejections;
        
        // Update stats
        setStats({
          totalApplications,
          interviews,
          offers,
          rejections,
          pending
        });
        
        // Prepare chart data
        const chartData = [
          { status: 'Applied', count: Math.max(0, totalApplications - interviews - offers - rejections), color: '#1976d2' },
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
        
        // Get 5 most recent applications for the Recent Applications section
        const sortedApplications = [...applications].sort((a, b) => {
          const dateA = a.dateApplied ? new Date(a.dateApplied) : new Date(0);
          const dateB = b.dateApplied ? new Date(b.dateApplied) : new Date(0);
          return dateB - dateA; // Sort in descending order (newest first)
        });
        
        setRecentApplications(sortedApplications.slice(0, 5));
      } catch (error) {
        console.error('Error processing application data:', error);
        setError('An error occurred while processing your data.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [currentUser]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {currentUser?.displayName || 'User'}
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : (
      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Application Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Applications
                    </Typography>
                    <Typography variant="h3">
                      {stats.totalApplications}
                    </Typography>
                    <WorkOutline />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Interviews
                    </Typography>
                    <Typography variant="h3">
                      {stats.interviews}
                    </Typography>
                    <PendingOutlined />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Offers
                    </Typography>
                    <Typography variant="h3" color="success.main">
                      {stats.offers}
                    </Typography>
                    <CheckCircleOutline color="success" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quick Actions
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mb: 1 }}
              onClick={() => navigate('/add-application')}
            >
              Add New Application
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mb: 1 }}
              onClick={() => navigate('/applications')}
            >
              View All Applications
            </Button>
            <Button variant="outlined" color="primary">
              Update Profile
            </Button>
          </Paper>
        </Grid>
        
        {/* Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Application Status
            </Typography>
            {applicationData && applicationData.length > 0 ? (
              <AccumulationChartComponent 
                id="application-chart"
                tooltip={{ enable: true }}
                legendSettings={{ visible: true, position: 'Right' }}
                key={applicationData.length} // Force re-render when data changes
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
                      name: 'status',
                      position: 'Inside'
                    }}
                  />
                </AccumulationSeriesCollectionDirective>
              </AccumulationChartComponent>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                <Typography variant="body1" color="text.secondary">
                  No application data to display
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Applications */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Applications
            </Typography>
            <Box sx={{ overflow: 'auto', height: '100%' }}>
              {recentApplications.length > 0 ? (
                recentApplications.map((app) => (
                  <Box 
                    key={app.id} 
                    sx={{ 
                      mb: 2, 
                      p: 1, 
                      cursor: 'pointer', 
                      '&:hover': { 
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: 1
                      } 
                    }}
                    onClick={() => navigate(`/edit-application/${app.id}`)}
                  >
                    <Typography variant="subtitle1">
                      {app.companyName || 'Unknown Company'}
                    </Typography>
                    <Typography variant="body2">
                      {app.jobTitle || 'Job Position'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applied on {app.dateApplied ? new Date(app.dateApplied).toLocaleDateString() : 'Unknown date'}
                    </Typography>
                    <Typography variant="body2" color={app.applicationStatus?.toLowerCase().includes('offer') ? 'success.main' : 
                                          app.applicationStatus?.toLowerCase().includes('reject') ? 'error.main' : 'text.secondary'}>
                      Status: {app.applicationStatus || 'Applied'}
                    </Typography>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                  No applications yet. Add your first job application!
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      )}
    </Container>
  );
};

export default Dashboard;
