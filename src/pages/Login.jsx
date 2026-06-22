import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Container,
  Tabs,
  Tab,
  Paper,
  Avatar,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, ArrowForward, AdminPanelSettings, Groups, Badge, LockPerson } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password should be at least 6 characters').required('Password is required'),
}).required();

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(1); // Default to HR Admin
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const onSubmit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      let role = '';
      if (tabValue === 0) role = 'SYSTEM_ADMIN';
      else if (tabValue === 1) role = 'HR_ADMIN';
      else if (tabValue === 2) role = 'INTERVIEWER';

      const mockToken = 'mock-jwt-token-12345';
      const mockUser = {
        id: 1,
        name: `${role.replace('_', ' ')} User`,
        email: data.email,
        role: role,
      };

      login(mockUser, mockToken);

      switch (role) {
        case 'HR_ADMIN': navigate('/hr/dashboard'); break;
        case 'INTERVIEWER': navigate('/tech/dashboard'); break;
        case 'SYSTEM_ADMIN': navigate('/admin/dashboard'); break;
        default: navigate('/login');
      }
    } catch (error) {
      console.error('Login Failed', error);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={0} 
          className="animate-slide-up"
          sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 4,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mb: 3 }}>
            <LockPerson fontSize="large" />
          </Avatar>
          
          <Typography variant="h4" fontWeight="800" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4} align="center">
            Sign in to Abhiyanta Portal to continue.
          </Typography>

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ mb: 4, width: '100%', borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<AdminPanelSettings />} iconPosition="start" label="Admin" />
            <Tab icon={<Groups />} iconPosition="start" label="HR" />
            <Tab icon={<Badge />} iconPosition="start" label="Interviewer" />
          </Tabs>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label={`${tabValue === 0 ? 'Admin' : tabValue === 1 ? 'HR' : 'Interviewer'} Email Address`}
              autoComplete="email"
              autoFocus
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 4 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              endIcon={<ArrowForward />}
              sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
            >
              {isSubmitting ? 'Authenticating...' : `Login as ${tabValue === 0 ? 'System Admin' : tabValue === 1 ? 'HR Admin' : 'Interviewer'}`}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

