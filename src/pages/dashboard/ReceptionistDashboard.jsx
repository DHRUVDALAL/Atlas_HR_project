import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar,
} from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FiberNewOutlinedIcon from '@mui/icons-material/FiberNewOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusChip from '../../components/common/StatusChip';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { mockCandidates, mockDashboardStats } from '../../mock/mockData';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const recentCandidates = [...mockCandidates]
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
    .slice(0, 5);

  const getInitials = (name) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

  const handleGenerateLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/register/token-${Date.now()}`);
    showNotification('Registration link copied to clipboard!', 'success');
  };

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}!`}
        subtitle="Receptionist Dashboard — Here's your daily overview"
      />

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Candidates"
            value={mockDashboardStats.totalCandidates}
            icon={<PeopleOutlinedIcon />}
            color="#1E3A5F"
            trend={12}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Today's Interviews"
            value={mockDashboardStats.todaysInterviews}
            icon={<EventOutlinedIcon />}
            color="#00897B"
            trend={5}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="New Applications"
            value={mockDashboardStats.newApplications}
            icon={<FiberNewOutlinedIcon />}
            color="#7B1FA2"
            trend={18}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Reviews"
            value={mockDashboardStats.pendingReviews}
            icon={<HourglassEmptyOutlinedIcon />}
            color="#E65100"
            trend={-3}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Candidates Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Recent Candidates
                </Typography>
                <Button size="small" onClick={() => navigate('/candidates')} sx={{ fontWeight: 500 }}>
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Applied Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentCandidates.map((candidate) => (
                      <TableRow
                        key={candidate.id}
                        hover
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: '#1E3A5F', fontSize: '0.75rem', fontWeight: 600 }}>
                              {getInitials(candidate.fullName)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {candidate.fullName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {candidate.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {new Date(candidate.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={candidate.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<LinkOutlinedIcon />}
                  onClick={handleGenerateLink}
                  sx={{
                    height: 48,
                    justifyContent: 'flex-start',
                    px: 3,
                    background: 'linear-gradient(135deg, #00897B, #4DB6AC)',
                    '&:hover': { background: 'linear-gradient(135deg, #00695C, #00897B)' },
                  }}
                >
                  Generate Registration Link
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VisibilityOutlinedIcon />}
                  onClick={() => navigate('/candidates')}
                  sx={{
                    height: 48,
                    justifyContent: 'flex-start',
                    px: 3,
                    borderColor: '#E5E7EB',
                    color: 'text.primary',
                    '&:hover': { borderColor: '#1E3A5F', backgroundColor: '#F8FAFF' },
                  }}
                >
                  View All Candidates
                </Button>
              </Box>

              {/* Quick stats summary */}
              <Box sx={{ mt: 4, p: 2.5, borderRadius: 3, backgroundColor: '#F8FAFC' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Today's Summary
                </Typography>
                {[
                  { label: 'Applications Received', value: 3 },
                  { label: 'Interviews Scheduled', value: mockDashboardStats.todaysInterviews },
                  { label: 'Candidates in Pipeline', value: 8 },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
