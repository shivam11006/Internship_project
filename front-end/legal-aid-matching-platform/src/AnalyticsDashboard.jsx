import React, { useState } from 'react';
import './AnalyticsDashboard.css';

const MOCK_ANALYTICS_DATA = {
  overview: {
    totalUsers: 150,
    totalCases: 342,
    totalMatches: 1205,
    totalAppointments: 450,
    newUsersThisMonth: 25,
    newCasesThisMonth: 45,
    newMatchesThisMonth: 180,
    systemHealthScore: 87.5,
    lastUpdated: new Date().toISOString()
  },
  users: {
    totalLawyers: 80,
    totalNgos: 45,
    totalCitizens: 20,
    userGrowthTrend: [{ percentageChange: 5.6, trend: 'UP' }],
    lawyerGrowthTrend: [{ percentageChange: 6.2, trend: 'UP' }],
    ngoGrowthTrend: [{ percentageChange: 4.8, trend: 'UP' }]
  },
  cases: {
    closedCases: 72,
    caseResolutionRate: 21.05
  },
  activity: {
    appointmentsToday: 8,
    appointmentsThisMonth: 156
  }
};

const AnalyticsDashboard = () => {
  const [data] = useState(MOCK_ANALYTICS_DATA);

  const formatNumber = (num) => num?.toLocaleString() || '0';

  const renderTrend = (trend) => {
    if (!trend) return null;
    return (
      <div className="kpi-trend trend-up">
        ↑ {trend.percentageChange}% vs last month
      </div>
    );
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>📊 Impact Analytics Dashboard</h1>
        <span className="last-updated">
          Last updated: {new Date(data.overview.lastUpdated).toLocaleString()}
        </span>
        <span className="demo-badge">🎨 Demo Mode - Sample Data</span>
      </div>

      <div className="kpi-cards-grid">

        {/* TOTAL USERS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">👥</span>
            <h3 className="kpi-title">Total Users</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.overview.totalUsers)}</div>
          {renderTrend(data.users.userGrowthTrend[0])}
        </div>

        {/* TOTAL LAWYERS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">⚖️</span>
            <h3 className="kpi-title">Total Lawyers</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.users.totalLawyers)}</div>
          {renderTrend(data.users.lawyerGrowthTrend[0])}
        </div>

        {/* TOTAL NGOS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">🏢</span>
            <h3 className="kpi-title">Total NGOs</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.users.totalNgos)}</div>
          {renderTrend(data.users.ngoGrowthTrend[0])}
        </div>

        {/* TOTAL CASES */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">📋</span>
            <h3 className="kpi-title">Total Cases</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.overview.totalCases)}</div>
          <div className="kpi-subtitle">
            {data.overview.newCasesThisMonth} new this month
          </div>
        </div>

        {/* TOTAL MATCHES */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">🤝</span>
            <h3 className="kpi-title">Total Matches</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.overview.totalMatches)}</div>
          <div className="kpi-subtitle">
            {data.overview.newMatchesThisMonth} new this month
          </div>
        </div>

        {/* ACTIVE APPOINTMENTS */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">📅</span>
            <h3 className="kpi-title">Active Appointments</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.activity.appointmentsThisMonth)}</div>
          <div className="kpi-subtitle">{data.activity.appointmentsToday} today</div>
        </div>

        {/* RESOLVED CASES */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">✅</span>
            <h3 className="kpi-title">Resolved Cases</h3>
          </div>
          <div className="kpi-value">{formatNumber(data.cases.closedCases)}</div>
          <div className="kpi-subtitle">
            {data.cases.caseResolutionRate.toFixed(1)}% resolution rate
          </div>
        </div>

        {/* SYSTEM HEALTH */}
        <div className="kpi-card kpi-card-highlight">
          <div className="kpi-header">
            <span className="kpi-icon">💚</span>
            <h3 className="kpi-title">System Health</h3>
          </div>
          <div className="kpi-value">{data.overview.systemHealthScore.toFixed(1)}%</div>
          <div className="kpi-subtitle">Platform performance</div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
