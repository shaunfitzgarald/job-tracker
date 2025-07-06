import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  TrendingUp, 
  EmojiEvents, 
  Group, 
  CompareArrows,
  Speed
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  ChartComponent, 
  SeriesCollectionDirective, 
  SeriesDirective, 
  Inject, 
  Legend, 
  Category, 
  Tooltip, 
  DataLabel, 
  ColumnSeries,
  LineSeries
} from '@syncfusion/ej2-react-charts';

const Analytics = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFrame, setTimeFrame] = useState('30days');
  const [myStats, setMyStats] = useState({
    totalApplications: 0,
    interviews: 0,
    offers: 0,
    rejections: 0,
    responseRate: 0,
    averageResponseTime: 0
  });
  const [communityStats, setCommunityStats] = useState({
    totalApplications: 0,
    interviews: 0,
    offers: 0,
    rejections: 0,
    responseRate: 0,
    averageResponseTime: 0
  });
  const [topCompanies, setTopCompanies] = useState([]);
  const [applicationTrends, setApplicationTrends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        setError('Please log in to view analytics data.');
        return;
      }

      try {
        // Get date range based on selected time frame
        const getDateRange = () => {
          const now = new Date();
          const startDate = new Date();
          
          switch(timeFrame) {
            case '7days':
              startDate.setDate(now.getDate() - 7);
              break;
            case '30days':
              startDate.setDate(now.getDate() - 30);
              break;
            case '90days':
              startDate.setDate(now.getDate() - 90);
              break;
            case '1year':
              startDate.setFullYear(now.getFullYear() - 1);
              break;
            default:
              startDate.setDate(now.getDate() - 30);
          }
          
          return { startDate, endDate: now };
        };
        
        const { startDate } = getDateRange();
        
        // Fetch user's applications
        // Remove orderBy to avoid requiring composite index
        const userAppsQuery = query(
          collection(db, 'applications'),
          where('userId', '==', currentUser.uid)
        );
        
        const userAppsSnapshot = await getDocs(userAppsQuery);
        let userApps = userAppsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          applicationDate: doc.data().applicationDate?.toDate?.() || new Date(doc.data().applicationDate) || new Date()
        }));
        
        // Filter by date and sort in memory instead of using Firestore orderBy
        userApps = userApps
          .filter(app => app.applicationDate >= startDate)
          .sort((a, b) => b.applicationDate - a.applicationDate);
        
        // Calculate user stats
        const interviews = userApps.filter(app => 
          ['Phone Screen', 'Interview', 'Technical Interview'].includes(app.applicationStatus)
        ).length;
        
        const offers = userApps.filter(app => 
          ['Offer', 'Accepted'].includes(app.applicationStatus)
        ).length;
        
        const rejections = userApps.filter(app => 
          ['Rejected', 'Declined'].includes(app.applicationStatus)
        ).length;
        
        const responseRate = userApps.length > 0 
          ? ((interviews + offers + rejections) / userApps.length * 100).toFixed(1) 
          : 0;
        
        setMyStats({
          totalApplications: userApps.length,
          interviews,
          offers,
          rejections,
          responseRate,
          averageResponseTime: 7 // Mock data - would calculate from actual timestamps
        });
        
        // Fetch public applications for community stats
        // Remove orderBy to avoid requiring composite index
        const publicAppsQuery = query(
          collection(db, 'applications'),
          where('isPublic', '==', true)
        );
        
        const publicAppsSnapshot = await getDocs(publicAppsQuery);
        const publicApps = publicAppsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate community stats
        const communityInterviews = publicApps.filter(app => 
          ['Phone Screen', 'Interview', 'Technical Interview'].includes(app.applicationStatus)
        ).length;
        
        const communityOffers = publicApps.filter(app => 
          ['Offer', 'Accepted'].includes(app.applicationStatus)
        ).length;
        
        const communityRejections = publicApps.filter(app => 
          ['Rejected', 'Declined'].includes(app.applicationStatus)
        ).length;
        
        const communityResponseRate = publicApps.length > 0 
          ? ((communityInterviews + communityOffers + communityRejections) / publicApps.length * 100).toFixed(1) 
          : 0;
        
        setCommunityStats({
          totalApplications: publicApps.length,
          interviews: communityInterviews,
          offers: communityOffers,
          rejections: communityRejections,
          responseRate: communityResponseRate,
          averageResponseTime: 9 // Mock data
        });
        
        // Calculate top companies
        const companyCount = {};
        publicApps.forEach(app => {
          if (!companyCount[app.companyName]) {
            companyCount[app.companyName] = 0;
          }
          companyCount[app.companyName]++;
        });
        
        const sortedCompanies = Object.entries(companyCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([company, count]) => ({ company, count }));
        
        setTopCompanies(sortedCompanies);
        
        // Generate application trends (mock data for now)
        // In a real app, we would aggregate by date
        const trends = [
          { month: 'Jan', applications: 12, interviews: 5 },
          { month: 'Feb', applications: 19, interviews: 8 },
          { month: 'Mar', applications: 24, interviews: 10 },
          { month: 'Apr', applications: 18, interviews: 7 },
          { month: 'May', applications: 22, interviews: 9 },
          { month: 'Jun', applications: 29, interviews: 12 },
        ];
        
        setApplicationTrends(trends);
        
        // Generate leaderboard (mock data for now)
        // In a real app, we would aggregate by user
        const mockLeaderboard = [
          { name: 'Alex Johnson', applications: 45, interviews: 18, offers: 3 },
          { name: 'Sam Smith', applications: 38, interviews: 15, offers: 2 },
          { name: 'Jordan Lee', applications: 32, interviews: 12, offers: 1 },
          { name: currentUser.displayName || 'You', applications: userApps.length, interviews, offers },
          { name: 'Taylor Brown', applications: 25, interviews: 8, offers: 1 },
        ].sort((a, b) => b.applications - a.applications);
        
        setLeaderboard(mockLeaderboard);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, timeFrame]);

  const handleTimeFrameChange = (event) => {
    setTimeFrame(event.target.value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Analytics & Insights
        </Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Frame</InputLabel>
          <Select
            value={timeFrame}
            label="Time Frame"
            onChange={handleTimeFrameChange}
            size="small"
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="1year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Personal Stats */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Your Application Stats</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Applications
                </Typography>
                <Typography variant="h4">
                  {myStats.totalApplications}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Interviews
                </Typography>
                <Typography variant="h4">
                  {myStats.interviews}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Offers
                </Typography>
                <Typography variant="h4" color="success.main">
                  {myStats.offers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Rejections
                </Typography>
                <Typography variant="h4" color="error.main">
                  {myStats.rejections}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Response Rate
                </Typography>
                <Typography variant="h4">
                  {myStats.responseRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Avg. Response Time
                </Typography>
                <Typography variant="h4">
                  {myStats.averageResponseTime}d
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Community Comparison */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CompareArrows color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">How You Compare</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ mr: 2 }}>
                    {myStats.responseRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your Rate
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ mr: 2 }}>
                    {communityStats.responseRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Community Average
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {parseFloat(myStats.responseRate) > parseFloat(communityStats.responseRate) 
                      ? `You're getting ${(parseFloat(myStats.responseRate) - parseFloat(communityStats.responseRate)).toFixed(1)}% more responses than average!` 
                      : `You're getting ${(parseFloat(communityStats.responseRate) - parseFloat(myStats.responseRate)).toFixed(1)}% fewer responses than average.`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Interview to Offer Conversion
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ mr: 2 }}>
                    {myStats.interviews > 0 ? ((myStats.offers / myStats.interviews) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your Conversion
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ mr: 2 }}>
                    {communityStats.interviews > 0 ? ((communityStats.offers / communityStats.interviews) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Community Average
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {myStats.interviews > 0 && communityStats.interviews > 0 && 
                      ((myStats.offers / myStats.interviews) > (communityStats.offers / communityStats.interviews)) 
                      ? `You're converting ${(((myStats.offers / myStats.interviews) - (communityStats.offers / communityStats.interviews)) * 100).toFixed(1)}% more interviews to offers!` 
                      : `You're converting ${(((communityStats.offers / communityStats.interviews) - (myStats.offers / myStats.interviews)) * 100).toFixed(1)}% fewer interviews to offers.`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Application Trends */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Speed color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Application Trends</Typography>
        </Box>
        
        <Box sx={{ height: 350 }}>
          <ChartComponent 
            primaryXAxis={{ 
              valueType: 'Category',
              title: 'Month',
              labelIntersectAction: 'Rotate45'
            }}
            primaryYAxis={{ 
              title: 'Count',
              minimum: 0,
              interval: 5
            }}
            tooltip={{ enable: true }}
            legendSettings={{ visible: true }}
          >
            <Inject services={[ColumnSeries, LineSeries, Legend, Tooltip, DataLabel, Category]} />
            <SeriesCollectionDirective>
              <SeriesDirective 
                dataSource={applicationTrends} 
                xName='month' 
                yName='applications' 
                name='Applications' 
                type='Column'
                marker={{ dataLabel: { visible: true } }}
              />
              <SeriesDirective 
                dataSource={applicationTrends} 
                xName='month' 
                yName='interviews' 
                name='Interviews' 
                type='Line'
                marker={{ visible: true, dataLabel: { visible: true } }}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </Box>
      </Paper>
      
      {/* Leaderboard */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEvents color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Leaderboard</Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Applications</TableCell>
                    <TableCell align="right">Interviews</TableCell>
                    <TableCell align="right">Offers</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((user, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        backgroundColor: user.name === (currentUser.displayName || 'You') 
                          ? 'rgba(25, 118, 210, 0.08)' 
                          : 'inherit'
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {user.name}
                        {user.name === (currentUser.displayName || 'You') && (
                          <Chip size="small" label="You" color="primary" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell align="right">{user.applications}</TableCell>
                      <TableCell align="right">{user.interviews}</TableCell>
                      <TableCell align="right">{user.offers}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Top Companies */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Group color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Top Companies</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Most popular companies people are applying to:
            </Typography>
            
            {topCompanies.length > 0 ? (
              <Stack spacing={2}>
                {topCompanies.map((company, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1">{company.company}</Typography>
                      <Typography variant="body1">{company.count} applications</Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: `${(company.count / topCompanies[0].count) * 100}%`, 
                          height: '100%', 
                          backgroundColor: 'primary.main',
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                No data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
