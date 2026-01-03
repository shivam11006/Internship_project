import { apiClient } from './authService';

/**
 * Match Service for handling all match-related API calls
 */
const matchService = {

    /**
     * Trigger match generation for a specific case (Citizen)
     * POST /api/matches/case/{caseId}/generate
     */
    generateMatches: async (caseId) => {
        try {
            const response = await apiClient.post(`/matches/case/${caseId}/generate`);
            return response.data;
        } catch (error) {
            console.error(`Error generating matches for case ${caseId}:`, error);
            throw error;
        }
    },

    /**
     * Get match results for a case (Citizen)
     * GET /api/matches/case/{caseId}/results
     */
    getMatchResults: async (caseId) => {
        try {
            const response = await apiClient.get(`/matches/case/${caseId}/results`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching match results for case ${caseId}:`, error);
            throw error;
        }
    },

    /**
     * Get detailed matches for a case (Citizen)
     * GET /api/matches/case/{caseId}
     */
    getMatchesForCase: async (caseId) => {
        try {
            const response = await apiClient.get(`/matches/case/${caseId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching matches for case ${caseId}:`, error);
            throw error;
        }
    },

    /**
     * Select a match (Citizen)
     * POST /api/matches/{matchId}/select
     */
    selectMatch: async (matchId) => {
        try {
            const response = await apiClient.post(`/matches/${matchId}/select`);
            return response.data;
        } catch (error) {
            console.error(`Error selecting match ${matchId}:`, error);
            throw error;
        }
    },

    /**
     * Reject a match (Citizen)
     * POST /api/matches/{matchId}/reject
     */
    rejectMatch: async (matchId, reason) => {
        try {
            const response = await apiClient.post(`/matches/${matchId}/reject`, { reason });
            return response.data;
        } catch (error) {
            console.error(`Error rejecting match ${matchId}:`, error);
            throw error;
        }
    },

    /**
     * Get assigned cases (Lawyer/NGO)
     * GET /api/matches/assigned-cases
     */
    getAssignedCases: async () => {
        try {
            const response = await apiClient.get('/matches/assigned-cases');
            return response.data;
        } catch (error) {
            console.error('Error fetching assigned cases:', error);
            throw error;
        }
    },

    /**
     * Accept case assignment (Lawyer/NGO)
     * POST /api/matches/{matchId}/accept-assignment
     */
    acceptAssignment: async (matchId) => {
        try {
            const response = await apiClient.post(`/matches/${matchId}/accept-assignment`);
            return response.data;
        } catch (error) {
            console.error(`Error accepting assignment ${matchId}:`, error);
            throw error;
        }
    },

    /**
     * Decline case assignment (Lawyer/NGO)
     * POST /api/matches/{matchId}/decline-assignment
     */
    declineAssignment: async (matchId, reason) => {
        try {
            const response = await apiClient.post(`/matches/${matchId}/decline-assignment`, { reason });
            return response.data;
        } catch (error) {
            console.error(`Error declining assignment ${matchId}:`, error);
            throw error;
        }
    }
};

// Export individual functions for easier destructuring or * as matchService import
export const {
    generateMatches,
    getMatchResults,
    getMatchesForCase,
    selectMatch,
    rejectMatch,
    getAssignedCases,
    acceptAssignment,
    declineAssignment
} = matchService;

export default matchService;
