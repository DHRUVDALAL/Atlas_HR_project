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
  Paper,
  Avatar,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, ArrowForward, LockPerson } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login as authLogin } from '../api/authService';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password should be at least 6 characters').required('Password is required'),
}).required();

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      const res = await authLogin(data.email, data.password);
      if (res.success) {
        // Persist tokens and fetch the fresh user + permissions from /auth/me.
        await login(res.token, res.refresh_token);
        // Everyone lands on the single, permission-driven dashboard.
        navigate('/dashboard');
      } else {
        setErrorMsg(res.message || 'Login failed. Please check credentials.');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || 'Invalid email or password');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: '#F0F2F5',
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
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)'
          }}
        >
          <Avatar sx={{ bgcolor: '#1E3A8A', width: 64, height: 64, mb: 3 }}>
            <LockPerson fontSize="large" />
          </Avatar>
          
          <Typography variant="h4" fontWeight="800" gutterBottom color="#0F2942">
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4} align="center">
            Sign in to Abhiyanta Portal to continue.
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
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
              size="large"
              disabled={isSubmitting}
              endIcon={<ArrowForward />}
              sx={{ 
                py: 1.5, 
                fontSize: '1.1rem', 
                borderRadius: 2,
                backgroundColor: '#1E3A8A',
                '&:hover': {
                  backgroundColor: '#12224F'
                }
              }}
            >
              {isSubmitting ? 'Authenticating...' : 'Login'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
