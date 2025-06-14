import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Avatar,
  Badge,
  Grid as MuiGrid,
  Menu,
  MenuItem,
  Container,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  Search as SearchIcon,
  Visibility as SupervisionIcon,
  Description as ReportsIcon,
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  BatteryChargingFull as BatteryIcon,
  Speed as SpeedIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Stop as StopIcon,
  RestartAlt as ResetIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../common/Header';
import {
  ChartContainer,
  ResponsiveContainer as RechartsResponsiveContainer,
} from './DashboardStyles';
import axios from 'axios';
import moment from 'moment-timezone';
import ChatButtonWithPopup from './ChatButtonWithPopup';
import type { YAxisProps } from 'recharts';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { socket } from '../../socket';
import MuiAlert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Create a typed version of Grid to avoid the TypeScript errors
const Grid = MuiGrid as React.ComponentType<any>;

// Type for energy data points used in the trend chart
export type EnergyDataPoint = {
  timestamp: number;
  avgCurrent: number;
  avgEnergy: number;
  avgEfficiency: number;
};

// DEFINE THE PRE-SET MISSION PATH HERE
const PREDEFINED_MISSION_WAYPOINTS = [
  { x: -1.905, y: -0.648 },  // Target 1 is P2
  { x: -2.012, y: 0.448 },   // Target 2 is P3
  { x: -1.478, y: 0.716 },   // Target 3 is P4
  { x: -0.556, y: 0.442 },   // Target 4 is P5
  { x: 0.428,  y: 0.186 }    // Target 5 is P1 (return to start)
];

// DEFINE THE RETURN TO STATION WAYPOINT
const RETURN_TO_STATION_WAYPOINT = [
  { x: -1.905, y: -0.648 }
];

const DashboardContainer = styled(Box)`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
`;

const MainContent = styled(Box)<{ isMobile?: boolean }>`
  flex-grow: 1;
  padding: ${props => props.isMobile ? '16px' : '24px'};
  padding-bottom: ${props => props.isMobile ? '8px' : '12px'};
  margin-left: ${props => props.isMobile ? '0' : '240px'};
  transition: margin-left 0.3s ease;
`;

const Header = styled(Box)<{ isMobile?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: ${props => props.isMobile ? 'wrap' : 'nowrap'};
  gap: ${props => props.isMobile ? '16px' : '0'};
  
  ${props => props.isMobile && `
    .title {
      width: 100%;
      order: 1;
    }
    .actions {
      width: 100%;
      order: 3;
      justify-content: center;
    }
    .user-section {
      width: 100%;
      order: 2;
      justify-content: flex-end;
    }
  `}
`;

const SearchBar = styled(Paper)<{ isMobile?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  width: ${props => props.isMobile ? '100%' : '300px'};
  border-radius: 20px;
  background-color: white;
  margin-right: ${props => props.isMobile ? '0' : '16px'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:focus-within {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatusCard = styled(Paper)<{ isMobile?: boolean }>`
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  height: ${props => props.isMobile ? '120px' : '140px'};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;

    .card-icon {
      opacity: 0.2;
      color: #1a237e;
    }
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(to bottom, #1a237e, #3949ab);
  }
  
  .card-icon {
    position: absolute;
    right: 20px;
    bottom: 20px;
    opacity: 0.1;
    font-size: 40px;
    color: #000080;
    transition: all 0.3s ease;
  }
`;

const ActionButton = styled(Button)<{ isMobile?: boolean; variant?: string }>`
  border-radius: 30px;
  padding: ${props => props.isMobile ? '8px 16px' : '10px 24px'};
  font-weight: 600;
  text-transform: none;
  transition: all 0.3s ease;
  background: ${props => props.variant === 'contained' ? 'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)' : 'transparent'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(26, 35, 126, 0.2);
    background: ${props => props.variant === 'contained' ? 'linear-gradient(90deg, #3949ab 0%, #1a237e 100%)' : 'transparent'};
  }
`;

const StatusIndicator = styled.div<{ color?: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color || '#4caf50'};
  margin-right: 8px;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background-color: ${props => props.color || '#4caf50'};
    opacity: 0.3;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.5;
    }
    70% {
      transform: scale(1.1);
      opacity: 0.2;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.5;
    }
  }
`;

const MobileMenuButton = styled(IconButton)<{ isMobile?: boolean }>`
  display: ${props => props.isMobile ? 'flex' : 'none'};
  margin-right: 8px;
`;

const EmergencyButton = styled(Button)`
  width: 100%;
  padding: 12px;
  margin: 4px 0;
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const FILTER_KEY = 'dashboard_timeRange';

const PanelCard = styled(Paper)<{ isMobile?: boolean; isLast?: boolean }>`
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  height: 140px;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(to bottom, #1a237e, #3949ab);
  }

  @media (max-width: 900px) {
    border-radius: 12px;
    margin-bottom: 24px;
  }
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem(FILTER_KEY) || 'week');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [energyData, setEnergyData] = useState<EnergyDataPoint[]>([]);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [robotConnected, setRobotConnected] = useState(false);
  const [battery] = useState<number>(84);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMissionActive, setIsMissionActive] = useState(false);
  const { markAllAsRead } = useNotificationContext();
  const [missionSnackbarOpen, setMissionSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleNotificationClick = async (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    markAllAsRead();
    const unread = notifications.filter((n: any) => !n.read);
    if (unread.length > 0) {
      try {
        await Promise.all(unread.map((n: any) => axios.put(`http://localhost:5000/api/notifications/${n._id}/read`)));
        const updated = notifications.map((n: any) => ({ ...n, read: true }));
        setNotifications(updated);
      } catch {}
    }
  };
  
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };
  
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  const fetchEnergyData = async (range: string, date: Date) => {
    // Use local time for the date string
    const dateStr = moment(date).format('YYYY-MM-DD');
    const res = await axios.get(`http://localhost:5000/api/energy/aggregate?filter=${range}&date=${dateStr}&timezone=Africa/Tunis`);
    // Map backend fields to frontend expected fields
    let filtered = res.data;
    if (range === 'month') {
      filtered = res.data.filter((d: any) => d.count > 0 && d.timestamp);
    }
    const mapped = filtered.map((d: any) => ({
      ...d,
      avgCurrent: d.current ?? d.currentAmps ?? null,
      avgEnergy: d.energy ?? null,
      avgEfficiency: d.efficiency ?? null,
    }));
    setEnergyData(mapped);
  };

  useEffect(() => {
    fetchEnergyData(timeRange, selectedDate);
  }, [timeRange, selectedDate]);

  const handleFilter = (range: string) => {
    setTimeRange(range);
    localStorage.setItem(FILTER_KEY, range);
    setSelectedDate(new Date());
    handleFilterClose();
  };
  
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    localStorage.setItem(FILTER_KEY, range);
    handleFilterClose();
  };
  
  const handleStartMonitoring = () => {
    navigate('/supervision');
  };

  const handleActivateRobot = () => {
    // TODO: Add robot activation logic here
    console.log('Robot activation triggered');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  useEffect(() => {
    // Fetch current robot status on mount
    const fetchRobotStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/robot/status');
        setRobotConnected(!!response.data.connected);
        console.log('Fetched robot status via REST:', response.data);
      } catch (error) {
        setRobotConnected(false);
        console.error('Error fetching robot status:', error);
      }
    };
    fetchRobotStatus();

    function handleRobotStatus(data: any) {
      setRobotConnected(!!data.connected);
      console.log('robot_connection_status event:', data);
    }
    socket.on('robot_connection_status', handleRobotStatus);
    return () => {
      socket.off('robot_connection_status', handleRobotStatus);
    };
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications');
        // Sort notifications by timestamp descending
        const sorted = (res.data as any[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(sorted);
      } catch (err) {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  const validEnergyData = energyData
    .map(d => ({
      ...d,
      timestamp: typeof d.timestamp === 'string' ? new Date(d.timestamp).getTime() : d.timestamp
    }))
    .filter(
      d =>
        d &&
        typeof d.timestamp === 'number' &&
        !isNaN(d.timestamp)
    );
  const allDataValid = validEnergyData.length > 0;

  const handleStartMission = async () => {
    console.log("Start Mission button clicked. Sending predefined waypoints.");
    const missionData = {
      type: "start_mission",
      waypoints: PREDEFINED_MISSION_WAYPOINTS
    };
    try {
      await fetch('http://localhost:5000/api/start-mission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missionData),
      });
      setSnackbarMessage('Mission start command has been successfully sent to the robot.');
      setMissionSnackbarOpen(true);
      console.log("Successfully sent mission command:", missionData);
    } catch (error) {
      alert('Failed to send mission command. See console for details.');
      console.error("Error sending mission start command:", error);
    }
  };

  const handleReturnToStation = async () => {
    console.log("Return to Station clicked. Sending return waypoint.");
    const missionData = {
      type: "return_to_station",
      waypoints: RETURN_TO_STATION_WAYPOINT
    };
    try {
      await fetch('http://localhost:5000/api/start-mission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missionData),
      });
      setSnackbarMessage('Return to Station command has been successfully sent to the robot.');
      setMissionSnackbarOpen(true);
      console.log("Successfully sent return to station command:", missionData);
    } catch (error) {
      alert('Failed to send return to station command. See console for details.');
      console.error("Error sending return to station command:", error);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader 
        title="Dashboard" 
        onMenuClick={handleDrawerToggle}
      />
      
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 2,
          width: '100vw',
          ml: { md: '240px' },
          mt: '64px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          overflowX: 'auto',
        }}
      >
        <Container maxWidth="xl" sx={{ px: isMobile ? 0.5 : 2 }}>
          <Grid container spacing={isMobile ? 2 : 6} sx={{ mt: isMobile ? 2 : 6, mb: isMobile ? 2 : 8 }}>
            <Grid item xs={12} sm={12} md={3}>
              <PanelCard elevation={0} isMobile={isMobile}>
                <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Robot Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <StatusIndicator color={robotConnected ? "#4caf50" : "#f44336"} />
                  <Typography variant={isMobile ? "subtitle2" : "h6"} fontWeight="600">
                    {robotConnected ? "Active" : "Inactive"}
                  </Typography>
                </Box>
              </PanelCard>
            </Grid>
            <Grid item xs={12} sm={12} md={3}>
              <PanelCard elevation={0} isMobile={isMobile}>
                <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Robot Battery Level</Typography>
                <Typography variant={isMobile ? "subtitle2" : "h6"} fontWeight="600" sx={{ mt: 1 }}>{battery}%</Typography>
              </PanelCard>
            </Grid>
            <Grid item xs={12} sm={12} md={3}>
              <PanelCard elevation={0} isMobile={isMobile}>
                <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Go to Supervision</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 1, fontWeight: 700, borderRadius: '8px', background: '#1a237e', boxShadow: 'none', minWidth: isMobile ? 100 : 140, padding: isMobile ? '6px 12px' : '8px 24px', fontSize: isMobile ? '0.9rem' : '1rem', '&:hover': { background: '#3949ab' } }}
                  onClick={handleStartMonitoring}
                >
                  Start Monitoring
                </Button>
              </PanelCard>
            </Grid>
            <Grid item xs={12} sm={12} md={3}>
              <PanelCard elevation={0} isMobile={isMobile} isLast>
                <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Quick Actions</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, fontWeight: 700, borderRadius: '8px', background: '#1a237e', boxShadow: 'none', minWidth: isMobile ? 100 : 140, padding: isMobile ? '6px 12px' : '8px 24px', fontSize: isMobile ? '0.9rem' : '1rem', '&:hover': { background: '#3949ab' } }}
                    onClick={handleReturnToStation}
                  >
                    Return to Station
                  </Button>
                  <Button
                    id="start-mission-btn"
                    variant="contained"
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      borderRadius: '8px',
                      background: isMissionActive ? '#f57f17' : '#4caf50',
                      color: '#fff',
                      minWidth: isMobile ? 100 : 140,
                      padding: isMobile ? '6px 12px' : '8px 24px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      boxShadow: 'none',
                      '&:hover': {
                        background: isMissionActive ? '#e65100' : '#43a047',
                        color: '#fff',
                        boxShadow: 'none',
                      },
                    }}
                    onClick={handleStartMission}
                  >
                    Start Mission
                  </Button>
                </Box>
              </PanelCard>
            </Grid>
          </Grid>
          <ChartContainer isMobile={isMobile} sx={{ mt: isMobile ? 1 : 4, overflowX: isMobile ? 'auto' : 'visible', minWidth: isMobile ? 320 : 'unset' }}>
            <Box className="chart-header" sx={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="600">Solar Panel Energy Production Trend</Typography>
              <Box>
                <Button 
                  variant="text" 
                  color="primary" 
                  size="medium"
                  onClick={handleFilterClick}
                  endIcon={<FilterIcon />}
                  sx={{
                    fontSize: isMobile ? '0.95rem' : '1.1rem',
                    padding: isMobile ? '6px 10px' : '8px 20px',
                    minWidth: isMobile ? '80px' : '110px',
                    fontWeight: 600
                  }}
                >
                  {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
                </Button>
                <Menu
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={handleFilterClose}
                >
                  <MenuItem onClick={() => handleFilter('day')}>Day</MenuItem>
                  <MenuItem onClick={() => handleFilter('week')}>Week</MenuItem>
                  <MenuItem onClick={() => handleFilter('month')}>Month</MenuItem>
                </Menu>
              </Box>
            </Box>
            <RechartsResponsiveContainer width="100%" height={isMobile ? 300 : 450} isMobile={isMobile}>
              <LineChart
                data={allDataValid ? validEnergyData : []}
                margin={{
                  top: 5,
                  right: 40,
                  left: 60,
                  bottom: 0
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={
                    timeRange === 'day'
                      ? 'timestamp'
                      : timeRange === 'week'
                      ? 'day'
                      : 'week'
                  }
                  tickFormatter={value => {
                    if (timeRange === 'day') {
                      const d = new Date(value);
                      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes() < 30 ? '00' : '30'}`;
                    }
                    if (timeRange === 'week') return `Day ${value}`;
                    if (timeRange === 'month') return `Week ${value}`;
                    return value;
                  }}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: isMobile ? 14 : 16 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  label={{
                    value: 'Energy Production (kWh)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 0,
                    fontSize: isMobile ? 14 : 16,
                    fill: '#000080',
                    fontWeight: 700
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: isMobile ? 14 : 16 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  label={{
                    value: 'Efficiency (%)',
                    angle: 90,
                    position: 'insideRight',
                    offset: 0,
                    fontSize: isMobile ? 14 : 16,
                    fill: '#4caf50',
                    fontWeight: 700
                  }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Energy Production (kW)' || name === 'Energy Production (kWh)') {
                      return [`${value} kWh`, 'Energy Production (kWh)'];
                    }
                    if (name === 'Efficiency (%)') {
                      return [`${value} %`, 'Efficiency (%)'];
                    }
                    return [value, name];
                  }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }} 
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                />
                <Line
                  name="Energy Production (kWh)"
                  type="monotone"
                  dataKey="avgEnergy"
                  stroke="#000080"
                  strokeWidth={2}
                  dot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                  activeDot={{ r: isMobile ? 6 : 8, strokeWidth: 2 }}
                  yAxisId="left"
                />
                <Line
                  name="Efficiency (%)"
                  type="monotone"
                  dataKey="avgEfficiency"
                  stroke="#4caf50"
                  strokeWidth={2}
                  dot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                  activeDot={{ r: isMobile ? 6 : 8, strokeWidth: 2 }}
                  yAxisId="right"
                />
              </LineChart>
            </RechartsResponsiveContainer>
          </ChartContainer>
        </Container>
      </Box>
      
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: '12px', minWidth: '250px' }
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
          notifications.map((notif: any) => (
            <MenuItem key={notif._id} onClick={handleNotificationClose} selected={!notif.read}>
              <Box sx={{ py: 1 }}>
                <Typography variant="body2" fontWeight="500">{notif.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notif.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button variant="text" size="small" fullWidth>View All</Button>
        </Box>
      </Menu>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Last 7 Days</MenuItem>
        <MenuItem onClick={handleMenuClose}>Last 30 Days</MenuItem>
        <MenuItem onClick={handleMenuClose}>Custom Range</MenuItem>
      </Menu>
      <ChatButtonWithPopup />
      <Snackbar
        open={missionSnackbarOpen}
        autoHideDuration={5000}
        onClose={() => setMissionSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setMissionSnackbarOpen(false)}
          severity="success"
          iconMapping={{ success: <CheckCircleIcon fontSize="inherit" sx={{ color: '#4caf50' }} /> }}
          sx={{ width: '100%', alignItems: 'center', fontWeight: 600, fontSize: '1.1rem', background: '#e8f5e9', color: '#388e3c' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;