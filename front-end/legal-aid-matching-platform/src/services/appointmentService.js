import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

class AppointmentService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to include JWT token in requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment details
   * @param {number} appointmentData.matchId - ID of the accepted match
   * @param {string} appointmentData.scheduledDateTime - ISO format datetime (e.g., "2026-01-15T10:00:00")
   * @param {string} appointmentData.appointmentTime - Time in HH:mm:ss format (optional)
   * @param {string} appointmentData.appointmentType - 'CALL' or 'OFFLINE'
   * @param {string} [appointmentData.venue] - Required for OFFLINE appointments
   * @param {string} [appointmentData.meetingLink] - Phone number or meeting link (required for CALL)
   * @param {number} appointmentData.durationMinutes - Meeting duration in minutes
   * @param {string} [appointmentData.location] - General location/area (optional)
   * @param {string} [appointmentData.address] - Full address (optional)
   * @param {string} [appointmentData.notes] - Additional notes (optional)
   * @param {string} [appointmentData.agenda] - Meeting agenda (optional)
   * @returns {Promise<Object>} Created appointment response
   */
  async createAppointment(appointmentData) {
    try {
      const response = await this.axiosInstance.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all appointments for the current user
   * @returns {Promise<Array>} List of appointments
   */
  async getMyAppointments() {
    try {
      const response = await this.axiosInstance.get('/appointments/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get upcoming appointments (future appointments with active statuses)
   * @returns {Promise<Array>} List of upcoming appointments
   */
  async getUpcomingAppointments() {
    try {
      const response = await this.axiosInstance.get('/appointments/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get past appointments
   * @returns {Promise<Array>} List of past appointments
   */
  async getPastAppointments() {
    try {
      const response = await this.axiosInstance.get('/appointments/past');
      return response.data;
    } catch (error) {
      console.error('Error fetching past appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get pending appointments (requiring user action)
   * @returns {Promise<Array>} List of pending appointments
   */
  async getPendingAppointments() {
    try {
      const response = await this.axiosInstance.get('/appointments/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get appointment by ID
   * @param {number} id - Appointment ID
   * @returns {Promise<Object>} Appointment details
   */
  async getAppointmentById(id) {
    try {
      const response = await this.axiosInstance.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get appointments for a specific case
   * @param {number} caseId - Case ID
   * @returns {Promise<Array>} List of appointments for the case
   */
  async getAppointmentsByCase(caseId) {
    try {
      const response = await this.axiosInstance.get(`/appointments/case/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching case appointments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update appointment details
   * @param {number} id - Appointment ID
   * @param {Object} updates - Updated appointment details
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(id, updates) {
    try {
      const response = await this.axiosInstance.put(`/appointments/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Citizen accepts an appointment created by provider
   * @param {number} id - Appointment ID
   * @returns {Promise<Object>} Updated appointment with CONFIRMED status
   */
  async confirmAppointment(id) {
    try {
      const response = await this.axiosInstance.post(`/appointments/${id}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Provider accepts an appointment created by citizen
   * @param {number} id - Appointment ID
   * @returns {Promise<Object>} Updated appointment with CONFIRMED status
   */
  async acceptAppointment(id) {
    try {
      const response = await this.axiosInstance.post(`/appointments/${id}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Request to reschedule an appointment
   * @param {number} id - Appointment ID
   * @param {Object} rescheduleData
   * @param {string} rescheduleData.preferredDateTime - New preferred datetime
   * @param {string} rescheduleData.reason - Reason for reschedule
   * @param {string} rescheduleData.message - Optional message
   * @returns {Promise<Object>} Updated appointment
   */
  async requestReschedule(id, rescheduleData) {
    try {
      const response = await this.axiosInstance.post(`/appointments/${id}/request-reschedule`, rescheduleData);
      return response.data;
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel an appointment
   * @param {number} id - Appointment ID
   * @param {string} cancellationReason - Reason for cancellation
   * @returns {Promise<Object>} Updated appointment
   */
  async cancelAppointment(id, cancellationReason) {
    try {
      const response = await this.axiosInstance.post(`/appointments/${id}/cancel`, {
        cancellationReason
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark appointment as completed
   * @param {number} id - Appointment ID
   * @param {string} completionNotes - Optional completion notes
   * @returns {Promise<Object>} Updated appointment
   */
  async completeAppointment(id, completionNotes = '') {
    try {
      const response = await this.axiosInstance.post(`/appointments/${id}/complete`, {
        completionNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark appointment as no-show
   * @param {number} id - Appointment ID
   * @param {string} notes - Notes about the no-show
   * @returns {Promise<Object>} Updated appointment
   */
  async markNoShow(id, notes = '') {
    try {
      const response = await this.axiosInstance.post(`/appointments/${id}/no-show`, {
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error marking no-show:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @private
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AppointmentService();
