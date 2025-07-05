import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DatePickerComponent as DatePicker, DateTimePickerComponent as DateTimePicker } from '@syncfusion/ej2-react-calendars';
import { useAuth } from '../context/AuthContext';

const ApplicationForm = ({ onSubmit, initialData = null }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(initialData || {
    companyName: '',
    hiring: 'Yes',
    jobTitle: '',
    jobLocation: '',
    jobType: 'Full-time',
    jobPostingUrl: '',
    applicationDate: new Date(),
    applicationStatus: 'Applied',
    interviewDateTime: null,
    interviewType: '',
    followUpDate: null,
    dateHeardBack: null,
    outcome: '',
    salary: '',
    salaryRange: '',
    contactPerson: '',
    contactEmail: '',
    notes: '',
    isPublic: false,
    userId: currentUser?.uid || ''
  });
  
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (field) => (args) => {
    if (args && args.value) {
      setFormData(prev => ({
        ...prev,
        [field]: args.value
      }));
    }
  };

  const handleTimeChange = (field) => (args) => {
    if (args && args.value) {
      setFormData(prev => ({ ...prev, [field]: args.value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Add current user ID if not present
    if (!formData.userId && currentUser) {
      formData.userId = currentUser.uid;
    }
    
    try {
      onSubmit(formData);
      
      // Reset form if it's a new application (no initialData)
      if (!initialData) {
        setFormData({
          companyName: '',
          hiring: 'Yes',
          jobTitle: '',
          jobLocation: '',
          jobType: 'Full-time',
          jobPostingUrl: '',
          applicationDate: new Date(),
          applicationStatus: 'Applied',
          interviewDateTime: null,
          interviewType: '',
          followUpDate: null,
          dateHeardBack: null,
          outcome: '',
          salary: '',
          salaryRange: '',
          contactPerson: '',
          contactEmail: '',
          notes: '',
          isPublic: false,
          userId: currentUser?.uid || ''
        });
      }
      
      setNotification({
        open: true,
        message: initialData ? 'Application updated successfully!' : 'Application added successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving application:', error);
      setNotification({
        open: true,
        message: 'Error saving application. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {initialData ? 'Edit Job Application' : 'Add New Job Application'}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              error={!!errors.companyName}
              helperText={errors.companyName}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Hiring</InputLabel>
              <Select
                name="hiring"
                value={formData.hiring}
                onChange={handleChange}
                label="Hiring"
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Job Title"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              error={!!errors.jobTitle}
              helperText={errors.jobTitle}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Job Location"
              name="jobLocation"
              value={formData.jobLocation}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                label="Job Type"
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Freelance">Freelance</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Job Posting URL"
              name="jobPostingUrl"
              value={formData.jobPostingUrl}
              onChange={handleChange}
              placeholder="https://example.com/job"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Application Date
              </Typography>
              <DatePicker 
                id="applicationDate"
                value={formData.applicationDate} 
                change={handleDateChange('applicationDate')}
                format="MM/dd/yyyy"
                placeholder="Select Date"
                floatLabelType="Auto"
                showClearButton={false}
                cssClass="e-custom-datepicker"
                strictMode={false}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Application Status</InputLabel>
              <Select
                name="applicationStatus"
                value={formData.applicationStatus}
                onChange={handleChange}
                label="Application Status"
              >
                <MenuItem value="Not Applied Yet">Not Applied Yet</MenuItem>
                <MenuItem value="Application Started">Application Started</MenuItem>
                <MenuItem value="Applied">Applied</MenuItem>
                <MenuItem value="Phone Screen">Phone Screen</MenuItem>
                <MenuItem value="Interview">Interview</MenuItem>
                <MenuItem value="Technical Interview">Technical Interview</MenuItem>
                <MenuItem value="Offer">Offer</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Accepted">Accepted</MenuItem>
                <MenuItem value="Declined">Declined</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Interview Date & Time
              </Typography>
              <DateTimePicker 
                id="interviewDateTime"
                value={formData.interviewDateTime} 
                change={handleDateChange('interviewDateTime')}
                format="MM/dd/yyyy HH:mm"
                placeholder="Select Date & Time"
                floatLabelType="Auto"
                showClearButton={false}
                cssClass="e-custom-datetimepicker"
                strictMode={false}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Interview Type</InputLabel>
              <Select
                name="interviewType"
                value={formData.interviewType}
                onChange={handleChange}
                label="Interview Type"
              >
                <MenuItem value="In Person">In Person</MenuItem>
                <MenuItem value="Phone">Phone</MenuItem>
                <MenuItem value="Video">Video</MenuItem>
                <MenuItem value="Technical">Technical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Follow Up Date
              </Typography>
              <DatePicker 
                id="followUpDate"
                value={formData.followUpDate} 
                change={handleDateChange('followUpDate')}
                format="MM/dd/yyyy"
                placeholder="Select Date"
                floatLabelType="Auto"
                showClearButton={false}
                cssClass="e-custom-datepicker"
                strictMode={false}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date Heard Back
              </Typography>
              <DatePicker 
                id="dateHeardBack"
                value={formData.dateHeardBack} 
                change={handleDateChange('dateHeardBack')}
                format="MM/dd/yyyy"
                placeholder="Select Date"
                floatLabelType="Auto"
                showClearButton={false}
                cssClass="e-custom-datepicker"
                strictMode={false}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Outcome</InputLabel>
              <Select
                name="outcome"
                value={formData.outcome}
                onChange={handleChange}
                label="Outcome"
              >
                <MenuItem value="">Not determined yet</MenuItem>
                <MenuItem value="Offer">Offer</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Withdrawn">Withdrawn</MenuItem>
                <MenuItem value="No Response">No Response</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Salary"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. $80,000"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Salary Range"
              name="salaryRange"
              value={formData.salaryRange}
              onChange={handleChange}
              placeholder="e.g. $80,000 - $100,000"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Contact Email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              type="email"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Share with others?</InputLabel>
              <Select
                name="isPublic"
                value={formData.isPublic}
                onChange={handleChange}
                label="Share with others?"
              >
                <MenuItem value={true}>Yes, share my application</MenuItem>
                <MenuItem value={false}>No, keep private</MenuItem>
              </Select>
              <FormHelperText>
                Sharing allows others to see your application stats (company name and status)
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Add any additional notes about this application"
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              fullWidth
            >
              {initialData ? 'Update Application' : 'Add Application'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ApplicationForm;
