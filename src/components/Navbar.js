import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Box,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard, 
  Work, 
  Add, 
  Person, 
  Settings, 
  Logout,
  Description 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Applications', icon: <Work />, path: '/applications' },
    { text: 'Add Application', icon: <Add />, path: '/add-application' },
    { text: 'Resumes', icon: <Description />, path: '/resumes' },
  ];
  
  const accountItems = [
    { text: 'Profile', icon: <Person />, path: '/profile' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];
  
  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Job Tracker
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {accountItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><Logout /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {currentUser && isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to={currentUser ? "/dashboard" : "/"}
              sx={{ textTransform: 'none', fontSize: '1.25rem' }}
            >
              Job Tracker
            </Button>
          </Typography>
          
          {currentUser ? (
            <>
              {!isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {menuItems.map((item) => (
                    <Button 
                      key={item.text}
                      color="inherit" 
                      component={RouterLink} 
                      to={item.path}
                      startIcon={item.icon}
                      sx={{ mx: 1 }}
                    >
                      {item.text}
                    </Button>
                  ))}
                  
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    {currentUser?.photoURL ? (
                      <Avatar 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || 'User'}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <Person />
                    )}
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    {accountItems.map((item) => (
                      <MenuItem 
                        key={item.text} 
                        onClick={() => {
                          handleClose();
                          navigate(item.path);
                        }}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText>{item.text}</ListItemText>
                      </MenuItem>
                    ))}
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon><Logout /></ListItemIcon>
                      <ListItemText>Logout</ListItemText>
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </>
          ) : (
            <Box>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Mobile drawer */}
      {currentUser && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerToggle}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Navbar;
