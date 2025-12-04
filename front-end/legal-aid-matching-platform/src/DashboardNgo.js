import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import './Dashboard.css';

function DashboardNgo() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/signin');
  };

  const supportCases = [
    { id: 1, beneficiary: 'Jane Doe', caseType: 'Housing Rights', lawyer: 'Sarah Wilson', date: '2024-11-15', status: 'approved' },
    { id: 2, beneficiary: 'Mike Brown', caseType: 'Labor Rights', lawyer: 'Pending', date: '2024-12-01', status: 'pending' },
    { id: 3, beneficiary: 'Lisa Anderson', caseType: 'Family Law', lawyer: 'David Lee', date: '2024-11-20', status: 'approved' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="logo-icon">⚖️</div>
          <span className="logo-text">LegalMatch Pro</span>
        </div>
        
        <nav className="dashboard-nav">
          <button className="nav-item">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Organization Profile</span>
          </button>
          
          <button className="nav-item active">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Supported Cases</span>
          </button>
          
          <button className="nav-item">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Funding</span>
          </button>
          
          <button className="nav-item">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Impact Reports</span>
          </button>
        </nav>
        
        <div className="dashboard-user">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase() || 'N'}</div>
            <span className="user-name">{user?.username || 'NGO'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">NGO Dashboard</h1>
          <div className="header-actions">
            <div className="notification-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="notification-badge"></span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="dashboard-content">
          <p className="dashboard-subtitle">Track your organization's impact and manage legal aid programs.</p>
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Active Beneficiaries</div>
              <div className="stat-value">234</div>
              <div className="stat-change">+45 this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Partner Lawyers</div>
              <div className="stat-value">56</div>
              <div className="stat-change">+8 this quarter</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cases Funded</div>
              <div className="stat-value">892</div>
              <div className="stat-change">+127 this year</div>
            </div>
          </div>

          {/* Support Cases Table */}
          <div className="data-table-container">
            <div className="table-header">
              <h2 className="table-title">Supported Cases</h2>
              <input type="text" placeholder="Search cases..." className="search-input" />
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beneficiary</th>
                  <th>Case Type</th>
                  <th>Assigned Lawyer</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supportCases.map(item => (
                  <tr key={item.id}>
                    <td>{item.beneficiary}</td>
                    <td>{item.caseType}</td>
                    <td>{item.lawyer}</td>
                    <td>{item.date}</td>
                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardNgo;
