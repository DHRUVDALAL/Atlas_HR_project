import React from 'react';
import { Box, Grid, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import { Code, Assessment, RateReview, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TechDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Hero */}
      <Box sx={{ 
        p: 4, mb: 4, borderRadius: 4, color: 'white',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', // Darker theme for tech
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', right: '-10%', top: '-20%', opacity: 0.1 }}>
          <Code sx={{ fontSize: 250 }} />
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="800" gutterBottom>Technical Review Portal</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>You have 8 pending assessments to review today.</Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Tech Queue" value="14" icon={<Assessment />} color="warning" delay="100" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Reviews Done" value="45" icon={<RateReview />} color="success" trend="15%" delay="200" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Escalations" value="2" icon={<Error />} color="error" delay="300" /></Grid>
      </Grid>
      
      {/* Tech Queue */}
      <Box sx={{ mt: 5 }} className="animate-slide-up delay-400">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight="800">Pending Technical Reviews</Typography>
          <Button variant="outlined" onClick={() => navigate('/candidates')}>View All</Button>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: 1, borderColor: 'divider', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }, transition: 'all 0.2s' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip label="Backend Dev" size="small" color="primary" sx={{ fontWeight: 600 }} />
                  <Typography variant="caption" color="text.secondary">Submitted 2h ago</Typography>
                </Box>
                <Typography variant="h6" fontWeight="700">Candidate #{890 + item}</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>Python, Django, PostgreSQL</Typography>
                <Button fullWidth variant="contained" color="primary" sx={{ borderRadius: 2 }}>Evaluate Now</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default TechDashboard;
