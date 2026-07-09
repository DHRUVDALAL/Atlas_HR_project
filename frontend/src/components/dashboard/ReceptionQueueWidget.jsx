import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, CircularProgress,
} from '@mui/material';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SendIcon from '@mui/icons-material/Send';
import StatusChip from '../common/StatusChip';
import { useNotification } from '../../hooks/useNotification';
import { getApplicants, forwardToHr } from '../../api/applicantService';

// Salvaged from ReceptionistDashboard: the "forward to HR" queue plus quick actions.
// Gated by workflow.reception_forward.
const ReceptionQueueWidget = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forwardingIds, setForwardingIds] = useState([]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await getApplicants();
      if (res.success && res.applicants) {
        setCandidates(res.applicants);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      showNotification('Failed to fetch candidates from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForward = async (e, candidateId) => {
    e.stopPropagation();
    if (forwardingIds.includes(candidateId)) return;
    try {
      setForwardingIds((prev) => [...prev, candidateId]);
      const res = await forwardToHr(candidateId);
      if (res.success) {
        showNotification('Candidate forwarded to HR successfully', 'success');
        fetchCandidates();
      }
    } catch (err) {
      console.error('Error forwarding candidate:', err);
      showNotification(err.response?.data?.detail || 'Failed to forward candidate', 'error');
    } finally {
      setForwardingIds((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  const getInitials = (firstName = '', lastName = '') =>
    `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  const handleGenerateLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/register-candidate`);
    showNotification('Registration link copied to clipboard!', 'success');
  };

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Reception Queue — Recent Candidates
              </Typography>
              <Button size="small" onClick={() => navigate('/candidates')} sx={{ fontWeight: 500 }}>
                View All
              </Button>
            </Box>
            <TableContainer>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>App No.</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Date Applied</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No candidates registered yet.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentCandidates.map((candidate) => {
                        const canEdit = ['DRAFT', 'SUBMITTED', 'Submitted — awaiting reception'].includes(candidate.status);
                        return (
                          <TableRow
                            key={candidate.candidate_id}
                            hover
                            onClick={() => navigate(`/register-candidate?edit=${candidate.candidate_id}`)}
                            sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              {candidate.application_number || '—'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 34, height: 34, bgcolor: '#1E3A5F', fontSize: '0.75rem', fontWeight: 600 }}>
                                  {getInitials(candidate.first_name, candidate.last_name)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {candidate.first_name} {candidate.last_name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {candidate.position_applied_for || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <StatusChip status={candidate.status} />
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => navigate(`/register-candidate?edit=${candidate.candidate_id}`)}
                                  sx={{ textTransform: 'none', minWidth: '60px', borderRadius: '6px', fontSize: '0.7rem' }}
                                >
                                  {canEdit ? 'Edit' : 'View'}
                                </Button>
                                {canEdit && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    disabled={forwardingIds.includes(candidate.candidate_id)}
                                    onClick={(e) => handleForward(e, candidate.candidate_id)}
                                    sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}
                                  >
                                    Mark as Arrived
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 3 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<LinkOutlinedIcon />}
                onClick={handleGenerateLink}
                sx={{
                  height: 48,
                  justifyContent: 'flex-start',
                  px: 3,
                  background: 'linear-gradient(135deg, #00897B, #4DB6AC)',
                  '&:hover': { background: 'linear-gradient(135deg, #00695C, #00897B)' },
                }}
              >
                Generate Registration Link
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => navigate('/candidates')}
                sx={{
                  height: 48,
                  justifyContent: 'flex-start',
                  px: 3,
                  borderColor: '#E5E7EB',
                  color: 'text.primary',
                  '&:hover': { borderColor: '#1E3A5F', backgroundColor: '#F8FAFF' },
                }}
              >
                View All Candidates
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ReceptionQueueWidget;
