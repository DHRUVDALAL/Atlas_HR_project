import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, CircularProgress, Alert, Tabs, Tab,
  TextField, InputAdornment, Grid,
} from '@mui/material';
import RateReview from '@mui/icons-material/RateReview';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Visibility from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { getApplicants } from '../../api/applicantService';

// Salvaged from HrDashboard: pending HR review + selected candidates queue.
// Gated by workflow.hr_review.
const HrReviewQueueWidget = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateFilter, setDateFilter] = useState('');

  // Filter server-side by status so we see the whole queue, not just page 1.
  // Tab 0 = candidates a receptionist has forwarded (ready for HR review).
  useEffect(() => {
    const status = tabValue === 0 ? 'RECEPTION_FORWARDED' : 'SELECTED';
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getApplicants({ status, limit: 100 });
        if (res.success && res.applicants) {
          setCandidates(res.applicants);
        }
      } catch (err) {
        console.error('Error fetching HR candidates:', err);
        setErrorMsg(err.response?.data?.detail || 'Failed to fetch candidates from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [tabValue]);

  const filteredCandidates = candidates.filter((c) => {
    if (dateFilter) {
      const candidateDate = c.created_at ? c.created_at.split('T')[0] : '';
      return candidateDate === dateFilter;
    }
    return true;
  });

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 2 }}>
        HR Review Queue
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: '1px solid #e2e8f0', '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}
          >
            <Tab label="Pending HR Review" />
            <Tab label="Selected Candidates" />
          </Tabs>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TextField
            type="date"
            size="small"
            label="Filter by Date"
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: '100%', maxWidth: '240px' }}
          />
          {dateFilter && (
            <Button size="small" sx={{ ml: 1, textTransform: 'none' }} onClick={() => setDateFilter('')}>
              Clear
            </Button>
          )}
        </Grid>
      </Grid>

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
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Registration Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      {tabValue === 0
                        ? 'Nothing to review yet — candidates appear here once a receptionist forwards them from the "Awaiting Reception" queue.'
                        : 'No selected candidates found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.candidate_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography fontWeight="600">{candidate.first_name} {candidate.last_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{candidate.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.created_at ? candidate.created_at.split('T')[0] : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={candidate.status} size="small" color={tabValue === 0 ? 'info' : 'success'} sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      {tabValue === 0 ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<RateReview />}
                          onClick={() => navigate(`/hr/review/${candidate.candidate_id}`)}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' } }}
                        >
                          Review
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/hr/review/${candidate.candidate_id}?view=true`)}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                        >
                          View Details
                        </Button>
                      )}
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

export default HrReviewQueueWidget;
