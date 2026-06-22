import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({ title = 'No data found', description = 'There are no items to display.', actionLabel, onAction, icon }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: '#D1D5DB', mb: 2 }}>
        {icon || <InboxOutlinedIcon sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 400 }}>
        {description}
      </Typography>
      {actionLabel && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
