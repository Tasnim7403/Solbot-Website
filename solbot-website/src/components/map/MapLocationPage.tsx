import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  IconButton,
  Container,
  Theme,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Speed as SpeedIcon,
  BatteryChargingFull as BatteryIcon,
  SignalCellularAlt as SignalIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Stop as StopIcon,
  RestartAlt as ResetIcon,
  Navigation as NavigationIcon,
  LocationSearching as LocationSearchingIcon,
  Home as HomeIcon,
  BatteryChargingFull as ChargingStationIcon,
} from '@mui/icons-material';
import styled from 'styled-components';
import Sidebar from '../dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../common/Header';
import MapDisplay from './MapDisplay';
import { socket } from '../../socket';
import axios from 'axios';

const StyledGrid = styled(Grid)<{ isMobile?: boolean }>`
  display: flex;
  flex-direction: column;
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
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
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
  }
`;

const MapContainer = styled(Paper)`
  padding: 16px 16px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(26, 35, 126, 0.15);
    border-color: #3949ab;
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(to bottom, #1a237e, #3949ab);
    border-top-left-radius: 14px;
    border-bottom-left-radius: 14px;
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

const MapLocationPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState<'satellite' | 'ground'>('ground');
  const [robotConnected, setRobotConnected] = useState(false);
  const [movementSpeed, setMovementSpeed] = useState<number | null>(null);
  const [signalStrength, setSignalStrength] = useState<number | null>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMapViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'satellite' | 'ground' | null,
  ) => {
    if (newView !== null) {
      setMapView(newView);
    }
  };

  useEffect(() => {
    function handleRobotStatus(data: any) {
      setRobotConnected(!!data.connected);
    }
    socket.on('robot_connection_status', handleRobotStatus);

    // Listen for robot_update and update movementSpeed
    function handleRobotUpdate(message: any) {
      if (message && message.data && message.data.speed && typeof message.data.speed.linear_mps === 'number') {
        setMovementSpeed(message.data.speed.linear_mps);
      }
    }
    socket.on('robot_update', handleRobotUpdate);

    return () => {
      socket.off('robot_connection_status', handleRobotStatus);
      socket.off('robot_update', handleRobotUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchSignalStrength = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/robot/signal-strength');
        setSignalStrength(response.data.signalStrength);
      } catch (error) {
        setSignalStrength(null);
        console.error('Error fetching signal strength:', error);
      }
    };
    fetchSignalStrength();
    const intervalId = setInterval(fetchSignalStrength, 600000); // 10 minutes
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader 
        title="Map/Location" 
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
          p: 2,
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          mt: '64px',
          minHeight: '100vh',
          background: '#f7f7fa',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ mt: 6 }}>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
              <Box>
                <StatusCard elevation={0} isMobile={isMobile}>
                  <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Current Location</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StatusIndicator color="#4caf50" />
                    <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="600">Panel Section A</Typography>
                  </Box>
                  <LocationIcon className="card-icon" />
                </StatusCard>
              </Box>
              <Box>
                <StatusCard elevation={0} isMobile={isMobile}>
                  <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Signal Strength</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                    {signalStrength !== null ? (
                      <>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="600">WiFi</Typography>
                        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                          <SignalIcon sx={{ color: '#4caf50', fontSize: isMobile ? 22 : 28 }} />
                        </Box>
                      </>
                    ) : (
                      <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="600">Loading...</Typography>
                    )}
                  </Box>
                </StatusCard>
              </Box>
              <Box>
                <StatusCard elevation={0} isMobile={isMobile}>
                  <Typography color="text.secondary" variant={isMobile ? "body2" : "body1"}>Movement Speed</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="600">
                      {movementSpeed !== null ? `${movementSpeed.toFixed(2)} m/s` : 'Loading...'}
                    </Typography>
                  </Box>
                  <SpeedIcon className="card-icon" />
                </StatusCard>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 6, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{
                  p: 3,
                  borderRadius: 4,
                  boxShadow: 4,
                  maxWidth: 900,
                  width: '100%',
                  height: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff',
                }}>
                  <MapDisplay />
                </Paper>
                </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MapLocationPage; 