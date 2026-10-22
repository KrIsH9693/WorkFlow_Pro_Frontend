import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const currentRole = typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role;
  const isAdmin = currentRole === 'Company Admin';

  // 1. Fetch Dashboard Stats
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await axiosClient.get('/dashboard/stats');
      return res.data;
    },
  });

  // 2. Fetch Activity & Comment Logs (Admin Exclusive)
  const { data: activityLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await axiosClient.get('/activity-logs');
      return res.data?.logs || [];
    },
    enabled: isAdmin,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 10, gap: 2 }}>
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          Loading dashboard metrics...
        </Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Failed to load dashboard metrics.
      </Alert>
    );
  }

  const summary = data?.summary || {};
  const breakdown = data?.task_breakdown || {};

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
              {isAdmin ? 'Company Dashboard' : 'My Workspace Overview'}
            </Typography>
            <Chip
              label={data?.role || currentRole || 'Team Member'}
              color={isAdmin ? 'primary' : 'default'}
              variant={isAdmin ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, height: 24, fontSize: '0.75rem', borderRadius: 1.5 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin
              ? 'Real-time overview of workspaces, company tasks, and live team activity logs.'
              : 'Tracking your assigned tasks, active sprints, and personal milestones.'}
          </Typography>
        </Box>
      </Box>

      {/* 2. Admin Workspace & Team Counters */}
      {isAdmin && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
          {/* Total Workspaces */}
          <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1.5, boxSizing: 'border-box' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CorporateFareOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>
                  TOTAL WORKSPACES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.2 }}>
                  {summary.total_workspaces ?? 0}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Team Members */}
          <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1.5, boxSizing: 'border-box' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#10b981', transform: 'translateY(-2px)' },
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GroupOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>
                  TEAM MEMBERS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.2 }}>
                  {summary.total_members ?? 0}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* 3. Task & Workload Metric Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
        {!isAdmin && (
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, p: 1.5, boxSizing: 'border-box' }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: 'action.hover', color: '#0284c7', display: 'flex' }}>
                <FolderSpecialOutlinedIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  ACTIVE PROJECTS
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {summary.total_projects ?? 0}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Total Tasks */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: isAdmin ? '25%' : '25%' }, p: 1.5, boxSizing: 'border-box' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: 'action.hover', color: '#6366f1', display: 'flex' }}>
              <AssignmentOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                {isAdmin ? 'TOTAL TASKS' : 'MY TASKS'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {summary.total_tasks ?? 0}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* In Progress */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: isAdmin ? '25%' : '25%' }, p: 1.5, boxSizing: 'border-box' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: 'action.hover', color: '#f59e0b', display: 'flex' }}>
              <PendingActionsOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                IN PROGRESS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {breakdown.IN_PROGRESS ?? 0}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Completed */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: isAdmin ? '25%' : '25%' }, p: 1.5, boxSizing: 'border-box' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: 'action.hover', color: '#10b981', display: 'flex' }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                COMPLETED
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {breakdown.DONE ?? 0}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Overdue */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: isAdmin ? '25%' : '25%' }, p: 1.5, boxSizing: 'border-box' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: 'action.hover', color: '#ef4444', display: 'flex' }}>
              <WarningAmberOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                OVERDUE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444' }}>
                {breakdown.OVERDUE ?? 0}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 4. Real-Time Audit & Activity Feed (Admin Exclusive) */}
      {isAdmin && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main', display: 'flex' }}>
                <HistoryToggleOffOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem' }}>
                  Company Activity & Audit Log
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time timeline of team operations, comments, and task transitions
                </Typography>
              </Box>
            </Box>
            <Chip
              label="Live Sync"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {isLogsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : activityLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="body2" color="text.secondary">
                No team comments or activity logs recorded yet.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {activityLogs.slice(0, 8).map((log: any) => {
                const isComment = log.action === 'COMMENT_ADDED';

                return (
                  <Paper
                    key={log.id}
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          bgcolor: isComment ? '#8b5cf6' : '#2563eb',
                        }}
                      >
                        {isComment ? (
                          <ChatBubbleOutlinedIcon sx={{ fontSize: 18, color: '#ffffff' }} />
                        ) : (
                          log.user?.name?.[0]?.toUpperCase() || 'U'
                        )}
                      </Avatar>

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {log.details}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                          <Typography variant="caption" color="text.secondary">
                            {log.user?.name || 'System User'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            •
                          </Typography>
                          <Chip
                            label={log.action}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {log.created_at && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};