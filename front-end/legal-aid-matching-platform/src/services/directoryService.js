import { apiClient } from './authService';

const directoryService = {
  // Preview CSV before importing
  previewCsv: async (file, role) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', role);

      const response = await apiClient.post(
        '/admin/import/preview',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to preview CSV file. Please try again.',
      };
    }
  },

  // Quick import lawyers (auto-detect mappings)
  quickImportLawyers: async (file, defaultPassword = 'lawyer123', autoApprove = true) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('defaultPassword', defaultPassword);
      formData.append('autoApprove', autoApprove);

      const response = await apiClient.post(
        '/admin/import/lawyers/quick',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to import lawyers. Please try again.',
      };
    }
  },

  // Quick import NGOs (auto-detect mappings)
  quickImportNgos: async (file, defaultPassword = 'ngo123', autoApprove = true) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('defaultPassword', defaultPassword);
      formData.append('autoApprove', autoApprove);

      const response = await apiClient.post(
        '/admin/import/ngos/quick',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to import NGOs. Please try again.',
      };
    }
  },

  // Advanced import lawyers with custom field mapping
  importLawyersWithMapping: async (rows, fieldMapping, defaultPassword = 'lawyer123', autoApprove = true) => {
    try {
      const request = {
        rows,
        mapping: {
          fieldMapping: fieldMapping || {}
        },
        role: 'LAWYER',
        defaultPassword,
        autoApprove,
        generateEmails: true,
      };

      const response = await apiClient.post(
        '/admin/import/lawyers',
        request
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to import lawyers with custom mapping. Please try again.',
      };
    }
  },

  // Advanced import NGOs with custom field mapping
  importNgosWithMapping: async (rows, fieldMapping, defaultPassword = 'ngo123', autoApprove = true) => {
    try {
      const request = {
        rows,
        mapping: {
          fieldMapping: fieldMapping || {}
        },
        role: 'NGO',
        defaultPassword,
        autoApprove,
        generateEmails: true,
      };

      const response = await apiClient.post(
        '/admin/import/ngos',
        request
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to import NGOs with custom mapping. Please try again.',
      };
    }
  },

  // Search lawyers in directory
  searchLawyers: async (searchRequest) => {
    try {
      const response = await apiClient.post(
        '/directory/lawyers/search',
        searchRequest
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search lawyers. Please try again.',
      };
    }
  },

  // Search NGOs in directory
  searchNgos: async (searchRequest) => {
    try {
      const response = await apiClient.post(
        '/directory/ngos/search',
        searchRequest
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search NGOs. Please try again.',
      };
    }
  },

  // Get lawyer details by ID
  getLawyerById: async (userId) => {
    try {
      const response = await apiClient.get(
        `/directory/lawyers/${userId}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch lawyer details. Please try again.',
      };
    }
  },

  // Get NGO details by ID
  getNgoById: async (userId) => {
    try {
      const response = await apiClient.get(
        `/directory/ngos/${userId}`
      );

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch NGO details. Please try again.',
      };
    }
  },
};

export default directoryService;
