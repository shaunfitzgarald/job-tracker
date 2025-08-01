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
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
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
  const [metrics, setMetrics] = useState({
    interviewRate: 0,
    responseRate: 0,
    rejectionRate: 0,
    offerRate: 0,
    averageResponseTime: 0
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
          // Get applications with matching userId - without orderBy to avoid composite index requirement
          const userQuery = query(
            collection(db, 'applications'),
            where('userId', '==', currentUser.uid)
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
        const notYetApplied = applications.filter(app => 
          app.applicationStatus?.toLowerCase().includes('not yet applied')).length;
        const applicationStarted = applications.filter(app => 
          app.applicationStatus?.toLowerCase().includes('application started')).length;
        const pending = totalApplications - interviews - offers - rejections - notYetApplied - applicationStarted;
        
        // Calculate responses (heard back)
        const responsesReceived = applications.filter(app => 
          app.dateHeardBack || 
          app.applicationStatus?.toLowerCase().includes('interview') || 
          app.applicationStatus?.toLowerCase().includes('offer') || 
          app.applicationStatus?.toLowerCase().includes('reject')).length;
        
        // Calculate advanced metrics
        const interviewRate = totalApplications > 0 ? (interviews / totalApplications) * 100 : 0;
        const responseRate = totalApplications > 0 ? (responsesReceived / totalApplications) * 100 : 0;
        const rejectionRate = responsesReceived > 0 ? (rejections / responsesReceived) * 100 : 0;
        const offerRate = totalApplications > 0 ? (offers / totalApplications) * 100 : 0;
        
        // Calculate average response time (in days)
        let totalResponseTime = 0;
        let applicationsWithResponseTime = 0;
        
        applications.forEach(app => {
          if (app.dateApplied && app.dateHeardBack) {
            const appliedDate = new Date(app.dateApplied);
            const heardBackDate = new Date(app.dateHeardBack);
            const diffTime = Math.abs(heardBackDate - appliedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0) {
              totalResponseTime += diffDays;
              applicationsWithResponseTime++;
            }
          }
        });
        
        const averageResponseTime = applicationsWithResponseTime > 0 ? 
          Math.round(totalResponseTime / applicationsWithResponseTime) : 0;
        
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
        
        // Update metrics
        setMetrics({
          interviewRate: parseFloat(interviewRate.toFixed(1)),
          responseRate: parseFloat(responseRate.toFixed(1)),
          rejectionRate: parseFloat(rejectionRate.toFixed(1)),
          offerRate: parseFloat(offerRate.toFixed(1)),
          averageResponseTime
        });
        
        // Prepare chart data
        const chartData = [
          { status: 'Not Yet Applied', count: notYetApplied, color: '#9c27b0' },
          { status: 'Application Started', count: applicationStarted, color: '#2196f3' },
          { status: 'Applied', count: Math.max(0, pending), color: '#1976d2' },
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
              <Grid item xs={6} md={4}>
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
              <Grid item xs={6} md={4}>
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
              <Grid item xs={6} md={4}>
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
              <Grid item xs={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Rejections
                    </Typography>
                    <Typography variant="h3" color="error.main">
                      {stats.rejections}
                    </Typography>
                    <CancelOutlined color="error" />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending
                    </Typography>
                    <Typography variant="h3" color="text.secondary">
                      {stats.pending}
                    </Typography>
                    <PendingOutlined color="action" />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Response Rate
                    </Typography>
                    <Typography variant="h3" color="info.main">
                      {metrics.responseRate}%
                    </Typography>
                    <TrendingUp color="info" />
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
        
        {/* Chart - Full Width */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 700 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Application Status
            </Typography>
            {applicationData && Array.isArray(applicationData) && applicationData.length > 0 ? (
              <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
                {/* Wrap chart in error boundary */}
                {(() => {
                  try {
                    return (
                      <AccumulationChartComponent 
                        id="application-chart"
                        tooltip={{ enable: true }}
                        legendSettings={{ 
                          visible: true, 
                          position: 'Right', 
                          textStyle: { size: '18px', fontWeight: '500' },
                          width: '200px'
                        }}
                        key={applicationData.length} // Force re-render when data changes
                        height="100%"
                        width="100%"
                        background="transparent"
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
                              position: 'Inside',
                              font: {
                                fontWeight: '600',
                                size: '18px'
                              },
                              template: '${point.x}: ${point.y}'
                            }}
                            radius='100%'
                            innerRadius='0%'
                            explode={true}
                            explodeOffset='5%'
                            explodeIndex={0}
                          />
                        </AccumulationSeriesCollectionDirective>
                      </AccumulationChartComponent>
                    );
                  } catch (error) {
                    console.error('Error rendering chart:', error);
                    return (
                      <Typography variant="body1" color="error">
                        Error rendering chart. Please try refreshing the page.
                      </Typography>
                    );
                  }
                })()} 
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                <Typography variant="body1" color="text.secondary">
                  No application data to display
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Applications and Quick Actions - Side by Side */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
                          {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : 'No date'} - {app.applicationStatus || 'Status unknown'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                      No recent applications
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}>
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
          </Grid>
        </Grid>
      </Grid>
      )}

      {/* Advanced Metrics Section */}
      {!loading && !error && stats.totalApplications > 0 && (
        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Job Search Metrics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Interview Rate</Typography>
                <Typography variant="h4" color="primary">{metrics.interviewRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.interviewRate > 15 ? 'Great!' : metrics.interviewRate > 8 ? 'Good' : 'Room for improvement'} 
                  The average interview rate is typically 8-12%.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Response Rate</Typography>
                <Typography variant="h4" color="info.main">{metrics.responseRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.responseRate > 50 ? 'Excellent!' : metrics.responseRate > 30 ? 'Good' : 'Keep improving'} 
                  Typical response rates range from 30-60%.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Offer Rate</Typography>
                <Typography variant="h4" color="success.main">{metrics.offerRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.offerRate > 5 ? 'Outstanding!' : metrics.offerRate > 2 ? 'Good' : 'Keep going'} 
                  The average offer rate is typically 2-5%.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Rejection Rate</Typography>
                <Typography variant="h4" color="error.main">{metrics.rejectionRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.rejectionRate < 70 ? 'Good' : 'Typical'} 
                  Don't be discouraged - rejection is part of the process.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Avg. Response Time</Typography>
                <Typography variant="h4">{metrics.averageResponseTime} days</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.averageResponseTime < 14 ? 'Quick responses!' : 'Typical response time'} 
                  Most companies respond within 1-3 weeks.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Applications to Offer</Typography>
                <Typography variant="h4">
                  {stats.offers > 0 ? Math.round(stats.totalApplications / stats.offers) : '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applications needed per job offer. Typical range is 20-50.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;
