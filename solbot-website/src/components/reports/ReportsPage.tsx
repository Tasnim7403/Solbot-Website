import React, { useState, useEffect, useRef } from 'react';
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
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid, // Standard Grid
  Container,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  NotificationsNone as NotificationsIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import Sidebar from '../dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../common/Header';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ChartContainer, ResponsiveContainer as RechartsResponsiveContainer } from '../dashboard/DashboardStyles';
import moment from 'moment-timezone';
import solbotLogo from '../../assets/images/solbot-logo.png';

const ReportTitle = styled(Typography)`
  transition: all 0.3s ease;
  font-weight: 600;
  color: #333;
`;

const SearchBar = styled(Paper)<{ ismobile?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  width: ${props => props.ismobile ? '100%' : '300px'};
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  margin-right: ${props => props.ismobile ? '0' : '16px'};
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;

    input {
      color: #1a237e;
    }
  }

  input {
    border: none;
    outline: none;
    width: 100%;
    background: transparent;
    transition: all 0.3s ease;
  }
`;

const ChartCard = styled(Paper)<{ ismobile?: string }>`
  padding: ${props => props.ismobile === 'true' ? '16px' : '24px'};
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-top: ${props => props.ismobile === 'true' ? '24px' : '32px'};
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;

    h6 {
      color: #1a237e;
      transform: scale(1.02);
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

  h6 {
    transition: all 0.3s ease;
  }
`;

const TableCard = styled(Paper)`
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(26, 35, 126, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #e8eaf6 100%);
    border-color: #3949ab;

    ${ReportTitle} {
      color: #1a237e;
      transform: scale(1.02);
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

const StyledTableCell = styled(TableCell)`
  padding: 16px;
  font-weight: 500;
  color: #333;
  
  &.MuiTableCell-head {
    background-color: white;
    font-weight: 600;
  }
`;

const StyledTableRow = styled(TableRow)`
  &:nth-of-type(odd) {
    background: linear-gradient(135deg, #f8f9ff 0%, #f5f7fa 100%);
  }
  &:hover {
    background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%);
    transform: scale(1.01);
    transition: all 0.3s ease;
  }
`;

const FramedDownloadButton = styled(Button)`
  min-width: 180px;
  height: 60px;
  border-radius: 24px;
  font-weight: bold;
  font-size: 1.35rem;
  padding: 18px 38px;
  color: #000080;
  background: #fff;
  border: 2.5px solid #000080 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-transform: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: #000080;
    color: #fff;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
`;

const FilterButton = styled(Button)`
  color: #000080;
  font-weight: 500;
  text-transform: none;
  
  &:hover {
    background-color: rgba(0, 0, 128, 0.05);
  }
`;

const TimeRangeButton = styled(Button)<{ active: boolean }>`
  border-radius: 20px;
  padding: 6px 16px;
  font-weight: 500;
  text-transform: none;
  margin-right: 8px;
  background-color: ${props => props.active ? '#000080' : 'transparent'};
  color: ${props => props.active ? 'white' : '#000080'};
  border: 1px solid ${props => props.active ? '#000080' : '#e0e0e0'};
  
  &:hover {
    background-color: ${props => props.active ? '#000066' : 'rgba(0, 0, 128, 0.05)'};
  }
`;

const MobileMenuButton = styled(IconButton)`
  display: none;
  @media (max-width: 960px) {
    display: flex;
  }
`;

const NavSidebar = styled(Box)`
  width: 240px;
  background-color: #000080;
  color: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
`;

const NavLogo = styled(Box)`
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: bold;
`;

const NavItem = styled(Box)`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const FILTER_KEY = 'reports_timeRange';

type AnomalyRow = {
  id: string;
  type: string;
  date: string;
  status: string;
  assignedTo: string;
  location: string;
};

// Define a fun color palette for the bars
const anomalyBarColors = [
  '#3949ab', // Indigo (theme blue)
  '#43a047', // Green (theme green)
  '#fbc02d', // Yellow
  '#e57373', // Red
  '#00bcd4', // Cyan
  '#ff9800', // Orange
  '#8e24aa', // Purple
];

const ReportsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [energyData, setEnergyData] = useState([]);
  const [anomaliesTypeData, setAnomaliesTypeData] = useState([]);
  const [anomalyRows, setAnomalyRows] = useState<AnomalyRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<AnomalyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(''); // yyyy-mm-dd
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem(FILTER_KEY) || 'week');
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const reportRef = useRef<HTMLDivElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Helper to fetch anomalies
  const fetchAnomalies = async (dateFilter?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/anomalies?limit=5&page=1';
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        const rows: AnomalyRow[] = res.data.data.map((item: any, idx: number) => ({
          id: item._id || idx,
          type: item.anomalyType,
          date: item.timestamp,
          status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')) : '',
          assignedTo: item.assignedTo || '',
          location: item.location || '',
        }));
        setAnomalyRows(rows);
        setFilteredRows(rows);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
      setAnomalyRows([]);
      setFilteredRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnomalies();
  }, []);

  useEffect(() => {
    const fetchAnomaliesType = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/anomalies/by-type', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success) {
          setAnomaliesTypeData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch anomalies by type:', err);
      }
    };
    fetchAnomaliesType();
  }, []);

  useEffect(() => {
    fetchAnomalies(filterDate);
  }, [filterDate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    // Hide the download button and filter before capture
    if (downloadBtnRef.current) downloadBtnRef.current.style.display = 'none';
    if (filterRef.current) filterRef.current.style.display = 'none';
    const input = reportRef.current;
    const pdf = new jsPDF('p', 'pt', 'a4');

    await html2canvas(input, { scale: 2 }).then(async canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Add logo and date at the bottom center
      const logoImg = new window.Image();
      logoImg.src = solbotLogo;
      await new Promise(resolve => { logoImg.onload = resolve; });
      const logoWidth = 60;
      const logoHeight = 60;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const logoX = (pdfWidth - logoWidth) / 2;
      const logoY = pageHeight - logoHeight - 40;
      pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      const dateStr = new Date().toLocaleDateString('en-GB');
      pdf.setFontSize(13);
      pdf.setTextColor('#000080');
      pdf.text(`Report generated on: ${dateStr}`, pdfWidth / 2, logoY + logoHeight + 22, { align: 'center' });

      pdf.save('solar_panel_report.pdf');
    });
    // Show the button and filter again after capture
    if (downloadBtnRef.current) downloadBtnRef.current.style.display = '';
    if (filterRef.current) filterRef.current.style.display = '';
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilter = (range: string) => {
    setTimeRange(range);
    localStorage.setItem(FILTER_KEY, range);
    handleFilterClose();
  };

  const fetchEnergyData = async (range: string, date: Date) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateStr = moment(date).tz(userTimezone).format('YYYY-MM-DD');
    try {
      const res = await axios.get(`http://localhost:5000/api/energy/aggregate?filter=${range}&date=${dateStr}&timezone=${encodeURIComponent(userTimezone)}`);
      setEnergyData(res.data);
    } catch (err) {
      setEnergyData([]);
      console.error('Failed to fetch energy data:', err);
    }
  };

  useEffect(() => {
    fetchEnergyData(timeRange, selectedDate);
  }, [timeRange, selectedDate]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader 
        title="Reports" 
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
        <Container maxWidth="xl" ref={reportRef} sx={{ pt: { xs: 2, md: 4 }, pb: 4 }}>
          {/* Page Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 0 }}>
            <Typography variant="h4" fontWeight="700" sx={{ color: '#000', textAlign: 'center', mx: 'auto', width: '100%', mb: 2, mt: { xs: 2, md: 3 } }}>
              Solar Panel Monitoring and Anomaly Reports
            </Typography>
            <FramedDownloadButton ref={downloadBtnRef} startIcon={<DownloadIcon />} onClick={handleDownloadPDF}>
              Download
            </FramedDownloadButton>
          </Box>

          {/* Performance Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ChartContainer isMobile={isMobile} sx={{ mt: 2, mb: 4 }}>
                <Box className="chart-header">
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>Solar Panel Energy Production Trend</Typography>
                  <Box>
                    <Box className="pdf-hide-filter pdf-hide" ref={filterRef} sx={{ display: 'inline-block' }}>
                      <Button 
                        variant="text" 
                        color="primary" 
                        size="medium"
                        onClick={handleFilterClick}
                        endIcon={<FilterIcon />}
                        sx={{
                          fontSize: '1.1rem',
                          padding: '8px 20px',
                          minWidth: '110px',
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
                </Box>
                <RechartsResponsiveContainer width="100%" height={isMobile ? 400 : 450} isMobile={isMobile}>
                  <LineChart
                    data={energyData}
                    margin={{ 
                      top: 5, 
                      right: isMobile ? 15 : 35, 
                      left: isMobile ? 0 : 25, 
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
                          return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes() < 30 ? '00' : '30'} UTC`;
                        }
                        if (timeRange === 'week') return `Day ${value}`;
                        if (timeRange === 'month') return `Week ${value}`;
                        return value;
                      }}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip
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
                      name="Current (A)"
                      type="monotone"
                      dataKey="avgCurrent"
                      stroke="#000080"
                      strokeWidth={2}
                      dot={{ r: 6, strokeWidth: 2 }}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                    />
                    <Line
                      name="Energy Production (kW)"
                      type="monotone"
                      dataKey="avgEnergy"
                      stroke="#000080"
                      strokeWidth={2}
                      dot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                      activeDot={{ r: isMobile ? 6 : 8, strokeWidth: 2 }}
                    />
                    <Line
                      name="Efficiency (%)"
                      type="monotone"
                      dataKey="avgEfficiency"
                      stroke="#4caf50"
                      strokeWidth={2}
                      dot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                      activeDot={{ r: isMobile ? 6 : 8, strokeWidth: 2 }}
                    />
                  </LineChart>
                </RechartsResponsiveContainer>
              </ChartContainer>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <ChartCard elevation={0} ismobile={isMobile ? 'true' : undefined} sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }} color="#333">
                      Anomalies by Type
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={anomaliesTypeData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="type" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" barSize={40} radius={[8, 8, 0, 0]}> 
                          {anomaliesTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={anomalyBarColors[index % anomalyBarColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Anomalies Section */}
          <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <TableCard elevation={0}>
                {/* Date Filter */}
                <Box ref={filterRef} className="pdf-hide" sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, pb: 0 }}>
                  <Typography variant="body1" sx={{ mr: 2, fontWeight: 500 }}>Filter by Date:</Typography>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <ReportTitle variant="h6">
                    Solar Panel Monitoring and Anomaly Report
                  </ReportTitle>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Detected Anomaly</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell>Anomaly Status</StyledTableCell>
                        <StyledTableCell>Assigned Person</StyledTableCell>
                        <StyledTableCell>Location Description</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRows.map((row) => (
                        <StyledTableRow key={row.id}>
                          <StyledTableCell>{row.type}</StyledTableCell>
                          <StyledTableCell>{row.date ? new Date(row.date).toLocaleDateString('en-GB') : ''}</StyledTableCell>
                          <StyledTableCell>{row.status}</StyledTableCell>
                          <StyledTableCell>{row.assignedTo}</StyledTableCell>
                          <StyledTableCell>{row.location}</StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TableCard>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ReportsPage;