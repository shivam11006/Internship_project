import React, { useState, useEffect } from 'react';
import analyticsService from './services/analyticsService';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    const result = await analyticsService.getAllAnalytics();
    
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Failed to load analytics data');
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={fetchAnalyticsData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>📊 Impact Analytics Dashboard</h1>
        <span className="last-updated">
          Last updated: {data?.overview?.lastUpdated ? new Date(data.overview.lastUpdated).toLocaleString() : 'N/A'}
        </span>
      </div>

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

    </div>
  );
};

export default AnalyticsDashboard;
