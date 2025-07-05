import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    applicationReminders: true,
    followUpReminders: true,
    defaultPrivacy: 'private',
    defaultJobType: 'Full-time',
    theme: 'light'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get user settings from Firestore
        const settingsDocRef = doc(db, 'userSettings', currentUser.uid);
        const settingsDoc = await getDoc(settingsDocRef);
        
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [currentUser]);

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Update settings in Firestore
      const settingsDocRef = doc(db, 'userSettings', currentUser.uid);
      await setDoc(settingsDocRef, {
        ...settings,
        updatedAt: new Date()
      });
      
      setSuccess('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
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
        Settings
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleSwitchChange}
                    name="emailNotifications"
                    color="primary"
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Receive email notifications about your job applications
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.applicationReminders}
                    onChange={handleSwitchChange}
                    name="applicationReminders"
                    color="primary"
                  />
                }
                label="Application Reminders"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Get reminders to add new applications regularly
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.followUpReminders}
                    onChange={handleSwitchChange}
                    name="followUpReminders"
                    color="primary"
                  />
                }
                label="Follow-up Reminders"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Get reminders to follow up on applications after a certain period
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Default Settings
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Privacy</InputLabel>
                <Select
                  name="defaultPrivacy"
                  value={settings.defaultPrivacy}
                  onChange={handleSelectChange}
                  label="Default Privacy"
                >
                  <MenuItem value="private">Private (Only visible to you)</MenuItem>
                  <MenuItem value="public">Public (Share with community)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" display="block">
                Default privacy setting for new applications
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Job Type</InputLabel>
                <Select
                  name="defaultJobType"
                  value={settings.defaultJobType}
                  onChange={handleSelectChange}
                  label="Default Job Type"
                >
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Freelance">Freelance</MenuItem>
                  <MenuItem value="Internship">Internship</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  name="theme"
                  value={settings.theme}
                  onChange={handleSelectChange}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;
