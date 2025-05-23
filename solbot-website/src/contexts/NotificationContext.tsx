import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';

interface Notification {
  _id: string;
  type: string;
  message: string;
  data?: any;
  read: boolean;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      const sorted = (res.data as Notification[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Real-time updates
    const socket = socketIOClient('ws://localhost:5000');
    socket.on('new-notification', (notification: Notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, 25);
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      await Promise.all(
        unread.map(n =>
          axios.put(`/api/notifications/${n._id}/read`).catch(err => {
            if (err.response && err.response.status === 404) {
              // Ignore not found
              return null;
            }
            throw err;
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, refetchNotifications: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export {}; 