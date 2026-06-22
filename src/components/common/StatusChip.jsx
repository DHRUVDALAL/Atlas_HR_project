import React from 'react';
import { Chip } from '@mui/material';

const statusStyles = {
  'New': { bg: '#E3F2FD', color: '#1565C0' },
  'In Progress': { bg: '#FFF3E0', color: '#E65100' },
  'Selected': { bg: '#E8F5E9', color: '#2E7D32' },
  'Rejected': { bg: '#FFEBEE', color: '#C62828' },
  'On Hold': { bg: '#FFF8E1', color: '#F57F17' },
  'Pending': { bg: '#F3E5F5', color: '#7B1FA2' },
  'Hold': { bg: '#FFF8E1', color: '#F57F17' },
  'Round 1': { bg: '#E8EAF6', color: '#283593' },
  'Round 2': { bg: '#E0F2F1', color: '#00695C' },
  'HR Round': { bg: '#FCE4EC', color: '#AD1457' },
  'Final Round': { bg: '#FFF3E0', color: '#E65100' },
  'Active': { bg: '#E8F5E9', color: '#2E7D32' },
  'Inactive': { bg: '#EFEBE9', color: '#5D4037' },
};

export default function StatusChip({ status, size = 'small', ...props }) {
  const style = statusStyles[status] || { bg: '#F5F5F5', color: '#616161' };

  return (
    <Chip
      label={status}
      size={size}
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        border: 'none',
        ...props.sx,
      }}
      {...props}
    />
  );
}
