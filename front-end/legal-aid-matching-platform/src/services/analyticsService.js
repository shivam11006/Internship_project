import { apiClient } from './authService';

const analyticsService = {
    // Get all analytics data
    getAllAnalytics: async () => {
        try {
            const response = await apiClient.get('/admin/analytics');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch analytics data. Please try again.',
            };
        }
    },
};

export default analyticsService;
