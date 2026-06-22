import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { People, Assignment, CheckCircle, HourglassEmpty, MoreVert } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, trend, delay }) => (
  <Card className={`animate-slide-up delay-${delay}`} sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    {/* Decorative background glow */}
    <Box sx={{
      position: 'absolute',
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      borderRadius: '50%',
      backgroundColor: `${color}.main`,
      opacity: 0.1,
      zIndex: 0
    }} />
    
    <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 48, height: 48, boxShadow: `0 4px 12px rgba(0,0,0,0.05)` }}>
          {icon}
        </Avatar>
        <IconButton size="small"><MoreVert fontSize="small" /></IconButton>
      </Box>
      <Typography color="text.secondary" variant="subtitle2" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
        {title}
      </Typography>
      <Typography color="text.primary" variant="h3" fontWeight="800" sx={{ mt: 1 }}>
        {value}
      </Typography>
      {trend && (
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'flex', alignItems: 'center', mt: 1 }}>
          ↑ {trend} <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>vs last week</Typography>
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      {/* Hero Banner */}
      <Box sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 4, 
        color: 'white',
        background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract shapes in hero */}
        <Box sx={{ position: 'absolute', right: '-5%', top: '-50%', width: '40%', height: '200%', background: 'rgba(255,255,255,0.1)', transform: 'rotate(15deg)', borderRadius: '50px' }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="800" gutterBottom>
            Welcome back, {user?.name.split(' ')[0]}! 👋
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: '600px' }}>
            Here's what's happening in your {user?.role} portal today. You have 12 interviews scheduled.
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Candidates" value="1,284" icon={<People />} color="primary" trend="12%" delay="100" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Interviews Today" value="12" icon={<Assignment />} color="warning" trend="4%" delay="200" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Offers Accepted" value="34" icon={<CheckCircle />} color="success" trend="8%" delay="300" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Review" value="89" icon={<HourglassEmpty />} color="error" delay="400" />
        </Grid>
      </Grid>
      
      {/* Activity Section */}
      <Box sx={{ mt: 5 }} className="animate-slide-up delay-500">
        <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
          Recent Activity
        </Typography>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Mock Activity List */}
            {[1, 2, 3].map((item, index) => (
              <Box key={item} sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: index !== 2 ? '1px solid #F3F4F6' : 'none',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', mr: 3 }}>{item}</Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="600">Jane Smith completed Round {item}</Typography>
                  <Typography variant="body2" color="text.secondary">2 hours ago</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
