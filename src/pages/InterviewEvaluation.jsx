import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Grid, TextField, Slider, Rating, Divider } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, StarBorder, AssignmentTurnedIn } from '@mui/icons-material';

const InterviewEvaluation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({ tech: 0, comm: 0, apt: 0, culture: 0 });

  const handleRating = (field, value) => {
    setRatings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box className="animate-fade-in" sx={{ maxWidth: 800, mx: 'auto', pb: 8 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 3, fontWeight: 600 }}>&larr; Back to Profile</Button>

      <Typography variant="h4" fontWeight="800" gutterBottom>Interview Scorecard</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Please evaluate the candidate across the following dimensions. Be objective and provide clear reasoning in the remarks.
      </Typography>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: 1, borderColor: 'divider', mb: 4 }}>
        <Grid container spacing={4}>
          {[
            { key: 'tech', label: 'Technical Skills' },
            { key: 'comm', label: 'Communication Skills' },
            { key: 'apt', label: 'Aptitude & Problem Solving' },
            { key: 'culture', label: 'Culture Fit' },
          ].map((item) => (
            <Grid item xs={12} sm={6} key={item.key}>
              <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 3, border: 1, borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700" mb={2}>{item.label}</Typography>
                <Rating
                  name={item.key}
                  value={ratings[item.key]}
                  onChange={(event, newValue) => handleRating(item.key, newValue)}
                  precision={1}
                  size="large"
                  icon={<Star fontSize="inherit" sx={{ color: 'warning.main' }} />}
                  emptyIcon={<StarBorder fontSize="inherit" />}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: 1, borderColor: 'divider', mb: 4 }}>
        <Typography variant="h6" fontWeight="800" mb={3}>Qualitative Feedback</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Key Strengths" placeholder="What stood out?" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Areas for Improvement" placeholder="Any red flags or weaknesses?" />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Typography variant="h6" fontWeight="800" mb={2} color="success.main">Final Recommendation</Typography>
        <TextField select fullWidth label="Recommendation" defaultValue="Proceed" SelectProps={{ native: true }} sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <option value="Proceed">Proceed to Next Round</option>
          <option value="Hire">Make Offer</option>
          <option value="Hold">Keep on Hold</option>
          <option value="Reject">Reject</option>
        </TextField>
        <Button variant="contained" color="success" size="large" fullWidth startIcon={<AssignmentTurnedIn />}>
          Submit Scorecard
        </Button>
      </Paper>
    </Box>
  );
};

export default InterviewEvaluation;
