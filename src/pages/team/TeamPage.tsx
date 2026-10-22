import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import type { TeamMember } from '../../types';

interface PendingInvite {
  id: number;
  email: string;
  role: string;
  expires_at: string;
}

// Supabase "Roles" table ke matching roles
const AVAILABLE_ROLES = [
  'Company Admin',
  'Project Manager',
  'Employee',
  'Team Member',
  'Client',
  'Viewer'
];

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  
  const currentRole = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const isAdmin = currentRole === 'Company Admin' || currentRole === 'Super Admin';

  const queryClient = useQueryClient();
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Team Member');
  const [modalMessage, setModalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // 1. Fetch Team Members & Pending Invites
  const { data, isLoading, isError } = useQuery({
    queryKey: ['team-details'],
    queryFn: async () => {
      const res = await axiosClient.get('/team/members');
      return {
        members: (res.data?.members || []) as TeamMember[],
        pendingInvites: (res.data?.pending_invitations || []) as PendingInvite[],
      };
    },
  });

  // 2. Invite Mutation (Admin Only)
  const inviteMutation = useMutation({
    mutationFn: async (payload: { email: string; role_name: string }) => {
      const res = await axiosClient.post('/team/invite', payload);
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['team-details'] });
      setModalMessage({ type: 'success', text: resData.message || 'Invitation sent successfully!' });
      setInviteEmail('');
    },
    onError: (err: any) => {
      setModalMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send invite.' });
    },
  });

  // 3. Update Role Mutation (Admin Only)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleName }: { memberId: number; roleName: string }) => {
      const res = await axiosClient.put(`/team/members/${memberId}/role`, { role_name: roleName });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-details'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to update role.');
    },
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setModalMessage(null);
    inviteMutation.mutate({
      email: inviteEmail.trim(),
      role_name: inviteRole,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 10, gap: 2 }}>
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          Loading team workspace members...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, pb: 4 }}>
      {/* 1. Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Team Management
            </Typography>
            <Chip
              label={`${data?.members?.length || 0} Members`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary', height: 24 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin 
              ? 'Manage company workspace members, adjust permission roles, and track invitations.' 
              : 'View colleagues, teammates, and contributors in your workspace.'}
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setModalMessage(null);
              setOpenInviteModal(true);
            }}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            Invite Member
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load team data from server.
        </Alert>
      )}

      {/* 2. Active Team Members Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <GroupOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Active Members ({data?.members?.length || 0})
          </Typography>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.paper' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>MEMBER</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.members?.map((m) => {
                const isMe = m.id === user?.id;

                return (
                  <TableRow
                    key={m.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: isMe ? '#10b981' : '#2563eb',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          {(m.full_name || m.name || m.email || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {m.full_name || m.name || m.email.split('@')[0]}
                          </Typography>
                          {isMe && (
                            <Chip 
                              label="You" 
                              size="small" 
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: 'action.selected',
                                color: 'primary.main',
                                borderRadius: 1,
                              }} 
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      {m.email}
                    </TableCell>
                    
                    {/* Dynamic Role selector */}
                    <TableCell>
                      {isAdmin && !isMe ? (
                        <TextField
                          select
                          size="small"
                          value={m.role || 'Team Member'}
                          onChange={(e) => updateRoleMutation.mutate({ memberId: m.id, roleName: e.target.value })}
                          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                          {AVAILABLE_ROLES.map((r) => (
                            <MenuItem key={r} value={r}>
                              {r}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <Chip
                          label={m.role || 'Team Member'}
                          size="small"
                          color={m.role === 'Company Admin' ? 'primary' : 'default'}
                          variant={m.role === 'Company Admin' ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 700, height: 24, borderRadius: 1.5 }}
                        />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label="Active"
                        size="small"
                        color="success"
                        sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem', borderRadius: 1 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 3. Pending Invitations Table */}
      {isAdmin && data?.pendingInvites && data.pendingInvites.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <MailOutlineIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Pending Invitations ({data.pendingInvites.length})
            </Typography>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.paper' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>INVITED EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>ASSIGNED ROLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>EXPIRES AT</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', py: 1.8 }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.pendingInvites.map((inv) => (
                  <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{inv.email}</TableCell>
                    <TableCell>
                      <Chip label={inv.role} size="small" variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {new Date(inv.expires_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Chip label="Pending" size="small" color="warning" sx={{ height: 22, fontWeight: 700, borderRadius: 1 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* 4. Modal: Invite New Member */}
      {isAdmin && (
        <Dialog
          open={openInviteModal}
          onClose={() => setOpenInviteModal(false)}
          maxWidth="xs"
          fullWidth
          disableRestoreFocus
          slotProps={{ paper: { sx: { borderRadius: 3, p: 1, bgcolor: 'background.paper' } } }}
        >
          <Box component="form" onSubmit={handleSendInvite}>
            <DialogTitle sx={{ fontWeight: 800, color: 'text.primary', pb: 1 }}>Invite New Colleague</DialogTitle>
            <DialogContent>
              {modalMessage && (
                <Alert severity={modalMessage.type} sx={{ mb: 2, borderRadius: 2 }}>
                  {modalMessage.text}
                </Alert>
              )}

              <TextField
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                select
                margin="dense"
                label="Workspace Permission Role"
                fullWidth
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {AVAILABLE_ROLES.map((roleName) => (
                  <MenuItem key={roleName} value={roleName}>
                    {roleName}
                  </MenuItem>
                ))}
              </TextField>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setOpenInviteModal(false)} sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Close
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={inviteMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
              >
                {inviteMutation.isPending ? <CircularProgress size={20} /> : 'Send Invite'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </Box>
  );
};