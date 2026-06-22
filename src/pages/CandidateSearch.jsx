import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Grid, MenuItem, InputAdornment, Paper, Chip } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Search, FilterList, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const mockCandidates = [
  { id: 1, name: 'John Doe', role: 'Frontend Dev', exp: '3 Years', status: 'Applied', date: '2026-06-21', source: 'LinkedIn' },
  { id: 2, name: 'Jane Smith', role: 'Backend Dev', exp: '5 Years', status: 'HR Screening', date: '2026-06-22', source: 'Referral' },
  { id: 3, name: 'Alice Walker', role: 'UI/UX Designer', exp: '2 Years', status: 'Selected', date: '2026-06-20', source: 'Indeed' },
  { id: 4, name: 'Bob Brown', role: 'DevOps Engineer', exp: '4 Years', status: 'Rejected', date: '2026-06-19', source: 'Website' },
  { id: 5, name: 'Charlie Davis', role: 'Frontend Dev', exp: '1 Year', status: 'Technical R1', date: '2026-06-18', source: 'LinkedIn' },
];

const CandidateSearch = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('All');

  const columns = [
    { field: 'name', headerName: 'Candidate Name', flex: 1.5, minWidth: 200, renderCell: (params) => <Typography fontWeight="600">{params.value}</Typography> },
    { field: 'role', headerName: 'Role', flex: 1, minWidth: 150 },
    { field: 'exp', headerName: 'Experience', width: 120 },
    { field: 'date', headerName: 'Applied Date', width: 130, color: 'text.secondary' },
    { field: 'source', headerName: 'Source', width: 130 },
    {
      field: 'status', headerName: 'Status', width: 150,
      renderCell: (params) => {
        let color = 'default';
        if (params.value === 'Selected') color = 'success';
        if (params.value === 'Rejected') color = 'error';
        if (params.value === 'HR Screening' || params.value === 'Technical R1') color = 'warning';
        if (params.value === 'Applied') color = 'info';
        return <Chip label={params.value} color={color} size="small" sx={{ fontWeight: 600 }} />;
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 150,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => navigate(`/candidates/${params.row.id}`)} sx={{ borderRadius: 2 }}>
          View Profile
        </Button>
      ),
    },
  ];

  const filteredRows = filterStatus === 'All' ? mockCandidates : mockCandidates.filter(c => c.status === filterStatus);

  return (
    <Box className="animate-fade-in delay-100" sx={{ height: 'calc(100vh - 120px)', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="800">Advanced Candidate Search</Typography>
        <Button variant="contained" color="primary" startIcon={<Download />}>Export CSV</Button>
      </Box>

      {/* Advanced Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or skills..."
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Role" defaultValue="All">
              <MenuItem value="All">All Roles</MenuItem>
              <MenuItem value="Frontend Dev">Frontend Dev</MenuItem>
              <MenuItem value="Backend Dev">Backend Dev</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select fullWidth label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Applied">Applied</MenuItem>
              <MenuItem value="HR Screening">HR Screening</MenuItem>
              <MenuItem value="Technical R1">Technical R1</MenuItem>
              <MenuItem value="Selected">Selected</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" startIcon={<FilterList />} sx={{ height: 56 }}>More Filters</Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* DataGrid */}
      <Box sx={{ 
        flexGrow: 1, bgcolor: 'background.paper', borderRadius: 4, border: 1, borderColor: 'divider', overflow: 'hidden',
        '& .MuiDataGrid-root': { border: 'none' },
        '& .MuiDataGrid-columnHeaders': { bgcolor: 'action.hover', borderBottom: 2, borderColor: 'divider' },
        '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
      }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default CandidateSearch;
