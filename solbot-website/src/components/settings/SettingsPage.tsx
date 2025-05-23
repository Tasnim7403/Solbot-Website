import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getUserProfile, updateUserProfile, updatePassword } from '../../services/authService';
import type { UserData, PasswordData } from '../../services/authService';
import Sidebar from '../dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  PhotoCamera as PhotoCameraIcon,
  Logout as LogoutIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../common/Header';
import axios from 'axios';

const StyledPaper = styled(Paper)`
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const StyledAvatar = styled(Avatar)`
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  background-color: #000080;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface UserProfile {
  name: string;
  email: string;
  role: string;
  profileImage: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface LocalPasswordData extends PasswordData {
  confirmPassword: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; read: boolean }>>([
    { id: 1, message: "New system update available", read: false },
    { id: 2, message: "Profile changes saved", read: false },
    { id: 3, message: "Security alert: New login detected", read: false }
  ]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    role: 'user',
    profileImage: ''
  });
  const [passwordData, setPasswordData] = useState<LocalPasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleNotificationRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getUserProfile();
        setUserProfile({
          name: response.name || '',
          email: response.email || '',
          role: 'user', // Default role since it's not in the User type
          profileImage: response.profileImage || '' // <-- Fix: use backend value
        });
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setSnackbar({
          open: true,
          message: 'Failed to load user profile',
          severity: 'error'
        });
      }
    };

    fetchUserProfile();
  }, []);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle profile form change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle password form change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validate profile form
  const validateProfileForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!userProfile.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!userProfile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      setLoading(true);
      const userData: UserData = {
        name: userProfile.name,
        email: userProfile.email
      };
      const updated = await updateUserProfile(userData);
      if (updateUser) updateUser({
        name: updated.name || '',
        email: updated.email || '',
        role: updated.role || 'user'
      });
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setLoading(true);
      const { currentPassword, newPassword } = passwordData;
      const updateData: PasswordData = {
        currentPassword,
        newPassword
      };
      await updatePassword(updateData);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSnackbar({
        open: true,
        message: 'Password updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to update password:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update password',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    // Send to backend with JWT in Authorization header
    try {
      const token = localStorage.getItem('token'); // or sessionStorage, or your app's state
      const res = await axios.post('http://localhost:5000/api/auth/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      // Optionally update avatar preview
      setUserProfile(prev => ({ ...prev, profileImage: res.data.profileImage }));
    } catch (err) {
      // Handle error
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <AppHeader 
        title="Settings" 
        onMenuClick={handleDrawerToggle}
      />

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        {notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={() => {
              handleNotificationRead(notification.id);
              handleNotificationsClose();
            }}
            sx={{
              bgcolor: notification.read ? 'transparent' : 'action.hover',
              '&:hover': {
                bgcolor: notification.read ? 'action.hover' : 'action.selected',
              },
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {notification.message}
              </Typography>
              {!notification.read && (
                <Typography variant="caption" color="primary">
                  New
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
        {notifications.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        )}
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { 
            mt: 1.5,
            minWidth: 200,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <PersonIcon sx={{ mr: 2 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <SecurityIcon sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          mt: '64px',
        }}
      >
        <StyledPaper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                },
              }}
            >
              <Tab
                icon={<PersonIcon />}
                label="Profile"
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              />
              <Tab
                icon={<SecurityIcon />}
                label="Security"
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <StyledAvatar src={userProfile.profileImage ? `http://localhost:5000${userProfile.profileImage}` : undefined}>
                {!userProfile.profileImage && (userProfile.name ? userProfile.name[0].toUpperCase() : <PersonIcon />)}
              </StyledAvatar>
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                sx={{
                  mt: 2,
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
                onClick={handleUploadClick}
              >
                Upload Photo
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Box>

            <form onSubmit={handleProfileUpdate}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={userProfile.name}
                      onChange={handleProfileChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputLabelProps={{ style: { fontSize: '1.25rem' } }}
                      inputProps={{ style: { fontSize: '1.25rem', height: 32, padding: '20px 14px' } }}
                      sx={{ fontSize: '1.25rem', height: 70 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={userProfile.email}
                      onChange={handleProfileChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputLabelProps={{ style: { fontSize: '1.25rem' } }}
                      inputProps={{ style: { fontSize: '1.25rem', height: 32, padding: '20px 14px' } }}
                      sx={{ fontSize: '1.25rem', height: 70 }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      fontSize: '1rem',
                      minWidth: 120,
                      minHeight: 36
                    }}
                  >
                    {loading ? <CircularProgress size={22} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handlePasswordUpdate}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    type={showCurrentPassword ? 'text' : 'password'}
                    label="Current Password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowCurrentPassword((show) => !show)}
                          edge="end"
                          sx={{ fontSize: 28 }}
                        >
                          {showCurrentPassword ? <VisibilityOff fontSize="large" /> : <Visibility fontSize="large" />}
                        </IconButton>
                      ),
                      sx: { fontSize: '1.25rem', height: 60 }
                    }}
                    InputLabelProps={{ style: { fontSize: '1.15rem' } }}
                    sx={{
                      fontSize: '1.25rem',
                      height: 60,
                      mb: 2
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowNewPassword((show) => !show)}
                          edge="end"
                          sx={{ fontSize: 28 }}
                        >
                          {showNewPassword ? <VisibilityOff fontSize="large" /> : <Visibility fontSize="large" />}
                        </IconButton>
                      ),
                      sx: { fontSize: '1.25rem', height: 60 }
                    }}
                    InputLabelProps={{ style: { fontSize: '1.15rem' } }}
                    sx={{
                      fontSize: '1.25rem',
                      height: 60,
                      mb: 2
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowConfirmPassword((show) => !show)}
                          edge="end"
                          sx={{ fontSize: 28 }}
                        >
                          {showConfirmPassword ? <VisibilityOff fontSize="large" /> : <Visibility fontSize="large" />}
                        </IconButton>
                      ),
                      sx: { fontSize: '1.25rem', height: 60 }
                    }}
                    InputLabelProps={{ style: { fontSize: '1.15rem' } }}
                    sx={{
                      fontSize: '1.25rem',
                      height: 60,
                      mb: 2
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      fontSize: '1rem',
                      minWidth: 120,
                      minHeight: 36
                    }}
                  >
                    {loading ? <CircularProgress size={22} /> : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            </form>
          </TabPanel>
        </StyledPaper>
      </Box>

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
    </Box>
  );
};

export default SettingsPage;
