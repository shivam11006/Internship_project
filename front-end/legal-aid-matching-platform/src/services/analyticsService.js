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

    // Get location analytics with role-based distribution
    getLocationAnalytics: async () => {
        try {
            // Fetch all analytics data to get location breakdowns and user role totals
            const [overviewRes, usersRes, casesRes, matchesRes, activityRes] = await Promise.all([
                apiClient.get('/analytics/overview'),
                apiClient.get('/analytics/users'),
                apiClient.get('/analytics/cases'),
                apiClient.get('/analytics/matches'),
                apiClient.get('/analytics/activity')
            ]);

            const overview = overviewRes.data;
            const users = usersRes.data;
            const cases = casesRes.data;
            const matches = matchesRes.data;
            const activity = activityRes.data;

            // Get user role totals from overview
            const usersByRole = overview.usersByRole || { CITIZEN: 0, LAWYER: 0, NGO: 0, ADMIN: 0 };
            const totalUsers = overview.totalUsers || 1; // Avoid division by zero

            // Calculate role distribution percentages
            const lawyerRatio = (usersByRole.LAWYER || 0) / totalUsers;
            const ngoRatio = (usersByRole.NGO || 0) / totalUsers;

            // Get location data from different endpoints
            const usersByLocation = users.usersByLocation || {};
            const casesByLocation = cases.casesByLocation || {};
            const matchesByLocation = matches.matchesByLocation || {};
            const activityByLocation = activity.activityByLocation || {};

            // Build result with role distribution applied to user locations
            const lawyersByLocation = {};
            const ngosByLocation = {};

            // Distribute users by role for each location
            Object.entries(usersByLocation).forEach(([location, totalCount]) => {
                lawyersByLocation[location] = Math.round(totalCount * lawyerRatio);
                ngosByLocation[location] = Math.round(totalCount * ngoRatio);
            });

            // Get top locations (highest case count)
            const topLocations = Object.entries(casesByLocation)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([location]) => location);

            return {
                success: true,
                data: {
                    cases: casesByLocation,
                    lawyers: lawyersByLocation,
                    ngos: ngosByLocation,
                    topLocations: topLocations
                }
            };
        } catch (error) {
            console.error('Error fetching location analytics:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch location analytics.'
            };
        }
    }
};

export default analyticsService;
