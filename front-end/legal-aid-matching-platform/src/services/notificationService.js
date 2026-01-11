import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/notifications';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const notificationService = {
  /**
   * Get all notifications with pagination
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Number of items per page
   * @returns {Promise}
   */
  getNotifications: async (page = 0, size = 20) => {
    try {
      const response = await apiClient.get('', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get only unread notifications
   * @returns {Promise}
   */
  getUnreadNotifications: async () => {
    try {
      const response = await apiClient.get('/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  /**
   * Get count of unread notifications
   * @returns {Promise}
   */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/unread-count');
      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param {number} id - Notification ID
   * @returns {Promise}
   */
  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise}
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   * @param {number} id - Notification ID
   * @returns {Promise}
   */
  deleteNotification: async (id) => {
    try {
      const response = await apiClient.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },
};

export default notificationService;
