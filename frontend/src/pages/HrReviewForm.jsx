import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  Grid, Divider, Alert, Avatar, CircularProgress, Rating,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getApplicantById, submitHrReview } from '../api/applicantService';
import { useNotification } from '../hooks/useNotification';
import CandidateFormReadOnly from '../components/CandidateFormReadOnly';

const HR_DIMENSIONS = [
  "Communication & Articulation",
  "Confidence & Poise",
  "Technical / Domain Knowledge",
  "Attitude & Ownership Mindset",
  "Empathy & Team Orientation",
  "Problem-Solving Approach",
  "Cultural Fit & Values Alignment"
];

const SAP_DOMAINS = ["FI", "CO", "MM", "SD", "PP", "QM", "PM", "WM", "HCM", "BASIS"];

const HrReviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();

  const viewMode = searchParams.get('view') === 'true';

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs state
  const [domain, setDomain] = useState('');
  const [technicalRounds, setTechnicalRounds] = useState(1);
  const [hrStatus, setHrStatus] = useState('SELECT');
  const [firstInterviewerEmail, setFirstInterviewerEmail] = useState('');

  // 7 Dimensions ratings & remarks
  const [ratings, setRatings] = useState({
    "Communication & Articulation": 3,
    "Confidence & Poise": 3,
    "Technical / Domain Knowledge": 3,
    "Attitude & Ownership Mindset": 3,
    "Empathy & Team Orientation": 3,
    "Problem-Solving Approach": 3,
    "Cultural Fit & Values Alignment": 3,
  });

  const [remarks, setRemarks] = useState({
    "Communication & Articulation": "",
    "Confidence & Poise": "",
    "Technical / Domain Knowledge": "",
    "Attitude & Ownership Mindset": "",
    "Empathy & Team Orientation": "",
    "Problem-Solving Approach": "",
    "Cultural Fit & Values Alignment": "",
  });

  // Saved HR review round (for read-only view mode)
  const [savedHrRound, setSavedHrRound] = useState(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await getApplicantById(id);
        if (res && res.success && res.data) {
          setCandidate(res.data);
          setDomain(res.data.domain || '');
          setTechnicalRounds(res.data.total_rounds || 1);
          
          // Look for saved HR round data
          const hrRound = (res.data.interview_rounds || []).find(r => r.round_type === 'HR_REVIEW');
          if (hrRound) {
            setSavedHrRound(hrRound);
            if (hrRound.evaluation_data) {
              try {
                const parsed = typeof hrRound.evaluation_data === 'string' ? JSON.parse(hrRound.evaluation_data) : hrRound.evaluation_data;
                const newRatings = {};
                const newRemarks = {};
                HR_DIMENSIONS.forEach(d => {
                  newRatings[d] = parsed[d]?.rating || 3;
                  newRemarks[d] = parsed[d]?.remarks || "";
                });
                setRatings(newRatings);
                setRemarks(newRemarks);
              } catch (e) {
                console.error("Error parsing HR evaluation data:", e);
              }
            }
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

  const handleRatingChange = (dimension, value) => {
    setRatings(prev => ({ ...prev, [dimension]: value }));
  };

  const handleRemarkChange = (dimension, value) => {
    setRemarks(prev => ({ ...prev, [dimension]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domain) {
      showNotification('Domain is required', 'warning');
      return;
    }
    if (technicalRounds < 1 || technicalRounds > 10) {
      showNotification('Number of technical rounds must be between 1 and 10', 'warning');
      return;
    }
    if (!firstInterviewerEmail) {
      showNotification('First interviewer email is required', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      // Build evaluation_data matching dimension names
      const evaluationPayload = {};
      HR_DIMENSIONS.forEach(d => {
        evaluationPayload[d] = {
          rating: ratings[d],
          remarks: remarks[d]
        };
      });

      const payload = {
        domain,
        number_of_tech_rounds: parseInt(technicalRounds),
        hr_status: hrStatus,
        first_interviewer_email: firstInterviewerEmail,
        evaluation_data: evaluationPayload
      };

      const res = await submitHrReview(id, payload);
      if (res.success) {
        showNotification('HR Review submitted successfully. Candidate routed to technical rounds.', 'success');
        navigate('/dashboard');
      } else {
        showNotification(res.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showNotification(err.response?.data?.detail || 'Failed to submit HR review.', 'error');
    } finally {
      setIsSubmitting(false);
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
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }} startIcon={<ArrowBack />}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: '#1e3a8a' }}
      >
        Back to HR Dashboard
      </Button>

      <Typography variant="h4" fontWeight="800" color="#1e3a8a" mb={1}>
        Section 9: HR Round Assessment
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        {viewMode 
          ? "View recorded screening and evaluation comments." 
          : "Complete the initial screening scorecard and route the candidate to technical interviews."}
      </Typography>

      {/* Candidate Summary accordion (Read-Only) */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', mb: 4 }}>
        <CandidateFormReadOnly candidate={candidate} />
      </Paper>

      {/* HR Evaluation Form */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0' }}
      >
        <Typography variant="h6" fontWeight="700" color="#1e3a5f" mb={3}>
          Section 9: Round 1 — Screening / HR Evaluation
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* 7 Dimensions Scores Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: '8px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Assessment Dimension</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '180px' }} align="center">Rating (1-5)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks / Behavioral Evidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {HR_DIMENSIONS.map((dimension) => (
                <TableRow key={dimension} hover>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{dimension}</TableCell>
                  <TableCell align="center">
                    <Rating
                      value={ratings[dimension]}
                      readOnly={viewMode}
                      max={5}
                      onChange={(event, newValue) => handleRatingChange(dimension, newValue || 3)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      disabled={viewMode}
                      placeholder="e.g. Articulate, active listener"
                      value={remarks[dimension]}
                      onChange={(e) => handleRemarkChange(dimension, e.target.value)}
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Setup technical routing fields */}
        <Typography variant="subtitle1" fontWeight="700" color="#1e3a5f" mb={2}>
          Workflow & Interview Routing Details
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Domain Selector */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              required
              fullWidth
              disabled={viewMode}
              label="Assigned Module / Domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              variant="outlined"
            >
              {SAP_DOMAINS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Number of technical rounds */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              required
              fullWidth
              disabled={viewMode}
              type="number"
              label="Total Technical Rounds"
              variant="outlined"
              inputProps={{ min: 1, max: 10 }}
              value={technicalRounds}
              onChange={(e) => setTechnicalRounds(e.target.value)}
            />
          </Grid>

          {/* Status Selection */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              required
              fullWidth
              disabled={viewMode}
              label="HR Selection Status"
              value={hrStatus}
              onChange={(e) => setHrStatus(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="SELECT">SELECT (Forward to Tech Rounds)</MenuItem>
              <MenuItem value="REJECT">REJECT (End Hiring Process)</MenuItem>
              <MenuItem value="HOLD">HOLD (Keep Application on Hold)</MenuItem>
            </TextField>
          </Grid>

          {/* First Technical Interviewer email */}
          {!viewMode && (
            <Grid size={12}>
              <TextField
                required
                fullWidth
                type="email"
                label="First Technical Interviewer Email Address"
                variant="outlined"
                placeholder="e.g. tech.interviewer@atlas.com"
                value={firstInterviewerEmail}
                onChange={(e) => setFirstInterviewerEmail(e.target.value)}
              />
            </Grid>
          )}
        </Grid>

        {/* Action Button */}
        {!viewMode && (
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
                backgroundColor: '#4F46E5',
                '&:hover': { backgroundColor: '#4338CA' },
              }}
            >
              Submit HR Review
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default HrReviewForm;
