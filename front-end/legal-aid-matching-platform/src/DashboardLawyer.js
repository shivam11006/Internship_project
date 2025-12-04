import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import './Dashboard.css';

function DashboardLawyer() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/signin');
  };

  const clientRequests = [
    { id: 1, name: 'John Smith', caseType: 'Family Law', date: '2024-12-01', status: 'pending' },
    { id: 2, name: 'Mary Johnson', caseType: 'Employment Law', date: '2024-12-02', status: 'pending' },
    { id: 3, name: 'Robert Williams', caseType: 'Criminal Defense', date: '2024-11-28', status: 'approved' },
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile Management</span>
          </button>
          
          <button className="nav-item active">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Client Requests</span>
          </button>
          
          <button className="nav-item">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Active Cases</span>
          </button>
          
          <button className="nav-item">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Performance</span>
          </button>
        </nav>
        
        <div className="dashboard-user">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase() || 'L'}</div>
            <span className="user-name">{user?.username || 'Lawyer'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Lawyer Dashboard</h1>
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
          <p className="dashboard-subtitle">Manage your legal practice and client relationships.</p>
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Active Clients</div>
              <div className="stat-value">18</div>
              <div className="stat-change">+4 this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Requests</div>
              <div className="stat-value">7</div>
              <div className="stat-change">2 urgent</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cases Won</div>
              <div className="stat-value">142</div>
              <div className="stat-change">+12 this year</div>
            </div>
          </div>

          {/* Client Requests Table */}
          <div className="data-table-container">
            <div className="table-header">
              <h2 className="table-title">Client Request Queue</h2>
              <input type="text" placeholder="Search requests..." className="search-input" />
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Case Type</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clientRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.name}</td>
                    <td>{request.caseType}</td>
                    <td>{request.date}</td>
                    <td>
                      <span className={`status-badge status-${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {request.status === 'pending' ? (
                        <div className="action-buttons">
                          <button className="btn-approve">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </button>
                          <button className="btn-reject">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button className="btn-view">View Details</button>
                      )}
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

export default DashboardLawyer;
