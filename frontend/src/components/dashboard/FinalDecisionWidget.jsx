import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Alert, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Tabs, Tab
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { getApplicants, submitFinalDecision } from '../../api/applicantService';
import { useNotification } from '../../hooks/useNotification';

// Salvaged from AdminDashboard: full candidate visibility + final Select/Reject decision.
// Gated by evaluation.view_all / decision.final.
const FinalDecisionWidget = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [finalStatus, setFinalStatus] = useState('SELECTED');
  const [offeredCtc, setOfferedCtc] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [finalRemarks, setFinalRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await getApplicants({ limit: 100 });
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

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openDecisionDialog = (candidate, status) => {
    setSelectedCandidate(candidate);
    setFinalStatus(status);
    setOfferedCtc('');
    setJoiningDate('');
    setFinalRemarks('');
    setDialogOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (finalStatus === 'SELECTED' && (!offeredCtc || parseFloat(offeredCtc) <= 0)) {
      showNotification('Offered CTC must be provided and greater than 0 for SELECTED status', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        final_status: finalStatus,
        offered_ctc: finalStatus === 'SELECTED' ? parseFloat(offeredCtc) : null,
        joining_date: joiningDate || null,
        final_remarks: finalRemarks || null,
      };

      const res = await submitFinalDecision(selectedCandidate.candidate_id, payload);
      if (res.success) {
        showNotification(`Decision for ${selectedCandidate.first_name} recorded successfully.`, 'success');
        setDialogOpen(false);
        fetchCandidates();
      }
    } catch (err) {
      console.error('Error recording final decision:', err);
      showNotification(err.response?.data?.detail || 'Failed to record decision.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // The backend only accepts a final decision once the candidate has reached
  // FINAL_DECISION (i.e. the CEO round is complete). Gate the quick actions on
  // that so we never fire a request that would 400.
  const canDecide = (candidate) => candidate.status === 'FINAL_DECISION';

  const getStatusColor = (status) => {
    if (status === 'SELECTED' || status === 'Selected') return 'success';
    if (status === 'REJECTED' || status === 'Rejected') return 'error';
    if (status === 'HOLD' || status === 'On Hold') return 'warning';
    return 'info';
  };

  const activeCandidates = candidates.filter(c => {
    if (['SELECTED', 'REJECTED'].includes(c.status)) return false;
    if (c.status === 'HOLD') {
      if (c.final_decision?.hr_discussion_notes) {
        try {
          const parsed = JSON.parse(c.final_decision.hr_discussion_notes);
          if (parsed && parsed.is_draft) return true;
        } catch (e) {}
      }
      return false;
    }
    return true;
  });

  const finalDecisions = candidates.filter(c => {
    if (['SELECTED', 'REJECTED'].includes(c.status)) return true;
    if (c.status === 'HOLD') {
      if (c.final_decision?.hr_discussion_notes) {
        try {
          const parsed = JSON.parse(c.final_decision.hr_discussion_notes);
          if (parsed && parsed.is_draft) return false;
        } catch (e) {}
      }
      return true;
    }
    return false;
  });

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 0.5 }}>
        Hiring Pipeline & Final Decisions
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Candidate progression tracking. Final selection outcome and offer discussions become available once a candidate reaches the final decision stage.
      </Typography>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      <Tabs
        value={tabValue}
        onChange={(e, val) => setTabValue(val)}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 3, borderBottom: '1px solid #e2e8f0', '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}
      >
        <Tab label={`Active Candidates (${activeCandidates.length})`} />
        <Tab label={`Final Decisions (${finalDecisions.length})`} />
      </Tabs>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : tabValue === 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Domain</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Current Stage</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No active candidates found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activeCandidates.map((candidate) => (
                  <TableRow key={candidate.candidate_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography fontWeight="600" variant="body2">{candidate.first_name} {candidate.last_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{candidate.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{candidate.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{candidate.domain || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={candidate.status} size="small" color={getStatusColor(candidate.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                        {candidate.status === 'CEO_ROUND' ? (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => navigate(`/admin/review/${candidate.candidate_id}?mode=evaluate`)}
                              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, mr: 1, fontSize: '0.75rem', backgroundColor: '#1e3a8a', '&:hover': { backgroundColor: '#172554' } }}
                            >
                              Evaluate
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/admin/review/${candidate.candidate_id}?mode=review`)}
                              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, mr: 1, fontSize: '0.75rem' }}
                            >
                              Review Candidate
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant={canDecide(candidate) ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => navigate(`/admin/review/${candidate.candidate_id}${canDecide(candidate) ? '' : '?mode=review'}`)}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, mr: 1, fontSize: '0.75rem', ...(canDecide(candidate) ? { backgroundColor: '#1e3a8a', '&:hover': { backgroundColor: '#172554' } } : {}) }}
                          >
                            {canDecide(candidate) ? 'Record HR Discussion' : 'Review Candidate'}
                          </Button>
                        )}
                        <Tooltip title={canDecide(candidate) ? 'Select Candidate' : 'Available at the final-decision stage'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => openDecisionDialog(candidate, 'SELECTED')}
                              disabled={!canDecide(candidate)}
                              sx={{ color: '#10B981', '&:hover': { bgcolor: '#ECFDF5' } }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={canDecide(candidate) ? 'Reject Candidate' : 'Available at the final-decision stage'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => openDecisionDialog(candidate, 'REJECTED')}
                              disabled={!canDecide(candidate)}
                              sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Candidate Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Decision</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Final Offered CTC</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Joining Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>CEO Recommendation</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>HR Recommendation</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Discussion Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }}>Current Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e3a5f' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {finalDecisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No finalized decisions found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                finalDecisions.map((candidate) => {
                  const ceoRound = (candidate.interview_rounds || []).find(r => r.round_type === 'CEO_ROUND');
                  
                  // Parse HR notes if structured JSON exists
                  let hrData = null;
                  if (candidate.final_decision?.hr_discussion_notes && candidate.final_decision.hr_discussion_notes.trim().startsWith('{')) {
                    try {
                      hrData = JSON.parse(candidate.final_decision.hr_discussion_notes);
                    } catch (e) {}
                  }

                  return (
                    <TableRow key={candidate.candidate_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography fontWeight="600" variant="body2">{candidate.first_name} {candidate.last_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="700" color="#1e3a8a">{candidate.final_decision?.final_status || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {candidate.final_decision?.offered_ctc ? `${candidate.final_decision.offered_ctc} LPA` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {candidate.final_decision?.joining_date ? new Date(candidate.final_decision.joining_date).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ceoRound?.remarks || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {hrData?.final_recommendation || candidate.final_decision?.final_status || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {hrData?.discussion_date || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={candidate.status} size="small" color={getStatusColor(candidate.status)} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/admin/review/${candidate.candidate_id}?mode=review`)}
                          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          View Summary
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#1e3a5f' }}>
          Record Final Decision for {selectedCandidate?.first_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              select
              label="Final Status Decision"
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value)}
              fullWidth
            >
              <MenuItem value="SELECTED">SELECTED (Offer Job)</MenuItem>
              <MenuItem value="REJECTED">REJECTED (Decline Offer)</MenuItem>
              <MenuItem value="HOLD">HOLD (Keep on Hold)</MenuItem>
            </TextField>

            {finalStatus === 'SELECTED' && (
              <TextField
                required
                type="number"
                label="Offered CTC (LPA)"
                value={offeredCtc}
                onChange={(e) => setOfferedCtc(e.target.value)}
                placeholder="e.g. 8.5"
                fullWidth
              />
            )}

            <TextField
              type="date"
              label="Proposed Joining Date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              multiline
              rows={3}
              label="Final Decision Remarks"
              placeholder="Provide final remarks..."
              value={finalRemarks}
              onChange={(e) => setFinalRemarks(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={finalStatus === 'SELECTED' ? 'success' : 'error'}
            onClick={handleConfirmDecision}
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Decision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinalDecisionWidget;
