import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Card,
  CardContent,
  Slider,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  Chip
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit, 
  CheckCircle, 
  RadioButtonUnchecked, 
  Link as LinkIcon,
  Business,
  CalendarToday,
  PriorityHigh,
  DragHandle,
  Save
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';

const PlannedApplications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [plannedJobs, setPlannedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [averageApplications, setAverageApplications] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobUrl: '',
    priority: 'Medium',
    plannedDate: new Date(),
    notes: ''
  });

  useEffect(() => {
    fetchPlannedJobs();
    fetchUserSettings();
    fetchApplicationHistory();
  }, [currentUser]);

  const fetchPlannedJobs = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const plannedJobsRef = collection(db, 'plannedApplications');
      // Remove orderBy to avoid composite index requirement
      const q = query(
        plannedJobsRef, 
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const jobs = [];
      
      querySnapshot.forEach((doc) => {
        jobs.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to JS Date objects
          plannedDate: doc.data().plannedDate?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || null
        });
      });
      
      // Sort in memory by plannedDate ascending
      const sortedJobs = [...jobs].sort((a, b) => {
        const dateA = a.plannedDate ? new Date(a.plannedDate) : new Date(0);
        const dateB = b.plannedDate ? new Date(b.plannedDate) : new Date(0);
        return dateA - dateB; // Sort in ascending order (earliest first)
      });
      
      setPlannedJobs(sortedJobs);
    } catch (err) {
      console.error('Error fetching planned jobs:', err);
      setError('Failed to load planned applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    if (!currentUser) return;

    try {
      const settingsRef = collection(db, 'userSettings');
      const q = query(settingsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const settingsData = querySnapshot.docs[0].data();
        if (settingsData.dailyApplicationGoal) {
          setDailyGoal(settingsData.dailyApplicationGoal);
        }
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
    }
  };

  const saveUserSettings = async (newDailyGoal) => {
    if (!currentUser) return;

    try {
      const settingsRef = collection(db, 'userSettings');
      const q = query(settingsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new settings document
        await addDoc(settingsRef, {
          userId: currentUser.uid,
          dailyApplicationGoal: newDailyGoal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing settings
        const settingsDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'userSettings', settingsDoc.id), {
          dailyApplicationGoal: newDailyGoal,
          updatedAt: serverTimestamp()
        });
      }
      
      setSnackbar({
        open: true,
        message: 'Daily goal updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error saving user settings:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update daily goal',
        severity: 'error'
      });
    }
  };

  const handleDialogOpen = (job = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        companyName: job.companyName || '',
        jobTitle: job.jobTitle || '',
        jobUrl: job.jobUrl || '',
        priority: job.priority || 'Medium',
        plannedDate: job.plannedDate || new Date(),
        notes: job.notes || ''
      });
    } else {
      setEditingJob(null);
      setFormData({
        companyName: '',
        jobTitle: '',
        jobUrl: '',
        priority: 'Medium',
        plannedDate: new Date(),
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingJob(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (args) => {
    if (args && args.value) {
      setFormData({
        ...formData,
        plannedDate: new Date(args.value)
      });
    }
  };

  const handleDailyGoalChange = (event, newValue) => {
    setDailyGoal(newValue);
  };
  
  // Fetch application history
  const fetchApplicationHistory = async () => {
    if (!currentUser) return;
    
    try {
      const plannedJobsRef = collection(db, 'plannedApplications');
      const q = query(
        plannedJobsRef, 
        where('userId', '==', currentUser.uid),
        where('status', '==', 'applied'),
        orderBy('appliedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const appliedJobs = [];
      
      querySnapshot.forEach((doc) => {
        appliedJobs.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to JS Date objects
          plannedDate: doc.data().plannedDate?.toDate() || null,
          appliedDate: doc.data().appliedDate?.toDate() || null,
          createdAt: doc.data().createdAt?.toDate() || null
        });
      });
      
      // Group applications by date
      const historyByDate = appliedJobs.reduce((acc, job) => {
        if (!job.appliedDate) return acc;
        
        const dateStr = job.appliedDate.toDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(job);
        return acc;
      }, {});
      
      // Convert to array format for display
      const historyArray = Object.keys(historyByDate).map(dateStr => ({
        date: new Date(dateStr),
        applications: historyByDate[dateStr],
        count: historyByDate[dateStr].length
      }));
      
      // Sort by date (newest first)
      historyArray.sort((a, b) => b.date - a.date);
      
      setApplicationHistory(historyArray);
      
      // Calculate average applications per day
      if (historyArray.length > 0) {
        const totalApplied = historyArray.reduce((sum, day) => sum + day.count, 0);
        setAverageApplications(totalApplied / historyArray.length);
      }
      
    } catch (err) {
      console.error('Error fetching application history:', err);
    }
  };

  const handleSaveDailyGoal = () => {
    saveUserSettings(dailyGoal);
  };

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.jobTitle) {
      setSnackbar({
        open: true,
        message: 'Company name and job title are required',
        severity: 'error'
      });
      return;
    }

    try {
      const plannedJobData = {
        userId: currentUser.uid,
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        jobUrl: formData.jobUrl,
        priority: formData.priority,
        plannedDate: formData.plannedDate,
        notes: formData.notes,
        status: 'planned', // planned, applied, skipped
        updatedAt: serverTimestamp()
      };

      if (editingJob) {
        // Update existing job
        await updateDoc(doc(db, 'plannedApplications', editingJob.id), {
          ...plannedJobData,
          updatedAt: serverTimestamp()
        });
        
        setSnackbar({
          open: true,
          message: 'Planned job updated successfully',
          severity: 'success'
        });
      } else {
        // Add new job
        plannedJobData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'plannedApplications'), plannedJobData);
        
        setSnackbar({
          open: true,
          message: 'Planned job added successfully',
          severity: 'success'
        });
      }

      handleDialogClose();
      fetchPlannedJobs();
    } catch (err) {
      console.error('Error saving planned job:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save planned job',
        severity: 'error'
      });
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, 'plannedApplications', jobId));
      
      setSnackbar({
        open: true,
        message: 'Planned job deleted successfully',
        severity: 'success'
      });
      
      fetchPlannedJobs();
    } catch (err) {
      console.error('Error deleting planned job:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete planned job',
        severity: 'error'
      });
    }
  };

  const handleMarkAsApplied = async (jobId) => {
    try {
      await updateDoc(doc(db, 'plannedApplications', jobId), {
        status: 'applied',
        appliedDate: new Date(),
        updatedAt: serverTimestamp()
      });
      
      setSnackbar({
        open: true,
        message: 'Job marked as applied',
        severity: 'success'
      });
      
      fetchPlannedJobs();
      fetchApplicationHistory(); // Refresh history after marking as applied
    } catch (err) {
      console.error('Error updating planned job:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update job status',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Group jobs by planned date
  const groupedJobs = plannedJobs.reduce((acc, job) => {
    const dateStr = job.plannedDate ? job.plannedDate.toDateString() : 'No Date';
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(job);
    return acc;
  }, {});

  // Calculate today's planned jobs
  const today = new Date().toDateString();
  const todaysJobs = groupedJobs[today] || [];
  const todaysCompletedJobs = todaysJobs.filter(job => job.status === 'applied').length;
  const todaysProgress = dailyGoal > 0 ? (todaysCompletedJobs / dailyGoal) * 100 : 0;

  // Auto-distribute function - assigns planned dates to jobs without dates
  const autoDistributeJobs = async () => {
    try {
      // Get jobs without planned dates or with dates in the past
      const jobsToDistribute = plannedJobs.filter(job => 
        job.status === 'planned' && 
        (!job.plannedDate || job.plannedDate < new Date().setHours(0, 0, 0, 0))
      );
      
      if (jobsToDistribute.length === 0) {
        setSnackbar({
          open: true,
          message: 'No jobs need to be distributed',
          severity: 'info'
        });
        return;
      }
      
      // Sort by priority
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      jobsToDistribute.sort((a, b) => {
        return priorityOrder[a.priority || 'Medium'] - priorityOrder[b.priority || 'Medium'];
      });
      
      // Calculate how many days we need
      const daysNeeded = Math.ceil(jobsToDistribute.length / dailyGoal);
      
      // Distribute jobs over days
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < jobsToDistribute.length; i++) {
        const dayIndex = Math.floor(i / dailyGoal);
        const distributionDate = new Date(currentDate);
        distributionDate.setDate(distributionDate.getDate() + dayIndex);
        
        await updateDoc(doc(db, 'plannedApplications', jobsToDistribute[i].id), {
          plannedDate: distributionDate,
          updatedAt: serverTimestamp()
        });
      }
      
      setSnackbar({
        open: true,
        message: `${jobsToDistribute.length} jobs distributed over ${daysNeeded} days`,
        severity: 'success'
      });
      
      fetchPlannedJobs();
    } catch (err) {
      console.error('Error distributing jobs:', err);
      setSnackbar({
        open: true,
        message: 'Failed to distribute jobs',
        severity: 'error'
      });
    }
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Planned Applications
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Add />}
          onClick={() => handleDialogOpen()}
        >
          Add Planned Job
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Daily Goal Setting */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Daily Application Goal
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Slider
              value={dailyGoal}
              onChange={handleDailyGoalChange}
              aria-labelledby="daily-goal-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={10}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography>
              Goal: {dailyGoal} applications per day
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<Save />}
              onClick={handleSaveDailyGoal}
            >
              Save Goal
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Today's Progress */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Today's Progress
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={todaysProgress} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {`${todaysCompletedJobs}/${dailyGoal}`}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={autoDistributeJobs}
              fullWidth
            >
              Auto-Distribute Jobs
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Application History */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application History
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">
            Average: <strong>{averageApplications.toFixed(1)}</strong> applications per day
          </Typography>
          
          <Chip 
            label={averageApplications >= dailyGoal ? "On Track" : "Below Target"}
            color={averageApplications >= dailyGoal ? "success" : "warning"}
          />
        </Box>
        
        {applicationHistory.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {applicationHistory.map((day) => (
              <ListItem key={day.date.toISOString()} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1">
                        {day.date.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      <Chip 
                        label={`${day.count} ${day.count === 1 ? 'application' : 'applications'}`}
                        color={day.count >= dailyGoal ? "success" : "default"}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {day.applications.slice(0, 3).map((app) => (
                        <Chip 
                          key={app.id}
                          label={`${app.companyName} - ${app.jobTitle}`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                      {day.applications.length > 3 && (
                        <Chip 
                          label={`+${day.applications.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No application history available yet.
          </Typography>
        )}
      </Paper>

      {/* Planned Jobs List */}
      {Object.keys(groupedJobs).length > 0 ? (
        Object.keys(groupedJobs).sort((a, b) => new Date(a) - new Date(b)).map(dateStr => (
          <Paper key={dateStr} elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {dateStr === new Date().toDateString() 
                ? 'Today' 
                : new Date(dateStr).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric'
                  })
              }
            </Typography>
            <List>
              {groupedJobs[dateStr].map((job) => (
                <ListItem
                  key={job.id}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: job.status === 'applied' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: job.status === 'applied' 
                        ? 'rgba(76, 175, 80, 0.2)' 
                        : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon>
                    {job.status === 'applied' ? (
                      <CheckCircle color="success" />
                    ) : (
                      <RadioButtonUnchecked />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                          variant="subtitle1"
                          sx={{ 
                            textDecoration: job.status === 'applied' ? 'line-through' : 'none',
                            color: job.status === 'applied' ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {job.companyName}
                        </Typography>
                        <Chip 
                          label={job.priority || 'Medium'} 
                          size="small"
                          color={
                            job.priority === 'High' ? 'error' : 
                            job.priority === 'Medium' ? 'warning' : 
                            'default'
                          }
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {job.jobTitle}
                        </Typography>
                        {job.jobUrl && (
                          <Tooltip title="Open job posting">
                            <IconButton 
                              size="small" 
                              href={job.jobUrl} 
                              target="_blank"
                              sx={{ ml: 1 }}
                            >
                              <LinkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {job.status !== 'applied' && (
                      <Tooltip title="Mark as applied">
                        <IconButton 
                          edge="end" 
                          aria-label="mark-applied"
                          onClick={() => handleMarkAsApplied(job.id)}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleDialogOpen(job)}
                        sx={{ ml: 1 }}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteJob(job.id)}
                        sx={{ ml: 1 }}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        ))
      ) : (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No planned applications yet. Add your first planned job!
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingJob ? 'Edit Planned Job' : 'Add Planned Job'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="companyName"
            label="Company Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.companyName}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="jobTitle"
            label="Job Title"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.jobTitle}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="jobUrl"
            label="Job Posting URL"
            type="url"
            fullWidth
            variant="outlined"
            value={formData.jobUrl}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Planned Application Date
            </Typography>
            <DatePickerComponent
              id="plannedDate"
              value={formData.plannedDate}
              change={handleDateChange}
              format="MM/dd/yyyy"
              placeholder="Select a date"
              cssClass="e-custom-datepicker"
              showClearButton={false}
              strictMode={false}
            />
          </Box>
          <TextField
            select
            margin="dense"
            name="priority"
            label="Priority"
            fullWidth
            variant="outlined"
            value={formData.priority}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </TextField>
          <TextField
            margin="dense"
            name="notes"
            label="Notes"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.notes}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Custom LinearProgress component
const LinearProgress = ({ variant, value, sx }) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: 'inherit',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${value}%`,
            height: '100%',
            bgcolor: 'primary.main',
            position: 'absolute',
            transition: 'width 0.4s ease-in-out',
          }}
        />
      </Box>
    </Box>
  );
};

export default PlannedApplications;
