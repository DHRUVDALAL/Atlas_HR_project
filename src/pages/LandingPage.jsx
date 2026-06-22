import React from 'react';
import { Box, Typography, Button, Container, Grid, Paper, Avatar } from '@mui/material';
import { ArrowForward, Analytics, GroupAdd, EventAvailable, DashboardCustomize, RateReview } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default', overflow: 'hidden' }}>
      
      {/* Navbar (Public) */}
      <Box sx={{ py: 3, px: { xs: 3, md: 8 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="800" color="primary.main" sx={{ letterSpacing: '-0.5px' }}>
          RecruitPro
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/login')} sx={{ borderRadius: 2 }}>
            Internal Login
          </Button>
          <Button variant="contained" onClick={() => navigate('/register-candidate')} sx={{ borderRadius: 2 }}>
            Apply Now
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center', py: { xs: 8, md: 15 } }}>
        {/* Background Decorative Shapes */}
        <Box className="bg-mesh" sx={{ position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '140%', borderRadius: '50%', opacity: 0.1, zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40%', height: '60%', background: 'linear-gradient(135deg, #10B981 0%, transparent 100%)', borderRadius: '50%', opacity: 0.1, zIndex: 0 }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={8} alignItems="center">
            
            {/* Left Content */}
            <Grid item xs={12} md={6} className="animate-slide-in-right">
              <Box sx={{ mb: 2 }}>
                <Typography component="span" sx={{ bgcolor: 'primary.light', color: 'primary.dark', py: 0.5, px: 1.5, borderRadius: 2, fontSize: '0.875rem', fontWeight: 700 }}>
                  v2.0 Enterprise Release
                </Typography>
              </Box>
              <Typography variant="h1" fontWeight="800" sx={{ mb: 3, color: 'text.primary', fontSize: { xs: '3rem', md: '4rem' }, lineHeight: 1.1 }}>
                Hire the <Typography component="span" variant="inherit" color="primary.main">Best Talent,</Typography><br/> Faster Than Ever.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 5, fontWeight: 400, maxWidth: '90%', lineHeight: 1.6 }}>
                RecruitPro is the premium applicant tracking system designed for modern enterprises. Seamlessly manage candidates, evaluate skills, and analyze your hiring funnel in one beautiful platform.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  endIcon={<ArrowForward />} 
                  onClick={() => navigate('/register-candidate')}
                  sx={{ py: 2, px: 4, borderRadius: 3, fontSize: '1.125rem' }}
                >
                  Apply Now
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  onClick={() => navigate('/login')}
                  sx={{ py: 2, px: 4, borderRadius: 3, fontSize: '1.125rem', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                >
                  Login to Dashboard
                </Button>
              </Box>
            </Grid>

            {/* Right Content / Illustration Mock */}
            <Grid item xs={12} md={6} className="animate-slide-up delay-200">
              <Paper elevation={3} className="glass-panel" sx={{ p: 4, borderRadius: 6, position: 'relative' }}>
                {/* Mocking a dashboard graphic */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Box sx={{ width: '40%', height: 12, bgcolor: '#E5E7EB', borderRadius: 2 }} />
                  <Box sx={{ width: '20%', height: 12, bgcolor: '#E5E7EB', borderRadius: 2 }} />
                </Box>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {[1, 2, 3].map((i) => (
                    <Grid item xs={4} key={i}>
                      <Box sx={{ height: 100, bgcolor: i === 1 ? 'primary.light' : 'action.hover', borderRadius: 3, opacity: i === 1 ? 0.2 : 1 }} />
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ display: 'flex', gap: 1.5, height: 200, overflow: 'hidden' }}>
                  {/* Column 1 */}
                  <Box sx={{ flex: 1, bgcolor: 'action.hover', borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 0.5 }}>Screening</Typography>
                    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'primary.light', color: 'primary.dark' }}>JD</Avatar>
                        <Box sx={{ width: '60%', height: 6, bgcolor: '#D1D5DB', borderRadius: 1 }} />
                      </Box>
                      <Box sx={{ width: '40%', height: 4, bgcolor: '#E5E7EB', borderRadius: 1 }} />
                    </Paper>
                    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'warning.light', color: 'warning.dark' }}>AS</Avatar>
                        <Box sx={{ width: '70%', height: 6, bgcolor: '#D1D5DB', borderRadius: 1 }} />
                      </Box>
                      <Box sx={{ width: '30%', height: 4, bgcolor: '#E5E7EB', borderRadius: 1 }} />
                    </Paper>
                  </Box>
                  {/* Column 2 */}
                  <Box sx={{ flex: 1, bgcolor: 'action.hover', borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 0.5 }}>Interview</Typography>
                    <Paper elevation={3} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #3B82F6', bgcolor: '#EFF6FF', transform: 'rotate(2deg) translateY(-4px)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'info.main', color: 'white' }}>MK</Avatar>
                        <Box sx={{ width: '80%', height: 6, bgcolor: '#93C5FD', borderRadius: 1 }} />
                      </Box>
                      <Box sx={{ width: '50%', height: 4, bgcolor: '#BFDBFE', borderRadius: 1 }} />
                    </Paper>
                  </Box>
                  {/* Column 3 */}
                  <Box sx={{ flex: 1, bgcolor: 'action.hover', borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ mb: 0.5 }}>Selected</Typography>
                    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: 'success.light', color: 'success.dark' }}>RL</Avatar>
                        <Box sx={{ width: '50%', height: 6, bgcolor: '#10B981', borderRadius: 1 }} />
                      </Box>
                      <Box sx={{ width: '30%', height: 4, bgcolor: '#A7F3D0', borderRadius: 1 }} />
                    </Paper>
                  </Box>
                </Box>
                
                {/* Floating Elements */}
                <Paper elevation={2} sx={{ position: 'absolute', top: -20, right: -20, p: 2, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.light', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EventAvailable />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="700">Interview Scheduled</Typography>
                    <Typography variant="caption" color="text.secondary">Just now</Typography>
                  </Box>
                </Paper>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8} className="animate-slide-up">
            <Typography variant="h3" fontWeight="800" gutterBottom>Everything you need to hire</Typography>
            <Typography variant="h6" color="text.secondary" fontWeight="400">Enterprise-grade tools built for modern talent acquisition teams.</Typography>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} className="animate-slide-up delay-200">
              <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: 1, borderColor: 'divider', height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', borderColor: 'primary.main' } }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: 'primary.light', color: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <DashboardCustomize fontSize="large" />
                </Box>
                <Typography variant="h5" fontWeight="800" mb={2}>Interactive Kanban</Typography>
                <Typography variant="body1" color="text.secondary" lineHeight={1.6}>Drag and drop candidates effortlessly across customized hiring stages with our highly visual interview workspace.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} className="animate-slide-up delay-300">
              <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: 1, borderColor: 'divider', height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', borderColor: 'success.main' } }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: 'success.light', color: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <RateReview fontSize="large" />
                </Box>
                <Typography variant="h5" fontWeight="800" mb={2}>Smart Scorecards</Typography>
                <Typography variant="body1" color="text.secondary" lineHeight={1.6}>Evaluate candidates objectively using structured scorecards for technical skills, communication, and culture fit.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} className="animate-slide-up delay-400">
              <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: 1, borderColor: 'divider', height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', borderColor: 'warning.main' } }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: 'warning.light', color: 'warning.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Analytics fontSize="large" />
                </Box>
                <Typography variant="h5" fontWeight="800" mb={2}>Rich Analytics</Typography>
                <Typography variant="body1" color="text.secondary" lineHeight={1.6}>Gain real-time insights into your hiring funnel, sourcing channels, and time-to-hire metrics at a glance.</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

    </Box>
  );
};

export default LandingPage;
