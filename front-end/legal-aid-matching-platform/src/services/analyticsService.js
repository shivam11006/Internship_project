import { apiClient } from './authService';

const analyticsService = {
    // Get all analytics data by combining multiple endpoints
    getAllAnalytics: async () => {
        try {
            // Fetch all analytics data from separate endpoints
            const [overviewRes, usersRes, casesRes, matchesRes, activityRes] = await Promise.all([
                apiClient.get('/analytics/overview'),
                apiClient.get('/analytics/users'),
                apiClient.get('/analytics/cases'),
                apiClient.get('/analytics/matches'),
                apiClient.get('/analytics/activity')
            ]);
            
            // Combine all the data
            return { 
                success: true, 
                data: {
                    overview: overviewRes.data,
                    users: usersRes.data,
                    cases: casesRes.data,
                    matches: matchesRes.data,
                    activity: activityRes.data
                }
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch analytics data. Please try again.',
            };
        }
    },

    // Get overview analytics
    getOverviewAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/overview');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching overview analytics:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to fetch overview analytics.' };
        }
    },

    // Get users analytics
    getUsersAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/users');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching users analytics:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to fetch users analytics.' };
        }
    },

    // Get cases analytics
    getCasesAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/cases');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching cases analytics:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to fetch cases analytics.' };
        }
    },

    // Get matches analytics
    getMatchesAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/matches');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching matches analytics:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to fetch matches analytics.' };
        }
    },

    // Get activity analytics
    getActivityAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/activity');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching activity analytics:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to fetch activity analytics.' };
        }
    },
};

export default analyticsService;
