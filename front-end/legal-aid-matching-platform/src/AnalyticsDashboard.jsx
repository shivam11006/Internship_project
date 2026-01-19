import React, { useState, useEffect, useRef } from 'react';
import analyticsService from './services/analyticsService';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [cacheStatus, setCacheStatus] = useState(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchAnalyticsData();

    // Set up auto-refresh interval
    if (autoRefresh) {
      startAutoRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update auto-refresh when toggle changes
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }, [autoRefresh, refreshInterval]);

  const startAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      fetchAnalyticsData(false); // Don't force refresh, use cache
    }, refreshInterval * 1000);
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const fetchAnalyticsData = async (forceRefresh = true) => {
    setLoading(true);
    setError(null);
    
    const result = await analyticsService.getAllAnalytics(forceRefresh);

    if (result.success && result.data) {
      setData(result.data);
      
      // Update cache status
      const cacheStatus = analyticsService.getCacheStatus();
      setCacheStatus(cacheStatus);

      // Show warning if data is stale
      if (result.stale) {
        setError({
          type: 'warning',
          message: result.warning || 'Data may be outdated. Please try again when connection is restored.'
        });
      }
    } else {
      setError({
        type: 'error',
        message: result.error || 'Failed to load analytics data'
      });
    }
    setLoading(false);
  };

  const handleManualRefresh = () => {
    fetchAnalyticsData(true); // Force refresh, bypass cache
  };

  const handleClearCache = () => {
    analyticsService.clearCache();
    setCacheStatus(null);
    fetchAnalyticsData(true);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const renderTrend = (percentageChange, trend) => {
    if (percentageChange === null || percentageChange === undefined) return null;
    const isUp = trend === 'UP';
    return (
      <div className={`kpi-trend ${isUp ? 'trend-up' : 'trend-down'}`}>
        {isUp ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}% vs last period
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Impact Analytics Dashboard</h1>
          <span className="last-updated">
            Last updated: {data?.overview?.lastUpdated ? new Date(data.overview.lastUpdated).toLocaleString() : 'N/A'}
          </span>
        </div>

        <div className="dashboard-controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            {autoRefresh && (
              <input
                type="number"
                min="10"
                max="300"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="refresh-interval-input"
                title="Refresh interval in seconds"
              />
            )}
          </div>
          <button
            className="refresh-btn"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Force refresh (bypass cache)"
          >
            🔄 Refresh
          </button>
          <button
            className="clear-cache-btn"
            onClick={handleClearCache}
            disabled={loading || !cacheStatus?.isCached}
            title="Clear analytics cache"
          >
            🗑️ Clear Cache
          </button>
        </div>

        {cacheStatus && cacheStatus.isCached && (
          <div className={`cache-indicator ${cacheStatus.isValid ? 'valid' : 'expired'}`}>
            {cacheStatus.isValid ? '📦 Cached' : '⏰ Cache Expired'} 
            {cacheStatus.cachedAt && ` - cached at ${new Date(cacheStatus.cachedAt).toLocaleTimeString()}`}
          </div>
        )}
      </div>

      {error && (
        <div className={`alert alert-${error.type}`}>
          <p className="error-message">{error.message}</p>
          {error.type === 'error' && (
            <button className="retry-btn" onClick={handleManualRefresh}>
              Retry
            </button>
          )}
        </div>
      )}

      {data && (
        <>
          <div className="kpi-cards-grid">

        {/* TOTAL USERS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">👥</span>
            <h3 className="kpi-title">Total Users</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.overview?.totalUsers)}</div>
          <div className="kpi-subtitle">
            {data?.overview?.newUsersThisMonth} new this month
          </div>
          {data?.users?.userGrowthTrend?.[0] && renderTrend(data.users.userGrowthTrend[0].percentageChange, data.users.userGrowthTrend[0].trend)}
        </div>

        {/* TOTAL LAWYERS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">⚖️</span>
            <h3 className="kpi-title">Total Lawyers</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.users?.totalLawyers)}</div>
          {data?.users?.lawyerGrowthTrend?.[0] && renderTrend(data.users.lawyerGrowthTrend[0].percentageChange, data.users.lawyerGrowthTrend[0].trend)}
        </div>

        {/* TOTAL NGOS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">🏢</span>
            <h3 className="kpi-title">Total NGOs</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.users?.totalNgos)}</div>
          {data?.users?.ngoGrowthTrend?.[0] && renderTrend(data.users.ngoGrowthTrend[0].percentageChange, data.users.ngoGrowthTrend[0].trend)}
        </div>

        {/* TOTAL CASES */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">📋</span>
            <h3 className="kpi-title">Total Cases</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.overview?.totalCases)}</div>
          <div className="kpi-subtitle">
            {data?.overview?.newCasesThisMonth} new this month
          </div>
        </div>

        {/* TOTAL MATCHES */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">🤝</span>
            <h3 className="kpi-title">Total Matches</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.overview?.totalMatches)}</div>
          <div className="kpi-subtitle">
            {data?.overview?.newMatchesThisMonth} new this month
          </div>
        </div>

        {/* ACCEPTANCE RATE */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">✅</span>
            <h3 className="kpi-title">Acceptance Rate</h3>
          </div>
          <div className="kpi-value">{data?.matches?.acceptanceRate?.toFixed(1)}%</div>
          <div className="kpi-subtitle">
            {formatNumber(data?.matches?.acceptedMatches)} accepted
          </div>
        </div>

        {/* ACTIVE APPOINTMENTS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">📅</span>
            <h3 className="kpi-title">Appointments This Month</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.activity?.appointmentsThisMonth)}</div>
          <div className="kpi-subtitle">{data?.activity?.appointmentsToday} today</div>
        </div>

        {/* RESOLVED CASES */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">📂</span>
            <h3 className="kpi-title">Resolved Cases</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.cases?.closedCases)}</div>
          <div className="kpi-subtitle">
            {data?.cases?.caseResolutionRate?.toFixed(1)}% resolution rate
          </div>
        </div>

        {/* ACTIVE USERS THIS WEEK */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">🔥</span>
            <h3 className="kpi-title">Active Users This Week</h3>
          </div>
          <div className="kpi-value">{formatNumber(data?.users?.activeUsersThisWeek)}</div>
          <div className="kpi-subtitle">
            Retention: {data?.users?.userRetentionRate?.toFixed(1)}%
          </div>
        </div>

        {/* AVERAGE MATCH SCORE */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">⭐</span>
            <h3 className="kpi-title">Avg Match Quality</h3>
          </div>
          <div className="kpi-value">{data?.matches?.averageMatchScore?.toFixed(1)}</div>
          <div className="kpi-subtitle">
            High quality: {data?.matches?.highQualityMatchesPercentage?.toFixed(1)}%
          </div>
        </div>

        {/* SYSTEM HEALTH */}
        <div className="kpi-card kpi-card-highlight">
          <div className="kpi-header">
            <span className="kpi-icon">💚</span>
            <h3 className="kpi-title">System Health</h3>
          </div>
          <div className="kpi-value">{data?.overview?.systemHealthScore?.toFixed(1)}%</div>
          <div className="kpi-subtitle">Platform performance</div>
        </div>

      </div>

      {/* Additional Metrics Section */}
      <div className="analytics-section">
        <h2 className="section-title">Key Metrics</h2>
        <div className="metrics-grid">

          <div className="metric-card">
            <h4>User Distribution</h4>
            <div className="metric-value">
              <div className="metric-row">
                <span>Lawyers:</span>
                <strong>{formatNumber(data?.overview?.usersByRole?.LAWYER)}</strong>
              </div>
              <div className="metric-row">
                <span>NGOs:</span>
                <strong>{formatNumber(data?.overview?.usersByRole?.NGO)}</strong>
              </div>
              <div className="metric-row">
                <span>Citizens:</span>
                <strong>{formatNumber(data?.overview?.usersByRole?.CITIZEN)}</strong>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <h4>Case Status</h4>
            <div className="metric-value">
              <div className="metric-row">
                <span>Open:</span>
                <strong>{formatNumber(data?.cases?.openCases)}</strong>
              </div>
              <div className="metric-row">
                <span>Assigned:</span>
                <strong>{formatNumber(data?.cases?.assignedCases)}</strong>
              </div>
              <div className="metric-row">
                <span>Closed:</span>
                <strong>{formatNumber(data?.cases?.closedCases)}</strong>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <h4>Match Status</h4>
            <div className="metric-value">
              <div className="metric-row">
                <span>Pending:</span>
                <strong>{formatNumber(data?.matches?.pendingMatches)}</strong>
              </div>
              <div className="metric-row">
                <span>Accepted:</span>
                <strong>{formatNumber(data?.matches?.acceptedMatches)}</strong>
              </div>
              <div className="metric-row">
                <span>Rejected:</span>
                <strong>{formatNumber(data?.matches?.rejectedMatches)}</strong>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <h4>Approval Status</h4>
            <div className="metric-value">
              <div className="metric-row">
                <span>Approved:</span>
                <strong>{formatNumber(data?.overview?.usersByApprovalStatus?.APPROVED)}</strong>
              </div>
              <div className="metric-row">
                <span>Pending:</span>
                <strong>{formatNumber(data?.overview?.usersByApprovalStatus?.PENDING)}</strong>
              </div>
              <div className="metric-row">
                <span>Rejected:</span>
                <strong>{formatNumber(data?.overview?.usersByApprovalStatus?.REJECTED)}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
        </>
      )}

    </div>
  );
};

export default AnalyticsDashboard;
