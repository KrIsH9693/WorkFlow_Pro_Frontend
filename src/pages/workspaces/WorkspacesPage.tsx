import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  // IconButton,
  // Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
// import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import type { Workspace } from '../../types';

export const WorkspacesPage: React.FC = () => {
  const { user } = useAuth();
  const currentRole = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const isAdmin = currentRole === 'Company Admin';

  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch Workspaces
  const { data: workspaces = [], isLoading, isError, error } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await axiosClient.get('/workspaces');
      return res.data.workspaces || [];
    },
  });

  // Create Workspace Mutation (Admin Only)
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const res = await axiosClient.post('/workspaces', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setOpenModal(false);
      setName('');
      setDescription('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to create workspace.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Workspace name is required.');
      return;
    }
    setFormError(null);
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 10, gap: 2 }}>
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          Loading workspaces...
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
              Workspaces
            </Typography>
            <Chip
              label={`${workspaces.length} Total`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary', height: 24 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin
              ? 'Organize projects, departments, and business units across your company.'
              : 'Workspaces and project divisions you have access to.'}
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setFormError(null);
              setOpenModal(true);
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
            New Workspace
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {(error as any)?.response?.data?.error || 'Failed to load workspaces.'}
        </Alert>
      )}

      {/* 2. Responsive Workspaces Grid */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          mx: -1.5,
        }}
      >
        {workspaces.map((ws) => (
          <Box
            key={ws.id}
            sx={{
              width: { xs: '100%', sm: '50%', md: '33.333%' },
              p: 1.5,
              boxSizing: 'border-box',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              {/* Top Meta & Icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    color: 'primary.main',
                    p: 1.2,
                    borderRadius: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FolderOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
                <Chip
                  label="Active Division"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
                    borderRadius: 1.5,
                  }}
                />
              </Box>

              {/* Title & Description */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                  mb: 1,
                }}
              >
                {ws.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  flexGrow: 1,
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 60,
                }}
              >
                {ws.description || 'No specific description provided for this business workspace.'}
              </Typography>

              {/* Action Button */}
              <Box sx={{ pt: 2.5, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  onClick={() => navigate(`/workspaces/${ws.id}/projects`)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                    },
                  }}
                >
                  Explore Projects
                </Button>
              </Box>
            </Paper>
          </Box>
        ))}

        {/* 3. Empty State (No Workspaces) */}
        {workspaces.length === 0 && (
          <Box sx={{ width: '100%', px: 1.5, py: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 4,
                border: '1.5px dashed',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: 480,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  mb: 2,
                }}
              >
                <LayersOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No workspaces available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isAdmin
                  ? 'Workspaces help structure your company’s projects and departments. Create your first one now.'
                  : 'You do not have access to any active workspace yet. Contact your Company Admin.'}
              </Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenModal(true)}
                  sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}
                >
                  Create Workspace
                </Button>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* 4. Modal Dialog: Create New Workspace */}
      {isAdmin && (
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="xs"
          fullWidth
          disableRestoreFocus
          slotProps={{ paper: { sx: { borderRadius: 3, p: 1, bgcolor: 'background.paper' } } }}
        >
          <Box component="form" onSubmit={handleCreate}>
            <DialogTitle sx={{ fontWeight: 800, color: 'text.primary', pb: 1 }}>Create Workspace</DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {formError}
                </Alert>
              )}
              <TextField
                margin="dense"
                label="Workspace Name"
                fullWidth
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering, Marketing, Operations"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the scope or purpose of this workspace..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
              >
                {createMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </Box>
  );
};