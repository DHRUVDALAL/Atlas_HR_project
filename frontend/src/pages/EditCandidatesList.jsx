import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, CircularProgress, Alert
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getApplicants } from '../api/applicantService';

const EditCandidatesList = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getApplicants();
        if (res.success && res.applicants) {
          setCandidates(res.applicants);
        }
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setErrorMsg(err.response?.data?.detail || 'Failed to fetch candidate records from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      <Typography variant="h4" fontWeight="800" color="#1e3a8a" mb={1}>
        Edit Candidate Records
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Select a candidate to view and edit their application form.
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Candidate Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Position Applied For</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No candidates registered yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow
                    key={candidate.candidate_id}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Typography fontWeight="600">{candidate.first_name} {candidate.last_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{candidate.position_applied_for || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{candidate.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{candidate.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={candidate.status}
                        size="small"
                        color={
                          candidate.status === 'Selected' || candidate.status === 'SELECTED' ? 'success' :
                          candidate.status === 'Rejected' || candidate.status === 'REJECTED' ? 'error' :
                          candidate.status === 'On Hold' || candidate.status === 'HOLD' ? 'warning' : 'info'
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/register-candidate?edit=${candidate.candidate_id}`)}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#1E3A8A',
                          color: '#1E3A8A',
                          '&:hover': {
                            borderColor: '#12224F',
                            backgroundColor: '#EFF6FF',
                          },
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default EditCandidatesList;
