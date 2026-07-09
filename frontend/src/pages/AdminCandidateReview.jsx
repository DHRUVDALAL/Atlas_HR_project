import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  Grid, Divider, Alert, CircularProgress, Tabs, Tab,
  Rating, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Card
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getApplicantById, submitCeoEvaluation, submitFinalDecision } from '../api/applicantService';
import { useNotification } from '../hooks/useNotification';
import CandidateFormReadOnly from '../components/CandidateFormReadOnly';
import ApplicationTimeline from '../components/common/ApplicationTimeline';

const CEO_RATINGS_DIMENSIONS = [
  "Leadership Potential",
  "Technical Understanding",
  "Communication",
  "Cultural Fit"
];

const AdminCandidateReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const mode = searchParams.get('mode') || 'review';

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Tab state: 0 = Candidate Profile, 1 = HR Review, 2 = Technical Evaluation, 3 = CEO Evaluation
  const [tabValue, setTabValue] = useState(0);

  // CEO Scorecard Form State
  const [ceoRatings, setCeoRatings] = useState({
    "Leadership Potential": 3,
    "Technical Understanding": 3,
    "Communication": 3,
    "Cultural Fit": 3,
  });

  const [ceoRemarks, setCeoRemarks] = useState({
    "Leadership Potential": "",
    "Technical Understanding": "",
    "Communication": "",
    "Cultural Fit": "",
  });

  const [ceoComments, setCeoComments] = useState('');
  const [isSubmittingCeo, setIsSubmittingCeo] = useState(false);

  // Final Decision / HR Discussion States
  const [finalStatus, setFinalStatus] = useState('SELECTED');
  const [offeredCtc, setOfferedCtc] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [finalRemarks, setFinalRemarks] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Structured HR Discussion Form State
  const [discussionDate, setDiscussionDate] = useState('');
  const [hrDiscussionNotesText, setHrDiscussionNotesText] = useState('');
  const [salaryDiscussionSummary, setSalaryDiscussionSummary] = useState('');
  const [hrNegotiatedCtc, setHrNegotiatedCtc] = useState('');
  const [hrFinalOfferedCtc, setHrFinalOfferedCtc] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState('');
  const [candidateResponse, setCandidateResponse] = useState('Thinking'); // Accepted, Thinking, Rejected
  const [hrNoticePeriodConfirmed, setHrNoticePeriodConfirmed] = useState('Confirmed');
  const [hrFinalRemarks, setHrFinalRemarks] = useState('');
  const [finalRecommendation, setFinalRecommendation] = useState('SELECTED'); // SELECTED, REJECTED, HOLD, OFFER_RELEASED

  // Inline Validation Errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getApplicantById(id);
        if (res && res.success && res.data) {
          const c = res.data;
          setCandidate(c);

          // Populate CEO Draft if any CEO round exists
          const ceoRound = (c.interview_rounds || []).find(r => r.round_type === 'CEO_ROUND');
          if (ceoRound && ceoRound.evaluation_data) {
            try {
              const parsed = typeof ceoRound.evaluation_data === 'string' ? JSON.parse(ceoRound.evaluation_data) : ceoRound.evaluation_data;
              const newRatings = {};
              const newRemarks = {};
              CEO_RATINGS_DIMENSIONS.forEach(d => {
                if (parsed.ratings) {
                  newRatings[d] = parsed.ratings[d] || 3;
                  newRemarks[d] = parsed.ceo_remarks || "";
                } else {
                  newRatings[d] = parsed[d]?.rating || 3;
                  newRemarks[d] = parsed[d]?.remarks || "";
                }
              });
              setCeoRatings(newRatings);
              setCeoRemarks(newRemarks);
              setCeoComments(ceoRound.remarks || parsed.overall_impression || '');
            } catch (e) {
              console.error("Error parsing CEO round data:", e);
            }
          }

          // Populate Final Decision / HR Discussion if already set
          if (c.final_decision) {
            const fd = c.final_decision;
            setFinalStatus(fd.final_status);
            setOfferedCtc(fd.offered_ctc || '');
            setJoiningDate(fd.joining_date || '');
            setFinalRemarks(fd.final_remarks || '');
            
            // Check if hr_discussion_notes is a JSON string
            if (fd.hr_discussion_notes && fd.hr_discussion_notes.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(fd.hr_discussion_notes);
                setDiscussionDate(parsed.discussion_date || '');
                setHrDiscussionNotesText(parsed.hr_discussion_notes || '');
                setSalaryDiscussionSummary(parsed.salary_discussion_summary || '');
                setHrNegotiatedCtc(parsed.negotiated_ctc || '');
                setHrFinalOfferedCtc(parsed.final_offered_ctc || '');
                setExpectedJoiningDate(parsed.expected_joining_date || '');
                setCandidateResponse(parsed.candidate_response || 'Thinking');
                setHrNoticePeriodConfirmed(parsed.notice_period_confirmed || 'Confirmed');
                setHrFinalRemarks(parsed.remarks || '');
                setFinalRecommendation(parsed.final_recommendation || fd.final_status);
              } catch (e) {
                console.error("Error parsing hr_discussion_notes JSON:", e);
                setHrDiscussionNotesText(fd.hr_discussion_notes || '');
              }
            } else {
              setHrDiscussionNotesText(fd.hr_discussion_notes || '');
            }
          }
        } else {
          setErrorMsg('Failed to load candidate details.');
        }
      } catch (err) {
        console.error('Error fetching candidate details:', err);
        setErrorMsg('Candidate details not found or unauthorized.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id]);

  useEffect(() => {
    if (mode === 'evaluate') {
      setTabValue(3);
    }
  }, [mode]);

  const handleCeoRatingChange = (dim, val) => {
    setCeoRatings(prev => ({ ...prev, [dim]: val }));
  };

  const handleCeoRemarkChange = (dim, val) => {
    setCeoRemarks(prev => ({ ...prev, [dim]: val }));
  };

  const handleCeoSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingCeo(true);
      const evalData = {
        ratings: {
          "Leadership Potential": ceoRatings["Leadership Potential"],
          "Technical Understanding": ceoRatings["Technical Understanding"],
          "Communication": ceoRatings["Communication"],
          "Cultural Fit": ceoRatings["Cultural Fit"]
        },
        overall_impression: ceoComments,
        ceo_remarks: ceoComments,
        decision: finalStatus,
        offered_ctc: offeredCtc,
        joining_date: joiningDate,
        recommendation: finalRemarks
      };

      const res = await submitCeoEvaluation(id, {
        remarks: ceoComments || "CEO evaluation completed",
        evaluation_data: evalData,
        save_draft: false
      });

      if (res.success) {
        showNotification('CEO Evaluation Saved Successfully', 'success');
        // Reload applicant data
        const updated = await getApplicantById(id);
        if (updated.success) setCandidate(updated.data);
      }
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.detail || 'Failed to save CEO scorecard.', 'error');
    } finally {
      setIsSubmittingCeo(false);
    }
  };

  const saveHrDiscussion = async (isFinalize) => {
    // Inline validation for finalization
    if (isFinalize) {
      const newErrors = {};
      if (!discussionDate) newErrors.discussionDate = 'Discussion Date is required';
      if (!hrNegotiatedCtc) newErrors.hrNegotiatedCtc = 'Negotiated CTC is required';
      if (!hrFinalOfferedCtc) newErrors.hrFinalOfferedCtc = 'Final Offered CTC is required';
      if (!candidateResponse) newErrors.candidateResponse = 'Candidate Response is required';
      if (!hrNoticePeriodConfirmed) newErrors.hrNoticePeriodConfirmed = 'Notice Period Confirmation is required';
      if (!finalRecommendation) newErrors.finalRecommendation = 'Final Recommendation is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showNotification('Please fill all required fields.', 'warning');
        return;
      }
    }
    setErrors({});

    try {
      setIsSubmittingDecision(true);
      
      const payloadNotes = {
        is_draft: !isFinalize,
        discussion_date: discussionDate,
        hr_discussion_notes: hrDiscussionNotesText,
        salary_discussion_summary: salaryDiscussionSummary,
        negotiated_ctc: hrNegotiatedCtc,
        final_offered_ctc: hrFinalOfferedCtc,
        expected_joining_date: expectedJoiningDate,
        candidate_response: candidateResponse,
        notice_period_confirmed: hrNoticePeriodConfirmed,
        remarks: hrFinalRemarks,
        hr_final_comments: hrFinalRemarks,
        final_recommendation: finalRecommendation
      };

      // Determine final_status to send to backend API
      let finalStatusApi = 'HOLD';
      if (isFinalize) {
        if (finalRecommendation === 'OFFER_RELEASED') {
          finalStatusApi = 'SELECTED';
        } else {
          finalStatusApi = finalRecommendation;
        }
      }

      const payload = {
        final_status: finalStatusApi,
        offered_ctc: hrFinalOfferedCtc ? parseFloat(hrFinalOfferedCtc) : null,
        joining_date: expectedJoiningDate || null,
        final_remarks: hrFinalRemarks || null,
        hr_discussion_notes: JSON.stringify(payloadNotes)
      };

      const res = await submitFinalDecision(id, payload);
      if (res.success) {
        showNotification(
          isFinalize 
            ? `Recruitment Completed Successfully` 
            : 'HR Discussion Draft saved successfully.', 
          'success'
        );
        
        // Refresh candidate details
        const updated = await getApplicantById(id);
        if (updated.success) setCandidate(updated.data);
      }
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.detail || 'Failed to save HR discussion.', 'error');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Helper to render round scorecard
  const renderRoundEvaluation = (round) => {
    if (!round.evaluation_data) return <Typography color="text.secondary">No evaluation details submitted for this round.</Typography>;
    
    try {
      const parsed = typeof round.evaluation_data === 'string' ? JSON.parse(round.evaluation_data) : round.evaluation_data;
      
      if (round.round_type === 'HR_REVIEW' || round.round_type === 'CEO_ROUND') {
        const ratingsMap = parsed.ratings || parsed;
        return (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', mt: 1 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Dimension</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '150px' }} align="center">Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(ratingsMap).map(([dim, val]) => (
                  <TableRow key={dim}>
                    <TableCell sx={{ fontWeight: 600 }}>{dim}</TableCell>
                    <TableCell align="center">
                      <Rating value={val.rating || val || 0} readOnly max={5} size="small" />
                    </TableCell>
                    <TableCell>{val.remarks || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      }

      const { ratings = {}, remarks = {}, overall = {} } = parsed;
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" fontWeight="700" color="text.secondary" mb={1}>Topic Ratings</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Topic / Area</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '180px' }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(ratings).map((topic) => (
                  <TableRow key={topic}>
                    <TableCell sx={{ fontWeight: 500 }}>{topic}</TableCell>
                    <TableCell>
                      <Chip label={ratings[topic]} size="small" color={ratings[topic] === 'Good' || ratings[topic] === 'OK' ? 'success' : 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>{remarks[topic] || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle2" fontWeight="700" color="text.secondary" mb={1}>Overall Assessment</Typography>
          <Grid container spacing={2}>
            {Object.entries(overall).map(([k, v]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={k}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '6px' }}>
                  <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                  <Typography variant="body2" fontWeight="600">{v || '—'}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    } catch (e) {
      console.error(e);
      return <Typography variant="body2">Error parsing evaluation data: {String(round.evaluation_data)}</Typography>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SELECTED': return 'success';
      case 'REJECTED': return 'error';
      case 'HOLD': return 'warning';
      case 'FINAL_DECISION': return 'warning';
      default: return 'info';
    }
  };

  const isFinalized = () => {
    if (!candidate?.final_decision) return false;
    const notes = candidate.final_decision.hr_discussion_notes || '';
    if (notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(notes);
        return !parsed.is_draft;
      } catch (e) {}
    }
    return true; // assume legacy finalized decision
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg && !candidate) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{errorMsg}</Alert>
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }} startIcon={<ArrowBack />}>Back to Dashboard</Button>
      </Box>
    );
  }

  const hrRound = (candidate?.interview_rounds || []).find(r => r.round_type === 'HR_REVIEW');
  const hrParsed = hrRound?.evaluation_data
    ? (typeof hrRound.evaluation_data === 'string' ? JSON.parse(hrRound.evaluation_data) : hrRound.evaluation_data)
    : null;

  const technicalRounds = (candidate?.interview_rounds || [])
    .filter(r => r.round_type !== 'HR_REVIEW' && r.round_type !== 'CEO_ROUND');

  const ceoRound = (candidate?.interview_rounds || []).find(r => r.round_type === 'CEO_ROUND');
  const ceoParsed = ceoRound?.evaluation_data
    ? (typeof ceoRound.evaluation_data === 'string' ? JSON.parse(ceoRound.evaluation_data) : ceoRound.evaluation_data)
    : null;

  const isCeoFormEditable = mode === 'evaluate' && candidate?.status === 'CEO_ROUND';
  const isHrDiscussionActive = candidate?.status === 'FINAL_DECISION' || candidate?.status === 'HOLD' || candidate?.status === 'SELECTED' || candidate?.status === 'REJECTED';
  const isHrDiscussionEditable = isHrDiscussionActive && (!candidate?.final_decision || (candidate?.final_decision?.hr_discussion_notes && JSON.parse(candidate.final_decision.hr_discussion_notes)?.is_draft));
  
  const isDiscussionFinalized = isFinalized();

  // Workflow summary stepper data
  const steps = [
    { label: "Candidate Submitted", completed: true },
    { label: "Reception Verified", completed: true },
    { label: "HR Review Completed", completed: true },
    { label: "Technical Evaluation Completed", completed: true },
    { label: "CEO Evaluation Completed", completed: ceoRound?.status === 'COMPLETED' },
    { 
      label: isHrDiscussionActive ? (isDiscussionFinalized ? "HR Discussion Completed" : "HR Discussion (Current)") : "HR Discussion (Pending)", 
      completed: isDiscussionFinalized,
      active: isHrDiscussionActive && !isDiscussionFinalized
    },
    { 
      label: isDiscussionFinalized ? "Recruitment Completed" : "Final Decision", 
      completed: isDiscussionFinalized,
      active: false
    }
  ];

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Redesigned Compact Premium Header Card */}
      <Card elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="800" color="#0F172A" sx={{ letterSpacing: '-0.025em', mb: 1.5 }}>
              {candidate?.first_name} {candidate?.last_name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5 }}>Application Number</Typography>
                <Typography variant="body2" fontWeight="700" color="#1E293B">{candidate?.employee_code || candidate?.candidate_id?.slice(0, 8)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5 }}>Applied Domain</Typography>
                <Typography variant="body2" fontWeight="700" color="#1E293B">{candidate?.domain || '—'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5 }}>Current Stage</Typography>
                <Chip 
                  label={candidate?.status === 'FINAL_DECISION' ? 'Awaiting HR Discussion' : (candidate?.status === 'HOLD' && candidate?.final_decision?.hr_discussion_notes && JSON.parse(candidate.final_decision.hr_discussion_notes)?.is_draft ? 'Awaiting HR Discussion' : candidate?.status)} 
                  size="small" 
                  color={getStatusColor(candidate?.status)} 
                  sx={{ fontWeight: 700, borderRadius: '6px' }} 
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5 }}>Status</Typography>
                <Chip 
                  label={candidate?.final_decision?.final_status ? (JSON.parse(candidate.final_decision.hr_discussion_notes || '{}').is_draft ? 'Draft Saved' : candidate.final_decision.final_status) : 'Awaiting Discussion'} 
                  size="small" 
                  color={candidate?.final_decision?.final_status ? (JSON.parse(candidate.final_decision.hr_discussion_notes || '{}').is_draft ? 'warning' : getStatusColor(candidate.final_decision.final_status)) : 'default'} 
                  sx={{ fontWeight: 700, borderRadius: '6px' }} 
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3, py: 1 }}
            >
              Back
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Demo Workflow Summary Stepper Banner */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#F8FAFC', mb: 4 }}>
        <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={2}>
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <Box display="flex" alignItems="center" gap={1}>
                {step.completed ? (
                  <Chip 
                    label={`✓ ${step.label}`} 
                    size="small" 
                    sx={{ bgcolor: '#dbeafe', color: '#1e3a8a', fontWeight: 700, borderRadius: '6px' }} 
                  />
                ) : step.active ? (
                  <Chip 
                    label={`→ ${step.label}`} 
                    size="small" 
                    sx={{ bgcolor: '#1e3a8a', color: '#FFFFFF', fontWeight: 700, borderRadius: '6px' }} 
                  />
                ) : (
                  <Chip 
                    label={step.label} 
                    size="small" 
                    sx={{ bgcolor: '#e2e8f0', color: '#64748b', fontWeight: 600, borderRadius: '6px' }} 
                  />
                )}
              </Box>
              {idx < steps.length - 1 && (
                <Typography color="text.secondary" fontWeight="700" sx={{ mx: 0.5 }}>
                  •
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Card>

      {/* Professional Step Navigation Tabs */}
      <Tabs
        value={tabValue}
        onChange={(e, val) => setTabValue(val)}
        sx={{
          mb: 4,
          borderBottom: '1px solid #e2e8f0',
          '& .MuiTabs-flexContainer': { gap: '8px' },
          '& .MuiTab-root': {
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '8px 8px 0 0',
            px: 3,
            py: 1.5,
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }
        }}
      >
        <Tab 
          label="1. Candidate Profile" 
          sx={{ 
            bgcolor: tabValue === 0 ? '#1e3a8a' : '#dbeafe', 
            color: tabValue === 0 ? '#FFFFFF !important' : '#1e3a8a !important' 
          }} 
        />
        <Tab 
          label="2. HR Review" 
          sx={{ 
            bgcolor: tabValue === 1 ? '#1e3a8a' : (hrRound?.status === 'COMPLETED' ? '#dbeafe' : '#f1f5f9'), 
            color: tabValue === 1 ? '#FFFFFF !important' : (hrRound?.status === 'COMPLETED' ? '#1e3a8a !important' : '#64748b !important')
          }} 
        />
        <Tab 
          label="3. Technical Review" 
          sx={{ 
            bgcolor: tabValue === 2 ? '#1e3a8a' : (technicalRounds.some(r => r.status === 'COMPLETED') ? '#dbeafe' : '#f1f5f9'), 
            color: tabValue === 2 ? '#FFFFFF !important' : (technicalRounds.some(r => r.status === 'COMPLETED') ? '#1e3a8a !important' : '#64748b !important')
          }} 
        />
        <Tab 
          label="4. CEO Evaluation" 
          sx={{ 
            bgcolor: tabValue === 3 ? '#1e3a8a' : (ceoRound?.status === 'COMPLETED' ? '#dbeafe' : '#f1f5f9'), 
            color: tabValue === 3 ? '#FFFFFF !important' : (ceoRound?.status === 'COMPLETED' ? '#1e3a8a !important' : '#64748b !important')
          }} 
        />
      </Tabs>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <CandidateFormReadOnly candidate={candidate} />
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
            HR Interview Assessment Summary
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {hrRound ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8FAFC', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Domain</Typography>
                  <Typography variant="body2" fontWeight="600">{candidate?.domain || '—'}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8FAFC', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Assigned Interviewer</Typography>
                  <Typography variant="body2" fontWeight="600">{hrRound.assigned_interviewer || '—'}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8FAFC', mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Technical Rounds Assigned</Typography>
                  <Typography variant="body2" fontWeight="600">{candidate?.total_rounds || '—'}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" color="text.secondary" display="block">HR Decision</Typography>
                  <Chip label={hrRound.status} size="small" color={hrRound.status === 'COMPLETED' ? 'success' : 'warning'} sx={{ mt: 0.5, fontWeight: 700 }} />
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle2" fontWeight="700" color="#1e3a5f" mb={2}>HR Dimensions Ratings</Typography>
                {hrParsed ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Dimension</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '150px' }} align="center">Rating</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(hrParsed).map(([dim, val]) => (
                          <TableRow key={dim}>
                            <TableCell sx={{ fontWeight: 600 }}>{dim}</TableCell>
                            <TableCell align="center">
                              <Rating value={val.rating || 0} readOnly max={5} size="small" />
                            </TableCell>
                            <TableCell>{val.remarks || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No HR rating details found.</Typography>
                )}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="700" color="#1e3a5f" mb={1}>HR Remarks & Recommendation</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', minHeight: '80px', bgcolor: '#F8FAFC' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{hrRound.remarks || 'No remarks provided.'}</Typography>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">HR review data is not available yet.</Typography>
          )}
        </Paper>
      )}

      {tabValue === 2 && (
        <Box display="flex" flexDirection="column" gap={3}>
          {technicalRounds.map((round, index) => (
            <Paper key={round.round_id || index} elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="700" color="#1e3a5f">
                  Technical Round {round.round_number} ({round.round_type})
                </Typography>
                <Chip
                  label={round.status}
                  size="small"
                  color={round.status === 'COMPLETED' ? 'success' : 'warning'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Interviewer: <strong>{round.assigned_interviewer}</strong> | Status: <strong>{round.status}</strong>
              </Typography>
              <Divider sx={{ my: 2 }} />
              {renderRoundEvaluation(round)}
            </Paper>
          ))}
          {technicalRounds.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No technical evaluations completed yet.</Typography>
            </Paper>
          )}
        </Box>
      )}

      {tabValue === 3 && (
        <Grid container spacing={4} alignItems="stretch">
          {/* Left Column: CEO Evaluation Form */}
          <Grid item xs={12} lg={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            {isCeoFormEditable ? (
              <Paper
                component="form"
                onSubmit={handleCeoSubmit}
                elevation={0}
                sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
                  CEO Candidate Evaluation Scorecard
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Assessment Dimension</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '150px' }} align="center">Rating</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CEO_RATINGS_DIMENSIONS.map((dimension) => (
                        <TableRow key={dimension} hover>
                          <TableCell sx={{ fontWeight: 600, py: 1.2 }}>{dimension}</TableCell>
                          <TableCell align="center">
                            <Rating
                              value={ceoRatings[dimension]}
                              max={5}
                              size="small"
                              onChange={(e, val) => handleCeoRatingChange(dimension, val || 3)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder={`Remarks for ${dimension}`}
                              value={ceoRemarks[dimension]}
                              onChange={(e) => handleCeoRemarkChange(dimension, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  required
                  label="Overall Impression"
                  placeholder="Enter overall impression of the candidate..."
                  value={ceoComments}
                  onChange={(e) => setCeoComments(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <TextField
                  select
                  fullWidth
                  required
                  label="Hiring Pipeline Outcome (Decision)"
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value)}
                  sx={{ mb: 3 }}
                >
                  <MenuItem value="SELECTED">SELECTED (Offer Job)</MenuItem>
                  <MenuItem value="REJECTED">REJECTED (Decline application)</MenuItem>
                  <MenuItem value="HOLD">HOLD (Keep on Hold)</MenuItem>
                </TextField>

                {finalStatus === 'SELECTED' && (
                  <TextField
                    required
                    fullWidth
                    type="number"
                    step="0.1"
                    label="Offered CTC (Annual LPA)"
                    placeholder="e.g. 7.5"
                    value={offeredCtc}
                    onChange={(e) => setOfferedCtc(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                )}

                <TextField
                  fullWidth
                  type="date"
                  label="Proposed Joining Date"
                  InputLabelProps={{ shrink: true }}
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="CEO Final Recommendation Notes"
                  placeholder="Any recommendation notes..."
                  value={finalRemarks}
                  onChange={(e) => setFinalRemarks(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmittingCeo}
                  startIcon={isSubmittingCeo ? <CircularProgress size={16} color="inherit" /> : <Save />}
                  sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1E3A8A' }}
                >
                  Submit CEO Scorecard
                </Button>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#F8FAFC', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
                  CEO / Leadership Evaluation Summary
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {ceoRound ? (
                  <Box display="flex" flexDirection="column" gap={3}>
                    <Typography variant="body2" color="text.secondary">
                      Evaluator: <strong>{ceoRound.assigned_interviewer}</strong> | Status: <strong>{ceoRound.status}</strong>
                    </Typography>
                    {renderRoundEvaluation(ceoRound)}
                    <Divider sx={{ my: 1 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" mb={0.5}>Overall Impression</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: '#FFFFFF', p: 2, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        {ceoRound.remarks || '—'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">CEO / Leadership round not evaluated yet.</Typography>
                )}
              </Paper>
            )}
          </Grid>

          {/* Right Column: HR Discussion Panel */}
          <Grid item xs={12} lg={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            {!isHrDiscussionActive ? (
              <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC' }}>
                <Typography color="text.secondary" align="center">
                  HR Discussion details will become active once the CEO evaluation is saved.
                </Typography>
              </Paper>
            ) : (
              <Box display="flex" flexDirection="column" gap={3} sx={{ flex: 1 }}>
                {/* CEO Evaluation Summary Card for HR Reference */}
                <Card elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#F8FAFC' }}>
                  <Typography variant="subtitle1" fontWeight="700" color="#1e3a5f" mb={2}>
                    CEO Evaluation Summary (Read-Only Reference)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Leadership Rating</Typography>
                      <Rating value={ceoParsed?.ratings?.["Leadership Potential"] || ceoParsed?.["Leadership Potential"]?.rating || 0} readOnly size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Technical Understanding</Typography>
                      <Rating value={ceoParsed?.ratings?.["Technical Understanding"] || ceoParsed?.["Technical Understanding"]?.rating || 0} readOnly size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Communication</Typography>
                      <Rating value={ceoParsed?.ratings?.["Communication"] || ceoParsed?.["Communication"]?.rating || 0} readOnly size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Cultural Fit</Typography>
                      <Rating value={ceoParsed?.ratings?.["Cultural Fit"] || ceoParsed?.["Cultural Fit"]?.rating || 0} readOnly size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block">Overall Impression</Typography>
                      <Typography variant="body2" fontWeight="600">{ceoRound?.remarks || ceoParsed?.overall_impression || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block">CEO Remarks & Recommendation</Typography>
                      <Typography variant="body2" fontWeight="600">{ceoParsed?.recommendation || '—'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">CEO Decision</Typography>
                      <Chip label={ceoParsed?.decision || '—'} size="small" color="info" sx={{ fontWeight: 600 }} />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Offered CTC</Typography>
                      <Typography variant="body2" fontWeight="700">{ceoParsed?.offered_ctc ? `${ceoParsed.offered_ctc} LPA` : '—'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">Joining Date</Typography>
                      <Typography variant="body2" fontWeight="600">{ceoParsed?.joining_date || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Evaluator</Typography>
                      <Typography variant="body2" fontWeight="600">{ceoRound?.assigned_interviewer || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Submission Time</Typography>
                      <Typography variant="body2" fontWeight="600">{ceoRound?.updated_at ? new Date(ceoRound.updated_at).toLocaleString() : '—'}</Typography>
                    </Grid>
                  </Grid>
                </Card>

                {/* HR Discussion Form */}
                {isHrDiscussionEditable ? (
                  <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                    <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
                      HR Discussion & Final Decision Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Box display="flex" flexDirection="column" gap={3}>
                      {/* Section 1: Discussion Information */}
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="#1e3a5f" sx={{ mb: 1.5, letterSpacing: '0.025em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Discussion Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              type="date"
                              label="Discussion Date"
                              InputLabelProps={{ shrink: true }}
                              value={discussionDate}
                              onChange={(e) => setDiscussionDate(e.target.value)}
                              error={!!errors.discussionDate}
                              helperText={errors.discussionDate}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              fullWidth
                              required
                              label="Notice Period Confirmation"
                              value={hrNoticePeriodConfirmed}
                              onChange={(e) => setHrNoticePeriodConfirmed(e.target.value)}
                              error={!!errors.hrNoticePeriodConfirmed}
                              helperText={errors.hrNoticePeriodConfirmed}
                            >
                              <MenuItem value="Confirmed">Confirmed</MenuItem>
                              <MenuItem value="Negotiated">Negotiated</MenuItem>
                              <MenuItem value="Not Confirmed">Not Confirmed</MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Section 2: Offer Information */}
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="#1e3a5f" sx={{ mb: 1.5, letterSpacing: '0.025em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Offer Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              multiline
                              rows={2}
                              label="Salary Discussion Summary"
                              placeholder="Summary of salary discussions..."
                              value={salaryDiscussionSummary}
                              onChange={(e) => setSalaryDiscussionSummary(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              type="number"
                              label="Negotiated CTC (LPA)"
                              value={hrNegotiatedCtc}
                              onChange={(e) => setHrNegotiatedCtc(e.target.value)}
                              error={!!errors.hrNegotiatedCtc}
                              helperText={errors.hrNegotiatedCtc}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              required
                              fullWidth
                              type="number"
                              label="Final Offered CTC (LPA)"
                              value={hrFinalOfferedCtc}
                              onChange={(e) => setHrFinalOfferedCtc(e.target.value)}
                              error={!!errors.hrFinalOfferedCtc}
                              helperText={errors.hrFinalOfferedCtc}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              type="date"
                              label="Expected Joining Date"
                              InputLabelProps={{ shrink: true }}
                              value={expectedJoiningDate}
                              onChange={(e) => setExpectedJoiningDate(e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Section 3: Candidate Response */}
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="#1e3a5f" sx={{ mb: 1.5, letterSpacing: '0.025em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Candidate Response
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              fullWidth
                              required
                              label="Candidate Response"
                              value={candidateResponse}
                              onChange={(e) => setCandidateResponse(e.target.value)}
                              error={!!errors.candidateResponse}
                              helperText={errors.candidateResponse}
                            >
                              <MenuItem value="Accepted">Accepted</MenuItem>
                              <MenuItem value="Thinking">Thinking</MenuItem>
                              <MenuItem value="Rejected">Rejected</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Remarks"
                              placeholder="Candidate response details..."
                              value={hrFinalRemarks}
                              onChange={(e) => setHrFinalRemarks(e.target.value)}
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Section 4: Final Recommendation */}
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="#1e3a5f" sx={{ mb: 1.5, letterSpacing: '0.025em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Final Recommendation
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          required
                          label="Final Recommendation"
                          value={finalRecommendation}
                          onChange={(e) => setFinalRecommendation(e.target.value)}
                          error={!!errors.finalRecommendation}
                          helperText={errors.finalRecommendation}
                        >
                          <MenuItem value="SELECTED">Selected</MenuItem>
                          <MenuItem value="REJECTED">Rejected</MenuItem>
                          <MenuItem value="HOLD">Hold</MenuItem>
                          <MenuItem value="OFFER_RELEASED">Offer Released</MenuItem>
                        </TextField>
                      </Box>

                      {/* Action Buttons */}
                      <Box display="flex" gap={2} sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => saveHrDiscussion(false)}
                          disabled={isSubmittingDecision}
                          sx={{ textTransform: 'none', fontWeight: 700, flex: 1, borderRadius: '8px' }}
                        >
                          Save Draft
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => saveHrDiscussion(true)}
                          disabled={isSubmittingDecision}
                          sx={{ textTransform: 'none', fontWeight: 700, flex: 1, borderRadius: '8px', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                        >
                          Finalize Discussion
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ) : (
                  <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#F8FAFC', flex: 1 }}>
                    <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
                      Final Decision & Summary
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box display="flex" flexDirection="column" gap={2.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">Final Selection Status</Typography>
                        <Chip
                          label={candidate?.final_decision?.final_status === 'SELECTED' ? 'SELECTED' : candidate?.final_decision?.final_status}
                          color={candidate?.final_decision?.final_status === 'SELECTED' ? 'success' : candidate?.final_decision?.final_status === 'REJECTED' ? 'error' : 'warning'}
                          sx={{ fontWeight: 800 }}
                        />
                      </Box>

                      {candidate?.final_decision?.final_status === 'SELECTED' && (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" color="text.secondary">Offered CTC</Typography>
                          <Typography variant="body2" fontWeight="700">{candidate?.final_decision?.offered_ctc} LPA</Typography>
                        </Box>
                      )}

                      {candidate?.final_decision?.joining_date && (
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" color="text.secondary">Proposed Joining Date</Typography>
                          <Typography variant="body2" fontWeight="600">{new Date(candidate?.final_decision?.joining_date).toLocaleDateString()}</Typography>
                        </Box>
                      )}

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">Decision Approved By</Typography>
                        <Typography variant="body2" fontWeight="600">{candidate?.final_decision?.approved_by || '—'}</Typography>
                      </Box>

                      {hrDiscussionNotesText && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" mb={0.5}>HR Discussion Details</Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '8px' }}>
                            <Grid container spacing={1.5}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Discussion Date</Typography>
                                <Typography variant="body2" fontWeight="600">{discussionDate || '—'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Negotiated CTC</Typography>
                                <Typography variant="body2" fontWeight="600">{hrNegotiatedCtc ? `${hrNegotiatedCtc} LPA` : '—'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Candidate Response</Typography>
                                <Typography variant="body2" fontWeight="600">{candidateResponse || '—'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Notice Period Confirmation</Typography>
                                <Typography variant="body2" fontWeight="600">{hrNoticePeriodConfirmed || '—'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Discussion Notes</Typography>
                                <Typography variant="body2">{hrDiscussionNotesText}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Salary Discussion Summary</Typography>
                                <Typography variant="body2">{salaryDiscussionSummary || '—'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">Remarks / Final Comments</Typography>
                                <Typography variant="body2">{hrFinalRemarks || '—'}</Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* Workflow Timeline Audit Trail */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" fontWeight="800" color="#1e3a8a" mb={1}>
          Pipeline Activity & Audit Trail
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Full history of transitions, edits, reviews, and decisions recorded for this candidate.
        </Typography>
        <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <ApplicationTimeline logs={candidate?.activity_logs} />
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminCandidateReview;
