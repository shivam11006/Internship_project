import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/users';

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
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

  // Get user by email (for login simulation)
  getUserByEmail: async (email) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/email/${email}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'User not found'
      };
    }
  },

  // Login (using getUserByEmail and password check on frontend)
  login: async (credentials) => {
    try {
      // Get user by email
      const result = await authService.getUserByEmail(credentials.email);
      
      if (!result.success) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const user = result.data;
      
      // Note: In production, password validation should be on backend
      // This is temporary until backend implements /login endpoint
      if (user.email === credentials.email) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        
        return { success: true, data: { user } };
      } else {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  },

  // Logout
  logout: () => {
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
    return localStorage.getItem('isAuthenticated') === 'true';
  }
};

export default authService;
