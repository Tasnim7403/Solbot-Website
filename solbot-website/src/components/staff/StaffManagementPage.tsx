import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Tooltip, Divider } from '@mui/material';
import AppHeader from '../common/Header';
import Sidebar from '../dashboard/Sidebar';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import styled from 'styled-components';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';

interface Staff {
  _id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

const StyledTableContainer = styled(TableContainer)`
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(26, 35, 126, 0.08);
  background: #fff;
  margin-top: 32px;
`;

const StyledTableHead = styled(TableHead)`
  & th {
    background: #f5f7fa;
    font-weight: 700;
    font-size: 1.1rem;
    color: #000080;
    position: sticky;
    top: 0;
    z-index: 1;
  }
`;

const StyledTableRow = styled(TableRow)`
  &:nth-of-type(odd) {
    background: #f8f9ff;
  }
  &:hover {
    background: #e3eafc;
    transition: background 0.2s;
  }
`;

const ActionIconButton = styled(IconButton)`
  margin: 0 4px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: background 0.2s;
  &:hover {
    background: #e3eafc;
  }
`;

const EnhancedAddButton = styled(Button)`
  border-radius: 20px;
  font-weight: 600;
  font-size: 1rem;
  padding: 8px 18px;
  min-width: 120px;
  height: 38px;
  background: linear-gradient(90deg, #3949ab 0%, #1a237e 100%) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(26, 35, 126, 0.12);
  &:hover {
    background: linear-gradient(90deg, #3949ab 0%, #1a237e 100%) !important;
    color: #fff !important;
  }
`;

const DialogPaper = styled(Paper)`
  border-radius: 18px !important;
  padding: 8px 0;
`;

const StaffManagementPage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [addErrors, setAddErrors] = useState<{ [key: string]: string }>({});
  const [addGeneralError, setAddGeneralError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Fetch people from backend
  const fetchStaff = async () => {
    try {
      const res = await axios.get('/api/people');
      setStaff(res.data);
    } catch (err) {
      setStaff([]);
    }
  };
  useEffect(() => { fetchStaff(); }, []);

  const handleAddOpen = () => {
    setForm({ name: '', role: '', email: '', phone: '' });
    setAddErrors({});
    setAddGeneralError(null);
    setAddOpen(true);
  };
  const handleAddClose = () => setAddOpen(false);
  const handleEditOpen = (person: Staff) => {
    setEditStaff(person);
    setForm({ name: person.name, role: person.role, email: person.email, phone: person.phone });
    setEditOpen(true);
  };
  const handleEditClose = () => setEditOpen(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async () => {
    // Frontend validation
    const errors: { [key: string]: string } = {};
    if (!form.name) errors.name = 'Name is required';
    if (!form.role) errors.role = 'Role is required';
    if (!form.email) errors.email = 'Email is required';
    if (!form.phone) errors.phone = 'Phone is required';
    setAddErrors(errors);
    setAddGeneralError(null);
    if (Object.keys(errors).length > 0) return;
    try {
      await axios.post('/api/people', form);
      setAddOpen(false);
      setAddErrors({});
      setAddGeneralError(null);
      fetchStaff();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        const errorMsg = err.response.data.error;
        if (typeof errorMsg === 'string' && errorMsg.includes('E11000')) {
          setAddGeneralError('Staff member already exists');
        } else {
          setAddGeneralError(errorMsg);
        }
      } else {
        setAddGeneralError('An error occurred.');
      }
    }
  };
  const handleEditSubmit = async () => {
    if (!editStaff) return;
    try {
      await axios.put(`/api/people/${editStaff._id}`, form);
      setEditOpen(false);
      fetchStaff();
    } catch (err) {
      // handle error
    }
  };
  const handleDeleteClick = (person: Staff) => {
    setStaffToDelete(person);
    setDeleteDialogOpen(true);
  };
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };
  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    try {
      await axios.delete(`/api/people/${staffToDelete._id}`);
      fetchStaff();
    } catch (err) {
      // handle error
    }
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  // Pagination logic
  const paginatedStaff = staff.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const pageCount = Math.ceil(staff.length / rowsPerPage);
  const handlePageChange = (_: any, value: number) => setPage(value);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)' }}>
      <AppHeader 
        title="Staff Management" 
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
          p: { xs: 1, md: 4 },
          width: { md: `calc(100% - 240px)` },
          ml: { md: '240px' },
          mt: '64px',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          {/* <Typography variant="h5" fontWeight={700}>People</Typography> */}
          <EnhancedAddButton startIcon={<AddIcon />} onClick={handleAddOpen}>
            Add Staff
          </EnhancedAddButton>
        </Stack>
        <StyledTableContainer>
          <Table>
            <StyledTableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {paginatedStaff.map(person => (
                <StyledTableRow key={person._id}>
                  <TableCell>{person.name}</TableCell>
                  <TableCell>{person.role}</TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.phone}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit" arrow>
                      <ActionIconButton color="primary" onClick={() => handleEditOpen(person)}>
                        <EditIcon />
                      </ActionIconButton>
                    </Tooltip>
                    <Tooltip title="Delete" arrow>
                      <ActionIconButton color="error" onClick={() => handleDeleteClick(person)}>
                        <DeleteIcon />
                      </ActionIconButton>
                    </Tooltip>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
        {pageCount > 1 && (
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={handlePageChange}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} PaperProps={{ sx: { p: 2, minWidth: 300 } }}>
          <DialogTitle sx={{ fontSize: '1.15rem', fontWeight: 600, textAlign: 'center', pb: 2 }}>
            Are you sure you want to delete this staff member?
          </DialogTitle>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button onClick={handleDeleteDialogClose} variant="contained" color="error" sx={{ fontSize: '1rem', fontWeight: 700, px: 3, py: 1 }}>No</Button>
            <Button onClick={handleDeleteConfirm} variant="outlined" sx={{ fontSize: '1rem', fontWeight: 700, borderWidth: 2, borderRadius: 2, px: 3, py: 1 }}>Yes</Button>
          </DialogActions>
        </Dialog>

        {/* Add Staff Dialog */}
        <Dialog open={addOpen} onClose={handleAddClose} PaperComponent={DialogPaper}>
          <DialogTitle>Add Staff</DialogTitle>
          <Divider />
          <DialogContent sx={{ minWidth: 350, py: 2 }}>
            {addGeneralError && (
              <Typography color="error" sx={{ mb: 2 }}>{addGeneralError}</Typography>
            )}
            <TextField margin="dense" label="Name" name="name" fullWidth value={form.name} onChange={handleFormChange} autoFocus error={!!addErrors.name} helperText={addErrors.name} />
            <TextField margin="dense" label="Role" name="role" fullWidth value={form.role} onChange={handleFormChange} error={!!addErrors.role} helperText={addErrors.role} />
            <TextField margin="dense" label="Email" name="email" fullWidth value={form.email} onChange={handleFormChange} error={!!addErrors.email} helperText={addErrors.email} />
            <TextField margin="dense" label="Phone" name="phone" fullWidth value={form.phone} onChange={handleFormChange} error={!!addErrors.phone} helperText={addErrors.phone} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleAddClose}>Cancel</Button>
            <Button onClick={handleAddSubmit} variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}>Add</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Staff Dialog */}
        <Dialog open={editOpen} onClose={handleEditClose} PaperComponent={DialogPaper}>
          <DialogTitle>Edit Staff</DialogTitle>
          <Divider />
          <DialogContent sx={{ minWidth: 350, py: 2 }}>
            <TextField margin="dense" label="Name" name="name" fullWidth value={form.name} onChange={handleFormChange} autoFocus />
            <TextField margin="dense" label="Role" name="role" fullWidth value={form.role} onChange={handleFormChange} />
            <TextField margin="dense" label="Email" name="email" fullWidth value={form.email} onChange={handleFormChange} />
            <TextField margin="dense" label="Phone" name="phone" fullWidth value={form.phone} onChange={handleFormChange} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleEditClose}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained" sx={{ fontWeight: 700, borderRadius: 2 }}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default StaffManagementPage; 