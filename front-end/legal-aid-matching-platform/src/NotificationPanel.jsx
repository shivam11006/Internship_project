import React, { useState, useEffect, useRef, useCallback } from 'react';
import notificationService from './services/notificationService';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const panelRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(pageNum, 20);
      const newNotifications = data.notifications || [];

      if (pageNum === 0) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setUnreadCount(data.unreadCount || 0);
      setHasMore(newNotifications.length === 20);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to fetch when page changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(page);
    }
  }, [page, fetchNotifications, isOpen]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    // Initial unread count fetch
    fetchUnreadCount();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchUnreadCount]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle scroll for infinite loading
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const deletedNotif = notifications.find((n) => n.id === notificationId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Navigate and close
  const handleNavigate = (url) => {
    if (url) {
      window.location.href = url;
    }
    setIsOpen(false);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconMap = {
      MATCH_FOUND: '🎯',
      MATCH_ACCEPTED: '✅',
      MATCH_REJECTED: '❌',
      MESSAGE_RECEIVED: '💬',
      APPOINTMENT_SCHEDULED: '📅',
      APPOINTMENT_UPDATED: '🔄',
      APPOINTMENT_CANCELLED: '⛔',
      APPOINTMENT_REMINDER: '🔔',
      CASE_UPDATED: '📝',
      MATCH_SELECTED: '👆',
      PROVIDER_RESPONSE: '📬',
    };
    return iconMap[type] || '📬';
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    const colorMap = {
      MATCH_FOUND: '#3b82f6',
      MATCH_ACCEPTED: '#10b981',
      MATCH_REJECTED: '#ef4444',
      MESSAGE_RECEIVED: '#f59e0b',
      APPOINTMENT_SCHEDULED: '#8b5cf6',
      APPOINTMENT_UPDATED: '#06b6d4',
      APPOINTMENT_CANCELLED: '#ef4444',
      APPOINTMENT_REMINDER: '#f59e0b',
      CASE_UPDATED: '#6366f1',
      MATCH_SELECTED: '#ec4899',
      PROVIDER_RESPONSE: '#14b8a6',
    };
    return colorMap[type] || '#6b7280';
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="notification-panel-container" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        className="notification-bell"
        onClick={() => {
          if (!isOpen) {
            setPage(0);
            setNotifications([]); // Clear for fresh load
          }
          setIsOpen(!isOpen);
        }}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                ✓ Mark All Read
              </button>
            )}
          </div>

          {/* Content */}
          <div
            className="notification-content"
            onScroll={handleScroll}
          >
            {!loading && notifications.length === 0 && (
              <div className="notification-empty">
                <p>📭 No notifications yet</p>
              </div>
            )}

            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNavigate(notification.actionUrl)}
                style={{
                  borderLeftColor: getNotificationColor(notification.type),
                }}
              >
                {/* Icon */}
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="notification-message">
                  <p className="notification-title">{notification.title}</p>
                  <p className="notification-text">{notification.message}</p>
                  <p className="notification-time">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.read && <div className="unread-indicator"></div>}

                {/* Actions */}
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="action-btn"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {loading && (
              <div className="notification-loading">
                <p>Loading...</p>
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <div className="notification-footer-msg">
                <p>No more notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
