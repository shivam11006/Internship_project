import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import './AdminDashboard.css';

function DashboardAdmin() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('user-verification');
  const [activeView, setActiveView] = useState('pending');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchUsers();
    
    // Auto-refresh when window/tab gets focus
    const handleFocus = () => {
      console.log('Window focused, refreshing users...');
      fetchUsers();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await authService.getAllUsers();
      
      // Flatten profile data into user object for easier access
      const flattenedUsers = result.map(user => {
        const flatUser = { ...user };
        if (user.profile) {
          // Extract profile fields to top level
          if (user.role === 'LAWYER') {
            flatUser.specialization = user.profile.specialization;
            flatUser.barNumber = user.profile.barNumber;
          } else if (user.role === 'NGO') {
            flatUser.organizationName = user.profile.organizationName;
            flatUser.registrationNumber = user.profile.registrationNumber;
            flatUser.focusArea = user.profile.focusArea;
          }
        }
        return flatUser;
      });
      
      // Filter out CITIZEN role from all displays
      const pending = flattenedUsers.filter(u => 
        (u.approvalStatus === 'PENDING' || u.approvalStatus === 'REAPPROVAL_PENDING') && 
        (u.role === 'LAWYER' || u.role === 'NGO')
      );
      const approved = flattenedUsers.filter(u => 
        u.approvalStatus === 'APPROVED' && 
        (u.role === 'LAWYER' || u.role === 'NGO')
      );
      const rejected = flattenedUsers.filter(u => 
        u.approvalStatus === 'REJECTED' && 
        (u.role === 'LAWYER' || u.role === 'NGO')
      );
      const suspended = flattenedUsers.filter(u => 
        u.approvalStatus === 'SUSPENDED' && 
        (u.role === 'LAWYER' || u.role === 'NGO')
      );
      setPendingUsers(pending);
      setApprovedUsers([...approved, ...rejected, ...suspended]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleApprove = async (userId, username) => {
    setActionLoading(userId);
    try {
      await authService.approveUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
    setActionLoading(null);
  };

  const handleReject = async (userId, username) => {
    // Find the user to check their status
    const user = [...pendingUsers, ...approvedUsers].find(u => u.id === userId);
    const isPending = user?.approvalStatus === 'PENDING';
    
    const message = isPending 
      ? `Are you sure you want to reject ${username}? Their status will be changed to REJECTED.`
      : `Reject profile changes for ${username}? Their profile will be reverted to the previously approved version.`;
    
    if (!confirm(message)) {
      return;
    }
    
    setActionLoading(userId);
    try {
      await authService.rejectUser(userId);
      await fetchUsers();
      alert(isPending ? 'User has been rejected.' : 'Profile changes have been rejected and reverted.');
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user');
    }
    setActionLoading(null);
  };

  const handleSuspend = async (userId, username) => {
    if (!confirm(`Are you sure you want to suspend ${username}? They will not be able to access the system.`)) {
      return;
    }
    setActionLoading(userId);
    try {
      await authService.suspendUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to suspend user');
    }
    setActionLoading(null);
  };

  const handleReactivate = async (userId, username) => {
    if (!confirm(`Reactivate ${username}'s account?`)) {
      return;
    }
    setActionLoading(userId);
    try {
      await authService.reactivateUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      alert('Failed to reactivate user');
    }
    setActionLoading(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/signin');
  };

  const handleProfileUpdate = async () => {
    try {
      // Implement profile update logic here
      console.log('Profile updated:', profileData);
      setShowProfileEdit(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleViewDetails = (userItem) => {
    setSelectedUser(userItem);
    setShowUserDetails(true);
  };

  const filteredPending = pendingUsers.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApproved = approvedUsers.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard-layout">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      
      {/* Sidebar */}
      <div className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-logo">
          <div className="logo-icon">⚖️</div>
          <span className="logo-text">LegalMatch Pro</span>
        </div>
        
        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile Management</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'case' ? 'active' : ''}`}
            onClick={() => setActiveTab('case')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Case Submission</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Directory</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Matches</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'impact' ? 'active' : ''}`}
            onClick={() => setActiveTab('impact')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Impact Dashboard</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === 'user-verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-verification')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Admin Panel</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <div className="admin-top-bar">
          <h1 className="admin-page-title">Admin Panel</h1>
          <div className="admin-top-actions">
            <button 
              className="refresh-btn"
              onClick={fetchUsers}
              title="Refresh user list"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div className="profile-dropdown">
              <button 
                className="profile-button" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar">{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showProfileMenu && (
                <div className="profile-menu">
                  <button onClick={() => { setShowProfileEdit(true); setShowProfileMenu(false); }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button onClick={handleLogout}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'user-verification' ? (
          <div className="admin-content-section">
            <div className="admin-panel-header">
              <p className="admin-panel-subtitle">
                Manage platform users, data ingestion, system health, and application settings.
              </p>
            </div>

            <div className="admin-tabs-container">
              <button 
                className={`admin-tab-btn ${activeView === 'user-verification' ? 'active' : ''}`}
                onClick={() => setActiveView('user-verification')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                User Verification
              </button>
              <button 
                className={`admin-tab-btn ${activeView === 'directory' ? 'active' : ''}`}
                onClick={() => setActiveView('directory')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Directory Ingestion
              </button>
              <button 
                className={`admin-tab-btn ${activeView === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveView('logs')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                System Logs
              </button>
              <button 
                className={`admin-tab-btn ${activeView === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveView('settings')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                App Settings
              </button>
            </div>

            {activeView === 'user-verification' && (
              <>
                <div className="section-header-new">
                  <h2 className="section-title-new">User Verification Queue</h2>
                  <p className="section-subtitle">Review and approve/reject profiles for Lawyers and NGOs.</p>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="search-input-new"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="table-wrapper">
                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner"></div>
                      <p>Loading...</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Email</th>
                          <th>Submitted Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPending.map((u) => (
                          <tr key={u.id}>
                            <td className="name-cell">{u.username}</td>
                            <td className="role-cell">{u.role}</td>
                            <td className="email-cell">{u.email}</td>
                            <td className="date-cell">
                              {new Date(u.createdAt || Date.now()).toLocaleDateString('en-CA')}
                            </td>
                            <td className="status-cell">
                              <span className="status-badge status-pending">
                                {u.approvalStatus === 'REAPPROVAL_PENDING' ? 'Re-approval Pending' : 'Pending'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="action-btn view-btn"
                                onClick={() => handleViewDetails(u)}
                              >
                                View Details
                              </button>
                              <button
                                className="action-btn approve-btn"
                                onClick={() => handleApprove(u.id, u.username)}
                                disabled={actionLoading === u.id}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </button>
                              <button
                                className="action-btn reject-btn"
                                onClick={() => handleReject(u.id, u.username)}
                                disabled={actionLoading === u.id}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredApproved.map((u) => (
                          <tr key={u.id}>
                            <td className="name-cell">{u.username}</td>
                            <td className="role-cell">{u.role}</td>
                            <td className="email-cell">{u.email}</td>
                            <td className="date-cell">
                              {new Date(u.createdAt || Date.now()).toLocaleDateString('en-CA')}
                            </td>
                            <td className="status-cell">
                              <span className={`status-badge ${
                                u.approvalStatus === 'APPROVED' ? 'status-approved' : 
                                u.approvalStatus === 'SUSPENDED' ? 'status-suspended' : 
                                'status-rejected'
                              }`}>
                                {u.approvalStatus === 'APPROVED' ? 'Approved' : 
                                 u.approvalStatus === 'SUSPENDED' ? 'Suspended' : 
                                 'Rejected'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="action-btn view-btn"
                                onClick={() => handleViewDetails(u)}
                              >
                                View Details
                              </button>
                              {u.approvalStatus === 'APPROVED' && (
                                <button
                                  className="action-btn suspend-btn"
                                  onClick={() => handleSuspend(u.id, u.username)}
                                  disabled={actionLoading === u.id}
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  Suspend
                                </button>
                              )}
                              {u.approvalStatus === 'SUSPENDED' && (
                                <button
                                  className="action-btn approve-btn"
                                  onClick={() => handleReactivate(u.id, u.username)}
                                  disabled={actionLoading === u.id}
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Reactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredPending.length === 0 && filteredApproved.length === 0 && (
                          <tr>
                            <td colSpan="6" className="empty-cell">No users found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {activeView === 'logs' && (
              <div className="empty-section">
                <svg width="64" height="64" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>System Logs will appear here</p>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-section">
            <svg width="80" height="80" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3>Coming Soon</h3>
            <p>This feature is under development</p>
          </div>
        )}

        {showProfileEdit && (
          <div className="modal-overlay" onClick={() => setShowProfileEdit(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Profile</h3>
                <button className="modal-close" onClick={() => setShowProfileEdit(false)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowProfileEdit(false)}>Cancel</button>
                <button className="btn-save" onClick={handleProfileUpdate}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {showUserDetails && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>User Details</h3>
                <button className="modal-close" onClick={() => setShowUserDetails(false)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="user-details-section">
                  <div className="user-avatar-large">
                    {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-role-badge-large">{selectedUser.role}</div>
                  <div className="user-status-badge">
                    <span className={`status-badge ${selectedUser.approvalStatus === 'APPROVED' ? 'status-approved' : selectedUser.approvalStatus === 'PENDING' ? 'status-pending' : 'status-rejected'}`}>
                      {selectedUser.approvalStatus}
                    </span>
                  </div>
                </div>

                <div className="details-grid">
                <div className="detail-item">
                  <label className="detail-label">Username</label>
                  <p className="detail-value">{selectedUser.username || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Email</label>
                    <p className="detail-value">{selectedUser.email || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Role</label>
                    <p className="detail-value">{selectedUser.role || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">User ID</label>
                    <p className="detail-value">{selectedUser.id || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Approval Status</label>
                    <p className="detail-value">{selectedUser.approvalStatus || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label className="detail-label">Registration Date</label>
                    <p className="detail-value">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                  {selectedUser.phone && (
                    <div className="detail-item">
                      <label className="detail-label">Phone Number</label>
                      <p className="detail-value">{selectedUser.phone}</p>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="detail-item">
                      <label className="detail-label">Address</label>
                      <p className="detail-value">{selectedUser.address}</p>
                    </div>
                  )}
                  {selectedUser.specialization && (
                    <div className="detail-item">
                      <label className="detail-label">Specialization</label>
                      <p className="detail-value">{selectedUser.specialization}</p>
                    </div>
                  )}
                  {selectedUser.barNumber && (
                    <div className="detail-item">
                      <label className="detail-label">Bar Number</label>
                      <p className="detail-value">{selectedUser.barNumber}</p>
                    </div>
                  )}
                  {selectedUser.organizationName && (
                    <div className="detail-item">
                      <label className="detail-label">Organization Name</label>
                      <p className="detail-value">{selectedUser.organizationName}</p>
                    </div>
                  )}
                  {selectedUser.registrationNumber && (
                    <div className="detail-item">
                      <label className="detail-label">Registration Number</label>
                      <p className="detail-value">{selectedUser.registrationNumber}</p>
                    </div>
                  )}
                  {selectedUser.focusArea && (
                    <div className="detail-item">
                      <label className="detail-label">Focus Area</label>
                      <p className="detail-value">{selectedUser.focusArea}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowUserDetails(false)}>Close</button>
                {(selectedUser.approvalStatus === 'PENDING' || selectedUser.approvalStatus === 'REAPPROVAL_PENDING') && (
                  <>
                    <button 
                      className="btn-reject" 
                      onClick={() => {
                        handleReject(selectedUser.id, selectedUser.username);
                        setShowUserDetails(false);
                      }}
                    >
                      Reject
                    </button>
                    <button 
                      className="btn-save" 
                      onClick={() => {
                        handleApprove(selectedUser.id, selectedUser.username);
                        setShowUserDetails(false);
                      }}
                    >
                      Approve
                    </button>
                  </>
                )}
                {selectedUser.approvalStatus === 'APPROVED' && (
                  <button 
                    className="btn-suspend" 
                    onClick={() => {
                      handleSuspend(selectedUser.id, selectedUser.username);
                      setShowUserDetails(false);
                    }}
                  >
                    Suspend User
                  </button>
                )}
                {selectedUser.approvalStatus === 'SUSPENDED' && (
                  <button 
                    className="btn-save" 
                    onClick={() => {
                      handleReactivate(selectedUser.id, selectedUser.username);
                      setShowUserDetails(false);
                    }}
                  >
                    Reactivate User
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardAdmin;
