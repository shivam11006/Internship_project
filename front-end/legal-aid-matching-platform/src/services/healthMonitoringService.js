/**
 * Health Monitoring Service
 * Fetches and manages system health data from the backend
 */

const API_BASE_URL = 'http://localhost:8080';

const healthMonitoringService = {
  /**
   * Fetch overall system health status
   */
  getSystemHealth: async (token, signal = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system health: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        return { status: 'UNKNOWN' };
      }

      return JSON.parse(text);
    } catch (error) {
      // Don't log AbortError as it's normal when requests are cancelled
      if (error.name !== 'AbortError') {
        console.error('Error fetching system health:', error);
      }
      return { status: 'DOWN' };
    }
  },

  /**
   * Fetch database health status
   */
  getDatabaseHealth: async (token, signal = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/database`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch database health: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        return {
          status: 'UNKNOWN',
          details: {
            database: 'PostgreSQL',
            status: 'No response',
            connectionValid: false
          }
        };
      }

      return JSON.parse(text);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching database health:', error);
      }
      return {
        status: 'DOWN',
        details: {
          database: 'PostgreSQL',
          status: 'Connection error',
          connectionValid: false
        }
      };
    }
  },

  /**
   * Fetch application health status (Memory, CPU)
   */
  getApplicationHealth: async (token, signal = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/application`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch application health: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        return {
          status: 'UNKNOWN',
          details: {
            heapUsagePercent: '0%',
            cpuUsagePercent: '0%',
            heapUsedMB: 0,
            heapMaxMB: 0,
            availableProcessors: 0
          }
        };
      }

      return JSON.parse(text);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching application health:', error);
      }
      return {
        status: 'DOWN',
        details: {
          heapUsagePercent: '0%',
          cpuUsagePercent: '0%',
          heapUsedMB: 0,
          heapMaxMB: 0,
          availableProcessors: 0
        }
      };
    }
  },

  /**
   * Fetch system info
   */
  getSystemInfo: async (token, signal = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system info: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        return {
          timestamp: new Date().toISOString(),
          javaVersion: 'Unknown',
          osName: 'Unknown',
          osVersion: 'Unknown',
          processors: 0,
          maxMemory: 0,
          totalMemory: 0,
          freeMemory: 0
        };
      }

      return JSON.parse(text);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching system info:', error);
      }
      return {
        timestamp: new Date().toISOString(),
        javaVersion: 'Unknown',
        osName: 'Unknown',
        osVersion: 'Unknown',
        processors: 0,
        maxMemory: 0,
        totalMemory: 0,
        freeMemory: 0
      };
    }
  },

  /**
   * Fetch available metrics
   */
  getAvailableMetrics: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics list: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics list:', error);
      return { names: [] };
    }
  },

  /**
   * Fetch specific metric data
   */
  getMetric: async (token, metricName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/metrics/${metricName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metric ${metricName}: ${response.statusText}`);
      }

      const text = await response.text();
      if (!text) {
        return { name: metricName, value: 0 };
      }

      return JSON.parse(text);
    } catch (error) {
      console.error(`Error fetching metric ${metricName}:`, error);
      return { name: metricName, value: 0 };
    }
  },

  /**
   * Fetch multiple metrics at once
   */
  getMultipleMetrics: async (token, metricNames) => {
    try {
      const promises = metricNames.map(name => 
        healthMonitoringService.getMetric(token, name)
          .catch(error => ({
            name,
            error: error.message,
            value: 0
          }))
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error fetching multiple metrics:', error);
      return [];
    }
  },

  /**
   * Simple ping to check if health endpoint is available
   */
  ping: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/health/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error pinging health endpoint:', error);
      return false;
    }
  }
};

export default healthMonitoringService;
