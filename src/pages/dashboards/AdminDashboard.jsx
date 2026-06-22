import React from 'react';
import { Box, Grid, Typography, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import { SupervisedUserCircle, Security, VpnKey, DataUsage } from '@mui/icons-material';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Hero */}
      <Box sx={{ 
        p: 4, mb: 4, borderRadius: 4, color: 'white',
        background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', // Distinct dark gray theme
        boxShadow: '0 10px 25px -5px rgba(17, 24, 39, 0.4)',
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', right: '-5%', top: '-30%', opacity: 0.1 }}>
          <Security sx={{ fontSize: 250 }} />
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="800" gutterBottom>System Administration</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>Manage users, roles, and system health.</Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Active Users" value="42" icon={<SupervisedUserCircle />} color="primary" trend="5%" delay="100" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Roles Managed" value="4" icon={<VpnKey />} color="warning" delay="200" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="System Uptime" value="99.9%" icon={<DataUsage />} color="success" delay="300" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Security Alerts" value="0" icon={<Security />} color="info" delay="400" /></Grid>
      </Grid>
      
      {/* Audit Logs */}
      <Box sx={{ mt: 5 }} className="animate-slide-up delay-400">
        <Typography variant="h5" fontWeight="800" mb={3}>Recent Audit Logs</Typography>
        <Paper elevation={0} sx={{ borderRadius: 4, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            {['Jane Doe (HR Admin) changed candidate status', 'John Smith (Tech Head) logged in', 'System Admin updated permissions for Receptionist'].map((log, index) => (
              <ListItem key={index} divider={index !== 2} sx={{ p: 3, '&:hover': { bgcolor: 'action.hover' } }}>
                <ListItemText 
                  primary={<Typography fontWeight="600">{log}</Typography>}
                  secondary="10 minutes ago"
                />
                <Chip label="System" size="small" variant="outlined" />
              </ListItem>
            ))}
          </List>
          <Box sx={{ p: 2, bgcolor: 'action.hover', textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
            <Button size="small">View Full Audit Trail</Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
