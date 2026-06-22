import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box, TextField, Button, Typography, Checkbox, FormControlLabel,
  InputAdornment, IconButton, Alert, CircularProgress, Fade,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../utils/validators';
import { DASHBOARD_PATHS } from '../../utils/constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      const dashboardPath = DASHBOARD_PATHS[result.user.role] || '/dashboard';
      navigate(dashboardPath, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* LEFT PANEL - Branded */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '50%',
          background: 'linear-gradient(135deg, #1E3A5F 0%, #0D253F 50%, #162D4A 100%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -120, left: -60,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(0,137,123,0.1)', border: '1px solid rgba(0,137,123,0.15)',
        }} />
        <Box sx={{
          position: 'absolute', top: '30%', left: '10%',
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }} />

        {/* Decorative grid pattern */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', zIndex: 1, maxWidth: 440 }}>
            {/* Logo */}
            <Box
              sx={{
                width: 72, height: 72, borderRadius: 4,
                background: 'linear-gradient(135deg, #00897B, #4DB6AC)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 4, boxShadow: '0 8px 32px rgba(0,137,123,0.35)',
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>RP</Typography>
            </Box>

            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
              RecruitPro
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400, mb: 4, lineHeight: 1.6 }}
            >
              Streamline your hiring process
            </Typography>

            {/* Feature highlights */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
              {['End-to-end candidate tracking', 'Multi-round interview management', 'Role-based access control'].map(
                (feature, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#00897B', flexShrink: 0,
                    }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', textAlign: 'left' }}>
                      {feature}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* RIGHT PANEL - Login Form */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Fade in timeout={800}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 5 }}>
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: 2,
                  background: 'linear-gradient(135deg, #1E3A5F, #00897B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 18,
                }}
              >
                RP
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E3A5F' }}>RecruitPro</Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A1A2E', mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280', mb: 4 }}>
              Sign in to your account to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          size="small"
                          sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#1E3A5F' } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: '#6B7280' }}>Remember me</Typography>}
                    />
                  )}
                />
                <Typography
                  variant="body2"
                  sx={{ color: '#1E3A5F', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  height: 48,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  mb: 3,
                  background: 'linear-gradient(135deg, #1E3A5F 0%, #2E5A8F 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #0D253F 0%, #1E3A5F 100%)' },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>

              {/* Demo credentials info */}
              <Box
                sx={{
                  p: 2, borderRadius: 2, backgroundColor: '#F8FAFC',
                  border: '1px solid #E5E7EB',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280', display: 'block', mb: 1 }}>
                  Demo Credentials
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', lineHeight: 1.8 }}>
                  Receptionist: sarah@recruitpro.com<br />
                  HR Admin: priya@recruitpro.com<br />
                  Tech Head: rahul@recruitpro.com<br />
                  Admin: admin@recruitpro.com<br />
                  Password: any (6+ chars)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
