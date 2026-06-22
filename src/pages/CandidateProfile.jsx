import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Tabs, Tab
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Download as DownloadIcon, Code, Dns, Cloud, CheckCircle, Schedule, PictureAsPdf, RateReview } from '@mui/icons-material';

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const candidate = {
    id,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 234 567 890',
    role: 'Backend Developer',
    experience: '5 Years',
    status: 'HR Round',
    education: 'M.Tech in Computer Science, MIT, 2021',
    skills: ['Node.js', 'Python', 'Docker', 'AWS', 'GraphQL'],
    resume: 'https://example.com/resume.pdf'
  };

  const interviews = [
    { round: 'Round 1 (Technical)', interviewer: 'Tech Head', status: 'Completed', date: '2026-06-20', remarks: 'Strong fundamentals' },
    { round: 'Round 2 (System Design)', interviewer: 'Senior Architect', status: 'Completed', date: '2026-06-21', remarks: 'Good scalable approach' },
    { round: 'HR Round', interviewer: 'HR Admin', status: 'Pending', date: '2026-06-22', remarks: 'Scheduled' },
  ];

  return (
    <Box className="animate-fade-in" sx={{ maxWidth: 1100, mx: 'auto', pb: 8 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 3, fontWeight: 600 }}>&larr; Back to Search</Button>
      
      {/* Hero Banner Area */}
      <Box sx={{ 
        position: 'relative', 
        height: 200, 
        borderRadius: '24px 24px 0 0',
        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', // More corporate blue
        mb: { xs: 8, md: 10 }
      }}>
        {/* Floating Avatar */}
        <Avatar 
          sx={{ 
            width: 140, 
            height: 140, 
            position: 'absolute', 
            bottom: -70, 
            left: { xs: '50%', md: 40 },
            transform: { xs: 'translateX(-50%)', md: 'none' },
            border: '6px solid',
            borderColor: 'background.default',
            bgcolor: 'background.paper',
            color: 'text.primary',
            fontSize: '3rem',
            fontWeight: 'bold',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
          }}
        >
          {candidate.name.charAt(0)}
        </Avatar>
        <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="warning" startIcon={<RateReview />} onClick={() => navigate(`/candidates/${id}/evaluate`)}>
            Evaluate
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ px: { xs: 2, md: 4 } }}>
        {/* Left Column: Profile Info */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>{candidate.name}</Typography>
            <Typography color="primary.main" fontWeight="600" variant="h6" gutterBottom>{candidate.role}</Typography>
            
            <Chip 
              label={candidate.status} 
              sx={{ mt: 1, mb: 4, bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 'bold', px: 1 }} 
            />

            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" letterSpacing={1} mb={2}>Contact Information</Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Email Address</Typography>
                <Typography variant="body1" fontWeight="500">{candidate.email}</Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1" fontWeight="500">{candidate.phone}</Typography>
              </Box>
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">Total Experience</Typography>
                <Typography variant="body1" fontWeight="500">{candidate.experience}</Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column: LinkedIn Style Tabs */}
        <Grid item xs={12} md={8}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label={<Typography fontWeight="600">Overview</Typography>} />
              <Tab label={<Typography fontWeight="600">Interview Timeline</Typography>} />
              <Tab label={<Typography fontWeight="600">Documents</Typography>} />
            </Tabs>
          </Box>

          {/* Tab 1: Overview */}
          {tabValue === 0 && (
            <Box className="animate-fade-in">
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider', mb: 4 }}>
                <Typography variant="h6" fontWeight="800" gutterBottom mb={3}>Technical Arsenal</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {candidate.skills.map((skill, index) => (
                    <Chip 
                      key={index} label={skill} 
                      icon={index % 2 === 0 ? <Code /> : (index % 3 === 0 ? <Cloud /> : <Dns />)}
                      sx={{ bgcolor: `hsla(${index * 40 + 200}, 80%, 95%, 1)`, color: `hsla(${index * 40 + 200}, 80%, 30%, 1)`, fontWeight: 600, px: 1, py: 2, borderRadius: 2 }} 
                    />
                  ))}
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight="800" gutterBottom mb={3}>Education</Typography>
                <Typography variant="body1" fontWeight="500">{candidate.education}</Typography>
              </Paper>
            </Box>
          )}

          {/* Tab 2: Timeline */}
          {tabValue === 1 && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }} className="animate-fade-in">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" fontWeight="800">Interview Timeline</Typography>
                <Button size="small" variant="outlined" sx={{ borderRadius: 2 }}>Schedule Next Round</Button>
              </Box>

              <List sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: '39px', top: '20px', bottom: '40px', width: '2px', bgcolor: 'divider', zIndex: 0 }} />
                {interviews.map((interview, index) => (
                  <ListItem key={index} sx={{ mb: 3, alignItems: 'flex-start', position: 'relative', zIndex: 1 }} className={`animate-slide-up delay-${(index + 1) * 100}`}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: interview.status === 'Completed' ? 'success.main' : 'warning.main', color: 'white', border: 4, borderColor: 'background.paper' }}>
                        {interview.status === 'Completed' ? <CheckCircle /> : <Schedule />}
                      </Avatar>
                    </ListItemAvatar>
                    <Paper elevation={0} sx={{ p: 2, ml: 1, flexGrow: 1, bgcolor: 'action.hover', borderRadius: 3, border: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography fontWeight="700" variant="subtitle1">{interview.round}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">{interview.date}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Interviewer: <b>{interview.interviewer}</b></Typography>
                      <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, mt: 1, border: 1, borderColor: 'divider' }}>
                        {interview.remarks}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Tab 3: Documents */}
          {tabValue === 2 && (
            <Box className="animate-fade-in">
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', width: 64, height: 64 }}><PictureAsPdf fontSize="large" /></Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="700">Jane_Smith_Resume.pdf</Typography>
                  <Typography variant="body2" color="text.secondary">Uploaded on 2026-06-19 • 2.4 MB</Typography>
                </Box>
                <Button variant="contained" startIcon={<DownloadIcon />}>Download</Button>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidateProfile;
