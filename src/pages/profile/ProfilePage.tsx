import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 1. Fetch Fresh User Profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        return res.data?.user || res.data;
      } catch {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : authUser;
      }
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || profile.name || '');
    }
  }, [profile]);

  const userName = profile?.full_name || profile?.name || authUser?.name || 'Workflow Pro User';
  const userEmail = profile?.email || authUser?.email || 'No email provided';
  const roleRaw = profile?.role || authUser?.role;
  const roleName = typeof roleRaw === 'object' ? roleRaw?.name : roleRaw || 'Company Admin';

  // 2. Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await axiosClient.put('/auth/profile', { full_name: name });
      return res.data;
    },
    onSuccess: () => {
      setProfileSuccess('Profile name updated successfully!');
      setProfileError(null);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.name = fullName;
        parsed.full_name = fullName;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
    },
    onError: (err: any) => {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
      setProfileSuccess(null);
    },
  });

  // 3. Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const res = await axiosClient.post('/auth/change-password', payload);
      return res.data;
    },
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully!');
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
      setPasswordSuccess(null);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }
    setProfileSuccess(null);
    setProfileError(null);
    updateProfileMutation.mutate(fullName.trim());
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  const isNameChanged = fullName.trim() !== '' && fullName.trim() !== userName;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress size={36} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1120, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5, pb: 6 }}>
      {/* 1. Header Banner & Identity Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        {/* Sleek Gradient Banner with Abstract Ambient Lighting */}
        <Box
          sx={{
            height: { xs: 120, sm: 160 },
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #38bdf8 100%)',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 20,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              color: '#ffffff',
            }}
          >
            <VerifiedUserOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
              Enterprise Protected Account
            </Typography>
          </Box>
        </Box>

        {/* Identity Details */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 4 },
            pb: 3.5,
            pt: 0,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          {/* Avatar & User Details */}
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2.5,
            }}
          >
            <Avatar
              sx={{
                width: { xs: 88, sm: 104 },
                height: { xs: 88, sm: 104 },
                bgcolor: '#2563eb',
                fontSize: { xs: '2.2rem', sm: '2.6rem' },
                fontWeight: 800,
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                mt: { xs: -6, sm: -6.5 },
                zIndex: 2,
              }}
            >
              {userName[0]?.toUpperCase() || 'U'}
            </Avatar>

            <Box sx={{ pt: { xs: 0, sm: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                  {userName}
                </Typography>
                <Chip
                  label={roleName}
                  size="small"
                  color={roleName === 'Company Admin' ? 'primary' : 'default'}
                  sx={{
                    fontWeight: 700,
                    height: 24,
                    fontSize: '0.75rem',
                    borderRadius: 1.5,
                    px: 0.5,
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.6, fontWeight: 500 }}
              >
                <EmailOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                {userEmail}
              </Typography>
            </Box>
          </Box>

          {/* Quick Status Tag */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              bgcolor: 'action.hover',
              px: 2,
              py: 1.2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <BusinessOutlinedIcon sx={{ fontSize: 20, color: '#2563eb' }} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1, fontWeight: 600 }}>
                Membership
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                Active Workspace Member
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 2. Dual Column Layout (Personal Info + Security) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left Card: Personal Details */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ p: 1.2, bgcolor: 'action.hover', borderRadius: 2.5, color: '#2563eb', display: 'flex' }}>
              <PersonOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem' }}>
                Personal Information
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Update your display name and basic identity details.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {profileSuccess && (
            <Alert icon={<CheckCircleOutlinedIcon fontSize="inherit" />} severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
              {profileSuccess}
            </Alert>
          )}

          {profileError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {profileError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flexGrow: 1 }}>
            <TextField
              label="Full Name"
              fullWidth
              size="small"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              label="Email Address"
              fullWidth
              size="small"
              value={userEmail}
              slotProps={{
                input: {
                  readOnly: true,
                  sx: {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                    fontWeight: 600,
                  },
                },
              }}
              helperText="Managed by company workspace policy"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              label="Assigned Role"
              fullWidth
              size="small"
              value={roleName}
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShieldOutlinedIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                    fontWeight: 600,
                  },
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <Box sx={{ mt: 'auto', pt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={updateProfileMutation.isPending || !isNameChanged}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  boxShadow: isNameChanged ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                }}
              >
                {updateProfileMutation.isPending ? <CircularProgress size={20} /> : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Right Card: Security & Password */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ p: 1.2, bgcolor: 'action.hover', borderRadius: 2.5, color: '#ef4444', display: 'flex' }}>
              <LockOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem' }}>
                Security & Password
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ensure your account is protected by a strong password.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {passwordSuccess && (
            <Alert icon={<CheckCircleOutlinedIcon fontSize="inherit" />} severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
              {passwordSuccess}
            </Alert>
          )}

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {passwordError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flexGrow: 1 }}>
            <TextField
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                        {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 6 characters with mixed characters"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              size="small"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <Box sx={{ mt: 'auto', pt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  boxShadow:
                    currentPassword && newPassword && confirmPassword
                      ? '0 4px 14px rgba(239, 68, 68, 0.25)'
                      : 'none',
                }}
              >
                {changePasswordMutation.isPending ? <CircularProgress size={20} /> : 'Update Password'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};