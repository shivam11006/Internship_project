import { apiClient } from './authService';

const CASES_API_BASE = '/cases';

/**
 * Get case details by ID
 * @param {number} caseId - The case ID
 * @returns {Promise} - Response containing case details
 */
export const getCaseById = async (caseId) => {
    try {
        const response = await apiClient.get(
            `${CASES_API_BASE}/${caseId}`
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching case details for ID ${caseId}:`, error);
        throw error;
    }
};

export default {
    getCaseById
};
