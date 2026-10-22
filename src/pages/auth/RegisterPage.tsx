import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import { useNavigate, Link } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import { useThemeMode } from '../../theme/ThemeModeContext';

export const RegisterPage: React.FC = () => {
  // Step 1: Registration Form State
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Status States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  // 1. Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/register-company', {
        company_name: companyName.trim(),
        full_name: adminName.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      setSuccess(res.data.message || 'Registration initiated! Please enter the OTP sent to your email.');
      setIsOtpStep(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });
      setSuccess(res.data.message || 'Account successfully verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axiosClient.post('/auth/resend-otp', { email: email.trim() });
      setSuccess(res.data.message || 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 4,
        position: 'relative',
        background:
          mode === 'dark'
            ? 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.15), transparent 70%), #090d16'
            : 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.08), transparent 70%), #f8fafc',
      }}
    >
      {/* Top Floating Theme Toggle */}
      <Box sx={{ position: 'absolute', top: 20, right: 24 }}>
        <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" sx={{ color: '#f59e0b' }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Registration Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow:
            mode === 'dark'
              ? '0 16px 40px rgba(0, 0, 0, 0.6)'
              : '0 16px 40px rgba(37, 99, 235, 0.08)',
        }}
      >
        {/* Brand Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
              mb: 1.5,
            }}
          >
            <BusinessCenterOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}
          >
            {isOtpStep ? 'Verify Your Work Email' : 'Register Organization'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
            {isOtpStep
              ? `Enter the 6-digit code sent to ${email}`
              : 'Setup your enterprise workspace and administrator profile'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* STEP 1: Registration Form */}
        {!isOtpStep ? (
          <Box component="form" onSubmit={handleRegister} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              id="companyName"
              label="Company / Workspace Name"
              name="companyName"
              autoFocus
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              required
              fullWidth
              id="adminName"
              label="Administrator Full Name"
              name="adminName"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              required
              fullWidth
              id="email"
              label="Work Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acmecorp.com"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              required
              fullWidth
              name="password"
              label="Admin Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Minimum 6 characters"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !companyName.trim() || !adminName.trim() || !email.trim() || !password.trim()}
              sx={{
                mt: 1.5,
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue to Verification'}
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'text.secondary' }}>
              Already registered?{' '}
              <Link
                to="/login"
                style={{
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        ) : (
          /* STEP 2: OTP Verification Form */
          <Box component="form" onSubmit={handleVerifyOtp} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              required
              fullWidth
              autoFocus
              id="otp"
              label="6-Digit Verification Code"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyOutlinedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !otp.trim()}
              sx={{
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Activate Workspace'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setIsOtpStep(false)}
                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
              >
                ← Back to Edit Details
              </Button>

              <Button
                variant="text"
                size="small"
                onClick={handleResendOtp}
                disabled={resendLoading}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {resendLoading ? 'Resending...' : 'Resend Code'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};