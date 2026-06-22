import React from 'react';
import { Card, CardContent, Typography, Avatar, Box, IconButton } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, trend, delay = '100' }) => (
  <Card className={`animate-slide-up delay-${delay}`} sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{
      position: 'absolute', top: -20, right: -20, width: 100, height: 100,
      borderRadius: '50%', backgroundColor: `${color}.main`, opacity: 0.1, zIndex: 0
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

export default StatCard;
