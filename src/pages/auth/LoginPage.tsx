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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import { useNavigate, Link } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../theme/ThemeModeContext';
import type { AuthResponse } from '../../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password Dialog States
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.post<AuthResponse>('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });
      login(res.data.access_token, res.data.refresh_token || '', res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const backendMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Cannot connect to server. Ensure Flask backend is running on port 5000.'
          : 'Invalid email or password.');
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  // 1. Send Forgot Password OTP
  const handleSendResetOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotMessage({ type: 'error', text: 'Please enter your registered email.' });
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      await axiosClient.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setOtpSent(true);
      setForgotMessage({ type: 'success', text: 'Verification code sent to your email.' });
    } catch (err: any) {
      setForgotMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send OTP.' });
    } finally {
      setForgotLoading(false);
    }
  };

  // 2. Submit New Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || !newPassword.trim()) {
      setForgotMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      await axiosClient.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: resetOtp.trim(),
        new_password: newPassword.trim(),
      });
      setForgotMessage({ type: 'success', text: 'Password reset successful! You can now login.' });
      setTimeout(() => {
        setForgotOpen(false);
        setOtpSent(false);
        setResetOtp('');
        setNewPassword('');
      }, 1500);
    } catch (err: any) {
      setForgotMessage({ type: 'error', text: err.response?.data?.error || 'Reset failed.' });
    } finally {
      setForgotLoading(false);
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
      {/* Top Bar Floating Theme Toggle */}
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

      {/* Main Login Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
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
            WorkFlow Pro
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
            Enter your credentials to access workspaces
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <Box>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography
                variant="caption"
                onClick={() => {
                  setForgotMessage(null);
                  setForgotEmail(email);
                  setForgotOpen(true);
                }}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot Password?
              </Typography>
            </Box>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !email.trim() || !password.trim()}
            sx={{
              mt: 1,
              py: 1.2,
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Workspace'}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'text.secondary' }}>
            New to WorkFlow Pro?{' '}
            <Link
              to="/register"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Register Company
            </Link>
          </Typography>
        </Box>
      </Paper>

      {/* Forgot Password Modal */}
      <Dialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        maxWidth="xs"
        fullWidth
        disableRestoreFocus
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1, bgcolor: 'background.paper' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary', pb: 1 }}>
          Reset Account Password
        </DialogTitle>
        <DialogContent>
          {forgotMessage && (
            <Alert severity={forgotMessage.type} sx={{ mb: 2, borderRadius: 2 }}>
              {forgotMessage.text}
            </Alert>
          )}

          {!otpSent ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Enter your work email address to receive an OTP reset code.
              </Typography>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                size="small"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleResetPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="6-Digit OTP Code"
                fullWidth
                size="small"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                size="small"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Minimum 6 characters"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setForgotOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Cancel
          </Button>
          {!otpSent ? (
            <Button
              variant="contained"
              onClick={handleSendResetOtp}
              disabled={forgotLoading || !forgotEmail.trim()}
              sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
            >
              {forgotLoading ? <CircularProgress size={20} /> : 'Send OTP'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleResetPassword}
              disabled={forgotLoading || !resetOtp.trim() || !newPassword.trim()}
              sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
            >
              {forgotLoading ? <CircularProgress size={20} /> : 'Change Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};