import React from 'react';
import { Box, Typography, Button, Chip, Avatar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

const mockCandidates = [
  { id: 1, name: 'John Doe', role: 'Frontend Developer', experience: '3 Years', status: 'Round 1', date: '2026-06-21', avatar: 'JD' },
  { id: 2, name: 'Jane Smith', role: 'Backend Developer', experience: '5 Years', status: 'HR Round', date: '2026-06-22', avatar: 'JS' },
  { id: 3, name: 'Alice Johnson', role: 'UI/UX Designer', experience: '2 Years', status: 'Selected', date: '2026-06-20', avatar: 'AJ' },
  { id: 4, name: 'Bob Brown', role: 'DevOps Engineer', experience: '4 Years', status: 'Rejected', date: '2026-06-19', avatar: 'BB' },
];

const getStatusConfig = (status) => {
  switch (status) {
    case 'Selected': return { color: '#10B981', bg: '#D1FAE5' };
    case 'Rejected': return { color: '#EF4444', bg: '#FEE2E2' };
    case 'Hold': return { color: '#F59E0B', bg: '#FEF3C7' };
    default: return { color: '#3B82F6', bg: '#DBEAFE' };
  }
};

const CandidatesList = () => {
  const navigate = useNavigate();

  const columns = [
    {
      field: 'name',
      headerName: 'Candidate',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.main' }}>
            {params.row.avatar}
          </Avatar>
          <Typography variant="body2" fontWeight="600">{params.value}</Typography>
        </Box>
      ),
    },
    { field: 'role', headerName: 'Applied Role', flex: 1, minWidth: 180 },
    { field: 'experience', headerName: 'Experience', width: 130 },
    { field: 'date', headerName: 'Applied Date', width: 130, color: 'text.secondary' },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const config = getStatusConfig(params.value);
        return (
          <Box sx={{
            bgcolor: config.bg,
            color: config.color,
            py: 0.5,
            px: 1.5,
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: config.color }} />
            {params.value}
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          sx={{ borderRadius: '6px', textTransform: 'none', boxShadow: 'none' }}
          onClick={() => navigate(`/candidates/${params.row.id}`)}
        >
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <Box className="animate-fade-in delay-100" sx={{ height: 'calc(100vh - 120px)', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="800">
          Candidates Pipeline
        </Typography>
        <Button variant="contained" color="primary">Add Candidate</Button>
      </Box>
      
      <Box sx={{ 
        height: '100%', 
        bgcolor: 'background.paper', 
        borderRadius: 4, 
        p: 2,
        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
        '& .MuiDataGrid-root': {
          border: 'none',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #F3F4F6',
        },
        '& .MuiDataGrid-columnHeaders': {
          borderBottom: '2px solid #E5E7EB',
          bgcolor: '#F9FAFB',
          borderRadius: '12px 12px 0 0',
        },
        '& .MuiDataGrid-row:hover': {
          bgcolor: '#F9FAFB',
          cursor: 'pointer'
        }
      }}>
        <DataGrid
          rows={mockCandidates}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default CandidatesList;
