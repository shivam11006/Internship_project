import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import AssignedCases from './AssignedCases';
import './Dashboard.css';

function DashboardLawyer() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile or assigned-cases
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    specialization: '',
    barNumber: '',
    address: '',
    location: '',
    languages: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await authService.getProfile();
      console.log('Profile API Response:', result);
      if (result.success) {
        console.log('Profile data:', result.data);
        console.log('Nested profile:', result.data.profile);
        
        // Check if user is suspended
        if (result.data.approvalStatus === 'SUSPENDED') {
          alert('Your account has been suspended. You will be logged out.');
          authService.logout();
          navigate('/signin');
          return;
        }
        
        const profile = result.data.profile || {};
        setProfileData({
          username: result.data.username || '',
          email: result.data.email || '',
          specialization: profile.specialization || '',
          barNumber: profile.barNumber || '',
          address: profile.address || '',
          location: result.data.location || '',
          languages: profile.languages || '',
        });
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/signin');
  };

  const handleViewProfile = () => {
    setShowProfileMenu(false);
    setShowProfileModal(true);
    setIsEditing(false);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    const result = await authService.updateProfile(profileData);
    if (result.success) {
      if (result.requiresApproval) {
        alert('Profile changes submitted. Your updates are pending admin approval. You will be notified once approved.');
      } else {
        alert('Profile updated successfully!');
      }
      setIsEditing(false);
    } else {
      alert(result.error || 'Failed to update profile');
    }
  };

  const handleCancelEdit = async () => {
    const result = await authService.getProfile();
    if (result.success) {
      const profile = result.data.profile || {};
      setProfileData({
        username: result.data.username || '',
        email: result.data.email || '',
        specialization: profile.specialization || '',
        barNumber: profile.barNumber || '',
        address: profile.address || '',
        location: result.data.location || '',
        languages: profile.languages || '',
      });
    }
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      
      <div className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="dashboard-logo">
          <div className="logo-icon">⚖️</div>
          <span className="logo-text">LegalMatch Pro</span>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile Management</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'assigned-cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('assigned-cases')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Assigned Cases</span>
          </button>
        </nav>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            {activeTab === 'profile' ? 'Lawyer Dashboard' : 'Assigned Cases'}
          </h1>
          <div className="header-profile">
            <div className="profile-dropdown" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-avatar">
                {user?.username?.charAt(0).toUpperCase() || 'L'}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.username || 'Lawyer'}</div>
                <div className="profile-email">{user?.email || ''}</div>
              </div>
              <svg className="dropdown-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            {showProfileMenu && (
              <div className="profile-menu">
                <button className="profile-menu-item" onClick={handleViewProfile}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </button>
                <button className="profile-menu-item" onClick={handleLogout}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-content">
          {activeTab === 'profile' && (
            <div className="empty-state">
              <svg width="80" height="80" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h2 className="empty-title">Welcome, {user?.username}</h2>
              <p className="empty-description">Your lawyer dashboard features are coming soon</p>
            </div>
          )}

          {activeTab === 'assigned-cases' && (
            <AssignedCases />
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Profile</h2>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="profile-section">
                <div className="profile-avatar-large">
                  {user?.username?.charAt(0).toUpperCase() || 'L'}
                </div>
                <div className="profile-role-badge">{user?.role || 'LAWYER'}</div>
              </div>
              
              <div className="profile-form">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    disabled={true}
                    className='disabled'
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Username cannot be changed
                  </small>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled={true}
                    className='disabled'
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Email cannot be changed
                  </small>
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={profileData.specialization}
                    onChange={handleChange}
                    placeholder="e.g., Family Law, Criminal Law"
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Bar Number</label>
                  <input
                    type="text"
                    name="barNumber"
                    value={profileData.barNumber}
                    onChange={handleChange}
                    placeholder="Enter your bar number"
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleChange}
                    placeholder="Enter your location"
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Languages</label>
                  <input
                    type="text"
                    name="languages"
                    value={profileData.languages}
                    onChange={handleChange}
                    placeholder="e.g., English, Hindi, Tamil"
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Separate multiple languages with commas
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {!isEditing ? (
                <button className="btn-primary" onClick={handleEditProfile}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLawyer;
