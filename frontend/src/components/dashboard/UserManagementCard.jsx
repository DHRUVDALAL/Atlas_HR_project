import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';

// Gated by user.manage. Admin-only entry point for user & role administration.
const UserManagementCard = () => (
  <Card>
    <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: '#1E3A5F14', color: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ManageAccountsOutlinedIcon />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            User &amp; Role Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system users, roles and their permissions.
          </Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        startIcon={<ManageAccountsOutlinedIcon />}
        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
      >
        Manage Users
      </Button>
    </CardContent>
  </Card>
);

export default UserManagementCard;
