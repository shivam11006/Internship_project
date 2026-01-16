import { apiClient } from './authService';

const analyticsService = {
    // Get overview analytics
    getOverviewAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/overview');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching overview analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch overview analytics.',
            };
        }
    },

    // Get users analytics
    getUsersAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/users');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching users analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch users analytics.',
            };
        }
    },

    // Get cases analytics
    getCasesAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/cases');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching cases analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch cases analytics.',
            };
        }
    },

    // Get matches analytics
    getMatchesAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/matches');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching matches analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch matches analytics.',
            };
        }
    },

    // Get activity analytics
    getActivityAnalytics: async () => {
        try {
            const response = await apiClient.get('/analytics/activity');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching activity analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch activity analytics.',
            };
        }
    },

    // Get all analytics data (combines all endpoints)
    getAllAnalytics: async () => {
        try {
            const [overview, users, cases, matches, activity] = await Promise.all([
                analyticsService.getOverviewAnalytics(),
                analyticsService.getUsersAnalytics(),
                analyticsService.getCasesAnalytics(),
                analyticsService.getMatchesAnalytics(),
                analyticsService.getActivityAnalytics(),
            ]);

            // Check if any request failed
            if (!overview.success || !users.success || !cases.success || !matches.success || !activity.success) {
                throw new Error('One or more analytics endpoints failed');
            }

            return {
                success: true,
                data: {
                    overview: overview.data,
                    users: users.data,
                    cases: cases.data,
                    matches: matches.data,
                    activity: activity.data,
                }
            };
        } catch (error) {
            console.error('Error fetching all analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch analytics data. Please try again.',
            };
        }
    },

    // Extract and aggregate location data from all analytics endpoints
    getLocationAnalytics: async () => {
        try {
            const [overview, users, cases, matches, activity] = await Promise.all([
                analyticsService.getOverviewAnalytics(),
                analyticsService.getUsersAnalytics(),
                analyticsService.getCasesAnalytics(),
                analyticsService.getMatchesAnalytics(),
                analyticsService.getActivityAnalytics(),
            ]);

            // Check if requests were successful
            if (!overview.success || !users.success || !cases.success || !matches.success || !activity.success) {
                throw new Error('One or more analytics endpoints failed');
            }

            // Get role distribution percentages from overview data
            const usersByRole = overview.data?.usersByRole || { CITIZEN: 0, LAWYER: 0, NGO: 0 };
            const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0) || 1;
            
            const citizenRatio = (usersByRole.CITIZEN || 0) / totalUsers;
            const lawyerRatio = (usersByRole.LAWYER || 0) / totalUsers;
            const ngoRatio = (usersByRole.NGO || 0) / totalUsers;

            // Get location data
            const usersByLocation = users.data?.usersByLocation || {};
            const casesByLocation = cases.data?.casesByLocation || {};

            // Distribute users by role for each location
            const citizensByLocation = {};
            const lawyersByLocation = {};
            const ngosByLocation = {};

            Object.entries(usersByLocation).forEach(([location, totalCount]) => {
                citizensByLocation[location] = Math.round(totalCount * citizenRatio);
                lawyersByLocation[location] = Math.round(totalCount * lawyerRatio);
                ngosByLocation[location] = Math.round(totalCount * ngoRatio);
            });

            return {
                success: true,
                data: {
                    cases: casesByLocation,
                    citizens: citizensByLocation,
                    lawyers: lawyersByLocation,
                    ngos: ngosByLocation,
                    topLocations: cases.data?.topCaseLocations || [],
                }
            };
        } catch (error) {
            console.error('Error fetching location analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch location analytics.',
            };
        }
    },

    // Get specific location metric (cases, users, matches, activity)
    getLocationMetric: async (metricType) => {
        try {
            const validMetrics = ['cases', 'users', 'matches', 'activity'];
            if (!validMetrics.includes(metricType)) {
                throw new Error(`Invalid metric type. Must be one of: ${validMetrics.join(', ')}`);
            }

            const locationData = await analyticsService.getLocationAnalytics();
            
            if (!locationData.success) {
                return locationData;
            }

            return {
                success: true,
                data: locationData.data[metricType] || {}
            };
        } catch (error) {
            console.error(`Error fetching location metric (${metricType}):`, error);
            return {
                success: false,
                error: error.message || 'Failed to fetch location metric.',
            };
        }
    },

    // Transform location data for map visualization
    transformLocationData: (locationDataObj, metricType = 'cases') => {
        try {
            if (!locationDataObj || typeof locationDataObj !== 'object') {
                return [];
            }

            return Object.entries(locationDataObj).map(([locationName, count]) => ({
                name: locationName,
                value: count,
                type: metricType
            })).sort((a, b) => b.value - a.value);
        } catch (error) {
            console.error('Error transforming location data:', error);
            return [];
        }
    },
};

export default analyticsService;
