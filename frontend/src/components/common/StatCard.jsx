import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

export default function StatCard({ title, value, icon, color = '#1E3A5F', trend, trendLabel }) {
  const lightColor = `${color}14`;

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 500, mb: 1, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              {value}
            </Typography>
            {trend !== undefined && (
              <Typography variant="caption" sx={{ color: trend >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || 'from last week'}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: lightColor,
              color: color,
              width: 52,
              height: 52,
              borderRadius: 3,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}
