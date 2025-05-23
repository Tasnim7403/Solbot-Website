import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
  Badge,
  Avatar,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import axios from 'axios';
import { staticSuggestions } from '../../staticSuggestions';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: '#F5F5F5',
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(1),
  width: '100%',
  display: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'block',
    width: 'auto',
    minWidth: '480px',
    maxWidth: '650px',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#757575',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#757575',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
  },
}));

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    message: 'Robot battery at 25%',
    time: '10 minutes ago'
  },
  {
    id: 2,
    message: 'New anomaly detected',
    time: '1 hour ago'
  },
  {
    id: 3,
    message: 'Monitoring started',
    time: '3 hours ago'
  }
];

const ADDITIONAL_NOTIFICATIONS = [
  {
    id: 4,
    message: 'Maintenance check completed',
    time: '5 hours ago'
  },
  {
    id: 5,
    message: 'Performance report generated',
    time: '8 hours ago'
  },
  {
    id: 6,
    message: 'System update available',
    time: '1 day ago'
  },
  {
    id: 7,
    message: 'Weekly backup completed',
    time: '2 days ago'
  }
];

const staticSuggestionRoutes: Record<string, string> = {
  'anomalies': '/anomalies',
  'staff': '/staff',
  'people': '/people',
  'temperature': '/supervision',
  'wind speed': '/supervision',
  'connection': '/supervision',
  'humidity': '/supervision',
  'battery': '/supervision',
  'energy': '/dashboard',
  'reports': '/reports',
  'solar panel': '/dashboard',
  'robot': '/supervision',
  'robot status': '/supervision',
  'maintenance': '/reports',
  'alerts': '/notifications',
  'weather': '/supervision',
  'location': '/map',
  'efficiency': '/dashboard',
  'production': '/dashboard',
  'dashboard': '/dashboard',
  'supervision': '/supervision',
  'map': '/map',
  'notifications': '/notifications',
  'admin': '/users',
  'user': '/users',
  'status': '/supervision',
  'mode': '/supervision',
  'speed': '/supervision',
  'panel': '/dashboard',
  'damage': '/anomalies',
  'dusty': '/anomalies',
  'snow': '/anomalies',
  'rain': '/anomalies',
  'autonomous': '/supervision',
  'manual': '/supervision',
  'online': '/supervision',
  'offline': '/supervision',
  'fixed': '/anomalies',
  'pending': '/anomalies',
  'not fixed': '/anomalies',
  'zone': '/map',
  'panel 1': '/dashboard',
  'panel 2': '/dashboard',
  'panel 3': '/dashboard',
  'role': '/users',
};

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotificationContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredStaticSuggestions, setFilteredStaticSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      (async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
          setSearchResults(res.data);
          setSearchOpen(true);
        } catch (err) {
          setSearchResults(null);
          setSearchOpen(false);
        }
      })();
    } else {
      setSearchResults(null);
      setSearchOpen(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredStaticSuggestions(
        staticSuggestions.filter(s =>
          s.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredStaticSuggestions([]);
    }
  }, [searchTerm]);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    markAllAsRead();
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = (notif: any) => {
    handleNotificationClose();
    if (notif.type === 'anomaly') {
      navigate('/anomalies');
    } else if (['temperature', 'humidity', 'wind', 'precipitation'].includes(notif.type)) {
      navigate('/supervision');
    } else if (['battery', 'current'].includes(notif.type)) {
      navigate('/');
    }
  };

  const handleViewMore = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setShowAllNotifications(true);
  };

  const currentNotifications = showAllNotifications 
    ? [...INITIAL_NOTIFICATIONS, ...ADDITIONAL_NOTIFICATIONS]
    : INITIAL_NOTIFICATIONS;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchResultClick = (type: string, id: string) => {
    switch (type) {
      case 'person': navigate('/people'); break;
      case 'anomaly': navigate('/anomalies'); break;
      case 'notification': navigate(`/notifications/${id}`); break;
      case 'user': navigate('/users'); break;
      case 'energy': navigate('/dashboard'); break;
      case 'weather': window.location.href = '/supervision'; break;
      case 'location': navigate('/map'); break;
      case 'static': {
        const lowerId = id.toLowerCase();
        const route = staticSuggestionRoutes[lowerId] || `/search?q=${encodeURIComponent(id)}`;
        navigate(route);
        break;
      }
      default: break;
    }
    setTimeout(() => setSearchOpen(false), 200);
  };

  const handleSearchFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setSearchAnchorEl(e.target);
    if (searchResults) setSearchOpen(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setSearchOpen(false), 150); // allow click
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: 'white',
        color: 'black',
        boxShadow: 'none',
        borderBottom: '1px solid #E0E0E0',
        width: { md: `calc(100% - 240px)` },
        ml: { md: '240px' },
        zIndex: (theme) => theme.zIndex.drawer - 1,
        height: 80,
      }}
    >
      <Toolbar sx={{ minHeight: 80, display: 'flex', alignItems: 'center', px: 2 }}>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h4"
          noWrap
          component="div"
          sx={{
            display: { xs: 'block', sm: 'block' },
            fontWeight: 700,
            minWidth: '150px',
            fontSize: '2rem',
            mr: 5,
          }}
        >
          {title}
        </Typography>
        {/* Centered Search Bar */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            <Popper open={searchOpen} anchorEl={searchAnchorEl} placement="bottom-start" style={{ zIndex: 1301 }}>
              <Paper
                style={{
                  minWidth: 350,
                  maxHeight: 300,
                  overflowY: 'auto',
                  background: '#fff',
                  color: '#000',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                }}
              >
                <List dense>
                  {/* Static Suggestions (from backend) */}
                  {searchResults?.suggestions && searchResults.suggestions.length > 0 && (
                    <>
                      <ListItem><b>Suggestions</b></ListItem>
                      {searchResults.suggestions.map((s: string, idx: number) => (
                        <ListItem key={s + idx} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('static', s)}>
                          <ListItemText primary={s} />
                        </ListItem>
                      ))}
                    </>
                  )}
                  {/* Fallback to filteredStaticSuggestions if no backend suggestions */}
                  {((searchResults && (!searchResults.suggestions || searchResults.suggestions.length === 0)) && filteredStaticSuggestions.length > 0) && (
                    <>
                      <ListItem><b>Suggestions</b></ListItem>
                      {filteredStaticSuggestions.map((s, idx) => (
                        <ListItem key={s + idx} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('static', s)}>
                          <ListItemText primary={s} />
                        </ListItem>
                      ))}
                    </>
                  )}
                  {/* Dynamic Results */}
                  {searchResults && Object.entries(searchResults).some(([k, v]) => Array.isArray(v) && v.length > 0) && (
                    <>
                      <ListItem><b>Results</b></ListItem>
                      {searchResults.persons && searchResults.persons.length > 0 && (
                        <>
                          <ListItem><b>Persons</b></ListItem>
                          {searchResults.persons.map((p: any) => (
                            <ListItem key={p._id} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('person', p._id)}>
                              <ListItemText primary={p.name} />
                            </ListItem>
                          ))}
                        </>
                      )}
                      {searchResults.anomalies && searchResults.anomalies.length > 0 && (
                        <>
                          <ListItem><b>Anomalies</b></ListItem>
                          {searchResults.anomalies.map((a: any) => (
                            <ListItem key={a._id} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('anomaly', a._id)}>
                              <ListItemText primary={a.anomalyType + (a.location ? ` (${a.location})` : '')} />
                            </ListItem>
                          ))}
                        </>
                      )}
                      {searchResults.notifications && searchResults.notifications.length > 0 && (
                        <>
                          <ListItem><b>Notifications</b></ListItem>
                          {searchResults.notifications.map((n: any) => (
                            <ListItem key={n._id} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('notification', n._id)}>
                              <ListItemText primary={n.message} />
                            </ListItem>
                          ))}
                        </>
                      )}
                      {searchResults.users && searchResults.users.length > 0 && (
                        <>
                          <ListItem><b>Users</b></ListItem>
                          {searchResults.users.map((u: any) => (
                            <ListItem key={u._id} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('user', u._id)}>
                              <ListItemText primary={u.name + (u.email ? ` (${u.email})` : '')} />
                            </ListItem>
                          ))}
                        </>
                      )}
                      {searchResults.energyReadings && searchResults.energyReadings.length > 0 && (
                        <>
                          <ListItem><b>Energy Readings</b></ListItem>
                          {searchResults.energyReadings.map((e: any) => (
                            <ListItem key={e._id} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('energy', e._id)}>
                              <ListItemText primary={`Current: ${e.currentAmps}A, Production: ${e.energyProduction ?? '-'}kW, Efficiency: ${e.efficiency ?? '-'}%`} />
                            </ListItem>
                          ))}
                        </>
                      )}
                      {searchResults.weatherConfigs && searchResults.weatherConfigs.length > 0 && (
                        <>
                          <ListItem><b>Locations</b></ListItem>
                          {searchResults.weatherConfigs.map((w: any) => (
                            <ListItem key={w._id} sx={{ cursor: 'pointer' }} onClick={() => handleSearchResultClick('location', w._id)}>
                              <ListItemText primary={w.location} />
                            </ListItem>
                          ))}
                        </>
                      )}
                      {searchResults.weatherResults && searchResults.weatherResults.length > 0 && (
                        <>
                          <ListItem><b>Weather</b></ListItem>
                          {searchResults.weatherResults.map((w: any, idx: number) => (
                            <ListItem key={idx} sx={{ cursor: 'pointer' }} onMouseDown={() => handleSearchResultClick('weather', w.keyword)}>
                              <ListItemText primary={`Go to Supervision for ${w.keyword}`} />
                            </ListItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                  {/* No results fallback */}
                  {((!searchResults || (
                    (!searchResults?.suggestions || searchResults.suggestions.length === 0) &&
                    Object.entries(searchResults).every(([k, v]) => Array.isArray(v) && v.length === 0)
                  )) && filteredStaticSuggestions.length === 0) && (
                    <ListItem><ListItemText primary="No results found" /></ListItem>
                  )}
                </List>
              </Paper>
            </Popper>
          </Search>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: 2 }}>
          <IconButton 
            color="inherit"
            onClick={handleNotificationClick}
            sx={{ ml: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ fontSize: 34 }} />
            </Badge>
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                fontSize: '1.25rem',
              }}
            >
              Hello, {user?.name || 'Guest'}
            </Typography>
            <Avatar 
              onClick={handleNotificationClick}
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: '#000080',
                cursor: 'pointer',
              }}
            >
              {user?.name?.charAt(0) || 'G'}
            </Avatar>
          </Box>
        </Box>
      </Toolbar>
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '12px', minWidth: '250px', maxHeight: 320, overflowY: 'auto' }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="subtitle1" fontWeight="600">Notifications</Typography>
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
            {notifications.map((notif) => {
              let mainMessage = notif.message;
              let detail = new Date(notif.timestamp).toLocaleString();
              if (notif.type === 'anomaly' && notif.data && notif.data.anomalyType) {
                mainMessage = `New anomaly detected: ${notif.data.anomalyType}`;
              }
              return (
                <MenuItem key={notif._id} onClick={() => handleNotificationItemClick(notif)} selected={!notif.read}>
                  <Box sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight="500">{mainMessage}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {detail}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            })}
          </Box>
        )}
      </Menu>
    </AppBar>
  );
};

export default Header; 