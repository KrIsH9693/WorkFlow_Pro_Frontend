import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Checkbox,
  LinearProgress,
  Paper,
  Tooltip,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient';
import type { Task } from '../../types';

interface SubtaskItem {
  id: number;
  title: string;
  is_completed: boolean;
}

interface AttachmentItem {
  id: number;
  filename: string;
  file_url: string;
  file_size?: number;
  created_at?: string;
}

interface TaskDetailsDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const PRIORITY_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export const TaskDetailsDrawer: React.FC<TaskDetailsDrawerProps> = ({ task, open, onClose }) => {
  const queryClient = useQueryClient();

  // 1. Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editDueDate, setEditDueDate] = useState('');

  // 2. Interactive Input States
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setEditTitle(task.title || '');
      setEditDesc(task.description || '');
      setEditPriority(task.priority || 'MEDIUM');
      setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setIsEditing(false);
      setActionError(null);
    }
  }, [task]);

  // ----------------- QUERIES -----------------

  // Fetch Comments
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const res = await axiosClient.get(`/tasks/${task.id}/comments`);
      return res.data?.comments || [];
    },
    enabled: open && !!task?.id,
    refetchInterval: 3000,
  });

  // Fetch Subtasks
  const { data: subtasks = [], isLoading: isSubtasksLoading } = useQuery<SubtaskItem[]>({
    queryKey: ['task-subtasks', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const res = await axiosClient.get(`/tasks/${task.id}/subtasks`);
      return res.data?.subtasks || [];
    },
    enabled: open && !!task?.id,
  });

  // Fetch Attachments
  const { data: attachments = [], isLoading: isAttachmentsLoading } = useQuery<AttachmentItem[]>({
    queryKey: ['task-attachments', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const res = await axiosClient.get(`/attachments/tasks/${task.id}`);
      return res.data?.attachments || (Array.isArray(res.data) ? res.data : []);
    },
    enabled: open && !!task?.id,
  });

  // ----------------- MUTATIONS -----------------

  // Update Task Mutation (Inline Edit)
  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; priority: string; due_date: string | null }) => {
      const res = await axiosClient.patch(`/projects/tasks/${task?.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setIsEditing(false);
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || 'Failed to update task details.');
    },
  });

  // Comments Mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await axiosClient.post(`/tasks/${task?.id}/comments`, { comment: text });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      setCommentText('');
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || 'Failed to post comment.');
    },
  });

  // Subtasks Mutations
  const addSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await axiosClient.post(`/tasks/${task?.id}/subtasks`, { title });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-subtasks', task?.id] });
      setNewSubtaskTitle('');
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: number) => {
      await axiosClient.patch(`/subtasks/${subtaskId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-subtasks', task?.id] });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: number) => {
      await axiosClient.delete(`/subtasks/${subtaskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-subtasks', task?.id] });
    },
  });

  // Attachment Upload Mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosClient.post(`/attachments/tasks/${task?.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', task?.id] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || 'Failed to upload attachment.');
    },
  });

  // Attachment Delete Mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      await axiosClient.delete(`/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', task?.id] });
    },
  });

  // ----------------- HANDLERS -----------------

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setActionError('Task title cannot be empty.');
      return;
    }
    updateTaskMutation.mutate({
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
      due_date: editDueDate || null,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAttachmentMutation.mutate(file);
      e.target.value = '';
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtaskMutation.mutate(newSubtaskTitle.trim());
  };

  if (!task) return null;

  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            p: 0,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            borderLeft: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* 1. Header Bar (Sticky Top) */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={task.status}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 800, borderRadius: 1.5, height: 24, fontSize: '0.75rem' }}
          />
          <Chip
            label={isEditing ? editPriority : task.priority}
            color={PRIORITY_COLORS[isEditing ? editPriority : task.priority] || 'default'}
            size="small"
            sx={{ fontWeight: 800, borderRadius: 1.5, height: 24, fontSize: '0.75rem' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isEditing ? (
            <Button
              size="small"
              startIcon={<EditOutlinedIcon fontSize="small" />}
              onClick={() => setIsEditing(true)}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
            >
              Edit Details
            </Button>
          ) : (
            <>
              <Button
                size="small"
                color="inherit"
                startIcon={<CancelOutlinedIcon fontSize="small" />}
                onClick={() => setIsEditing(false)}
                sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveOutlinedIcon fontSize="small" />}
                onClick={handleSaveEdit}
                disabled={updateTaskMutation.isPending}
                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
              >
                {updateTaskMutation.isPending ? <CircularProgress size={16} /> : 'Save'}
              </Button>
            </>
          )}

          <Tooltip title="Close Drawer (Esc)">
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Scrollable Drawer Body */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {actionError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {actionError}
          </Alert>
        )}

        {/* Title & Description (View vs Edit Mode) */}
        {!isEditing ? (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 1 }}>
              {task.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.description || 'No detailed instructions provided for this deliverable.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Title"
              fullWidth
              size="small"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        )}

        {/* Metadata Tiles (Assignee, Priority, Due Date) */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 150px',
              p: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
              <PersonOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                ASSIGNEE
              </Typography>
            </Box>
            <Typography noWrap variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {task.assignee?.name || 'Unassigned'}
            </Typography>
          </Paper>

          {isEditing ? (
            <Paper
              elevation={0}
              sx={{
                flex: '1 1 150px',
                p: 1.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <TextField
                select
                fullWidth
                size="small"
                label="Priority"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </TextField>
            </Paper>
          ) : null}

          <Paper
            elevation={0}
            sx={{
              flex: '1 1 150px',
              p: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                DUE DATE
              </Typography>
            </Box>
            {isEditing ? (
              <TextField
                type="date"
                size="small"
                fullWidth
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No deadline set'}
              </Typography>
            )}
          </Paper>
        </Box>

        <Divider />

        {/* 3. Checklist & Subtasks Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Checklist ({completedCount}/{subtasks.length})
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {progressPercent}% Done
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              borderRadius: 2,
              height: 6,
              mb: 2,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                bgcolor: progressPercent === 100 ? '#10b981' : 'primary.main',
              },
            }}
          />

          <Box component="form" onSubmit={handleAddSubtask} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add step or QA criteria..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={addSubtaskMutation.isPending || !newSubtaskTitle.trim()}
              sx={{ minWidth: 44, px: 1.5, borderRadius: 2 }}
            >
              <AddIcon fontSize="small" />
            </Button>
          </Box>

          {isSubtasksLoading ? (
            <CircularProgress size={20} />
          ) : (
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {subtasks.map((st) => (
                <ListItem
                  key={st.id}
                  dense
                  sx={{
                    px: 1.2,
                    py: 0.6,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => deleteSubtaskMutation.mutate(st.id)}>
                      <DeleteOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }} />
                    </IconButton>
                  }
                >
                  <Checkbox
                    edge="start"
                    checked={st.is_completed}
                    onChange={() => toggleSubtaskMutation.mutate(st.id)}
                    size="small"
                    sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#10b981' } }}
                  />
                  <ListItemText
                    primary={st.title}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.875rem',
                          fontWeight: st.is_completed ? 500 : 600,
                          textDecoration: st.is_completed ? 'line-through' : 'none',
                          color: st.is_completed ? 'text.secondary' : 'text.primary',
                        },
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider />

        {/* 4. Attachments & Asset Files Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachFileOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Attachments & Proofs ({attachments.length})
              </Typography>
            </Box>

            <Button
              component="label"
              size="small"
              variant="outlined"
              startIcon={uploadAttachmentMutation.isPending ? <CircularProgress size={14} /> : <AddIcon fontSize="small" />}
              disabled={uploadAttachmentMutation.isPending}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
            >
              Upload File
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
          </Box>

          {isAttachmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : attachments.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                textAlign: 'center',
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                No screenshots or documents attached yet. Click "Upload File" to add.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {attachments.map((att) => (
                <Paper
                  key={att.id}
                  elevation={0}
                  sx={{
                    p: 1.2,
                    px: 1.8,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: 'primary.main', flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {att.filename}
                      </Typography>
                      {att.file_size && (
                        <Typography variant="caption" color="text.secondary">
                          {(att.file_size / 1024).toFixed(1)} KB
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Download File">
                      <IconButton
                        size="small"
                        onClick={async () => {
                          try {
                            const response = await axiosClient.get(`/attachments/download/${att.id}`, {
                              responseType: 'blob',
                            });

                            // 1. Response header se actual MIME type read karein (e.g. image/png, application/pdf)
                            const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
                            const blob = new Blob([response.data], { type: contentType });

                            // 2. Safe filename fallback (extension preserve karne ke liye)
                            const downloadFileName =
                              att.filename ||
                              (att as any).file_name ||
                              (att as any).name ||
                              'downloaded-file';

                            // 3. Trigger download with correct Blob type and extension
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', downloadFileName);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error('Download error:', err);
                          }
                        }}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                      >
                        <DownloadOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete File">
                      <IconButton
                        size="small"
                        onClick={() => deleteAttachmentMutation.mutate(att.id)}
                        sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        <Divider />

        {/* 5. Activity & Discussion Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ChatBubbleOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Discussion ({comments.length})
            </Typography>
          </Box>

          <Box component="form" onSubmit={handlePostComment} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Leave QA review notes or feedback..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={addCommentMutation.isPending || !commentText.trim()}
              sx={{ minWidth: 44, px: 1.5, borderRadius: 2 }}
            >
              {addCommentMutation.isPending ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
            </Button>
          </Box>

          {isCommentsLoading ? (
            <CircularProgress size={20} />
          ) : comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No comments posted yet.
            </Typography>
          ) : (
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {comments.map((c: any) => (
                <Paper
                  key={c.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#2563eb' }}>
                        {(c.user?.name || c.user?.full_name || 'U')[0].toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {c.user?.name || c.user?.full_name || 'Team Member'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>
                    {c.comment}
                  </Typography>
                </Paper>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};