import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import AssignedCases from './AssignedCases';
import './Dashboard.css';
import './SecureChat.css';

function DashboardLawyer() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile, assigned-cases, secure-chat
  const [activeChat, setActiveChat] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    specialization: '',
    barNumber: '',
    address: '',
    location: '',
    languages: '',
  });

  // Mock Data for Secure Chat
  const [conversations] = useState([
    {
      id: 0,
      name: 'Rajesh Kumar (Citizen)',
      role: 'Citizen',
      lastMsg: 'I have uploaded the property documents as requested.',
      time: '11:15 AM',
      unread: 1,
      matchScore: '92%',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
      id: 1,
      name: 'Community Justice Center (NGO)',
      role: 'NGO',
      lastMsg: 'Could you please provide your legal opinion on this case?',
      time: '09:45 AM',
      unread: 0,
      matchScore: '85%',
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
      id: 2,
      name: 'Priya Singh (Citizen)',
      role: 'Citizen',
      lastMsg: 'When can we discuss the next steps for my case?',
      time: 'Yesterday',
      unread: 3,
      matchScore: '95%',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    }
  ]);

  const [messages] = useState([
    { id: 1, text: 'Hello, I see you have a dispute regarding your property boundaries.', sender: 'user', time: '10:00 AM' },
    { id: 2, text: 'Yes, that is correct. My neighbor is claiming two feet of my land.', sender: 'contact', time: '10:05 AM' },
    { id: 3, text: 'I understand. Have you already filed any formal complaint or had a survey done?', sender: 'user', time: '10:10 AM' },
    { id: 4, text: 'Not yet, I was waiting for legal advice first.', sender: 'contact', time: '10:15 AM' },
    { id: 5, text: 'I have uploaded the property documents as requested.', sender: 'contact', time: '11:15 AM' },
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await authService.getProfile();
      if (result.success) {
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
        alert('Profile changes submitted. Your updates are pending admin approval.');
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

  const currentContact = conversations[activeChat];

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
            className={`nav-item ${activeTab === 'secure-chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('secure-chat')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Secure Chat</span>
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
            {activeTab === 'profile' && 'Lawyer Dashboard'}
            {activeTab === 'secure-chat' && 'Secure Chat'}
            {activeTab === 'assigned-cases' && 'Assigned Cases'}
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

          {activeTab === 'secure-chat' && (
            <div className="secure-chat-container">
              {/* Chat Sidebar */}
              <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                  <div className="chat-search-container">
                    <svg className="chat-search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" className="chat-search-input" placeholder="Search conversations..." />
                  </div>
                </div>
                <div className="conversation-list">
                  {conversations.map((convo, index) => (
                    <div
                      key={convo.id}
                      className={`conversation-item ${activeChat === index ? 'active' : ''}`}
                      onClick={() => setActiveChat(index)}
                    >
                      <div className="convo-avatar">
                        <img src={convo.avatar} alt={convo.name} />
                      </div>
                      <div className="convo-details">
                        <div className="convo-header">
                          <span className="convo-name">{convo.name}</span>
                          <span className="convo-time">{convo.time}</span>
                        </div>
                        <div className="convo-last-msg">
                          <span>{convo.lastMsg}</span>
                          {convo.unread > 0 && <span className="unread-badge">{convo.unread}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Chat Window */}
              <div className="chat-window">
                <div className="chat-header">
                  <div className="chat-contact-info">
                    <img className="chat-contact-avatar" src={currentContact.avatar} alt={currentContact.name} />
                    <div className="chat-contact-details">
                      <h3>{currentContact.name}</h3>
                      <span className="match-score-pill">{currentContact.role} • Match Score: {currentContact.matchScore}</span>
                    </div>
                  </div>
                  <div className="chat-header-actions">
                    <button className="btn-header-action btn-view-profile">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>View Profile</span>
                    </button>
                    <button className="btn-header-action btn-schedule" onClick={() => setShowScheduleModal(true)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Schedule Call</span>
                    </button>
                  </div>
                </div>

                <div className="messages-container">
                  <div className="message-date-divider">
                    <span>Today</span>
                  </div>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.sender}`}>
                      <div className="message-bubble">
                        {msg.text}
                      </div>
                      <div className="message-info">
                        <span>{msg.time}</span>
                        {msg.sender === 'user' && (
                          <svg className="msg-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7m-12 6l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="suggested-replies">
                  {['Understood.', 'Please send the documents.', 'I am available for a call.', 'What is the current status?', 'Let\'s meet next week.'].map((reply, i) => (
                    <button key={i} className="suggested-reply-btn" onClick={() => setMessageText(reply)}>
                      {reply}
                    </button>
                  ))}
                </div>

                <div className="chat-input-container">
                  <div className="chat-input-wrapper">
                    <button className="btn-input-icon">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <textarea
                      className="chat-input-field"
                      placeholder="Type your message here..."
                      rows="1"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    ></textarea>
                    <button className="btn-send-msg">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Schedule Call Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="schedule-header">
                <h2>Schedule a Call</h2>
                <div className="schedule-subtitle">Propose a time to connect with {currentContact.name}</div>
              </div>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="contact-preview-card">
                <img className="contact-preview-avatar" src={currentContact.avatar} alt={currentContact.name} />
                <div className="contact-preview-info">
                  <h4>{currentContact.name} <span className="contact-preview-role">{currentContact.role}</span></h4>
                  <span className="match-score-pill">Match Score: {currentContact.matchScore}</span>
                </div>
              </div>

              <div className="profile-form">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" defaultValue="2025-12-28" />
                </div>

                <div className="form-group">
                  <label>Time Zone</label>
                  <select className="chat-search-input" style={{ paddingLeft: '12px' }}>
                    <option selected>India Standard Time (IST)</option>
                    <option>Pacific Standard Time (PST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Proposed Time Slots</label>
                  <div className="time-slots-grid">
                    {['10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '4:00 PM'].map((slot, i) => (
                      <button key={i} className={`time-slot-btn ${slot === '10:00 AM' ? 'selected' : ''}`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Call Duration</label>
                  <select className="chat-search-input" style={{ paddingLeft: '12px' }}>
                    <option selected>30 minutes</option>
                    <option>1 hour</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowScheduleModal(false)}>Cancel</button>
              <button className="btn-primary btn-confirm-schedule" style={{ flex: 2 }} onClick={() => setShowScheduleModal(false)}>Confirm Call</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLawyer;
