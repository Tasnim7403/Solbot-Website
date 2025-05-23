import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  Visibility as SupervisionIcon,
  Error as AnomalyIcon,
  Description as ReportsIcon,
  Settings as SettingsIcon,
  ExitToApp as SignOutIcon,
  Close as CloseIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import solbotLogo from '../../assets/images/solbot-logo.png';
import { logout } from '../../services/authService';

const SidebarContainer = styled(Box)<{ ismobile?: boolean }>((props) => ({
  width: '240px',
  height: '100vh',
  backgroundColor: '#000080',
  color: 'white',
  position: 'fixed',
  left: 0,
  top: 0,
  padding: '20px',
  overflowY: 'auto',
  zIndex: 1200,
  transition: 'transform 0.3s ease',
  display: props.ismobile ? 'none' : 'block',
}));

const Logo = styled.img`
  width: 72px;
  height: auto;
  margin-right: 24px;
`;

const SidebarTitle = styled(Typography)`
  font-size: 52px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: white;
  line-height: 1.1;
`;

const StyledListItem = styled(ListItem)<{ active?: boolean }>`
  border-radius: 8px;
  margin-bottom: 32px;
  cursor: pointer;
  padding: 16px 20px;
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const DrawerHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Map/Location', icon: <LocationIcon />, path: '/map' },
  { text: 'Supervision', icon: <SupervisionIcon />, path: '/supervision' },
  { text: 'Anomaly Detection History', icon: <AnomalyIcon />, path: '/anomalies' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Staff Management', icon: <GroupIcon />, path: '/staff' },
];

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [loading, setLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      handleDrawerToggle();
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setLogoutDialogOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SidebarContainer ismobile={isMobile}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Logo src={solbotLogo} alt="SolBot Logo" />
            <SidebarTitle variant="h5">
              SolBot
            </SidebarTitle>
          </Box>
          {isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        <List sx={{ mb: 8, px: 2 }}>
          {menuItems.map((item) => (
            <StyledListItem
              key={item.text}
              active={currentPath === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  sx: { 
                    fontSize: '16px',
                    fontWeight: currentPath === item.path ? 600 : 400
                  }
                }}
              />
            </StyledListItem>
          ))}
        </List>

        <Box sx={{ position: 'absolute', bottom: 32, width: 'calc(100% - 40px)' }}>
          <StyledListItem onClick={() => handleNavigation('/settings')}>
            <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Settings"
              primaryTypographyProps={{
                sx: { 
                  fontSize: '16px',
                  fontWeight: currentPath === '/settings' ? 600 : 400
                }
              }}
            />
          </StyledListItem>
          <StyledListItem onClick={() => setLogoutDialogOpen(true)} sx={{ mb: 0 }}>
            <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : <SignOutIcon />}
            </ListItemIcon>
            <ListItemText 
              primary="Sign Out"
              primaryTypographyProps={{
                sx: { fontSize: '16px' }
              }}
            />
          </StyledListItem>
        </Box>

        <Dialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          aria-labelledby="logout-dialog-title"
        >
          <DialogTitle id="logout-dialog-title">Sign Out</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to sign out?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogoutDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleLogout} 
              color="primary" 
              autoFocus
              variant="contained"
            >
              Sign Out
            </Button>
          </DialogActions>
        </Dialog>
      </SidebarContainer>

      <Drawer
        variant="temporary"
        open={isMobile && mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 240,
            backgroundColor: '#000080',
            color: 'white',
            boxSizing: 'border-box',
            padding: '20px',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Logo src={solbotLogo} alt="SolBot Logo" />
            <SidebarTitle variant="h5">
              SolBot
            </SidebarTitle>
          </Box>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ mb: 8, px: 2 }}>
          {menuItems.map((item) => (
            <StyledListItem
              key={item.text}
              active={currentPath === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  sx: { 
                    fontSize: '16px',
                    fontWeight: currentPath === item.path ? 600 : 400
                  }
                }}
              />
            </StyledListItem>
          ))}
        </List>

        <Box sx={{ position: 'absolute', bottom: 32, width: 'calc(100% - 40px)' }}>
          <StyledListItem onClick={() => handleNavigation('/settings')}>
            <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Settings"
              primaryTypographyProps={{
                sx: { 
                  fontSize: '16px',
                  fontWeight: currentPath === '/settings' ? 600 : 400
                }
              }}
            />
          </StyledListItem>
          <StyledListItem onClick={() => setLogoutDialogOpen(true)} sx={{ mb: 0 }}>
            <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : <SignOutIcon />}
            </ListItemIcon>
            <ListItemText 
              primary="Sign Out"
              primaryTypographyProps={{
                sx: { fontSize: '16px' }
              }}
            />
          </StyledListItem>
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;