import React from 'react';
import { Box, Typography } from '@mui/material';
import { WorkOutline } from '@mui/icons-material';

/**
 * AppLogo — Brand identity component.
 *
 * @param {boolean} collapsed - When true, shows only the briefcase icon.
 */
const AppLogo = ({ collapsed = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: collapsed ? 0 : 2.5,
        py: 2,
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)',
          flexShrink: 0,
        }}
      >
        <WorkOutline sx={{ color: '#FFFFFF', fontSize: 22 }} />
      </Box>

      {/* Brand text — hidden when collapsed */}
      {!collapsed && (
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: '#1E3A5F',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          Recruit
          <Box component="span" sx={{ color: '#00897B' }}>
            Pro
          </Box>
        </Typography>
      )}
    </Box>
  );
};

export default AppLogo;
