import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, List, ListItem, ListItemAvatar, ListItemText, Chip,
} from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusChip from '../../components/common/StatusChip';
import { useAuth } from '../../hooks/useAuth';
import { mockCandidates, mockInterviews, mockDashboardStats } from '../../mock/mockData';

export default function HRAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const pipelineData = [
    { label: 'Round 1', count: mockDashboardStats.pipelineRound1, color: '#1E3A5F', max: 10 },
    { label: 'Round 2', count: mockDashboardStats.pipelineRound2, color: '#00897B', max: 10 },
    { label: 'HR Round', count: mockDashboardStats.pipelineHR, color: '#7B1FA2', max: 10 },
    { label: 'Final Round', count: mockDashboardStats.pipelineFinal, color: '#E65100', max: 10 },
  ];

  const recentActivity = [...mockInterviews]
    .filter((i) => i.status !== 'Pending')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const upcomingInterviews = [...mockInterviews]
    .filter((i) => i.status === 'Pending')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const getCandidateName = (candidateId) => {
    const c = mockCandidates.find((c) => c.id === candidateId);
    return c?.fullName || 'Unknown';
  };

  const getInitials = (name) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}!`}
        subtitle="HR Administration — Manage your recruitment pipeline"
      />

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Candidates" value={mockDashboardStats.totalCandidates} icon={<PeopleOutlinedIcon />} color="#1E3A5F" trend={12} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Interviews Scheduled" value={mockDashboardStats.interviewsScheduled} icon={<EventNoteOutlinedIcon />} color="#00897B" trend={8} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Selected" value={mockDashboardStats.selected} icon={<CheckCircleOutlinedIcon />} color="#2E7D32" trend={15} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Rejected" value={mockDashboardStats.rejected} icon={<CancelOutlinedIcon />} color="#D32F2F" trend={-20} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Interview Pipeline */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 3 }}>
                Interview Pipeline
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pipelineData.map((round) => (
                  <Box key={round.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {round.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: round.color }}>
                        {round.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(round.count / round.max) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#F3F4F6',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: `linear-gradient(90deg, ${round.color}, ${round.color}CC)`,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>

              {/* Pipeline summary */}
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total in pipeline</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {pipelineData.reduce((sum, r) => sum + r.count, 0)} candidates
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 2 }}>
                Recent Activity
              </Typography>
              <List disablePadding>
                {recentActivity.map((interview, idx) => (
                  <ListItem
                    key={interview.id}
                    disablePadding
                    sx={{
                      py: 1.5,
                      borderBottom: idx < recentActivity.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: interview.status === 'Selected' ? '#E8F5E9' : interview.status === 'Rejected' ? '#FFEBEE' : '#FFF8E1',
                          color: interview.status === 'Selected' ? '#2E7D32' : interview.status === 'Rejected' ? '#C62828' : '#F57F17',
                        }}
                      >
                        {getInitials(getCandidateName(interview.candidateId))}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {getCandidateName(interview.candidateId)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {interview.round} • {interview.interviewer} • {new Date(interview.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Typography>
                      }
                    />
                    <StatusChip status={interview.status} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Interviews */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F0F0F0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Upcoming Interviews
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Round</TableCell>
                  <TableCell>Interviewer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingInterviews.map((interview) => (
                  <TableRow key={interview.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1E3A5F', fontSize: '0.7rem', fontWeight: 600 }}>
                          {getInitials(getCandidateName(interview.candidateId))}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getCandidateName(interview.candidateId)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell><StatusChip status={interview.round} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{interview.interviewer}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {new Date(interview.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell><StatusChip status={interview.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
