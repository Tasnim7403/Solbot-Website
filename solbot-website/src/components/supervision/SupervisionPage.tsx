import React, { useState, useRef, useEffect } from 'react';
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
  Stack,
  Container,
  TextField
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  PlayArrow,
  FiberManualRecord,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import styled from 'styled-components';
import Sidebar from '../dashboard/Sidebar';
import AppHeader from '../common/Header';
import axios from 'axios';

const SupervisionContainer = styled(Box)`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled(Box)<{ ismobile?: string }>`
  flex-grow: 1;
  padding: ${props => props.ismobile === 'true' ? '16px' : '24px'};
  margin-left: ${props => props.ismobile === 'true' ? '0' : '240px'};
  transition: margin-left 0.3s ease;
`;

const Header = styled(Box)<{ ismobile?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: ${props => props.ismobile === 'true' ? 'wrap' : 'nowrap'};
  gap: ${props => props.ismobile === 'true' ? '16px' : '0'};
  margin-bottom: 24px;
`;

const SearchBar = styled(Paper)<{ ismobile?: string }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  width: ${props => props.ismobile === 'true' ? '100%' : '300px'};
  border-radius: 20px;
  background-color: white;
  margin-right: ${props => props.ismobile === 'true' ? '0' : '16px'};
`;

const StatusCard = styled(Paper)<{ ismobile?: string }>`
  padding: 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;

    .card-icon {
      opacity: 0.2;
      transform: scale(1.1) rotate(5deg);
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

const StatusSection = styled(Box)`
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
`;

const PlayButton = styled(Box)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const StatusItem = styled(Box)`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f8f9fa;
    transform: translateX(4px);
  }
`;

const StatusValue = styled(Typography)<{ $color?: string }>`
  font-weight: 600;
  color: ${props => props.$color || 'inherit'};
  transition: all 0.3s ease;

  ${StatusItem}:hover & {
    transform: scale(1.05);
  }
`;

const StatusDot = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-right: 10px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

const MobileMenuButton = styled(IconButton)`
  display: none;
  @media (max-width: 960px) {
    display: flex;
  }
`;

const ActionButton = styled(Button)`
  border-radius: 12px;
  padding: 12px 28px;
  font-weight: 600;
  text-transform: none;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: ${props => props.className === 'monitoring' ? 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' : 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)'};
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(26, 35, 126, 0.2);
    background: ${props => props.className === 'monitoring' ? 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)' : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'};
  }
`;

const DetectionItem = styled(Box)`
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f8f9fa;
    transform: translateX(4px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetectionDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-right: 12px;
  margin-top: 6px;
  transition: all 0.3s ease;

  ${DetectionItem}:hover & {
    transform: scale(1.2);
  }
`;

const PanelMetrics = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 24px;
`;

const VideoContainer = styled(Paper)`
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    border-color: #3949ab;
    background: linear-gradient(135deg, #000000 0%, #1a237e 100%);

    .play-button {
      transform: scale(1.1);
      background-color: rgba(57, 73, 171, 0.3);
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
`;

const MetricValue = styled(Typography)`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  transition: all 0.3s ease;
`;

const MetricLabel = styled(Typography)`
  color: #666;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const MetricChange = styled(Typography)<{ positive?: boolean }>`
  color: ${props => props.positive ? '#4caf50' : '#f44336'};
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
`;

const MetricCard = styled(Paper)`
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex: 1;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;

    .metric-value {
      transform: scale(1.05);
      color: #1a237e;
    }

    .metric-change {
      transform: translateY(-2px);
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
`;

const CurrentPanelCard = styled(Paper)`
  padding: 24px;
  border-radius: 16px;
  background-color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const PanelHeader = styled(Box)`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const PanelId = styled(Typography)`
  font-size: 24px;
  font-weight: 600;
  margin-right: 12px;
`;

const PanelStatus = styled(Typography)`
  color: #ff9800;
  font-size: 14px;
  font-weight: 500;
`;

interface RobotStatus {
  battery: number;
  connection: string;
  speed: number;
  status: 'online' | 'offline';
  mode: string;
}

interface Detection {
  id: string;
  type: string;
  timestamp: string;
  confidence: number;
  color: string;
}

const SupervisionPage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [robotStatus, setRobotStatus] = useState<RobotStatus>({
    battery: 84,
    connection: '4G',
    speed: 1.2,
    status: 'online',
    mode: 'Autonomous'
  });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [currentPanel, setCurrentPanel] = useState({
    temperature: 42,
    humidity: {
      value: 65,
      change: 2.5
    },
    scanCoverage: {
      value: 89,
      change: 1.2
    },
    efficiency: {
      value: 87,
      change: 0.5
    }
  });
  const [movementSpeed, setMovementSpeed] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [signalStrength, setSignalStrength] = useState<number>(84);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);

  const handleFullscreenToggle = () => {
    const elem = videoContainerRef.current;
    if (!elem) return;
    if (!isFullscreen) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) (elem as any).webkitRequestFullscreen();
      else if ((elem as any).msRequestFullscreen) (elem as any).msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const fetchSignalStrength = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/robot/signal-strength');
        setSignalStrength(response.data.signalStrength);
      } catch (error) {
        console.error('Error fetching signal strength:', error);
      }
    };

    // Initial fetch
    fetchSignalStrength();

    // Set up polling every 10 minutes
    const intervalId = setInterval(fetchSignalStrength, 600000); // 10 minutes = 600,000 ms

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api/anomalies/recent', { withCredentials: true })
      .then(res => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          // Map backend anomaly types to display types/colors
          const colorMap: Record<string, string> = {
            'dusty': '#ff9800',
            'Electrical damage': '#f44336',
            'Physical damage': '#f44336',
            'snowy': '#2196f3',
            'Bird-drop': '#2196f3',
          };
          setDetections(res.data.data.map((anomaly: any) => ({
            id: anomaly._id,
            type: anomaly.anomalyType,
            timestamp: new Date(anomaly.timestamp).toLocaleString(),
            color: colorMap[anomaly.anomalyType] || '#2196f3',
          })));
        }
      })
      .catch(() => setDetections([]));
  }, []);

  useEffect(() => {
    setLocationLoading(true);
    axios.get('http://localhost:5000/api/weather/location')
      .then(res => {
        setLocation(res.data.location);
        setLocationLoading(false);
      })
      .catch(() => {
        setLocationError('Could not fetch location');
        setLocationLoading(false);
      });
  }, []);

  useEffect(() => {
    setWeatherLoading(true);
    setWeatherError('');
    axios.get('http://localhost:5000/api/weather')
      .then(res => {
        setWeather(res.data);
        setWeatherLoading(false);
      })
      .catch(() => {
        setWeather(null);
        setWeatherLoading(false);
        setWeatherError('Could not fetch weather data');
      });
  }, [location]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
  };

  const handleLocationBlur = () => {
    if (!location) return;
    axios.put('/api/weather/location', { location })
      .then(res => setLocation(res.data.location))
      .catch(() => setLocationError('Could not update location'));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader 
        title="Supervision" 
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
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          mt: '64px',
                }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', gap: { xs: 4, md: 6 }, flexWrap: 'wrap' }}>
            {/* Left Column */}
            <Box sx={{ flex: '1 1 60%', minWidth: 0 }}>
              <Stack direction="row" spacing={4} mb={4}>
                <ActionButton
                  className="monitoring"
                  variant="contained"
                  onClick={startMonitoring}
                  startIcon={<PlayArrow />}
                  sx={{ fontSize: '0.9rem', padding: '8px 18px', minWidth: '100px' }}
                  disabled={isMonitoring}
                >
                  Start Monitoring
                </ActionButton>
                <ActionButton
                  className="recording"
                  variant="contained"
                  onClick={stopMonitoring}
                  startIcon={<FiberManualRecord />}
                  sx={{ background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)', fontSize: '0.9rem', padding: '8px 18px', minWidth: '100px', '&.Mui-disabled': { background: '#ccc', color: '#fff' } }}
                  disabled={!isMonitoring}
                >
                  Stop Monitoring
                </ActionButton>
              </Stack>

              <VideoContainer elevation={0} ref={videoContainerRef} style={{ position: 'relative' }}>
                {isMonitoring && (
                  <IconButton
                    onClick={handleFullscreenToggle}
                    sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 2, background: 'rgba(255,255,255,0.7)' }}
                  >
                    {isFullscreen ? <FullscreenExit sx={{ fontSize: '2rem' }} /> : <Fullscreen sx={{ fontSize: '2rem' }} />}
                  </IconButton>
                )}
                {isMonitoring ? (
                  <img
                    src="http://localhost:8082/video_feed"
                    alt="Live Camera Stream"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', borderRadius: '10px' }}
                  />
                ) : (
                  <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                    <PlayArrow sx={{ fontSize: 100, mb: 3, color: '#3949ab' }} />
                    <Typography variant="h3" sx={{ color: '#3949ab', fontWeight: 700, mb: 1 }}>Stream Paused</Typography>
                    <Typography variant="h6" sx={{ color: '#888', fontWeight: 500 }}>Click Start Monitoring to view the live stream</Typography>
                  </Box>
                )}
              </VideoContainer>

              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                {location && (
                  <Typography variant="h6" color="text.secondary">
                    {location}
                  </Typography>
                )}
                {weatherLoading && <Typography variant="body2">Loading weather...</Typography>}
                {weatherError && <Typography variant="body2" color="error">{weatherError}</Typography>}
                {weather && (
                  <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                    {weather.city}, {weather.country}
                  </Typography>
                )}
              </Stack>

              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 3, md: 4 },
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                mb: { xs: 4, md: 6 },
                '& > *': { 
                  flex: { xs: '1 1 calc(50% - 12px)', md: 1 },
                  minWidth: { xs: 'calc(50% - 12px)', md: '0' }
                }
              }}>
                <MetricCard elevation={0}>
                  <MetricValue className="metric-value">{weather ? `${weather.temperature}°C` : '--'}</MetricValue>
                  <MetricLabel>Temperature</MetricLabel>
                  <MetricChange className="metric-change">{weather ? '' : '+10°C'}</MetricChange>
                </MetricCard>

                <MetricCard elevation={0}>
                  <MetricValue className="metric-value">{weather ? `${weather.humidity}%` : '--'}</MetricValue>
                  <MetricLabel>Humidity Level</MetricLabel>
                  <MetricChange className="metric-change" positive>{weather ? '' : `+2.5%`}</MetricChange>
                </MetricCard>

                <MetricCard elevation={0}>
                  <MetricValue className="metric-value">{weather ? `${weather.windSpeed} m/s` : '--'}</MetricValue>
                  <MetricLabel>Wind speed</MetricLabel>
                  <MetricChange className="metric-change" positive>{weather ? '' : `+1.2%`}</MetricChange>
                </MetricCard>

                <MetricCard elevation={0}>
                  <MetricValue className="metric-value">{weather ? `${weather.probabilityOfRain + weather.probabilityOfSnow} mm` : '--'}</MetricValue>
                  <MetricLabel>Probability of snow or rain</MetricLabel>
                  <MetricChange className="metric-change" positive>{weather ? '' : `+0.5%`}</MetricChange>
                </MetricCard>
              </Box>

            </Box>

            {/* Right Column */}
            <Box sx={{ flex: '1 1 35%', minWidth: 300, p: { xs: 0, md: 2 } }}>
            <StatusCard elevation={0} ismobile={isMobile ? 'true' : 'false'}>
                <StatusSection>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" fontWeight="600">Robot Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <StatusDot color={wsConnected ? '#4caf50' : '#f44336'} />
                  <Typography variant="body2" fontWeight="600">
                    {wsConnected ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              </Box>

              <StatusItem>
                <Typography variant="body2" color="text.secondary">Battery:</Typography>
                <StatusValue variant="body2" $color={robotStatus.battery < 20 ? '#f44336' : undefined}>
                  {robotStatus.battery}%
                </StatusValue>
              </StatusItem>

              <StatusItem>
                <Typography variant="body2" color="text.secondary">Connection:</Typography>
                <StatusValue variant="body2">
                  {robotStatus.connection}
                </StatusValue>
              </StatusItem>

              <StatusItem>
                <Typography variant="body2" color="text.secondary">Speed:</Typography>
                <StatusValue variant="body2">{movementSpeed !== null ? `${movementSpeed.toFixed(2)} m/s` : ''}</StatusValue>
              </StatusItem>

                  <StatusItem>
                    <Typography variant="body2" color="text.secondary">Mode:</Typography>
                    <StatusValue variant="body2">{robotStatus.mode}</StatusValue>
                  </StatusItem>
                </StatusSection>

                <Box>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 4 }}>Recent Detections</Typography>
              {detections.map((detection) => (
                <DetectionItem key={detection.id}>
                      <DetectionDot color={detection.color} />
                  <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="500">{detection.type}</Typography>
                        <Typography variant="body2" color="text.secondary">{detection.timestamp}</Typography>
                  </Box>
                </DetectionItem>
              ))}
                </Box>
            </StatusCard>
          </Box>
        </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SupervisionPage;