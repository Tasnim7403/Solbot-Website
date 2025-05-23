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
import JoystickControl from './JoystickControl';

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

const ControlCard = styled(Paper)`
  padding: 16px 16px 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(26, 35, 126, 0.15);
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
  
  .title {
    font-size: 1.1rem;
    margin: 0;
    padding: 0;
    color: #1a237e;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .description {
    font-size: 0.875rem;
    margin: 8px 0 0;
    color: #5c6bc0;
  }
`;

const JoystickIndicator = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border: 2px solid #e0e0e0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px auto;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);

  ${ControlCard}:hover & {
    border-color: #3949ab;
    box-shadow: 0 6px 12px rgba(26, 35, 126, 0.2);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
  }

  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
    position: absolute;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  ${ControlCard}:hover &::after {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(26, 35, 126, 0.3);
    background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  }
`;

const NavigationButton = styled(Button)`
  width: 100%;
  padding: 12px;
  margin: 4px 0;
  font-weight: 600;
  text-transform: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: ${props => props.variant === 'contained' ? 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' : 'transparent'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(26, 35, 126, 0.2);
    background: ${props => props.variant === 'contained' ? 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)' : 'transparent'};
  }
`;

const MapLocationPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState<'satellite' | 'ground'>('ground');
  const [signalStrength, setSignalStrength] = useState<number | null>(null);
  const [movementSpeed, setMovementSpeed] = useState<number | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [robotPose, setRobotPose] = useState<{x: number, y: number, heading?: number} | null>(null);
  const [lidarPoints, setLidarPoints] = useState<{angle: number, distance: number}[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapContainerSize, setMapContainerSize] = useState({ width: 0, height: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [squareSize, setSquareSize] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9090');
    wsRef.current = ws;
    ws.onopen = () => {
      setWsReady(true);
      ws.send(JSON.stringify({ op: 'subscribe', topic: '/signal_strength', type: 'std_msgs/Int32' }));
      ws.send(JSON.stringify({ op: 'subscribe', topic: '/movement_speed', type: 'std_msgs/Float32' }));
      ws.send(JSON.stringify({ op: 'subscribe', topic: '/map', type: 'nav_msgs/OccupancyGrid' }));
      ws.send(JSON.stringify({ op: 'subscribe', topic: '/robot_pose', type: 'geometry_msgs/PoseStamped' }));
      ws.send(JSON.stringify({ op: 'subscribe', topic: '/lidar_scan', type: 'custom/LidarScan' }));
      ws.send(JSON.stringify({ op: 'subscribe', topic: '/robot_status', type: 'custom/RobotStatus' }));
      console.log('WebSocket opened and subscriptions sent');
    };
    ws.onclose = () => { setWsReady(false); console.log('WebSocket closed'); };
    ws.onerror = () => { setWsReady(false); console.log('WebSocket error'); };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Received:', msg);
        if (msg.topic === '/signal_strength') {
          setSignalStrength(msg.msg.data);
        } else if (msg.topic === '/movement_speed' && msg.msg && typeof msg.msg.data === 'number') {
          setMovementSpeed(msg.msg.data);
        } else if (msg.topic === '/map') {
          setMapData(msg.msg);
        } else if (msg.topic === '/robot_pose') {
          setRobotPose({
            x: msg.msg.pose.position.x,
            y: msg.msg.pose.position.y,
            heading: msg.msg.pose.orientation.z // yaw (radians)
          });
        } else if (msg.topic === '/lidar_scan') {
          setLidarPoints(msg.msg.points);
        } else if (msg.topic === '/robot_status' && msg.msg && msg.msg.mode) {
          setManualMode(msg.msg.mode === 'Manual');
          console.log('Received /robot_status, mode:', msg.msg.mode);
        }
      } catch (e) {
        // ignore
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    function updateSize() {
      if (mapContainerRef.current) {
        const width = mapContainerRef.current.offsetWidth;
        const height = mapContainerRef.current.offsetHeight;
        setMapContainerSize({ width, height });
        setSquareSize(Math.min(width, height));
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw map on canvas
  useEffect(() => {
    if (
      !mapData ||
      !canvasRef.current ||
      !mapData.info ||
      !Array.isArray(mapData.data) ||
      squareSize === 0
    ) return;

    const width = mapData.info.width;
    const height = mapData.info.height;
    const data = mapData.data;
    const canvas = canvasRef.current;
    canvas.width = squareSize;
    canvas.height = squareSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cellSize = squareSize / width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = data[y * width + x];
        if (value === 100) ctx.fillStyle = '#222'; // occupied
        else if (value === 0) ctx.fillStyle = '#fff'; // free
        else ctx.fillStyle = '#bbb'; // unknown
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    ctx.strokeStyle = '#888';
    ctx.strokeRect(0, 0, cellSize * width, cellSize * height);
    // Draw robot as a blue circle and heading
    if (robotPose) {
      ctx.beginPath();
      ctx.arc(
        robotPose.x * cellSize + cellSize / 2,
        robotPose.y * cellSize + cellSize / 2,
        cellSize * 0.7,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = '#1976d2';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      // Draw heading as a line
      if (typeof robotPose.heading === 'number') {
        ctx.beginPath();
        ctx.moveTo(
          robotPose.x * cellSize + cellSize / 2,
          robotPose.y * cellSize + cellSize / 2
        );
        ctx.lineTo(
          robotPose.x * cellSize + cellSize / 2 + Math.cos(robotPose.heading) * cellSize * 1.2,
          robotPose.y * cellSize + cellSize / 2 + Math.sin(robotPose.heading) * cellSize * 1.2
        );
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    // Draw LIDAR scan points
    if (robotPose && lidarPoints && lidarPoints.length > 0) {
      ctx.fillStyle = '#e91e63';
      lidarPoints.forEach(pt => {
        const rx = robotPose.x + Math.cos(pt.angle) * (pt.distance / mapData.info.resolution);
        const ry = robotPose.y + Math.sin(pt.angle) * (pt.distance / mapData.info.resolution);
        if (
          rx >= 0 && rx < mapData.info.width &&
          ry >= 0 && ry < mapData.info.height
        ) {
          ctx.beginPath();
          ctx.arc(
            rx * cellSize + cellSize / 2,
            ry * cellSize + cellSize / 2,
            Math.max(2, cellSize * 0.18),
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      });
    }
  }, [mapData, robotPose, lidarPoints, squareSize]);

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

  const handleToggleManualMode = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (manualMode) {
        wsRef.current.send(JSON.stringify({ op: 'send_command', command: 'auto_mode' }));
        console.log('Sent auto_mode command');
      } else {
        wsRef.current.send(JSON.stringify({ op: 'send_command', command: 'manual_mode' }));
        console.log('Sent manual_mode command');
      }
    } else {
      console.log('WebSocket not open, cannot send command');
    }
  };

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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight="600">
                      {signalStrength !== null ? `${signalStrength} (4G)` : 'Loading...'}
                    </Typography>
                  </Box>
                  <SignalIcon className="card-icon" />
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

          <Box sx={{ mt: 3, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
            <Box sx={{ flex: '0 0 240px' }}>
              <Stack spacing={12}>
                <ControlCard elevation={0}>
                  <Typography variant="h6" className="title" fontWeight="600">
                    Manual Control Mode
                  </Typography>
                  <JoystickControl />
                  <Typography variant="body2" color="text.secondary" className="description">
                    Use joystick to control robot movement
                  </Typography>
                </ControlCard>

                <ControlCard elevation={0}>
                  <Typography variant="h6" className="title" fontWeight="600">
                    Navigation Mode
                  </Typography>
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <NavigationButton
                      variant="contained"
                      color="primary"
                      startIcon={<LocationSearchingIcon />}
                      onClick={handleToggleManualMode}
                      disabled={!wsReady}
                    >
                      {manualMode ? 'Return to Autonomous' : 'Switch to Manual Control'}
                    </NavigationButton>
                  </Box>
                </ControlCard>
              </Stack>
            </Box>

            <Box sx={{ flex: 1 }}>
              <MapContainer elevation={0}>
                <Box ref={mapContainerRef} sx={{ position: 'relative', width: '100%', height: '60vh', minHeight: '400px', minWidth: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  {mapData ? (
                    <canvas
                      ref={canvasRef}
                      style={{ borderRadius: 8, border: '1px solid #bbb', background: '#fff', width: squareSize, height: squareSize, display: 'block' }}
                    />
                  ) : (
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        position: 'absolute',
                        fontWeight: 600,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      Map View Coming Soon
                    </Typography>
                  )}
                </Box>
              </MapContainer>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MapLocationPage; 