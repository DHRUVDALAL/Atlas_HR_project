import React from 'react';
import { Box, Typography, Paper, Badge } from '@mui/material';

const ApplicationTimeline = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: '12px' }}>
        <Typography color="text.secondary" variant="body2">No activity logs recorded yet.</Typography>
      </Paper>
    );
  }

  // Sort logs chronological (newest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const getActionColor = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('reject')) return '#EF4444';
    if (act.includes('select') || act.includes('complete') || act.includes('forward')) return '#10B981';
    if (act.includes('hold') || act.includes('draft')) return '#F59E0B';
    return '#3B82F6';
  };

  return (
    <Box sx={{ position: 'relative', pl: 3, py: 1 }}>
      {/* Vertical line connector */}
      <Box
        sx={{
          position: 'absolute',
          left: '8px',
          top: 0,
          bottom: 0,
          width: '2px',
          bgcolor: '#E5E7EB',
          zIndex: 0
        }}
      />

      <Box display="flex" flexDirection="column" gap={3}>
        {sortedLogs.map((log, index) => {
          const color = getActionColor(log.action);
          const dateStr = log.timestamp
            ? new Date(log.timestamp).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
              })
            : '—';

          return (
            <Box key={log.log_id || index} sx={{ position: 'relative', zIndex: 1 }}>
              {/* Timeline Indicator Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: '-28px',
                  top: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  bgcolor: color,
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 0 0 2px #E5E7EB'
                }}
              />

              <Box>
                {/* Header info */}
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} sm={{ alignItems: 'center' }} gap={0.5} mb={0.5}>
                  <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                    {log.action}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="500">
                    {dateStr}
                  </Typography>
                </Box>

                {/* Performed by */}
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Performed by: <strong>{log.performed_by || 'System'}</strong>
                </Typography>

                {/* Details / Remarks */}
                {log.details && (
                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                      bgcolor: '#F8FAFC',
                      p: 1.5,
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      mt: 1,
                      display: 'inline-block',
                      minWidth: { xs: '100%', sm: '400px' }
                    }}
                  >
                    {log.details}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ApplicationTimeline;
