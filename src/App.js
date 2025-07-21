import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import AddApplication from './pages/AddApplication';
import EditApplication from './pages/EditApplication';
import ViewApplication from './pages/ViewApplication';
import PlannedApplications from './pages/PlannedApplications';
import Profile from './pages/Profile';
import UserView from './pages/UserView';
import ProfileViewer from './pages/ProfileViewer';
import ResumeViewer from './pages/ResumeViewer';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Components
import Layout from './components/Layout';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/applications" element={
              <ProtectedRoute>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/add-application" element={
              <ProtectedRoute>
                <Layout>
                  <AddApplication />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile-viewer" element={
              <ProtectedRoute>
                <Layout>
                  <ProfileViewer />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile-viewer/:userId" element={
              <ProtectedRoute>
                <Layout>
                  <ProfileViewer />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile-viewer/public" element={
              <ProtectedRoute>
                <Layout>
                  <ProfileViewer isPublic={true} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/edit-application/:id" element={
              <ProtectedRoute>
                <Layout>
                  <EditApplication />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/view-application/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ViewApplication />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/planned-applications" element={
              <ProtectedRoute>
                <Layout>
                  <PlannedApplications />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/user-view" element={
              <ProtectedRoute>
                <Layout>
                  <UserView />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/user-view/:userId" element={
              <ProtectedRoute>
                <Layout>
                  <UserView />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <div>
                    <h2>Settings</h2>
                    <p>Settings page content will be added here.</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/resumes" element={
              <ProtectedRoute>
                <Layout>
                  <ResumeViewer />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/resumes/:userId" element={
              <ProtectedRoute>
                <Layout>
                  <ResumeViewer />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
