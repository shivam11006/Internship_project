import { apiClient } from './authService';

const analyticsService = {
  // Get overview analytics
  getOverview: async () => {
    try {
      const response = await apiClient.get('/analytics/overview');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch analytics overview. Please try again.',
      };
    }
  },

  // Get detailed user analytics
  getUsers: async () => {
    try {
      const response = await apiClient.get('/analytics/users');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user analytics. Please try again.',
      };
    }
  },

  // Get detailed case analytics
  getCases: async () => {
    try {
      const response = await apiClient.get('/analytics/cases');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching case analytics:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch case analytics. Please try again.',
      };
    }
  },

  // Get detailed match analytics
  getMatches: async () => {
    try {
      const response = await apiClient.get('/analytics/matches');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching match analytics:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch match analytics. Please try again.',
      };
    }
  },

  // Get activity analytics
  getActivity: async () => {
    try {
      const response = await apiClient.get('/analytics/activity');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch activity analytics. Please try again.',
      };
    }
  },

  // Get all analytics data at once
  getAllAnalytics: async () => {
    try {
      const [overview, users, cases, matches, activity] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getUsers(),
        analyticsService.getCases(),
        analyticsService.getMatches(),
        analyticsService.getActivity(),
      ]);

      return {
        success: overview.success && users.success && cases.success && matches.success && activity.success,
        data: {
          overview: overview.data,
          users: users.data,
          cases: cases.data,
          matches: matches.data,
          activity: activity.data,
        },
        errors: {
          overview: overview.error,
          users: users.error,
          cases: cases.error,
          matches: matches.error,
          activity: activity.error,
        }
      };
    } catch (error) {
      console.error('Error fetching all analytics:', error);
      return {
        success: false,
        error: 'Failed to fetch analytics data. Please try again.',
      };
    }
  },
};

export default analyticsService;
