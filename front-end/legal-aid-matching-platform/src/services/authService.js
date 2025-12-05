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
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem('accessToken', token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
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
      const response = await apiClient.post('/users/register', {
        username: userData.fullName,
        email: userData.email,
        password: userData.password,
        role: userData.role.toUpperCase() // CITIZEN, LAWYER, NGO
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  },

  // Login - TEMPORARY workaround since backend doesn't return password in UserResponse
  // Backend team needs to implement POST /api/auth/login endpoint with proper password verification
  login: async (credentials) => {
    try {
      console.log('Login attempt for:', credentials.email);
      
      // Get user by email - just checking if user exists
      const response = await apiClient.get(`/users/email/${credentials.email}`);
      const user = response.data;
      
      console.log('User found:', user);

      // TEMPORARY: Since backend doesn't return password and no /auth/login endpoint exists,
      // we allow any login if user exists. Backend MUST implement proper authentication!
      if (user) {
        // Simulate JWT token (until backend implements proper JWT)
        const fakeToken = btoa(JSON.stringify({ email: user.email, role: user.role, exp: Date.now() + 86400000 }));
        
        // Store token and user info
        localStorage.setItem('accessToken', fakeToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');

        console.log('Login successful for:', user.role);
        return { success: true, data: user };
      } else {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.status === 404 ? 'Invalid email or password' : 'Login failed. Please try again.',
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
      const response = await apiClient.put('/profile/update', profileData);
      
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
};

export default authService;
