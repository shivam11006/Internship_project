import { apiClient } from './authService';

const MATCHES_API_BASE = '/matches';

/**
 * Generate matches for a case
 * @param {number} caseId - The case ID
 * @returns {Promise} - Response containing generated matches
 */
export const generateMatches = async (caseId) => {
  try {
    const response = await apiClient.post(
      `${MATCHES_API_BASE}/case/${caseId}/generate`
    );
    return response.data;
  } catch (error) {
    console.error('Error generating matches:', error);
    throw error;
  }
};

/**
 * Get match results for a case
 * @param {number} caseId - The case ID
 * @returns {Promise} - Response containing match results
 */
export const getMatchResults = async (caseId) => {
  try {
    const response = await apiClient.get(
      `${MATCHES_API_BASE}/case/${caseId}/results`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching match results:', error);
    throw error;
  }
};

/**
 * Get detailed matches for a case
 * @param {number} caseId - The case ID
 * @returns {Promise} - Response containing detailed matches
 */
export const getMatchesForCase = async (caseId) => {
  try {
    const response = await apiClient.get(
      `${MATCHES_API_BASE}/case/${caseId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching matches for case:', error);
    throw error;
  }
};

/**
 * Select a match (citizen action)
 * @param {number} matchId - The match ID
 * @returns {Promise} - Response from selecting the match
 */
export const selectMatch = async (matchId) => {
  try {
    const response = await apiClient.post(
      `${MATCHES_API_BASE}/${matchId}/select`
    );
    return response.data;
  } catch (error) {
    console.error('Error selecting match:', error);
    throw error;
  }
};

/**
 * Reject a match (citizen action)
 * @param {number} matchId - The match ID
 * @param {string} reason - Optional reason for rejection
 * @returns {Promise} - Response from rejecting the match
 */
export const rejectMatch = async (matchId, reason = null) => {
  try {
    const request = reason ? { reason } : {};
    const response = await apiClient.post(
      `${MATCHES_API_BASE}/${matchId}/reject`,
      request
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting match:', error);
    throw error;
  }
};

/** * Get all matches for current citizen
 * @returns {Promise} - Response containing all matches
 */
export const getMyMatches = async () => {
  try {
    const response = await apiClient.get(
      `${MATCHES_API_BASE}/my`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching my matches:', error);
    throw error;
  }
};

/** * Get assigned cases for a lawyer/NGO
 * @returns {Promise} - Response containing assigned cases
 */
export const getAssignedCases = async () => {
  try {
    const response = await apiClient.get(
      `${MATCHES_API_BASE}/assigned-cases`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching assigned cases:', error);
    throw error;
  }
};

/**
 * Accept a case assignment (lawyer/NGO action)
 * @param {number} matchId - The match ID
 * @returns {Promise} - Response from accepting the assignment
 */
export const acceptCaseAssignment = async (matchId) => {
  try {
    const response = await apiClient.post(
      `${MATCHES_API_BASE}/${matchId}/accept-assignment`
    );
    return response.data;
  } catch (error) {
    console.error('Error accepting case assignment:', error);
    throw error;
  }
};

/**
 * Decline a case assignment (lawyer/NGO action)
 * @param {number} matchId - The match ID
 * @param {string} reason - Optional reason for decline
 * @returns {Promise} - Response from declining the assignment
 */
export const declineCaseAssignment = async (matchId, reason = null) => {
  try {
    const request = reason ? { reason } : {};
    const response = await apiClient.post(
      `${MATCHES_API_BASE}/${matchId}/decline-assignment`,
      request
    );
    return response.data;
  } catch (error) {
    console.error('Error declining case assignment:', error);
    throw error;
  }
};

export default {
  generateMatches,
  getMatchResults,
  getMatchesForCase,
  selectMatch,
  rejectMatch,
  getAssignedCases,
  acceptCaseAssignment,
  declineCaseAssignment,
};
