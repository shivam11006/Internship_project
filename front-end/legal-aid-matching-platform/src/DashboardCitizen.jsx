import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

  // State for Match Profile Modal
  const [showMatchProfileModal, setShowMatchProfileModal] = useState(false);
  const [selectedMatchProfile, setSelectedMatchProfile] = useState(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: 'message',
      message: 'New message from Anya Sharma (Lawyer)',
      time: '5 min ago',
      read: false
    },
    {
      id: 2,
      type: 'schedule',
      message: 'Appointment reminder: Call with Legal Aid Foundation tomorrow at 10 AM',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'system',
      message: 'Your case #12345 has been successfully submitted',
      time: '2 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'alert',
      message: 'Please update your profile information',
      time: '1 day ago',
      read: true
    }
  ]);

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
    { id: 6, text: 'Great. Please share them here or we can schedule a call.', sender: 'contact', time: '10:25 AM' },
    { id: 7, text: 'Thank you for the update. I\'ll review it.', sender: 'contact', time: '10:30 AM' },
  ]);

  // Mock Data for Dashboard
  const dashboardStats = {
    newMatches: { value: 12, label: 'This week' },
    activeConversations: { value: 7, label: 'With lawyers/NGOs' },
    scheduledCalls: { value: 3, label: 'Upcoming sessions' },
    resolvedCases: { value: 25, label: 'Total cases' }
  };

  const recentMatches = [
    {
      id: 1,
      name: 'Sarah Chen, Esq.',
      role: 'Lawyer',
      description: 'New match, specializes in Family Law',
      time: '2 hours ago',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      online: true,
      rating: 4.8,
      location: 'New York, NY',
      email: 'sarah.chen@examplelaw.com',
      phone: '+1 (212) 555-0188',
      website: 'www.sarahchenlaw.com',
      practiceAreas: ['Family Law', 'Immigration', 'Civil Rights', 'Housing Law', 'Employment Law'],
      availability: 'Available for new consultations',
      matchPercentage: 92,
      recentActivity: [
        'Responded to 3 inquiries this week.',
        'Updated availability for April.',
        'Featured in "Legal Aid Hero" article.',
        'Completed "Advanced Immigration Law" training.',
        'Resolved 2 pro bono cases last month.'
      ],
      caseHistory: 'Sarah Chen is an experienced attorney specializing in pro bono legal services, with a strong focus on family law and immigration cases for underserved communities. She has successfully represented clients in over 150 complex family disputes, including divorce, child custody, and adoption cases, ensuring fair outcomes and protecting client rights. Her immigration work spans asylum applications, visa petitions, and deportation defense, consistently achieving positive results for vulnerable individuals seeking legal residency.',
      documents: [
        { name: 'Firm Profile Brochure', type: 'pdf' },
        { name: 'Licensing Information (NY Bar)', type: 'pdf' },
        { name: 'Client Testimonials Summary', type: 'pdf' }
      ]
    },
    {
      id: 2,
      name: 'Justice Alliance',
      role: 'NGO',
      description: 'Responded to your inquiry',
      time: 'Yesterday',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      online: false,
      rating: 4.9,
      location: 'Washington, DC',
      email: 'contact@justicealliance.org',
      phone: '+1 (202) 555-0199',
      website: 'www.justicealliance.org',
      practiceAreas: ['Human Rights', 'Public Interest', 'Environmental Law'],
      availability: 'Accepting new cases',
      matchPercentage: 88,
      recentActivity: [
        'Organized a community legal clinic.',
        'Published annual impact report.',
        'Partnered with 5 new law firms.'
      ],
      caseHistory: null,
      documents: null
    },
    {
      id: 3,
      name: 'Legal Aid Corps',
      role: 'NGO',
      description: 'Confirmed call for next Tuesday',
      time: '2 days ago',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      online: true,
      rating: 4.7,
      location: 'Chicago, IL',
      email: 'info@legalaidcorps.org',
      phone: '+1 (312) 555-0177',
      website: 'www.legalaidcorps.org',
      practiceAreas: ['Housing Law', 'Debt Relief', 'Veterans Rights'],
      availability: 'Limited availability',
      matchPercentage: 85,
      recentActivity: [
        'Provided aid to 500+ families this year.',
        'launched a new legal helpline.'
      ]
    },
    {
      id: 4,
      name: 'Advocate Sharma',
      role: 'Lawyer',
      description: 'Viewed your profile',
      time: '3 days ago',
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      online: false,
      rating: 4.5,
      location: 'Mumbai, MH',
      email: 'sharma.advocate@law.in',
      phone: '+91 98765 43210',
      website: 'www.sharmalaw.in',
      practiceAreas: ['Property Law', 'Criminal Defense', 'Tax Law'],
      availability: 'Consultation by appointment',
      matchPercentage: 80,
      recentActivity: [
        'Won a high-profile property case.',
        'Joined the Bar Association panel.'
      ]
    }
  ];

  const matchesOverTimeData = [
    { name: 'Jan', matches: 5 },
    { name: 'Feb', matches: 7 },
    { name: 'Mar', matches: 10 },
    { name: 'Apr', matches: 12 },
    { name: 'May', matches: 15 },
    { name: 'Jun', matches: 18 }
  ];

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

  const handleChatClick = (match) => {
    // In a real app, you might want to set the active chat to this specific match
    // For now, we just navigate to the tab
    setActiveTab('secure-chat');
  };

  const handleProfileClick = (match) => {
    setSelectedMatchProfile(match);
    setShowMatchProfileModal(true);
  };

  const handleCloseMatchProfile = () => {
    setShowMatchProfileModal(false);
    setSelectedMatchProfile(null);
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
          <div className="header-right">
            <div className="notification-container" style={{ position: 'relative' }}>
              <button
                className={`notification-btn ${showNotifications ? 'active' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.some(n => !n.read) && <span className="notification-indicator"></span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button className="mark-read-btn" onClick={() => {
                      // In a real app, this would update backend
                      alert('Marked all as read');
                    }}>Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                          <div className={`notification-icon ${notification.type}`}>
                            {notification.type === 'message' && '💬'}
                            {notification.type === 'schedule' && '📅'}
                            {notification.type === 'system' && '🔔'}
                            {notification.type === 'alert' && '⚠️'}
                          </div>
                          <div className="notification-content">
                            <p className="notification-text">{notification.message}</p>
                            <span className="notification-time">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
        </div>

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="new-dashboard-container">
              <div className="dashboard-intro">
                <h2 className="intro-title">Notifications & Matches Dashboard</h2>
                <p className="intro-subtitle">Overview of your recent legal aid activity and matching metrics.</p>
              </div>

              {/* Metrics Cards */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">New Matches</span>
                    <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="metric-value">{dashboardStats.newMatches.value}</div>
                  <div className="metric-label">{dashboardStats.newMatches.label}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Active Conversations</span>
                    <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="metric-value">{dashboardStats.activeConversations.value}</div>
                  <div className="metric-label">{dashboardStats.activeConversations.label}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Scheduled Calls</span>
                    <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="metric-value">{dashboardStats.scheduledCalls.value}</div>
                  <div className="metric-label">{dashboardStats.scheduledCalls.label}</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Resolved Cases</span>
                    <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="metric-value">{dashboardStats.resolvedCases.value}</div>
                  <div className="metric-label">{dashboardStats.resolvedCases.label}</div>
                </div>
              </div>

              <div className="dashboard-grid-layout">
                {/* Recent Matches Section */}
                <div className="recent-matches-section">
                  <h3 className="section-title">Recent Chats</h3>
                  <div className="recent-matches-list">
                    {recentMatches.map((match) => (
                      <div key={match.id} className="match-card-item">
                        <div className="match-card-left">
                          <div className="match-avatar-wrapper">
                            <img src={match.avatar} alt={match.name} className="match-avatar" />
                            <span className={`status-dot ${match.online ? 'online' : 'offline'}`}></span>
                          </div>
                          <div className="match-info">
                            <div className="match-name-row">
                              <span className="match-name">{match.name}</span>
                              <span className="match-role">({match.role})</span>
                            </div>
                            <div className="match-desc">{match.description}</div>
                            <div className="match-time">{match.time}</div>
                          </div>
                        </div>
                        <div className="match-actions">
                          <button
                            className="btn-match-action btn-chat"
                            onClick={() => handleChatClick(match)}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Chat
                          </button>
                          <button
                            className="btn-match-action btn-profile"
                            onClick={() => handleProfileClick(match)}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart Section */}
                <div className="chart-section">
                  <h3 className="section-title">Matches Over Time</h3>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={matchesOverTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          domain={[4, 20]}
                          ticks={[4, 8, 12, 16, 20]}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="matches"
                          stroke="#7c3aed"
                          strokeWidth={2}
                          dot={{ fill: '#7c3aed', stroke: '#fff', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="chart-legend">
                      <span className="legend-dot"></span>
                      <span className="legend-text">Matches</span>
                    </div>
                  </div>
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

      {/* Match Profile Modal */}
      {showMatchProfileModal && selectedMatchProfile && (
        <div className="modal-overlay" onClick={handleCloseMatchProfile}>
          <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Match Profile</h2>
              <button className="modal-close" onClick={handleCloseMatchProfile}>×</button>
            </div>
            <div className="modal-body profile-modal-body">
              <div className="profile-modal-grid">
                {/* Left Column: Details */}
                <div className="profile-left-col">
                  <div className="profile-header-new">
                    <img
                      src={selectedMatchProfile.avatar}
                      alt={selectedMatchProfile.name}
                      className="profile-modal-avatar"
                    />
                    <div className="profile-header-info">
                      <div className="profile-name-row">
                        <h2>{selectedMatchProfile.name}</h2>
                        <span className="verified-badge">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified {selectedMatchProfile.role}
                        </span>
                      </div>
                      <div className="profile-rating">
                        <span className="stars">⭐ {selectedMatchProfile.rating || 'N/A'}</span>
                        <span className="rating-count">(4.8)</span>
                      </div>
                      <div className="profile-contact-info">
                        <div className="contact-row">
                          <span className="icon">📍</span> {selectedMatchProfile.location || 'Location N/A'}
                        </div>
                        <div className="contact-row">
                          <span className="icon">✉️</span> {selectedMatchProfile.email || 'email@example.com'}
                        </div>
                        <div className="contact-row">
                          <span className="icon">📞</span> {selectedMatchProfile.phone || '+1 (555) 000-0000'}
                        </div>
                        <div className="contact-row">
                          <span className="icon">🌐</span> {selectedMatchProfile.website || 'www.website.com'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section-block">
                    <h3>Practice Areas</h3>
                    <div className="practice-areas-list">
                      {selectedMatchProfile.practiceAreas?.map((area, idx) => (
                        <span key={idx} className="practice-area-tag">{area}</span>
                      )) || <span className="practice-area-tag">General Law</span>}
                    </div>
                  </div>

                  <div className="profile-section-block">
                    <h3>Availability</h3>
                    <p className="availability-text">{selectedMatchProfile.availability || 'Contact for availability'}</p>

                    <div className="match-score-banner">
                      <div className="score-ring">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7c3aed" strokeWidth="3" strokeDasharray={`${selectedMatchProfile.matchPercentage || 100}, 100`} />
                        </svg>
                        <span className="score-text">{selectedMatchProfile.matchPercentage || 90}%</span>
                      </div>
                      <div className="score-details">
                        <h4 style={{ color: '#5b21b6' }}>High Compatibility</h4>
                        <p>Based on your case details and preferences.</p>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section-block">
                    <h3>Case History & Experience</h3>
                    <p className="case-history-text">
                      {selectedMatchProfile.caseHistory || 'Detailed case history and verified experience data would appear here.'}
                    </p>
                  </div>
                </div>

                {/* Right Column: Actions & Activity */}
                <div className="profile-right-col">
                  <div className="action-card">
                    <h3>Actions</h3>
                    <button className="btn-action-primary" onClick={() => { handleCloseMatchProfile(); handleChatClick(selectedMatchProfile); }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Message
                    </button>
                    <button className="btn-action-outline">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule Call
                    </button>
                    <button className="btn-action-outline">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Add to Shortlist
                    </button>
                  </div>

                  <div className="activity-card">
                    <h3>Recent Activity</h3>
                    <ul className="activity-list">
                      {selectedMatchProfile.recentActivity?.map((activity, idx) => (
                        <li key={idx} className="activity-item">{activity}</li>
                      )) || <li className="activity-item">No recent activity.</li>}
                    </ul>
                  </div>

                  <div className="activity-card">
                    <h3>Documents</h3>
                    {selectedMatchProfile.documents ? (
                      <div className="document-list">
                        {selectedMatchProfile.documents.map((doc, idx) => (
                          <div key={idx} className="document-row">
                            <div className="document-icon">
                              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="document-name">{doc.name}</span>
                            <button className="btn-download">
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="document-placeholder">
                        No public documents available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
