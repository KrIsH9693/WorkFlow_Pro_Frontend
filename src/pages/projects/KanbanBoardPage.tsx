import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Tooltip,
  Snackbar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import type { Task, TeamMember } from '../../types';
import { TaskDetailsDrawer } from '../../components/kanban/TaskDetailsDrawer';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', accent: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: '#3b82f6' },
  { id: 'IN_REVIEW', title: 'In Review', accent: '#f59e0b' },
  { id: 'DONE', title: 'Done (Verified)', accent: '#10b981' },
];

const PRIORITY_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

export const KanbanBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const currentRole = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const isAdmin = currentRole === 'Company Admin';
  const isViewer = currentRole === 'Viewer';

  // Modal / Drawer States
  const [openModal, setOpenModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // 1. Fetch Company Members
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/team/members');
        const rawList =
          res.data?.members ||
          res.data?.team ||
          (Array.isArray(res.data) ? res.data : []);

        return rawList.map((m: any) => ({
          id: m.id,
          name: m.full_name || m.name || m.email || `User #${m.id}`,
          email: m.email || '',
          role: m.role || 'MEMBER',
        }));
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Tasks with Live Polling
  const { data: tasks = [], isLoading, isError } = useQuery<Task[]>({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const res = await axiosClient.get(`/projects/${projectId}/tasks`);

      if (Array.isArray(res.data?.tasks)) {
        return res.data.tasks;
      }
      if (res.data?.board) {
        const flat: Task[] = [];
        Object.entries(res.data.board).forEach(([colKey, list]: [string, any]) => {
          if (Array.isArray(list)) {
            list.forEach((t) => flat.push({ ...t, status: (t.status || colKey).toUpperCase() }));
          }
        });
        return flat;
      }
      return [];
    },
    enabled: !!projectId,
    refetchInterval: 4000,
  });

  // 3. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status, order_index }: { taskId: number; status: string; order_index: number }) => {
      await axiosClient.patch(`/projects/tasks/${taskId}`, { status, order_index });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setToastMessage(err.response?.data?.error || 'Status update failed.');
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
  });

  // 4. Create Task Mutation (Admin Only)
  const createTaskMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      priority: string;
      status: string;
      assigned_to: number | null;
      due_date: string | null;
      order_index: number;
    }) => {
      const res = await axiosClient.post(`/projects/${projectId}/tasks`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setOpenModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setAssignedTo('');
      setDueDate('');
      setModalError(null);
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error || 'Failed to create task.');
    },
  });

  // Multi-Condition Client-Side Filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        t.title?.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search);

      const matchesPriority =
        selectedPriority === 'ALL' || t.priority?.toUpperCase() === selectedPriority;

      let matchesAssignee = true;
      if (onlyMyTasks) {
        matchesAssignee = t.assignee?.id === user?.id;
      } else if (selectedAssignee !== 'ALL') {
        matchesAssignee = String(t.assignee?.id) === selectedAssignee;
      }

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, selectedPriority, selectedAssignee, onlyMyTasks, user?.id]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedPriority !== 'ALL' ||
    selectedAssignee !== 'ALL' ||
    onlyMyTasks;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPriority('ALL');
    setSelectedAssignee('ALL');
    setOnlyMyTasks(false);
  };

  const onDragEnd = (result: DropResult) => {
    if (isViewer) return;

    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const taskId = Number(draggableId);
    const targetStatus = destination.droppableId;

    if (targetStatus === 'DONE' && !isAdmin) {
      setToastMessage('Tasks can only be moved to Done by Company Admin after testing review.');
      return;
    }

    updateStatusMutation.mutate({
      taskId,
      status: targetStatus,
      order_index: destination.index,
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setModalError('Task title is required.');
      return;
    }

    const currentColTasks = tasks.filter((t) => (t.status || '').toUpperCase() === 'TODO');

    createTaskMutation.mutate({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      priority: taskPriority,
      status: 'TODO',
      assigned_to: assignedTo ? Number(assignedTo) : null,
      due_date: dueDate ? dueDate : null,
      order_index: currentColTasks.length,
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 10, gap: 2 }}>
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          Loading Kanban Workspace...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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
          <Button
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={() => navigate('/projects')}
            sx={{
              p: 0,
              mb: 0.5,
              fontWeight: 600,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
            }}
          >
            Back to Projects
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Kanban Workspace
            </Typography>
            <Chip
              label={`${filteredTasks.length} Tasks`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary', height: 24 }}
            />
          </Box>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setModalError(null);
              setOpenModal(true);
            }}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              py: 1,
              width: { xs: '100%', sm: 'auto' },
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            Add New Task
          </Button>
        )}
      </Box>

      {/* 2. Interactive Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by title or details..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 220px' },
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />

        <TextField
          select
          size="small"
          label="Priority"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          sx={{
            flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 130px' },
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        >
          <MenuItem value="ALL">All Priorities</MenuItem>
          <MenuItem value="LOW">Low</MenuItem>
          <MenuItem value="MEDIUM">Medium</MenuItem>
          <MenuItem value="HIGH">High</MenuItem>
          <MenuItem value="URGENT">Urgent</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Assignee"
          value={selectedAssignee}
          disabled={onlyMyTasks}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          sx={{
            flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 160px' },
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        >
          <MenuItem value="ALL">All Members</MenuItem>
          {teamMembers.map((member) => (
            <MenuItem key={member.id} value={String(member.id)}>
              {member.name}
            </MenuItem>
          ))}
        </TextField>

        <Chip
          icon={<PersonOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
          label="My Tasks"
          clickable
          color={onlyMyTasks ? 'primary' : 'default'}
          variant={onlyMyTasks ? 'filled' : 'outlined'}
          onClick={() => {
            setOnlyMyTasks((prev) => !prev);
            if (!onlyMyTasks) setSelectedAssignee('ALL');
          }}
          sx={{
            fontWeight: 700,
            height: 38,
            borderRadius: 2,
            px: 1,
            flex: { xs: '1 1 auto', sm: 'none' },
          }}
        />

        {hasActiveFilters && (
          <Tooltip title="Reset all active filters">
            <IconButton
              size="small"
              onClick={handleResetFilters}
              sx={{ color: '#ef4444', bgcolor: 'action.hover' }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load tasks from server.
        </Alert>
      )}

      {/* 3. Kanban Columns Rail (Mobile Responsive Horizontal Scroll & Snap) */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box
          sx={{
            display: 'flex',
            gap: 2.5,
            overflowX: 'auto',
            pb: 2.5,
            pt: 0.5,
            px: { xs: 0.5, sm: 0 },
            scrollSnapType: { xs: 'x mandatory', sm: 'none' },
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'divider',
              borderRadius: 4,
            },
          }}
        >
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => (t.status || '').toUpperCase() === col.id);
            const isDoneColumn = col.id === 'DONE';

            return (
              <Box
                key={col.id}
                sx={{
                  flex: { xs: '0 0 84vw', sm: '0 0 310px' },
                  maxWidth: { xs: '84vw', sm: 310 },
                  scrollSnapAlign: 'start',
                  bgcolor: 'background.paper',
                  borderRadius: 3.5,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '68vh',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1,
                    borderBottom: '2px solid',
                    borderColor: col.accent,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                      {col.title}
                    </Typography>
                    {isDoneColumn && !isAdmin && (
                      <Tooltip title="Company Admin approval required to move here">
                        <LockIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Chip
                    label={colTasks.length}
                    size="small"
                    sx={{
                      bgcolor: 'action.hover',
                      color: 'text.primary',
                      fontWeight: 800,
                      height: 22,
                      fontSize: '0.75rem',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>

                {/* Droppable Task Container */}
                <Droppable droppableId={col.id} isDropDisabled={isViewer}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        flexGrow: 1,
                        minHeight: 180,
                        bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                        borderRadius: 2.5,
                        p: 0.5,
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 120,
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            No tasks here
                          </Typography>
                        </Box>
                      )}

                      {colTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={String(task.id)}
                          index={index}
                          isDragDisabled={isViewer}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <Paper
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              elevation={0}
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDrawerOpen(true);
                              }}
                              sx={{
                                p: 2,
                                mb: 1.5,
                                borderRadius: 2.5,
                                border: '1px solid',
                                borderColor: dragSnapshot.isDragging ? 'primary.main' : 'divider',
                                bgcolor: 'background.default',
                                cursor: isViewer ? 'pointer' : 'grab',
                                boxShadow: dragSnapshot.isDragging
                                  ? '0 12px 24px rgba(0,0,0,0.3)'
                                  : 'none',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  transform: 'translateY(-1px)',
                                },
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.35 }}
                              >
                                {task.title}
                              </Typography>

                              {task.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: '0.8rem',
                                    mt: 0.8,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {task.description}
                                </Typography>
                              )}

                              {/* Bottom Metadata */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 2,
                                  pt: 1.2,
                                  borderTop: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  color={PRIORITY_COLORS[task.priority] || 'default'}
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    borderRadius: 1,
                                  }}
                                />

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                  {task.due_date && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <CalendarTodayIcon sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                                        {new Date(task.due_date).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </Typography>
                                    </Box>
                                  )}

                                  {task.assignee ? (
                                    <Tooltip title={`Assigned to ${task.assignee.name}`}>
                                      <Avatar
                                        sx={{
                                          width: 26,
                                          height: 26,
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          bgcolor: task.assignee.id === user?.id ? '#10b981' : '#2563eb',
                                        }}
                                      >
                                        {task.assignee.name[0].toUpperCase()}
                                      </Avatar>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Unassigned task">
                                      <Box
                                        sx={{
                                          width: 26,
                                          height: 26,
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          bgcolor: 'action.hover',
                                          border: '1px dashed',
                                          borderColor: 'divider',
                                        }}
                                      >
                                        <PersonOutlinedIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>

      {/* 4. Task Creation Modal */}
      {isAdmin && (
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="xs"
          fullWidth
          disableRestoreFocus
          slotProps={{ paper: { sx: { borderRadius: 3, p: 1, bgcolor: 'background.paper' } } }}
        >
          <Box component="form" onSubmit={handleCreateTask}>
            <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>Add New Task</DialogTitle>
            <DialogContent>
              {modalError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {modalError}
                </Alert>
              )}

              <TextField
                margin="dense"
                label="Task Title"
                fullWidth
                required
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                select
                margin="dense"
                label="Priority"
                fullWidth
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </TextField>

              <TextField
                select
                margin="dense"
                label="Assign To (Team Member)"
                fullWidth
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : '')}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                margin="dense"
                label="Due Date"
                type="date"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
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
                disabled={createTaskMutation.isPending}
                sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
              >
                {createTaskMutation.isPending ? <CircularProgress size={22} /> : 'Save Task'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}

      {/* 5. Slide-Over Task Details Drawer */}
      <TaskDetailsDrawer
        open={isDrawerOpen}
        task={selectedTask}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* 6. Feedback Toast */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="warning"
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};