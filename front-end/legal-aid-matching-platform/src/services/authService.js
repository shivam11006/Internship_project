import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
apiClient.interceptors.request.use(
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

// Response interceptor - Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken: refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        authService.logout();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const registerData = {
        username: userData.fullName,
        email: userData.email,
        password: userData.password,
        role: userData.role.toUpperCase() // CITIZEN, LAWYER, NGO, ADMIN
      };

      // Add common fields for all roles
      if (userData.address) registerData.address = userData.address;
      if (userData.location) registerData.location = userData.location;
      if (userData.languages) registerData.languages = userData.languages;

      // Add role-specific fields if provided
      if (userData.role.toUpperCase() === 'LAWYER') {
        if (userData.specialization) registerData.specialization = userData.specialization;
        if (userData.barNumber) registerData.barNumber = userData.barNumber;
      } else if (userData.role.toUpperCase() === 'NGO') {
        if (userData.organizationName) registerData.organizationName = userData.organizationName;
        if (userData.registrationNumber) registerData.registrationNumber = userData.registrationNumber;
        if (userData.focusArea) registerData.focusArea = userData.focusArea;
      }

      const response = await apiClient.post('/auth/register', registerData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  },

  // Login with proper JWT authentication
  login: async (credentials) => {
    try {
      console.log('Login attempt for:', credentials.email);

      // Call backend login endpoint
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });

      const data = response.data;
      console.log('Login response:', data);

      // Store tokens temporarily to make authenticated request
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Fetch full user profile including approval status
      const profileResponse = await apiClient.get('/profile/me');
      const user = profileResponse.data;

      console.log('User profile:', user);

      // Block login for non-approved users
      if (user.role === 'LAWYER' || user.role === 'NGO') {
        if (user.approvalStatus === 'PENDING') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return {
            success: false,
            error: 'Your account is pending admin approval. Please wait for approval before logging in.'
          };
        }

        if (user.approvalStatus === 'REAPPROVAL_PENDING') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return {
            success: false,
            error: 'Your profile changes are pending admin approval. Please wait for re-approval before logging in.'
          };
        }

        if (user.approvalStatus === 'SUSPENDED') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return {
            success: false,
            error: 'Your account has been suspended. Please contact support for assistance.'
          };
        }

        if (user.approvalStatus === 'REJECTED') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return {
            success: false,
            error: 'Your account registration was rejected. Please contact support for more information.'
          };
        }
      }

      // Store user info
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus
      }));
      localStorage.setItem('isAuthenticated', 'true');

      console.log('Login successful for:', user.role);
      return { success: true, data: user };
    } catch (error) {
      console.error('Login error:', error);
      // Clear any tokens that might have been set
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid email or password'
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    return token && isAuth;
  },

  // Validate token (simple check)
  validateToken: async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || !refreshToken) {
      return false;
    }

    // Check if token is expired by decoding JWT
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();

      // If token is still valid, return true
      if (expirationTime > currentTime) {
        return true;
      }

      // Token expired, return false
      return false;
    } catch (error) {
      return false;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      // Map frontend fields to backend fields
      const updateData = { ...profileData };

      // For lawyers: licenseNumber maps to barNumber in backend
      if (profileData.licenseNumber) {
        updateData.barNumber = profileData.licenseNumber;
        delete updateData.licenseNumber;
      }

      // Remove yearsOfExperience and yearsActive as they're not in backend yet
      delete updateData.yearsOfExperience;
      delete updateData.yearsActive;

      const response = await apiClient.put('/profile/update', updateData);
      const responseData = response.data;

      // Check if response indicates reapproval is needed
      if (responseData.requiresApproval || responseData.message) {
        // Profile update requires admin approval
        const profileData = responseData.profile || responseData;
        const currentUser = authService.getCurrentUser();
        const updatedUser = {
          ...currentUser,
          ...profileData,
          approvalStatus: profileData.approvalStatus
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        return {
          success: true,
          data: updatedUser,
          requiresApproval: true,
          message: responseData.message || 'Profile changes are pending admin approval.'
        };
      }

      // Normal update without approval needed
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...responseData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, data: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile',
      };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile/me');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  },

  // Admin APIs for managing users
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  },

  approveUser: async (userId) => {
    try {
      const response = await apiClient.post(`/admin/approve/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Approve user error:', error);
      throw error;
    }
  },

  rejectUser: async (userId) => {
    try {
      const response = await apiClient.post(`/admin/reject/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Reject user error:', error);
      throw error;
    }
  },

  suspendUser: async (userId) => {
    try {
      const response = await apiClient.post(`/admin/suspend/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Suspend user error:', error);
      throw error;
    }
  },

  reactivateUser: async (userId) => {
    try {
      const response = await apiClient.post(`/admin/reactivate/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Reactivate user error:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  // Get user details by ID
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/profile/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch user details',
      };
    }
  },
};

export default authService;
