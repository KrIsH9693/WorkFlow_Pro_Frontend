import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  Button,
  CircularProgress,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../api/axiosClient';
import { playNotificationSound } from '../../utils/sound';

export const NotificationBell: React.FC = () => {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const prevUnreadCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // 1. Fetch Notifications (4-second polling)
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosClient.get('/notifications/');
      return res.data;
    },
    refetchInterval: 4000,
  });

  const unreadCount = data?.unread_count || 0;
  const notifications = data?.notifications || [];

  // Play Sound when new notification arrives
  useEffect(() => {
    if (isFirstLoadRef.current) {
      prevUnreadCountRef.current = unreadCount;
      isFirstLoadRef.current = false;
      return;
    }

    if (unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // 2. Mark Single Notification as Read
  const markSingleMutation = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 3. Mark All as Read
  const markAllMutation = useMutation({
    mutationFn: async () => {
      await axiosClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: '#475569' }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsOutlinedIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 460, borderRadius: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
          },
        }}
      >
        {/* Popover Header */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {/* Notifications List */}
        <Box sx={{ overflowY: 'auto', maxHeight: 380 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No notifications yet.
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((n: any) => (
                <ListItem
                  key={n.id}
                  onClick={() => !n.is_read && markSingleMutation.mutate(n.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #f1f5f9',
                    bgcolor: n.is_read ? '#ffffff' : '#f0f7ff',
                    cursor: n.is_read ? 'default' : 'pointer',
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {!n.is_read && <CircleIcon sx={{ fontSize: 8, color: '#2563eb' }} />}
                        <Typography variant="subtitle2" sx={{ fontWeight: n.is_read ? 600 : 700, color: '#0f172a' }}>
                          {n.title}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                      {n.message}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};