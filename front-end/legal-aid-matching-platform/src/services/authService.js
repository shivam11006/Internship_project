import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
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

      // Block login for pending lawyers and NGOs
      if ((user.role === 'LAWYER' || user.role === 'NGO') && user.approvalStatus === 'PENDING') {
        // Clear tokens if not approved
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return {
          success: false,
          error: 'Your account is pending admin approval. Please wait for approval before logging in.'
        };
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
      delete updateData.phone;
      
      const response = await apiClient.put('/profile/update', updateData);
      
      // Update stored user data
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...response.data };
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
};

export default authService;
