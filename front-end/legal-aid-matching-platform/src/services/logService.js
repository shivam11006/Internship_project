import { apiClient } from './authService';

const logService = {
  // Search logs with filters
  searchLogs: async (searchRequest) => {
    try {
      const response = await apiClient.post('/admin/logs/search', searchRequest);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search logs. Please try again.',
      };
    }
  },

  // Get log statistics
  getLogStats: async () => {
    try {
      const response = await apiClient.get('/admin/logs/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch log statistics. Please try again.',
      };
    }
  },

  // Get recent error logs
  getRecentErrors: async (limit = 10) => {
    try {
      const response = await apiClient.get('/admin/logs/recent-errors', {
        params: { limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch recent errors. Please try again.',
      };
    }
  },

  // Get specific log by ID
  getLogById: async (logId) => {
    try {
      const response = await apiClient.get(`/admin/logs/${logId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch log details. Please try again.',
      };
    }
  },
};

export default logService;
