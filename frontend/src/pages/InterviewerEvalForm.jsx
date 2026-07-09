import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Divider, Alert,
  Chip, MenuItem, Avatar, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Rating
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicantById, submitTechnicalEvaluation, getScorecardTopics, submitCeoEvaluation } from '../api/applicantService';
import { useNotification } from '../hooks/useNotification';
import CandidateFormReadOnly from '../components/CandidateFormReadOnly';
import ApplicationTimeline from '../components/common/ApplicationTimeline';

const OVERALL_FIELDS = [
  "Implementation experience (no. of full-cycle projects)",
  "Support / AMS experience",
  "GST / statutory exposure",
  "HANA / S/4HANA background",
  "Communication skill",
  "Attitude & learnability",
  "Final remark / recommendation"
];

const InterviewerEvalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [candidate, setCandidate] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scorecard topic states
  const [scorecardMetadata, setScorecardMetadata] = useState(null);
  const [topicsRatings, setTopicsRatings] = useState({});
  const [topicsRemarks, setTopicsRemarks] = useState({});
  
  // Overall assessment states
  const [overallAssessment, setOverallAssessment] = useState({
    "Implementation experience (no. of full-cycle projects)": "",
    "Support / AMS experience": "",
    "GST / statutory exposure": "",
    "HANA / S/4HANA background": "",
    "Communication skill": "",
    "Attitude & learnability": "",
    "Final remark / recommendation": ""
  });

  // Decision state
  const [statusSelection, setStatusSelection] = useState('COMPLETED');
  const [nextInterviewerEmail, setNextInterviewerEmail] = useState('');

  // General remarks text (defaults to overall remark field)
  const [generalRemarks, setGeneralRemarks] = useState('');

  // CEO Scorecard State
  const [ceoRatings, setCeoRatings] = useState({
    "Leadership": 3,
    "Vision": 3,
    "Decision Making": 3,
    "Culture": 3,
  });
  const [ceoRemarks, setCeoRemarks] = useState({
    "Leadership": "",
    "Vision": "",
    "Decision Making": "",
    "Culture": "",
  });
  const [ceoComments, setCeoComments] = useState('');

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getApplicantById(id);
        if (res && res.success && res.data) {
          const c = res.data;
          setCandidate(c);

          // Find the current pending round for evaluation
          const pending = (c.interview_rounds || []).find(r => r.status === 'PENDING');
          if (pending) {
            setActiveRound(pending);
            setGeneralRemarks(pending.remarks || '');
            
            if (pending.round_type === 'CEO_ROUND') {
              // Hydrate CEO Round draft if present
              if (pending.evaluation_data) {
                try {
                  const parsed = typeof pending.evaluation_data === 'string' ? JSON.parse(pending.evaluation_data) : pending.evaluation_data;
                  const newRatings = {};
                  const newRemarks = {};
                  ["Leadership", "Vision", "Decision Making", "Culture"].forEach(d => {
                    newRatings[d] = parsed[d]?.rating || 3;
                    newRemarks[d] = parsed[d]?.remarks || "";
                  });
                  setCeoRatings(newRatings);
                  setCeoRemarks(newRemarks);
                  setCeoComments(pending.remarks || '');
                } catch (e) {
                  console.error("Error parsing CEO round data:", e);
                }
              }
            } else if (c.domain) {
              // Fetch scorecard topics for candidate's domain
              const metadata = await getScorecardTopics(c.domain);
              if (metadata.success) {
                setScorecardMetadata(metadata);
                
                // Initialize default ratings and remarks
                const ratings = {};
                const remarks = {};
                metadata.topics.forEach(t => {
                  ratings[t] = 'Not worked';
                  remarks[t] = '';
                });

                // Load existing draft if present
                if (pending.evaluation_data) {
                  try {
                    const evalData = typeof pending.evaluation_data === 'string' ? JSON.parse(pending.evaluation_data) : pending.evaluation_data;
                    if (evalData.ratings) {
                      Object.assign(ratings, evalData.ratings);
                    }
                    if (evalData.remarks) {
                      Object.assign(remarks, evalData.remarks);
                    }
                    if (evalData.overall) {
                      setOverallAssessment(prev => ({ ...prev, ...evalData.overall }));
                    }
                  } catch (e) {
                    console.error('Error parsing draft evaluation data JSON:', e);
                  }
                }
                
                setTopicsRatings(ratings);
                setTopicsRemarks(remarks);
              }
            }
          } else {
            setErrorMsg('No pending interview round assigned to you was found for this candidate.');
          }
        } else {
          setErrorMsg('Failed to load candidate details.');
        }
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setErrorMsg('Candidate not found or unauthorized to view.');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id]);

  const handleTopicRatingChange = (topic, value) => {
    setTopicsRatings(prev => ({ ...prev, [topic]: value }));
  };

  const handleTopicRemarkChange = (topic, value) => {
    setTopicsRemarks(prev => ({ ...prev, [topic]: value }));
  };

  const handleOverallChange = (field, value) => {
    setOverallAssessment(prev => ({ ...prev, [field]: value }));
    if (field === 'Final remark / recommendation') {
      setGeneralRemarks(value);
    }
  };

  const isNextInterviewerRequired = 
    activeRound && 
    activeRound.round_number < (candidate?.total_rounds || 1) && 
    statusSelection === 'COMPLETED';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeRound?.round_type === 'CEO_ROUND') {
      if (!ceoComments || ceoComments.trim().length < 5) {
        showNotification('CEO Overall Remarks must be at least 5 characters long.', 'warning');
        return;
      }

      try {
        setIsSubmitting(true);
        const evalData = {};
        ["Leadership", "Vision", "Decision Making", "Culture"].forEach(d => {
          evalData[d] = {
            rating: ceoRatings[d],
            remarks: ceoRemarks[d]
          };
        });

        const payload = {
          remarks: ceoComments,
          evaluation_data: evalData,
          save_draft: false
        };

        const res = await submitCeoEvaluation(id, payload);
        if (res.success) {
          showNotification('CEO scorecard submitted successfully.', 'success');
          navigate('/dashboard');
        } else {
          showNotification(res.message || res.detail || 'Submission failed.', 'error');
        }
      } catch (err) {
        console.error('Error submitting CEO evaluation:', err);
        showNotification(err.response?.data?.detail || 'Failed to submit CEO scorecard.', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Check if next interviewer email is required
    if (isNextInterviewerRequired && !nextInterviewerEmail) {
      showNotification('Next interviewer email is required to forward to the next round.', 'warning');
      return;
    }

    const finalRemark = overallAssessment["Final remark / recommendation"] || '';
    const remarksText = generalRemarks || finalRemark || 'Evaluation completed';

    if (remarksText.length < 1) {
      showNotification('Please provide at least a brief remark before submitting.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        status_selection: statusSelection,
        remarks: remarksText,
        evaluation_data: {
          ratings: topicsRatings,
          remarks: topicsRemarks,
          overall: overallAssessment
        },
        next_interviewer_email: isNextInterviewerRequired ? nextInterviewerEmail : null
      };

      const res = await submitTechnicalEvaluation(id, activeRound.round_number, payload);
      if (res.success) {
        showNotification(`Technical Round ${activeRound.round_number} evaluation submitted successfully.`, 'success');
        navigate('/dashboard');
      } else {
        showNotification(res.message || res.detail || 'Submission failed.', 'error');
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || d.ctx?.reason || JSON.stringify(d)).join('; ') : 'Failed to submit evaluation.';
      showNotification(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [tabValue, setTabValue] = useState(0);

  // Helper to render round scorecard
  const renderRoundEvaluation = (round) => {
    if (!round.evaluation_data) return <Typography color="text.secondary">No evaluation details submitted for this round.</Typography>;
    
    try {
      const parsed = typeof round.evaluation_data === 'string' ? JSON.parse(round.evaluation_data) : round.evaluation_data;
      
      // Check if it is HR Round or CEO Round (7 dimensions format)
      if (round.round_type === 'HR_REVIEW' || round.round_type === 'CEO_ROUND') {
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
                {Object.entries(parsed).map(([dim, val]) => (
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
        );
      }

      // Otherwise Technical scorecard format
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
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }} startIcon={<ArrowBack />}>
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  const isCeoRound = activeRound?.round_type === 'CEO_ROUND';

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: '#1e3a8a' }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" fontWeight="800" color="#1e3a8a" mb={1}>
        {isCeoRound ? 'CEO Round Executive Evaluation' : `Section 10: Technical Round ${activeRound?.round_number} Evaluation`}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        {isCeoRound 
          ? 'Review candidate history and complete the leadership evaluation.' 
          : `Review candidate profile and fill in the domain technical scorecard for ${candidate?.domain}.`}
      </Typography>

      {isCeoRound ? (
        <>
          <Tabs
            value={tabValue}
            onChange={(e, val) => setTabValue(val)}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              mb: 4,
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' }
            }}
          >
            <Tab label="1. Candidate Profile (Sec 1-8)" />
            <Tab label="2. Interview Evaluation History" />
            <Tab label="3. CEO Scorecard" />
          </Tabs>

          {tabValue === 0 && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <CandidateFormReadOnly candidate={candidate} />
            </Paper>
          )}

          {tabValue === 1 && (
            <Box display="flex" flexDirection="column" gap={4}>
              {(candidate?.interview_rounds || [])
                .filter(r => r.round_id !== activeRound?.round_id) // hide current pending CEO round from history
                .map((round, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight="700" color="#1e3a5f">
                        Round {round.round_number}: {round.round_type === 'HR_REVIEW' ? 'HR REVIEW' : round.round_type}
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
              {(!candidate?.interview_rounds || candidate.interview_rounds.filter(r => r.round_id !== activeRound?.round_id).length === 0) && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No previous interview rounds completed yet.</Typography>
                </Paper>
              )}

              <Typography variant="h5" fontWeight="800" color="#1e3a8a" mt={4} mb={1}>
                Pipeline Activity & Audit Trail
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Full history of transitions, edits, reviews, and decisions recorded for this candidate.
              </Typography>
              <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <ApplicationTimeline logs={candidate?.activity_logs} />
              </Paper>
            </Box>
          )}

          {tabValue === 2 && (
            <Paper
              component="form"
              onSubmit={handleSubmit}
              elevation={0}
              sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
                CEO / Leadership Assessment
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
                    {["Leadership", "Vision", "Decision Making", "Culture"].map((dimension) => (
                      <TableRow key={dimension} hover>
                        <TableCell sx={{ fontWeight: 600, py: 1.2 }}>{dimension}</TableCell>
                        <TableCell align="center">
                          <Rating
                            value={ceoRatings[dimension]}
                            max={5}
                            size="small"
                            onChange={(e, val) => setCeoRatings(prev => ({ ...prev, [dimension]: val || 3 }))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={ceoRemarks[dimension]}
                            onChange={(e) => setCeoRemarks(prev => ({ ...prev, [dimension]: e.target.value }))}
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
                rows={4}
                required
                label="CEO Overall Remarks"
                placeholder="Provide details about Leadership, Vision, Decision Making, and Culture fit..."
                value={ceoComments}
                onChange={(e) => setCeoComments(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    backgroundColor: '#1E3A8A',
                    '&:hover': { backgroundColor: '#172554' },
                  }}
                >
                  {isSubmitting ? 'Submitting Scorecard...' : 'Submit CEO Evaluation'}
                </Button>
              </Box>
            </Paper>
          )}
        </>
      ) : (
        <>
          {/* Candidate Profile Details (Read-Only) */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', mb: 4 }}>
            <CandidateFormReadOnly candidate={candidate} />
          </Paper>

          {/* Scorecard form */}
          <Paper
            component="form"
            onSubmit={handleSubmit}
            elevation={0}
            sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}
          >
            <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
              Technical Scorecard — Module: {candidate?.domain}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {scorecardMetadata ? (
              <>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Interview Topic / Area</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: '220px' }}>Rating</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Remarks / Questions Asked</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scorecardMetadata.topics.map((topic, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 500, py: 1.5 }}>{topic}</TableCell>
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={topicsRatings[topic] || 'Not worked'}
                              onChange={(e) => handleTopicRatingChange(topic, e.target.value)}
                            >
                              {scorecardMetadata.rating_scale.map((r) => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Specific notes or remarks"
                              value={topicsRemarks[topic] || ''}
                              onChange={(e) => handleTopicRemarkChange(topic, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle1" fontWeight="700" color="#1e3a5f" mb={2}>
                  Overall Assessment & Recommendations
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {OVERALL_FIELDS.map((field) => (
                    <Grid size={{ xs: 12, md: field === "Final remark / recommendation" ? 12 : 6 }} key={field}>
                      <TextField
                        fullWidth
                        required={field === "Final remark / recommendation"}
                        multiline={field === "Final remark / recommendation"}
                        rows={field === "Final remark / recommendation" ? 3 : 1}
                        label={field}
                        placeholder={`Provide ${field.toLowerCase()}`}
                        value={overallAssessment[field] || ''}
                        onChange={(e) => handleOverallChange(field, e.target.value)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading scorecard topics...</Typography>
              </Box>
            )}

            <Typography variant="subtitle1" fontWeight="700" color="#1e3a5f" mb={2}>
              Interviewer Action & Next Routing
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Evaluation Status"
                  value={statusSelection}
                  onChange={(e) => setStatusSelection(e.target.value)}
                >
                  <MenuItem value="COMPLETED">Completed (Candidate Passes Round)</MenuItem>
                  <MenuItem value="REJECTED">Rejected (Candidate Fails)</MenuItem>
                  <MenuItem value="HOLD">Hold (Keep candidate on hold)</MenuItem>
                </TextField>
              </Grid>

              {isNextInterviewerRequired && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    required
                    fullWidth
                    type="email"
                    label="Next Interviewer Email Address"
                    placeholder="e.g. interviewer2@atlas.com"
                    value={nextInterviewerEmail}
                    onChange={(e) => setNextInterviewerEmail(e.target.value)}
                  />
                </Grid>
              )}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  backgroundColor: '#0F172A',
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                {isSubmitting ? 'Submitting Scorecard...' : 'Submit Evaluation'}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default InterviewerEvalForm;
