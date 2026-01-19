import { apiClient } from './authService';

// Configuration
const ANALYTICS_CONFIG = {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // milliseconds
    TIMEOUT: 30000, // milliseconds
    CACHE_DURATION: 60000 // milliseconds (1 minute)
};

// Cache for analytics data
let analyticsCache = {
    data: null,
    timestamp: null
};

// Utility function for retries with exponential backoff
const retryWithBackoff = async (fn, attempts = ANALYTICS_CONFIG.RETRY_ATTEMPTS, delay = ANALYTICS_CONFIG.RETRY_DELAY) => {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < attempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
};

// Utility function to validate analytics data structure
const validateAnalyticsData = (data) => {
    if (!data) return { valid: false, error: 'No data received' };
    
    const requiredFields = ['overview', 'users', 'cases', 'matches', 'activity'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        console.warn('Analytics data missing fields:', missingFields);
        // Don't fail if some data is missing, just log warning
    }
    
    return { valid: true };
};

// Cache utility
const isCacheValid = () => {
    if (!analyticsCache.data || !analyticsCache.timestamp) return false;
    return Date.now() - analyticsCache.timestamp < ANALYTICS_CONFIG.CACHE_DURATION;
};

const setCacheData = (data) => {
    analyticsCache = {
        data,
        timestamp: Date.now()
    };
};

const getCacheData = () => {
    return analyticsCache.data;
};

const analyticsService = {
    // Get all analytics data by combining multiple endpoints with retry logic and caching
    getAllAnalytics: async (forceRefresh = false, dateRange = null) => {
        try {
            // Return cached data if valid and not forcing refresh (ignore cache for date range queries)
            if (!forceRefresh && !dateRange && isCacheValid()) {
                console.info('Returning cached analytics data');
                return { 
                    success: true, 
                    data: getCacheData(),
                    fromCache: true
                };
            }

            // Build query parameters if date range is provided
            const queryParams = new URLSearchParams();
            if (dateRange?.startDate) {
                queryParams.append('startDate', dateRange.startDate);
            }
            if (dateRange?.endDate) {
                queryParams.append('endDate', dateRange.endDate);
            }

            // Fetch all analytics data from separate endpoints with retry
            const results = await retryWithBackoff(async () => {
                const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
                return await Promise.all([
                    apiClient.get(`/analytics/overview${queryString}`),
                    apiClient.get(`/analytics/users${queryString}`),
                    apiClient.get(`/analytics/cases${queryString}`),
                    apiClient.get(`/analytics/matches${queryString}`),
                    apiClient.get(`/analytics/activity${queryString}`)
                ]);
            });

            const [overviewRes, usersRes, casesRes, matchesRes, activityRes] = results;
            
            // Combine all the data
            const combinedData = {
                overview: overviewRes.data,
                users: usersRes.data,
                cases: casesRes.data,
                matches: matchesRes.data,
                activity: activityRes.data
            };

            // Validate data structure
            const validation = validateAnalyticsData(combinedData);
            if (!validation.valid) {
                console.warn('Analytics data validation warning:', validation.error);
            }

            // Only cache if no date range was applied
            if (!dateRange) {
                setCacheData(combinedData);
            }

            return { 
                success: true, 
                data: combinedData,
                fromCache: false,
                dateRange: dateRange || null
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            
            // Return cached data if available, even if it's stale (only if no date range)
            if (!dateRange) {
                const cachedData = getCacheData();
                if (cachedData) {
                    console.warn('Returning stale cached analytics data due to fetch error');
                    return {
                        success: true,
                        data: cachedData,
                        fromCache: true,
                        stale: true,
                        warning: 'Data may be outdated due to connection issues'
                    };
                }
            }

            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Failed to fetch analytics data. Please try again.',
                timestamp: new Date().toISOString()
            };
        }
    },


    // Get overview analytics
    getOverviewAnalytics: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/overview'));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching overview analytics:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to fetch overview analytics.' 
            };
        }
    },

    // Get users analytics
    getUsersAnalytics: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/users'));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching users analytics:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to fetch users analytics.' 
            };
        }
    },

    // Get cases analytics
    getCasesAnalytics: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/cases'));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching cases analytics:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to fetch cases analytics.' 
            };
        }
    },

    // Get matches analytics
    getMatchesAnalytics: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/matches'));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching matches analytics:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to fetch matches analytics.' 
            };
        }
    },

    // Get activity analytics
    getActivityAnalytics: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/activity'));
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching activity analytics:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message || 'Failed to fetch activity analytics.' 
            };
        }
    },

    // Get location analytics with role-based distribution
    getLocationAnalytics: async () => {
        try {
            // Fetch all analytics data to get location breakdowns and user role totals with retry
            const results = await retryWithBackoff(async () => {
                return await Promise.all([
                    apiClient.get('/analytics/overview'),
                    apiClient.get('/analytics/users'),
                    apiClient.get('/analytics/cases'),
                    apiClient.get('/analytics/matches'),
                    apiClient.get('/analytics/activity')
                ]);
            });

            const [overviewRes, usersRes, casesRes, matchesRes, activityRes] = results;

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
                error: error.response?.data?.error || error.message || 'Failed to fetch location analytics.'
            };
        }
    },

    // Cache management utilities
    clearCache: () => {
        analyticsCache = {
            data: null,
            timestamp: null
        };
        console.info('Analytics cache cleared');
    },

    // Get current cache status
    getCacheStatus: () => {
        return {
            isCached: analyticsCache.data !== null,
            isValid: isCacheValid(),
            cachedAt: analyticsCache.timestamp ? new Date(analyticsCache.timestamp).toISOString() : null,
            expiresIn: analyticsCache.timestamp ? Math.max(0, ANALYTICS_CONFIG.CACHE_DURATION - (Date.now() - analyticsCache.timestamp)) : null
        };
    },

    // Convenience methods for individual analytics categories (used by DashboardAdmin)
    getOverview: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/overview'));
            return response.data;
        } catch (error) {
            console.error('Error fetching overview analytics:', error);
            throw error;
        }
    },

    getUsers: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/users'));
            return response.data;
        } catch (error) {
            console.error('Error fetching users analytics:', error);
            throw error;
        }
    },

    getCases: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/cases'));
            return response.data;
        } catch (error) {
            console.error('Error fetching cases analytics:', error);
            throw error;
        }
    },

    getMatches: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/matches'));
            return response.data;
        } catch (error) {
            console.error('Error fetching matches analytics:', error);
            throw error;
        }
    },

    getActivity: async () => {
        try {
            const response = await retryWithBackoff(() => apiClient.get('/analytics/activity'));
            return response.data;
        } catch (error) {
            console.error('Error fetching activity analytics:', error);
            throw error;
        }
    }
};

export default analyticsService;
