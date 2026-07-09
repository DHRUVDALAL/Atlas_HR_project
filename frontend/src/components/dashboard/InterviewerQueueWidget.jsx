import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, CircularProgress, Alert,
} from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getMyAssignments } from '../../api/applicantService';

// "My assigned rounds" awaiting evaluation. Uses the dedicated
// /workflow/my-assignments endpoint (gated by workflow.technical_evaluate), so
// an interviewer needs no candidate.list permission.
const InterviewerQueueWidget = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getMyAssignments(true);
        if (res.success) {
          setAssignments(res.assignments || []);
        }
      } catch (err) {
        console.error('Error loading interviewer queue:', err);
        setErrorMsg(err.response?.data?.detail || 'Failed to fetch your assigned evaluations.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2 }}>
        My Assigned Evaluations
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Candidate Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Domain</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Round Awaiting Evaluation</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No candidates awaiting evaluation.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.round_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography fontWeight="600">{a.first_name} {a.last_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{a.domain || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Round {a.round_number} ({a.round_type})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={a.candidate_status} size="small" color="warning" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Assessment />}
                        onClick={() => navigate(`/interviewer/evaluate/${a.candidate_id}`)}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, backgroundColor: '#0F172A', '&:hover': { backgroundColor: '#1E293B' } }}
                      >
                        Evaluate
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

export default InterviewerQueueWidget;
