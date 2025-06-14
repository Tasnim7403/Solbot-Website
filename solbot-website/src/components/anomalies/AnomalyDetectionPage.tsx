import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Avatar
} from '@mui/material';
import { Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import styled from 'styled-components';
import AppHeader from '../common/Header';
import Sidebar from '../dashboard/Sidebar';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Pagination from '@mui/material/Pagination';

// Styled components
const TableCard = styled(Paper)`
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  border: none;
  min-height: 90vh;
  @media (max-width: 900px) {
    width: 100vw;
    margin: 0;
  }
`;

const StyledTableCell = styled(TableCell)`
  padding: 40px 40px;
  font-size: 1.25rem;
  transition: all 0.3s ease;
  color: #333;
  &:hover {
    color: #1a237e;
  }
  &.MuiTableCell-head {
    font-weight: 700;
    color: #000;
    background: #fff;
  }
`;

const StyledTableRow = styled(TableRow)`
  background: #fff;
  &:nth-of-type(odd) {
    background: #fafbfc;
  }
`;

const StatusPill = styled('span')<{
  status: 'fixed' | 'not_fixed' | 'pending';
}>`
  display: inline-block;
  min-width: 80px;
  padding: 4px 18px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  background-color: ${({ status }) =>
    status === 'fixed' ? '#e8f5e9' :
    status === 'pending' ? '#fff8e1' :
    '#ffebee'};
  color: ${({ status }) =>
    status === 'fixed' ? '#2e7d32' :
    status === 'pending' ? '#f57f17' :
    '#c62828'};
`;

const PaginationButton = styled(Button)<{ active?: boolean; nav?: boolean }>`
  min-width: 64px;
  height: 48px;
  margin: 0 8px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
  color: ${({ active, nav }) =>
    active ? '#fff !important' : nav ? '#000080' : '#000080'};
  background: ${({ active, nav }) =>
    active ? '#000080 !important' : nav ? 'rgba(0,0,128,0.08)' : '#fff'};
  border: 2px solid #000080 !important;
  box-shadow: ${({ nav }) =>
    nav ? '0 4px 16px rgba(0,0,128,0.15)' : '0 2px 8px rgba(0,0,0,0.08)'};
  text-transform: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: ${({ active, nav }) =>
      active ? '#000080 !important' : nav ? 'rgba(0,0,128,0.18)' : '#f0f4ff'};
    color: ${({ active }) => (active ? '#fff !important' : '#000080')};
    box-shadow: ${({ nav }) =>
      nav ? '0 6px 24px rgba(0,0,128,0.22)' : '0 4px 16px rgba(0,0,0,0.12)'};
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0,0,128,0.15);
  }
  & .MuiTouchRipple-root {
    display: none;
  }
`;

const AnomalyDetectionPage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editAnchorEl, setEditAnchorEl] = useState<null | HTMLElement>(null);
  const [editRowId, setEditRowId] = useState<string | number | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [editLocationAnchorEl, setEditLocationAnchorEl] = useState<null | HTMLElement>(null);
  const [editLocationRowId, setEditLocationRowId] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState('');
  const [editPersonAnchorEl, setEditPersonAnchorEl] = useState<null | HTMLElement>(null);
  const [editPersonRowId, setEditPersonRowId] = useState<string | null>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/anomalies?limit=50&page=1', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setAnomalies(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch anomalies:', error);
      }
    };
    const fetchPeople = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/people');
        const data = await response.json();
        setPeople(data.map((p: any) => p.name));
      } catch (error) {
        console.error('Failed to fetch people:', error);
      }
    };
    fetchAnomalies();
    fetchPeople();
  }, []);

  const totalPages = Math.ceil(anomalies.length / 10);
  const paginatedData = anomalies.slice((currentPage - 1) * 10, currentPage * 10);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEditClick = (event: React.MouseEvent<HTMLElement>, rowId: string | number) => {
    setEditAnchorEl(event.currentTarget);
    setEditRowId(rowId);
  };

  const handleEditClose = () => {
    setEditAnchorEl(null);
    setEditRowId(null);
  };

  const handleStatusChange = async (status: 'fixed' | 'pending' | 'not_fixed') => {
    if (!editRowId) return;
    // Update in backend
    await fetch(`http://localhost:5000/api/anomalies/${editRowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ status }),
    });
    // Update local state
    setAnomalies(prev => prev.map(row =>
      (row._id === editRowId || row.id === editRowId) ? { ...row, status } : row
    ));
    handleEditClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLocationEditClick = (event: React.MouseEvent<HTMLElement>, rowId: string, currentLocation: string) => {
    setEditLocationAnchorEl(event.currentTarget);
    setEditLocationRowId(rowId);
    setNewLocation(currentLocation);
  };

  const handleLocationSave = async () => {
    // Call your backend to update the anomaly's location
    await fetch(`http://localhost:5000/api/anomalies/${editLocationRowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ location: newLocation }),
    });
    // Update local state
    setAnomalies(prev => prev.map(row =>
      row._id === editLocationRowId ? { ...row, location: newLocation } : row
    ));
    setEditLocationAnchorEl(null);
    setEditLocationRowId(null);
    setNewLocation('');
  };

  const handlePersonEditClick = (event: React.MouseEvent<HTMLElement>, rowId: string) => {
    setEditPersonAnchorEl(event.currentTarget);
    setEditPersonRowId(rowId);
  };

  const handlePersonSave = async (name: string) => {
    await fetch(`http://localhost:5000/api/anomalies/${editPersonRowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ assignedTo: name }),
    });
    setAnomalies(prev => prev.map(row =>
      (row._id === editPersonRowId || row.id === editPersonRowId) ? { ...row, assignedTo: name } : row
    ));
    setEditPersonAnchorEl(null);
    setEditPersonRowId(null);
  };

  const handleViewImage = (image: string | null) => {
    setModalImage(image);
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setModalImage(null);
  };

  const shouldHideImage = (row: any) => {
    // Format date as yyyy-mm-dd for comparison
    const date = new Date(row.timestamp);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${d}`;

    // Range: 2025-05-18 to 2025-05-25 (inclusive)
    return isoDate >= '2025-05-18' && isoDate <= '2025-05-25';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader 
        title="Anomaly Detection History" 
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
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth={false} sx={{ width: { xs: '100vw', md: '100%' }, p: 0 }}>
          <TableCard elevation={0}>
            <TableContainer sx={{ overflowX: 'auto', width: { xs: '100vw', md: '100%' } }}>
              <Table sx={{ minWidth: 1200, mt: 6 }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Detected Anomaly</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                    <StyledTableCell>Anomaly Status</StyledTableCell>
                    <StyledTableCell>Assigned Person</StyledTableCell>
                    <StyledTableCell>Location</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <StyledTableRow key={row._id || idx}>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {row.anomalyType}
                          {!shouldHideImage(row) && row.image && (
                            <IconButton size="small" sx={{ ml: 1 }} onClick={() => handleViewImage(row.image)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        {new Date(row.timestamp).toLocaleDateString()}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StatusPill status={row.status}>
                            {row.status === 'fixed' && 'Fixed'}
                            {row.status === 'pending' && 'Pending'}
                            {row.status === 'not_fixed' && 'Not Fixed'}
                          </StatusPill>
                          <IconButton size="small" sx={{ ml: 1 }} onClick={e => handleEditClick(e, row._id || row.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#000080', fontSize: 16, mr: 1 }}>
                            {row.assignedTo ? row.assignedTo.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <span>{row.assignedTo}</span>
                          <IconButton size="small" sx={{ ml: 1 }} onClick={e => handlePersonEditClick(e, row._id || row.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        {row.location}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event: React.ChangeEvent<unknown>, value: number) => handlePageChange(value)}
                  variant="outlined"
                  shape="rounded"
                  size="large"
                  siblingCount={0}
                  boundaryCount={0}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '12px',
                      minWidth: 56,
                      minHeight: 48,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      border: '1.5px solid #000080',
                      color: '#000080',
                      boxShadow: '0 2px 8px rgba(0,0,128,0.08)',
                    },
                    '& .Mui-selected': {
                      background: '#000080',
                      color: '#fff',
                      border: '1.5px solid #000080',
                    },
                    '& .Mui-disabled': {
                      color: '#bdbdbd',
                      border: '1.5px solid #bdbdbd',
                    },
                  }}
                />
              </Box>
            )}
          </TableCard>
          <Menu
            anchorEl={editAnchorEl}
            open={Boolean(editAnchorEl)}
            onClose={handleEditClose}
          >
            <MenuItem onClick={() => handleStatusChange('fixed')}>Fixed</MenuItem>
            <MenuItem onClick={() => handleStatusChange('pending')}>Pending</MenuItem>
            <MenuItem onClick={() => handleStatusChange('not_fixed')}>Not Fixed</MenuItem>
          </Menu>
          <Menu
            anchorEl={editLocationAnchorEl}
            open={Boolean(editLocationAnchorEl)}
            onClose={() => setEditLocationAnchorEl(null)}
          >
            <MenuItem>
              <input
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                style={{ width: 150 }}
              />
              <Button onClick={handleLocationSave}>Save</Button>
            </MenuItem>
          </Menu>
          <Menu
            anchorEl={editPersonAnchorEl}
            open={Boolean(editPersonAnchorEl)}
            onClose={() => setEditPersonAnchorEl(null)}
          >
            {people.map(name => (
              <MenuItem key={name} onClick={() => handlePersonSave(name)}>
                {name}
              </MenuItem>
            ))}
          </Menu>
        </Container>
        <Dialog open={imageModalOpen} onClose={handleCloseImageModal} maxWidth="md">
          <DialogContent>
            {modalImage && (
              <img
                src={`data:image/jpeg;base64,${modalImage}`}
                alt="Anomaly"
                style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', margin: '0 auto' }}
              />
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AnomalyDetectionPage;