import React from 'react';
import { Box, Grid, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import { PersonAdd, Wc, HowToReg, EventAvailable } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Hero */}
      <Box sx={{ 
        p: 4, mb: 4, borderRadius: 4, color: 'white',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Green theme for receptionist
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" fontWeight="800" gutterBottom>Front Desk Portal</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>Manage walk-ins and candidate queue.</Typography>
          </Box>
          <Button variant="contained" sx={{ bgcolor: 'background.paper', color: 'success.main', '&:hover': { bgcolor: 'action.hover' }, px: 4, py: 1.5, borderRadius: 3, fontWeight: 700 }} onClick={() => navigate('/register-candidate')}>
            Quick Register
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Walk-ins Today" value="12" icon={<Wc />} color="primary" delay="100" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Checked In" value="8" icon={<HowToReg />} color="success" delay="200" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Waiting" value="4" icon={<PersonAdd />} color="warning" delay="300" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Scheduled Today" value="15" icon={<EventAvailable />} color="info" delay="400" /></Grid>
      </Grid>
      
      {/* Queue View */}
      <Box sx={{ mt: 5 }} className="animate-slide-up delay-400">
        <Typography variant="h5" fontWeight="800" mb={3}>Today's Queue</Typography>
        <Paper elevation={0} sx={{ borderRadius: 4, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            {['Alice Johnson - Waiting since 10:00 AM', 'Bob Brown - Interviewing', 'Charlie Davis - Just arrived'].map((log, index) => (
              <ListItem key={index} divider={index !== 2} sx={{ p: 3 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: index === 1 ? 'success.light' : (index === 0 ? 'warning.light' : 'info.light') }}>
                    <PersonAdd color="action" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={<Typography fontWeight="600">{log.split(' - ')[0]}</Typography>} secondary={log.split(' - ')[1]} />
                <Button variant={index === 2 ? 'contained' : 'outlined'} size="small" color={index === 2 ? 'primary' : 'inherit'}>
                  {index === 2 ? 'Check In' : 'Manage'}
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default ReceptionistDashboard;
