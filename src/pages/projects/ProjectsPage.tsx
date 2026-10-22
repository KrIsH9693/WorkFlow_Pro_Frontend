import React, { useState, useEffect } from 'react';
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
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import type { Project, Workspace } from '../../types';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const currentRole = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const isAdmin = currentRole === 'Company Admin';

  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId?: string }>();
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Fetch Workspaces
  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await axiosClient.get('/workspaces');
      return res.data.workspaces || [];
    },
  });

  useEffect(() => {
    if (urlWorkspaceId) {
      setSelectedWorkspaceId(Number(urlWorkspaceId));
    } else if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [urlWorkspaceId, workspaces]);

  // 2. Fetch Projects (Workspace-specific or All)
  const { data: projects = [], isLoading, isError, error } = useQuery<Project[]>({
    queryKey: ['projects', urlWorkspaceId || 'all'],
    queryFn: async () => {
      const endpoint = urlWorkspaceId
        ? `/workspaces/${urlWorkspaceId}/projects`
        : '/projects';
      const res = await axiosClient.get(endpoint);
      return res.data.projects || [];
    },
  });

  // Current filtered workspace name
  const activeWorkspace = workspaces.find((w) => String(w.id) === String(urlWorkspaceId));

  // 3. Create Project Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; workspace_id: number }) => {
      const res = await axiosClient.post('/projects', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setOpenModal(false);
      setName('');
      setDescription('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error || 'Failed to create project.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project name is required.');
      return;
    }
    if (!selectedWorkspaceId) {
      setFormError('Please select a workspace for this project.');
      return;
    }
    setFormError(null);
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      workspace_id: Number(selectedWorkspaceId),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 10, gap: 2 }}>
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          Loading active projects...
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Projects
            </Typography>
            <Chip
              label={`${projects.length} Total`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary', height: 24 }}
            />
            {urlWorkspaceId && (
              <Chip
                icon={<FolderOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={activeWorkspace ? `Workspace: ${activeWorkspace.name}` : `Workspace #${urlWorkspaceId}`}
                onDelete={() => navigate('/projects')}
                deleteIcon={<CloseIcon sx={{ fontSize: '0.85rem !important' }} />}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, height: 24 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {urlWorkspaceId
              ? `Manage and monitor progress inside ${activeWorkspace ? activeWorkspace.name : 'this workspace'}.`
              : 'All active project boards, deliverables, and pipelines in your workspace.'}
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
            New Project
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {(error as any)?.response?.data?.error || 'Failed to load projects from server.'}
        </Alert>
      )}

      {/* 2. Responsive Projects Grid */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          mx: -1.5,
        }}
      >
        {projects.map((proj) => {
          const isCompleted = proj.status === 'COMPLETED';

          return (
            <Box
              key={proj.id}
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
                {/* Top Meta & Status */}
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
                    <AssignmentOutlinedIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Chip
                    label={proj.status || 'ACTIVE'}
                    size="small"
                    color={isCompleted ? 'success' : 'primary'}
                    variant={isCompleted ? 'filled' : 'outlined'}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
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
                  {proj.name}
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
                  {proj.description || 'No specific description provided for this project.'}
                </Typography>

                {/* Action CTA: Open Kanban Board */}
                <Box sx={{ pt: 2.5, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ViewKanbanOutlinedIcon />}
                    onClick={() => navigate(`/projects/${proj.id}/kanban`)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 1,
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    Open Kanban Board
                  </Button>
                </Box>
              </Paper>
            </Box>
          );
        })}

        {/* 3. Empty State (No Projects) */}
        {projects.length === 0 && (
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
                <AssignmentOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                No projects found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isAdmin
                  ? 'Start building your project pipeline and manage tasks on real-time Kanban boards.'
                  : 'No active projects have been assigned or created in this section yet.'}
              </Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenModal(true)}
                  sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}
                >
                  Create Project
                </Button>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* 4. Modal Dialog: Create New Project */}
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
            <DialogTitle sx={{ fontWeight: 800, color: 'text.primary', pb: 1 }}>Create Project</DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {formError}
                </Alert>
              )}

              <TextField
                select
                margin="dense"
                label="Workspace"
                fullWidth
                required
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(Number(e.target.value))}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {workspaces.map((ws) => (
                  <MenuItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                margin="dense"
                label="Project Name"
                fullWidth
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mobile App Redesign, Q4 Migration"
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
                placeholder="Outline deliverables, scope, and objectives..."
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
                {createMutation.isPending ? <CircularProgress size={20} /> : 'Create Project'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </Box>
  );
};