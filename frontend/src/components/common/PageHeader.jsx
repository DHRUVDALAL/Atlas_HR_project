import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon, breadcrumbs, onAction }) {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1.5 }}>
          {breadcrumbs.map((crumb, index) => (
            index < breadcrumbs.length - 1 ? (
              <MuiLink
                key={index}
                component={Link}
                to={crumb.path}
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: '0.875rem', fontWeight: 500 }}
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={index} color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actionLabel && (
          <Button
            variant="contained"
            startIcon={actionIcon}
            onClick={onAction}
            sx={{ height: 44 }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
