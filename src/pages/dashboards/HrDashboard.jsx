import React from 'react';
import { Box, Grid, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import { EventAvailable, AssignmentInd, QueryBuilder, CheckCircle } from '@mui/icons-material';

const HrDashboard = () => {
  const { user } = useAuth();

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Hero */}
      <Box sx={{ 
        p: 4, mb: 4, borderRadius: 4, color: 'white',
        background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', right: '-5%', top: '-50%', width: '40%', height: '200%', background: 'rgba(255,255,255,0.1)', transform: 'rotate(15deg)', borderRadius: '50px' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="800" gutterBottom>Welcome, HR Admin! 👋</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>Overview of the Recruitment Funnel</Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Candidates" value="1,284" icon={<AssignmentInd />} color="primary" trend="12%" delay="100" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="HR Screenings" value="45" icon={<QueryBuilder />} color="warning" trend="4%" delay="200" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Interviews Scheduled" value="18" icon={<EventAvailable />} color="info" delay="300" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Offers Extended" value="12" icon={<CheckCircle />} color="success" trend="2%" delay="400" /></Grid>
      </Grid>
      
      {/* Visual Funnel / Pipeline Overview mock */}
      <Grid container spacing={4} sx={{ mt: 2 }} className="animate-slide-up delay-500">
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 4, height: '100%', border: 1, borderColor: 'divider' }} elevation={0}>
            <Typography variant="h6" fontWeight="800" mb={3}>Pipeline Status</Typography>
            {/* Mock Funnel UI */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[{label: 'Applied', val: 80, col: '#3B82F6'}, {label: 'Screening', val: 60, col: '#8B5CF6'}, {label: 'Interview', val: 40, col: '#F59E0B'}, {label: 'Offered', val: 15, col: '#10B981'}].map(stage => (
                <Box key={stage.label} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ width: 100, fontWeight: 600, color: 'text.secondary' }}>{stage.label}</Typography>
                  <Box sx={{ flexGrow: 1, bgcolor: 'action.hover', height: 24, borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ width: `${stage.val}%`, bgcolor: stage.col, height: '100%', transition: 'width 1s ease-out' }} />
                  </Box>
                  <Typography sx={{ width: 40, textAlign: 'right', fontWeight: 800 }}>{stage.val * 12}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', border: 1, borderColor: 'divider' }} elevation={0}>
            <Typography variant="h6" fontWeight="800" mb={2}>Upcoming Interviews</Typography>
            <List>
              {[1, 2, 3].map((item) => (
                <ListItem key={item} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark' }}><EventAvailable /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={<Typography fontWeight="600">Frontend Dev Role</Typography>} secondary="Today at 2:00 PM" />
                  <Chip size="small" label="Tech" color="primary" variant="outlined" />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HrDashboard;
