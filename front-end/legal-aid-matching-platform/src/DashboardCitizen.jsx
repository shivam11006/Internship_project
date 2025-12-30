import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import CaseSubmission from './CaseSubmission';
import Directory from './Directory';
import CaseManagement from './CaseManagement';
import Matches from './Matches';
import './Dashboard.css';
import './SecureChat.css';

function DashboardCitizen() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeChat, setActiveChat] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    location: '',
  });

  // Mock Data for Secure Chat
  const [conversations] = useState([
    {
      id: 0,
      name: 'Anya Sharma (Lawyer)',
      role: 'Lawyer',
      lastMsg: 'Thank you for the update. I\'ll review it.',
      time: '10:30 AM',
      unread: 2,
      matchScore: '92%',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
      id: 1,
      name: 'Legal Aid Foundation (NGO)',
      role: 'NGO',
      lastMsg: 'We\'ve received your documents. Our team is working on it.',
      time: 'Yesterday',
      unread: 0,
      matchScore: '88%',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
      id: 2,
      name: 'Michael Chen (Lawyer)',
      role: 'Lawyer',
      lastMsg: 'I\'m available next Tuesday for a call.',
      time: '2 days ago',
      unread: 0,
      matchScore: '95%',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
      id: 3,
      name: 'Community Justice Center (NGO)',
      role: 'NGO',
      lastMsg: 'Please provide more details on the incident.',
      time: '3 days ago',
      unread: 1,
      matchScore: '85%',
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    }
  ]);

  const [messages] = useState([
    { id: 1, text: 'Hello, I need some legal advice regarding a property dispute.', sender: 'user', time: '10:00 AM' },
    { id: 2, text: 'Sure, I can help you with that. Can you provide more details?', sender: 'contact', time: '10:05 AM' },
    { id: 3, text: 'The dispute is with my neighbor over the boundary line.', sender: 'user', time: '10:10 AM' },
    { id: 4, text: 'I see. Do you have the property documents?', sender: 'contact', time: '10:15 AM' },
    { id: 5, text: 'Yes, I have them ready.', sender: 'user', time: '10:20 AM' },
    { id: 6, text: 'Great. Please share them here or we can schedule a call.', sender: 'contact', time: '10:25 AM' },
    { id: 7, text: 'Thank you for the update. I\'ll review it.', sender: 'contact', time: '10:30 AM' },
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await authService.getProfile();
      if (result.success) {
        setProfileData({
          username: result.data.username || '',
          email: result.data.email || '',
          location: result.data.location || '',
        });
      }
    };
    fetchProfile();
  }, []);

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
      alert('Profile updated successfully!');
      setIsEditing(false);
    } else {
      alert(result.error || 'Failed to update profile');
    }
  };

  const handleCancelEdit = async () => {
    const result = await authService.getProfile();
    if (result.success) {
      setProfileData({
        username: result.data.username || '',
        email: result.data.email || '',
        location: result.data.location || '',
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

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <nav className="dashboard-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
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
            className={`nav-item ${activeTab === 'case-submission' ? 'active' : ''}`}
            onClick={() => setActiveTab('case-submission')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Case Submission</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'my-cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-cases')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>My Cases</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Directory</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>My Matches</span>
          </button>

          <button className="nav-item">
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Impact Dashboard</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="dashboard-logo">
              <div className="logo-icon">⚖️</div>
              <span className="logo-text">LegalMatch Pro</span>
            </div>
            <div className="header-divider"></div>
            <h1 className="dashboard-title">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'secure-chat' && 'Secure Chat'}
              {activeTab === 'case-submission' && 'Case Submission'}
              {activeTab === 'my-cases' && 'My Cases'}
              {activeTab === 'directory' && 'Filterable Directory'}
              {activeTab === 'matches' && 'My Matches'}
            </h1>
          </div>
          <div className="header-profile">
            <div className="profile-dropdown" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-avatar">
                {user?.username?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.username || 'Citizen'}</div>
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
          {activeTab === 'dashboard' && (
            <div className="welcome-section">
              <div className="welcome-card">
                <div className="welcome-icon">👋</div>
                <h2 className="welcome-title">Hi, {user?.username}!</h2>
                <p className="welcome-text">
                  Welcome to your Legal Aid dashboard. Navigate through the menu to submit cases, search the directory, or view your matches.
                </p>
              </div>

              <div className="feature-cards">
                <div className="feature-card">
                  <div className="feature-icon blue">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3>Find Legal Help</h3>
                  <p>Browse our directory of verified lawyers and NGOs</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon purple">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3>Smart Matching</h3>
                  <p>Get matched with the right legal professionals</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon green">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3>Secure & Confidential</h3>
                  <p>Your information is protected and encrypted</p>
                </div>
              </div>
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
                      <span className="match-score-pill">Match Score: {currentContact.matchScore}</span>
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
                  {['Thanks!', 'Got it.', 'Okay, sounds good.', 'When are you free for a call?', 'Please elaborate.'].map((reply, i) => (
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
                    <button className="btn-input-icon">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
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

          {activeTab === 'case-submission' && (
            <CaseSubmission onSuccess={() => setActiveTab('my-cases')} />
          )}

          {activeTab === 'my-cases' && (
            <CaseManagement />
          )}

          {activeTab === 'directory' && (
            <Directory />
          )}

          {activeTab === 'matches' && (
            <div className="matches-view">
              <div className="matches-info-banner" style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '32px' }}>💡</div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>About Matches</h3>
                  <p style={{ margin: 0, opacity: 0.95 }}>View matched lawyers and NGOs for your submitted cases. Accept or reject matches to find the perfect legal assistance.</p>
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#fef3c7',
                border: '2px solid #fbbf24',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <strong>🔧 Demo Mode:</strong> Click "View Matches" button on any case in "My Cases" tab to see the matches interface.
                <br /><small>In production, matches will be auto-generated when cases are submitted.</small>
              </div>
            </div>
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
                  {user?.username?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="profile-role-badge">{user?.role || 'CITIZEN'}</div>
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
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={!isEditing ? 'disabled' : ''}
                    placeholder="Enter your location"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {!isEditing ? (
                <button className="btn-primary" onClick={handleEditProfile}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
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
                    <option>Select a time zone</option>
                    <option selected>India Standard Time (IST)</option>
                    <option>Pacific Standard Time (PST)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Proposed Time Slots</label>
                  <div className="time-slots-grid">
                    {['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM', '5:00 PM'].map((slot, i) => (
                      <button key={i} className={`time-slot-btn ${slot === '10:30 AM' ? 'selected' : ''}`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Call Duration</label>
                  <select className="chat-search-input" style={{ paddingLeft: '12px' }}>
                    <option>Select duration</option>
                    <option selected>30 minutes</option>
                    <option>1 hour</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reminders</label>
                  <div className="reminder-options">
                    <label className="checkbox-group">
                      <input type="checkbox" defaultChecked />
                      15 minutes before the call
                    </label>
                    <label className="checkbox-group">
                      <input type="checkbox" />
                      1 hour before the call
                    </label>
                  </div>
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

export default DashboardCitizen;
