import React, { useState } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, Stack, Divider, Menu, MenuItem } from '@mui/material';
import { Language, Verified, HeadsetMic, HowToReg, VpnKey } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import abhiyantaLogo from '../assets/abhiyanta_logo.png';
import sapLogo from '../assets/sap_gold_partner_logo.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleLoginClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleRoleSelect = (roleParam) => {
    navigate(`/login?role=${roleParam}`);
    handleCloseMenu();
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden', fontFamily: '"Inter", sans-serif' }}>
      
      {/* HEADER (Navbar) */}
      <Box sx={{ 
        py: 1.5, 
        px: { xs: 3, md: 8 }, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        borderBottom: '1px solid #e2e8f0',
        boxShadow: 'none'
      }}>
        {/* Left Lockup: Company Logo + Brand Text */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={abhiyantaLogo} alt="Abhiyanta Logo" style={{ height: '36px', objectFit: 'contain' }} />
          <Typography 
            variant="h6" 
            fontWeight="800" 
            color="#1e3a5f" 
            sx={{ 
              fontSize: '1.25rem',
              letterSpacing: '-0.3px',
              fontFamily: '"Inter", sans-serif',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Abhiyanta India Solutions
          </Typography>
        </Box>
        
        {/* Right side controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Direct Login Button */}
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')} 
            startIcon={<VpnKey />}
            sx={{ 
              borderRadius: '6px', 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: '#1E3A8A',
              py: 0.9,
              px: 2.2,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#12224F',
                boxShadow: 'none'
              }
            }}
          >
            Login
          </Button>

          {/* Applicant Registration Button */}
          <Button 
            variant="contained" 
            onClick={() => navigate('/register-candidate')} 
            startIcon={<HowToReg />}
            sx={{ 
              borderRadius: '6px', 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: '#1E3A8A',
              py: 1,
              px: 2.2,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#12224F',
                boxShadow: 'none'
              }
            }}
          >
            Applicant Registration
          </Button>
        </Box>
      </Box>

      {/* HERO SECTION */}
      <Box sx={{ 
        bgcolor: '#f1f5f9', 
        display: 'flex', 
        alignItems: 'center', 
        py: { xs: 8, md: 10 },
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Centered SAP Gold Partner Badge */}
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              sx={{ 
                bgcolor: '#FFFFFF', 
                color: '#1e3a5f', 
                py: 0.8, 
                px: 2.5, 
                borderRadius: '50px', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                mb: 4,
                border: '1px solid #cbd5e1',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                letterSpacing: '0.5px'
              }}
            >
              <Verified fontSize="small" sx={{ color: '#1E3A8A' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                SAP GOLD PARTNER COMPANY
              </Typography>
            </Stack>

            {/* Large Centered Heading */}
            <Typography 
              variant="h3" 
              fontWeight="900" 
              color="#1e3a5f"
              sx={{ 
                mb: 3, 
                fontSize: { xs: '2rem', md: '3.5rem' }, 
                lineHeight: 1.15,
                letterSpacing: '-1px',
                fontFamily: '"Inter", sans-serif',
                maxWidth: '900px'
              }}
            >
              Abhiyanta India Solutions Pvt. Ltd.
            </Typography>

            {/* Centered Subheading Paragraph */}
            <Typography 
              variant="body1" 
              color="#475569"
              sx={{ 
                mb: 2, 
                fontWeight: 400, 
                maxWidth: '700px', 
                lineHeight: 1.7,
                fontSize: { xs: '0.95rem', md: '1.15rem' },
                textAlign: 'center'
              }}
            >
              We are a premier SAP Gold Partner enterprise dedicated to empowering organizations through innovative enterprise solutions, technology consulting, and comprehensive systems integration.
            </Typography>

          </Box>
        </Container>
      </Box>

      {/* FEATURE CARDS SECTION */}
      <Box sx={{ py: 8, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: '24px',
            width: '100%'
          }}>
            {/* Card 1: Enterprise ERP */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3.5, 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                height: '100%', 
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '8px', 
                bgcolor: '#EFF6FF', 
                color: '#1E3A8A', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 3 
              }}>
                <Language fontSize="medium" />
              </Box>
              <Typography variant="subtitle1" fontWeight="800" mb={1.5} color="#1e3a5f">
                Enterprise ERP
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                End-to-end SAP services including customization, consulting, implementation, and legacy migrations.
              </Typography>
            </Paper>

            {/* Card 2: Gold Class Quality */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3.5, 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                height: '100%', 
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '8px', 
                bgcolor: '#ECFDF5', 
                color: '#10B981', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 3 
              }}>
                <Verified fontSize="medium" sx={{ color: '#10B981' }} />
              </Box>
              <Typography variant="subtitle1" fontWeight="800" mb={1.5} color="#1e3a5f">
                Gold Class Quality
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                Delivering gold-standard support and high-performance solutions aligned with global industry benchmarks.
              </Typography>
            </Paper>

            {/* Card 3: Digital Consulting */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3.5, 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                height: '100%', 
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '8px', 
                bgcolor: '#EFF6FF', 
                color: '#3B82F6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 3 
              }}>
                <HeadsetMic fontSize="medium" />
              </Box>
              <Typography variant="subtitle1" fontWeight="800" mb={1.5} color="#1e3a5f">
                Digital Consulting
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                Helping businesses modernize workflows, optimize resource deployment, and scale operations securely.
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Footer containing only centered copyright line */}
      <Box sx={{ 
        py: 3, 
        px: 4,
        mt: 'auto',
        backgroundColor: '#FFFFFF', 
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        width: '100%'
      }}>
        <Typography variant="body2" color="text.secondary">
          © 2026 Abhiyanta India Solutions Pvt. Ltd. All rights reserved.
        </Typography>
      </Box>

    </Box>
  );
};

export default LandingPage;
