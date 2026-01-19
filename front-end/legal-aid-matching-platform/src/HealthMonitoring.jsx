import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import healthMonitoringService from './services/healthMonitoringService';
import './HealthMonitoring.css';

const HealthMonitoring = ({ token }) => {
  // Health data states
  const [systemHealth, setSystemHealth] = useState(null);
  const [databaseHealth, setDatabaseHealth] = useState(null);
  const [applicationHealth, setApplicationHealth] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

  // Metrics history for charts
  const [metricsHistory, setMetricsHistory] = useState({
    heapMemory: [],
    cpuUsage: [],
    threads: []
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refresh controls
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshInterval, setRefreshInterval] = useState(5000); // Default 5 seconds (in ms)

  // Max history points to keep in memory
  const MAX_HISTORY = 60; // Keep 60 data points (5 minutes at 5-second refresh)

  // Abort controller for cancelling requests
  const abortControllerRef = useRef(null);

  /**
   * Fetch all health data
   */
  const fetchAllHealthData = useCallback(async () => {
    if (!token) {
      setError('Authentication token is missing');
      return;
    }

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // Fetch all health data in parallel with abort signal
      const [health, db, app, info] = await Promise.all([
        healthMonitoringService.getSystemHealth(token, abortControllerRef.current.signal),
        healthMonitoringService.getDatabaseHealth(token, abortControllerRef.current.signal),
        healthMonitoringService.getApplicationHealth(token, abortControllerRef.current.signal),
        healthMonitoringService.getSystemInfo(token, abortControllerRef.current.signal)
      ]);

      setSystemHealth(health);
      setDatabaseHealth(db);
      setApplicationHealth(app);
      setSystemInfo(info);

      // Update metrics history
      if (app && app.details) {
        const timestamp = new Date().toLocaleTimeString();
        
        setMetricsHistory(prev => ({
          heapMemory: [
            ...prev.heapMemory.slice(-MAX_HISTORY + 1),
            {
              time: timestamp,
              used: app.details.heapUsedMB || 0,
              max: app.details.heapMaxMB || 0
            }
          ],
          cpuUsage: [
            ...prev.cpuUsage.slice(-MAX_HISTORY + 1),
            {
              time: timestamp,
              cpu: parseFloat(app.details.cpuUsagePercent) || 0
            }
          ],
          threads: [
            ...prev.threads.slice(-MAX_HISTORY + 1),
            {
              time: timestamp,
              count: Math.random() * 100 // Placeholder - would need actual thread count metric
            }
          ]
        }));
      }

      setLastUpdate(new Date());
    } catch (err) {
      // Don't set error if request was aborted (normal behavior)
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch health data');
        console.error('Health monitoring error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Set up auto-refresh with configurable interval
   */
  useEffect(() => {
    if (!isAutoRefresh || !token) return;

    // Fetch immediately on mount
    fetchAllHealthData();

    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      fetchAllHealthData();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      // Cancel any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAutoRefresh, token, refreshInterval, fetchAllHealthData]);

  /**
   * Handle manual refresh
   */
  const handleManualRefresh = async () => {
    await fetchAllHealthData();
  };

  /**
   * Get health status color
   */
  const getHealthStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#dc2626';
      case 'out_of_service':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  /**
   * Get health status icon
   */
  const getHealthStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'up':
        return '✓';
      case 'down':
        return '✕';
      case 'out_of_service':
        return '⚠';
      default:
        return '?';
    }
  };

  /**
   * Parse percentage string to number
   */
  const parsePercentage = (str) => {
    if (typeof str === 'number') return str;
    return parseFloat(str?.replace('%', '') || 0);
  };

  return (
    <div className="health-monitoring-container">
      {/* Header */}
      <div className="health-header">
        <div className="health-title-section">
          <h2 className="health-title">System Health Monitoring</h2>
          <p className="health-subtitle">Real-time system metrics and diagnostics</p>
        </div>

        <div className="health-controls">
          <div className="refresh-indicator">
            <span className={`status-dot ${isAutoRefresh ? 'active' : 'inactive'}`}></span>
            <span className="status-text">
              {isAutoRefresh ? 'Live' : 'Paused'} • Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          <div className="refresh-rate-control">
            <label htmlFor="refresh-interval">Refresh Rate:</label>
            <select 
              id="refresh-interval"
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="refresh-rate-select"
              disabled={!isAutoRefresh}
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={15000}>15 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>

          <div className="control-buttons">
            <button
              className="btn-refresh"
              onClick={handleManualRefresh}
              disabled={isLoading || isAutoRefresh}
              title={isAutoRefresh ? "Live stats - pause to manually refresh" : "Refresh now"}
            >
              {isAutoRefresh ? '📊 Live stats' : '🔄 Refresh'}
            </button>

            <button
              className={`btn-auto-refresh ${isAutoRefresh ? 'active' : ''}`}
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              title={isAutoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
            >
              {isAutoRefresh ? '⏸ Pause' : '▶ Resume'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Health Status KPI Cards */}
      <div className="health-kpi-grid">
        {/* Overall System Health */}
        <div className="health-kpi-card system-card">
          <div className="kpi-header">
            <h3>Overall System Status</h3>
            <span className="status-badge" style={{
              background: systemHealth?.status ? getHealthStatusColor(systemHealth.status) : '#9ca3af',
              color: 'white'
            }}>
              {getHealthStatusIcon(systemHealth?.status)} {systemHealth?.status || 'UNKNOWN'}
            </span>
          </div>
          <div className="kpi-value-large">
            {systemHealth?.status?.toUpperCase() || 'LOADING'}
          </div>
          <div className="kpi-details">
            <p className="detail-text">All system components operational</p>
          </div>
        </div>

        {/* Database Health */}
        <div className="health-kpi-card database-card">
          <div className="kpi-header">
            <h3>Database Connection</h3>
            <span className="status-badge" style={{
              background: databaseHealth?.status ? getHealthStatusColor(databaseHealth.status) : '#9ca3af',
              color: 'white'
            }}>
              {getHealthStatusIcon(databaseHealth?.status)} {databaseHealth?.status || 'UNKNOWN'}
            </span>
          </div>
          <div className="kpi-details">
            <div className="detail-row">
              <span className="detail-label">Database:</span>
              <span className="detail-value">{databaseHealth?.details?.database || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Connection:</span>
              <span className="detail-value">
                {databaseHealth?.details?.connectionValid ? '✓ Valid' : '✕ Invalid'}
              </span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="health-kpi-card memory-card">
          <div className="kpi-header">
            <h3>Heap Memory</h3>
            <span className="usage-value">
              {applicationHealth?.details?.heapUsagePercent || '0%'}
            </span>
          </div>
          <div className="memory-progress">
            <div
              className="memory-bar"
              style={{
                width: parsePercentage(applicationHealth?.details?.heapUsagePercent) + '%',
                background: parsePercentage(applicationHealth?.details?.heapUsagePercent) > 90
                  ? '#dc2626'
                  : parsePercentage(applicationHealth?.details?.heapUsagePercent) > 75
                  ? '#f59e0b'
                  : '#10b981'
              }}
            ></div>
          </div>
          <div className="kpi-details">
            <div className="detail-row">
              <span className="detail-label">Used:</span>
              <span className="detail-value">{applicationHealth?.details?.heapUsedMB || 0} MB</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Max:</span>
              <span className="detail-value">{applicationHealth?.details?.heapMaxMB || 0} MB</span>
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="health-kpi-card cpu-card">
          <div className="kpi-header">
            <h3>CPU Usage</h3>
            <span className="usage-value">
              {applicationHealth?.details?.cpuUsagePercent || '0%'}
            </span>
          </div>
          <div className="cpu-progress">
            <div
              className="cpu-bar"
              style={{
                width: parsePercentage(applicationHealth?.details?.cpuUsagePercent) + '%',
                background: parsePercentage(applicationHealth?.details?.cpuUsagePercent) > 85
                  ? '#dc2626'
                  : parsePercentage(applicationHealth?.details?.cpuUsagePercent) > 70
                  ? '#f59e0b'
                  : '#3b82f6'
              }}
            ></div>
          </div>
          <div className="kpi-details">
            <div className="detail-row">
              <span className="detail-label">Processors:</span>
              <span className="detail-value">{applicationHealth?.details?.availableProcessors || 0}</span>
            </div>
          </div>
        </div>

        {/* JVM Info */}
        <div className="health-kpi-card jvm-card">
          <div className="kpi-header">
            <h3>JVM Information</h3>
          </div>
          <div className="kpi-details">
            <div className="detail-row">
              <span className="detail-label">Java Version:</span>
              <span className="detail-value">{systemInfo?.javaVersion || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">OS:</span>
              <span className="detail-value">{systemInfo?.osName} {systemInfo?.osVersion}</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="health-kpi-card status-card">
          <div className="kpi-header">
            <h3>Application Status</h3>
            <span className="status-badge" style={{
              background: applicationHealth?.status ? getHealthStatusColor(applicationHealth.status) : '#9ca3af',
              color: 'white'
            }}>
              {getHealthStatusIcon(applicationHealth?.status)} {applicationHealth?.status || 'UNKNOWN'}
            </span>
          </div>
          <div className="kpi-details">
            <p className="detail-text">
              {applicationHealth?.details?.status || 'Checking application status...'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="health-charts-grid">
        {/* Heap Memory Chart */}
        <div className="chart-card-health">
          <div className="chart-header-health">
            <h3>Heap Memory Usage Over Time</h3>
            <span className="chart-subtitle">Memory utilization in MB (Last 60 seconds)</span>
          </div>
          <div className="chart-container-health">
            {metricsHistory.heapMemory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricsHistory.heapMemory} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="used"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsed)"
                    name="Heap Used (MB)"
                  />
                  <Line
                    type="monotone"
                    dataKey="max"
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    name="Heap Max (MB)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading">Collecting data...</div>
            )}
          </div>
        </div>

        {/* CPU Usage Chart */}
        <div className="chart-card-health">
          <div className="chart-header-health">
            <h3>CPU Usage Over Time</h3>
            <span className="chart-subtitle">CPU utilization percentage (Last 60 seconds)</span>
          </div>
          <div className="chart-container-health">
            {metricsHistory.cpuUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricsHistory.cpuUsage} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    name="CPU %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading">Collecting data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMonitoring;
