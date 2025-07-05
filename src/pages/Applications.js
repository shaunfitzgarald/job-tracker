import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Search, 
  FilterList,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc, 
  orderBy,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  GridComponent, 
  ColumnsDirective, 
  ColumnDirective, 
  Page, 
  Sort, 
  Filter, 
  Group,
  Inject,
  Toolbar,
  Search as SyncSearch,
  Edit as SyncEdit
} from '@syncfusion/ej2-react-grids';

const Applications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get applications with matching userId only
        let applicationsData = [];
        
        const userQuery = query(
          collection(db, 'applications'),
          where('userId', '==', currentUser.uid),
          orderBy('applicationDate', 'desc')
        );
        
        const userQuerySnapshot = await getDocs(userQuery);
        applicationsData = userQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          applicationDate: doc.data().applicationDate?.toDate?.() || new Date()
        }));
        
        // Sort applications by date (since we can't use orderBy in the second query)
        applicationsData.sort((a, b) => {
          return new Date(b.applicationDate) - new Date(a.applicationDate);
        });
        
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser]);

  const handleAddNew = () => {
    navigate('/add-application');
  };

  const handleEdit = (id) => {
    navigate(`/edit-application/${id}`);
  };

  const handleDeleteClick = (application) => {
    setApplicationToDelete(application);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return;

    try {
      await deleteDoc(doc(db, 'applications', applicationToDelete.id));
      setApplications(prev => prev.filter(app => app.id !== applicationToDelete.id));
    } catch (error) {
      console.error('Error deleting application:', error);
    } finally {
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setApplicationToDelete(null);
  };

  const handleToggleVisibility = async (application) => {
    try {
      const appRef = doc(db, 'applications', application.id);
      await updateDoc(appRef, {
        isPublic: !application.isPublic
      });
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === application.id 
            ? { ...app, isPublic: !app.isPublic } 
            : app
        )
      );
    } catch (error) {
      console.error('Error updating application visibility:', error);
    }
  };

  const getStatusChip = (status) => {
    let color = 'default';
    
    switch(status) {
      case 'Applied':
        color = 'primary';
        break;
      case 'Phone Screen':
      case 'Interview':
      case 'Technical Interview':
        color = 'warning';
        break;
      case 'Offer':
      case 'Accepted':
        color = 'success';
        break;
      case 'Rejected':
      case 'Declined':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  const actionTemplate = (props) => {
    return (
      <Box>
        <IconButton size="small" onClick={() => handleEdit(props.id)}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => handleDeleteClick(props)}>
          <Delete fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => handleToggleVisibility(props)}>
          {props.isPublic ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
        </IconButton>
      </Box>
    );
  };

  const statusTemplate = (props) => {
    return getStatusChip(props.applicationStatus);
  };

  const dateTemplate = (props) => {
    return new Date(props.applicationDate).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Applications
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleAddNew}
        >
          Add New Application
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : applications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No applications found
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={handleAddNew}
            >
              Add Your First Application
            </Button>
          </Box>
        ) : (
          <Box sx={{ width: '100%', overflow: 'visible' }}>
            <GridComponent 
              dataSource={applications}
              allowPaging={true}
              allowSorting={true}
              allowFiltering={true}
              pageSettings={{ pageSize: 10 }}
              height='auto'
              toolbar={['Search']}
            >
              <ColumnsDirective>
                <ColumnDirective field='companyName' headerText='Company' width='150' />
                <ColumnDirective field='jobTitle' headerText='Position' width='200' />
                <ColumnDirective field='jobLocation' headerText='Location' width='150' />
                <ColumnDirective field='applicationStatus' headerText='Status' width='120' template={statusTemplate} />
                <ColumnDirective field='applicationDate' headerText='Applied On' width='120' format='yMd' template={dateTemplate} />
                <ColumnDirective field='id' headerText='Actions' width='120' template={actionTemplate} />
              </ColumnsDirective>
              <Inject services={[Page, Sort, Filter, Group, SyncSearch, Toolbar]} />
            </GridComponent>
          </Box>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your application for{' '}
            {applicationToDelete?.jobTitle} at {applicationToDelete?.companyName}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Applications;
