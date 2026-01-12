import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import authService from './services/authService';
import chatService from './services/chatService';
import appointmentService from './services/appointmentService';
import * as matchService from './services/matchService';
import NotificationPanel from './NotificationPanel';
import CaseSubmission from './CaseSubmission';
import Directory from './Directory';
import CaseManagement from './CaseManagement';
import Matches from './Matches';
import MyAppointments from './MyAppointments';
import './Dashboard.css';
import './SecureChat.css';

// My Matches View Component
function MyMatchesView() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMyMatches();
  }, []);

  const fetchMyMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matchService.getMyMatches();
      setMatches(response.matches || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load matches. Please try again.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: '#f59e0b', label: 'Pending', bg: '#fef3c7' },
      SELECTED_BY_CITIZEN: { color: '#3b82f6', label: 'Selected', bg: '#dbeafe' },
      ACCEPTED_BY_PROVIDER: { color: '#10b981', label: 'Accepted', bg: '#d1fae5' },
      REJECTED_BY_CITIZEN: { color: '#ef4444', label: 'Rejected', bg: '#fee2e2' },
      REJECTED_BY_PROVIDER: { color: '#ef4444', label: 'Declined', bg: '#fee2e2' }
    };
    const config = statusConfig[status] || { color: '#6b7280', label: status, bg: '#f3f4f6' };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: config.color,
        background: config.bg
      }}>
        {config.label}
      </span>
    );
  };

  const filteredMatches = matches.filter(match => {
    // Only show selected, accepted, or rejected matches (not pending)
    const validStatuses = ['SELECTED_BY_CITIZEN', 'ACCEPTED_BY_PROVIDER', 'REJECTED_BY_CITIZEN'];
    if (!validStatuses.includes(match.status)) return false;

    if (filterStatus === 'all') return true;
    return match.status === filterStatus;
  });

  // Group matches by case
  const matchesByCase = {};
  filteredMatches.forEach(match => {
    if (!matchesByCase[match.caseId]) {
      matchesByCase[match.caseId] = {
        caseTitle: match.caseTitle,
        caseType: match.caseType,
        matches: []
      };
    }
    matchesByCase[match.caseId].matches.push(match);
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
        <p>Loading your matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchMyMatches} style={{
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        marginBottom: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>My Matches</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          History of all matches - accepted and rejected cases ({matches.length} total)
        </p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {['all', 'SELECTED_BY_CITIZEN', 'ACCEPTED_BY_PROVIDER', 'REJECTED_BY_CITIZEN'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: filterStatus === status ? '2px solid #667eea' : '2px solid #e5e7eb',
              background: filterStatus === status ? '#ede9fe' : 'white',
              color: filterStatus === status ? '#667eea' : '#6b7280',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Matches grouped by case */}
      {Object.keys(matchesByCase).length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No matches found</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {filterStatus === 'all'
              ? 'Submit cases to get matched with lawyers and NGOs'
              : `No matches with status: ${filterStatus.replace(/_/g, ' ')}`
            }
          </p>
        </div>
      ) : (
        Object.entries(matchesByCase).map(([caseId, caseData]) => (
          <div key={caseId} style={{
            marginBottom: '24px',
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #f3f4f6' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#111827' }}>
                {caseData.caseTitle}
              </h3>
              <span style={{
                fontSize: '13px',
                color: '#6b7280',
                background: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {caseData.caseType}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {caseData.matches.map(match => (
                <div key={match.id} style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}>
                        {match.providerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                          {match.providerName || 'Unknown Provider'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {match.providerType} • {match.providerLocation || 'Location not specified'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      Match Score: <span style={{ fontWeight: '600', color: '#667eea' }}>
                        {Math.round(match.matchScore || 0)}%
                      </span>
                    </div>
                    {match.matchReason && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '4px',
                        marginTop: '8px'
                      }}>
                        {match.matchReason}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {getStatusBadge(match.status)}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {new Date(match.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DashboardCitizen() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeChat, setActiveChat] = useState(null); // Will store matchId

  // Appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    appointmentType: 'call', // 'call' or 'offline'
    date: '',
    time: '',
    venue: '',
    meetingLink: '',
    durationMinutes: '',
    location: '',
    address: '',
    notes: '',
    agenda: ''
  });
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentError, setAppointmentError] = useState(null);

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const typingTimeoutRef = useRef(null);
  const hasAutoSelectedRef = useRef(false);
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Mock Notification Data
  const [mockNotifications, setMockNotifications] = useState({
    messages: [
      { id: 1, sender: 'Michael Chen (Lawyer)', text: 'Reviewing your case documents.', time: 'Just now' },
      { id: 2, sender: 'Anya Sharma (Lawyer)', text: 'Can we schedule a call for next week?', time: '5 min ago' }
    ],
    appointments: [
      { id: 101, name: 'Michael Chen', date: 'Jan 12, 2026', time: '2:00 PM' },
      { id: 102, name: 'Legal Aid Foundation', date: 'Jan 13, 2026', time: '10:00 AM' }
    ]
  });

  const handleAcceptMockAppointment = (id) => {
    alert('Appointment Request Accepted!');
    // Update mock state to remove the accepted item
    setMockNotifications(prev => ({
      ...prev,
      appointments: prev.appointments.filter(a => a.id !== id)
    }));
  };

  const handleRejectMockAppointment = (id) => {
    alert('Appointment Request Declined.');
    // Update mock state to remove the rejected item
    setMockNotifications(prev => ({
      ...prev,
      appointments: prev.appointments.filter(a => a.id !== id)
    }));
  };

  // Appointment State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Real Chat Data
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);

  // Mock Data for Dashboard
  const dashboardStats = {
    newMatches: { value: 12, label: 'This week' },
    activeConversations: { value: conversations.length || 0, label: 'With lawyers/NGOs' },
    scheduledCalls: { value: appointments.length, label: 'Upcoming sessions' },
    resolvedCases: { value: 0, label: 'Total cases' }
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

  ];

  const [matchesOverTimeData, setMatchesOverTimeData] = useState([]);

  // Utility function to format relative time
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Process matches for the chart (last 6 months)
  const processMatchesForChart = (matches) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const last6Months = [];

    // Initialize last 6 months with 0 matches
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        name: months[d.getMonth()],
        matches: 0
      });
    }

    // Count matches per month
    matches.forEach(match => {
      if (!match.createdAt) return;
      const matchDate = new Date(match.createdAt);
      const matchMonth = matchDate.getMonth();
      const matchYear = matchDate.getFullYear();

      const monthData = last6Months.find(m => m.monthIndex === matchMonth && m.year === matchYear);
      if (monthData) {
        monthData.matches++;
      }
    });

    return last6Months;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      // Load Profile
      try {
        const profileResult = await authService.getProfile();
        if (profileResult.success) {
          setProfileData({
            username: profileResult.data.username || '',
            email: profileResult.data.email || '',
            location: profileResult.data.location || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }

      // Load Matches for Chart
      try {
        const matchesResult = await matchService.getMyMatches();
        if (matchesResult.matches) {
          const processedData = processMatchesForChart(matchesResult.matches);
          setMatchesOverTimeData(processedData);
        }
      } catch (error) {
        console.error('Error loading matches for chart:', error);
        // Fallback to empty chart or error state if needed
        setMatchesOverTimeData([]);
      }
    };

    loadDashboardData();
  }, []);

  // Load upcoming appointments
  const loadUpcomingAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true);
      const result = await appointmentService.getUpcomingAppointments();
      // API returns array directly, not wrapped in {success, data}
      setAppointments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  // Load appointments on mount
  useEffect(() => {
    loadUpcomingAppointments();
  }, [loadUpcomingAppointments]);

  // Initialize WebSocket connection and load conversations
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Only connect if user is authenticated
        if (!authService.isAuthenticated()) {
          console.log('User not authenticated, skipping chat initialization');
          return;
        }

        // Connect WebSocket
        try {
          await chatService.connect();
          setWsConnected(true);
        } catch (wsError) {
          console.warn('WebSocket connection failed (this is OK if backend is not running):', wsError);
          setWsConnected(false);
          // Don't throw - allow app to continue without WebSocket
        }

        // Load conversations (this should work even without WebSocket)
        // Only auto-select on initial load
        try {
          await loadConversations(true); // true = auto-select first conversation
        } catch (loadError) {
          console.warn('Failed to load conversations:', loadError);
          // Don't throw - allow app to continue
        }

        // Set up connection status handler
        chatService.onConnectionChange((connected) => {
          setWsConnected(connected);
        });

        // Set up error handler
        chatService.onError((error) => {
          console.error('Chat error:', error);
          // Don't show alert for every error, just log it
        });
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setWsConnected(false);
        // Don't throw - allow app to continue
      }
    };

    // Initialize chat only if authenticated
    if (authService.isAuthenticated()) {
      initializeChat();
    }

    // Cleanup on unmount
    return () => {
      try {
        chatService.disconnect();
      } catch (error) {
        console.warn('Error disconnecting chat:', error);
      }
    };
  }, []);

  // Load conversations from API
  const loadConversations = useCallback(async (autoSelect = false) => {
    // Prevent multiple simultaneous calls
    if (loadingConversations) {
      console.log('Already loading conversations, skipping...');
      return;
    }

    setLoadingConversations(true);
    try {
      console.log('Loading conversations...', { autoSelect, activeChat, hasAutoSelected: hasAutoSelectedRef.current });
      const result = await chatService.getConversations();
      console.log('Load conversations result:', result);

      if (result.success && result.data) {
        const convos = result.data.conversations || [];
        console.log(`Loaded ${convos.length} conversations:`, convos);
        setConversations(convos);

        // Only auto-select if explicitly requested AND no active chat AND we haven't already auto-selected
        if (autoSelect && !activeChat && !hasAutoSelectedRef.current && convos.length > 0) {
          console.log('Auto-selecting first conversation:', convos[0].matchId);
          hasAutoSelectedRef.current = true; // Mark that we've auto-selected
          // Use setTimeout to avoid calling during state update and prevent loop
          setTimeout(() => {
            if (!activeChat) { // Double-check activeChat hasn't changed
              handleSelectConversation(convos[0].matchId);
            }
          }, 100);
        } else if (convos.length === 0) {
          console.log('No conversations found. Make sure you have accepted matches with status SELECTED_BY_CITIZEN or ACCEPTED_BY_PROVIDER.');
        }
      } else {
        console.error('Failed to load conversations:', result.error);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, loadingConversations]); // Removed handleSelectConversation from dependencies to break cycle

  // Load messages for a match
  const loadMessages = async (matchId) => {
    if (!matchId) return;

    setLoadingMessages(true);
    try {
      const result = await chatService.getChatHistory(matchId, 0, 50);
      if (result.success && result.data) {
        const msgs = result.data.messages || [];
        const currentUser = authService.getCurrentUser();

        // Convert backend messages to frontend format
        const formattedMessages = msgs.map(msg => {
          // Determine if message is from current user
          // Primary check: use isOwnMessage flag from backend
          // Fallback: compare sender ID with current user ID
          let isOwn = msg.isOwnMessage;
          if (isOwn === undefined || isOwn === null) {
            isOwn = msg.senderId === currentUser?.id;
          }

          return {
            id: msg.id,
            text: msg.content,
            sender: isOwn ? 'user' : 'contact',
            time: formatMessageTime(msg.sentAt),
            sentAt: msg.sentAt,
            isRead: msg.isRead,
            senderId: msg.senderId
          };
        });

        setMessages(formattedMessages);

        // Mark messages as read
        await chatService.markAsRead(matchId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Format message time
  const formatMessageTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Format conversation time
  const formatConversationTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Handle selecting a conversation
  const handleSelectConversation = async (matchId) => {
    setActiveChat(matchId);
    setCurrentMatchId(matchId);
    setMessages([]);

    // Unsubscribe from previous match
    if (currentMatchId && currentMatchId !== matchId) {
      chatService.unsubscribeFromMatch(currentMatchId);
    }

    // Subscribe to new match
    chatService.subscribeToMatch(matchId);

    // Set up message handler
    chatService.onMessage(matchId, (message) => {
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }

        const currentUser = authService.getCurrentUser();

        // Determine if message is from current user
        // Primary check: use isOwnMessage flag from backend
        // Fallback: compare sender ID with current user ID
        let isOwn = message.isOwnMessage;
        if (isOwn === undefined || isOwn === null) {
          isOwn = message.senderId === currentUser?.id;
        }

        return [...prev, {
          id: message.id,
          text: message.content,
          sender: isOwn ? 'user' : 'contact',
          time: formatMessageTime(message.sentAt),
          sentAt: message.sentAt,
          isRead: message.isRead,
          senderId: message.senderId
        }];
      });
    });

    // Set up typing indicator handler
    chatService.onTyping(matchId, (indicator) => {
      setIsTyping(indicator.isTyping);
    });

    // Load message history
    await loadMessages(matchId);

    // Mark as read
    await chatService.markAsRead(matchId);

    // Refresh conversations to update unread counts (avoid circular call)
    // loadConversations will be called separately if needed
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentMatchId) return;

    const content = messageText.trim();
    setMessageText('');

    try {
      await chatService.sendMessage(currentMatchId, content);
      // Message will be added via WebSocket handler
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setMessageText(content); // Restore message text
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!currentMatchId) return;

    // Send typing indicator
    chatService.sendTypingIndicator(currentMatchId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      chatService.sendTypingIndicator(currentMatchId, false);
    }, 3000);
  };

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

  const handleChatClick = async (match) => {
    setActiveTab('secure-chat');

    // If match has a matchId, start/select that conversation
    if (match?.matchId) {
      const matchId = match.matchId;

      // Check if this conversation already exists in the list
      const existingConvo = conversations.find(c => c.matchId === matchId);

      if (existingConvo) {
        // Conversation exists, just select it
        await handleSelectConversation(matchId);
      } else {
        // Conversation doesn't exist yet, but we can still start chatting
        // This will work if the match status is SELECTED_BY_CITIZEN or ACCEPTED_BY_PROVIDER
        try {
          // Try to load the match's chat history (this will validate if chat is allowed)
          const result = await chatService.getChatHistory(matchId, 0, 50);

          if (result.success) {
            // Chat is available, set up the conversation
            await handleSelectConversation(matchId);
            // Don't call loadConversations here to avoid infinite loop
            // Conversations will be refreshed on next manual load
          } else {
            // Chat not available - show message
            alert('Chat is not available for this match yet. Please accept the match first, or wait for the provider to accept your case.');
          }
        } catch (error) {
          console.error('Error starting chat:', error);
          alert('Unable to start chat. Please make sure the match has been accepted and try again.');
        }
      }
    } else {
      // No matchId provided, just navigate to chat tab
      console.warn('No matchId provided to handleChatClick');
    }
  };

  const handleProfileClick = (match) => {
    setSelectedMatchProfile(match);
    setShowMatchProfileModal(true);
  };

  const handleCloseMatchProfile = () => {
    setShowMatchProfileModal(false);
    setSelectedMatchProfile(null);
  };

  const handleOpenScheduleModal = () => {
    // Reset form when opening modal
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    setAppointmentForm({
      appointmentType: 'call',
      date: defaultDate,
      time: '10:30',
      venue: '',
      meetingLink: '',
      durationMinutes: '',
      location: '',
      address: '',
      notes: '',
      agenda: ''
    });
    setAppointmentError(null);
    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setAppointmentError(null);
  };

  const handleAppointmentFormChange = (field, value) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
    setAppointmentError(null);
  };

  const handleTimeSlotSelect = (time) => {
    handleAppointmentFormChange('time', time);
  };

  const handleSubmitAppointment = async () => {
    if (!currentContact) {
      setAppointmentError('No contact selected');
      return;
    }

    // Validate form
    if (!appointmentForm.date || !appointmentForm.time) {
      setAppointmentError('Please select date and time');
      return;
    }

    // Validate duration
    if (!appointmentForm.durationMinutes || isNaN(Number(appointmentForm.durationMinutes)) || Number(appointmentForm.durationMinutes) <= 0) {
      setAppointmentError('Please enter a valid duration in minutes');
      return;
    }

    // Validate based on appointment type
    if (appointmentForm.appointmentType === 'offline') {
      if (!appointmentForm.venue || !appointmentForm.venue.trim()) {
        setAppointmentError('Please provide a venue for offline meeting');
        return;
      }
      if (!appointmentForm.location || !appointmentForm.location.trim()) {
        setAppointmentError('Please provide a location for offline meeting');
        return;
      }
      if (!appointmentForm.address || !appointmentForm.address.trim()) {
        setAppointmentError('Please provide an address for offline meeting');
        return;
      }
    } else if (appointmentForm.appointmentType === 'call') {
      if (!appointmentForm.meetingLink || !appointmentForm.meetingLink.trim()) {
        setAppointmentError('Please provide a phone number or meeting link for call appointments');
        return;
      }
    }

    // Validate notes field (required for all appointment types)
    if (!appointmentForm.notes || !appointmentForm.notes.trim()) {
      setAppointmentError('Please provide notes for the appointment');
      return;
    }

    setSubmittingAppointment(true);
    setAppointmentError(null);

    try {
      // Combine date and time into ISO datetime format
      const scheduledDateTime = `${appointmentForm.date}T${appointmentForm.time}:00`;

      const appointmentData = {
        matchId: currentContact.matchId,
        scheduledDateTime: scheduledDateTime,
        appointmentTime: `${appointmentForm.time}:00`,
        appointmentType: appointmentForm.appointmentType.toUpperCase(),
        venue: appointmentForm.appointmentType === 'offline' ? appointmentForm.venue : null,
        meetingLink: appointmentForm.appointmentType === 'call' ? appointmentForm.meetingLink : null,
        durationMinutes: Number(appointmentForm.durationMinutes),
        location: appointmentForm.location || null,
        address: appointmentForm.address || null,
        notes: appointmentForm.notes || null,
        agenda: appointmentForm.agenda || null
      };

      const response = await appointmentService.createAppointment(appointmentData);
      console.log('Appointment created successfully:', response);
      alert(`Appointment scheduled successfully! Status: ${response.statusDescription || response.status}`);
      handleCloseScheduleModal();
      // Optionally refresh appointments list
      // await loadUpcomingAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      setAppointmentError(error.message || 'Failed to create appointment');
    } finally {
      setSubmittingAppointment(false);
    }
  };

  const currentContact = conversations.find(c => c.matchId === activeChat);

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

          <button
            className={`nav-item ${activeTab === 'my-appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-appointments')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>My Appointments</span>
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
              {activeTab === 'my-appointments' && 'My Appointments'}
            </h1>
          </div>
          <div className="header-right">
            {/* Notification Panel */}
            <NotificationPanel />

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
                {/* Recent Chats Section */}
                <div className="recent-matches-section">
                  <h3 className="section-title">Recent Chats</h3>
                  <div className="recent-matches-list">
                    {loadingConversations ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        Loading conversations...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        No recent chats. Start a conversation with matched lawyers or NGOs!
                      </div>
                    ) : (
                      conversations.slice(0, 5).map((conversation) => {
                        const timeAgo = conversation.lastMessageTime
                          ? formatTimeAgo(new Date(conversation.lastMessageTime))
                          : 'No messages yet';

                        return (
                          <div key={conversation.matchId} className="match-card-item">
                            <div className="match-card-left">
                              <div className="match-avatar-wrapper">
                                <div className="match-avatar" style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '16px'
                                }}>
                                  {conversation.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <span className="status-dot online"></span>
                                )}
                              </div>
                              <div className="match-info">
                                <div className="match-name-row">
                                  <span className="match-name">{conversation.otherUserName || 'Unknown'}</span>
                                  <span className="match-role">({conversation.otherUserRole || 'User'})</span>
                                </div>
                                <div className="match-desc" style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '200px'
                                }}>
                                  {conversation.lastMessage || 'No messages yet'}
                                </div>
                                <div className="match-time">
                                  {timeAgo}
                                  {conversation.unreadCount > 0 && (
                                    <span style={{
                                      marginLeft: '8px',
                                      background: '#667eea',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      fontSize: '11px',
                                      fontWeight: 'bold'
                                    }}>
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="match-actions">
                              <button
                                className="btn-match-action btn-chat"
                                onClick={() => {
                                  handleSelectConversation(conversation.matchId);
                                  setActiveTab('secure-chat');
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                Chat
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Upcoming Schedule Section */}
                <div className="upcoming-events-section">
                  <div className="section-header-row">
                    <h3 className="section-title">Upcoming Schedule</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('my-appointments')}>View All</button>
                  </div>

                  {loadingAppointments ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="loading-spinner" style={{ display: 'inline-block' }}>
                        <div className="spinner" style={{
                          width: '40px',
                          height: '40px',
                          border: '4px solid #f3f4f6',
                          borderTop: '4px solid #667eea',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite'
                        }}></div>
                      </div>
                      <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading appointments...</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No upcoming appointments
                    </div>
                  ) : (
                    <div className="events-grid">
                      {appointments.map(appointment => {
                        const appointmentDate = new Date(appointment.scheduledDateTime);
                        const dateStr = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const timeStr = appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                        // Determine status color based on appointment status
                        let statusClass = 'pending';
                        if (appointment.status === 'CONFIRMED') statusClass = 'confirmed';
                        else if (appointment.status === 'CANCELLED' || appointment.status === 'REJECTED') statusClass = 'cancelled';
                        else if (appointment.status === 'COMPLETED') statusClass = 'completed';
                        else if (appointment.status === 'NO_SHOW') statusClass = 'no-show';
                        else if (appointment.status === 'PENDING_PROVIDER_APPROVAL') statusClass = 'pending';

                        return (
                          <div key={appointment.id} className={`event-card ${statusClass}`}>
                            <div className="event-date-box">
                              <span className="event-month">{dateStr.split(' ')[0]}</span>
                              <span className="event-day">{dateStr.split(' ')[1]}</span>
                            </div>
                            <div className="event-details">
                              <div className="event-title-row">
                                <h4>{appointment.caseTitle || 'Appointment'}</h4>
                                <span className={`event-status-pill ${statusClass}`}>{appointment.status}</span>
                              </div>
                              <div className="event-meta">
                                <span className="event-time">🕒 {timeStr}</span>
                                <span className="event-type">
                                  {appointment.appointmentType === 'CALL' ? '📞 Call' : '🏢 Offline'}
                                </span>
                                {appointment.durationMinutes && (
                                  <span className="event-duration">⏱️ {appointment.durationMinutes} min</span>
                                )}
                              </div>
                              {appointment.appointmentType === 'CALL' && appointment.meetingLink && (
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                  📱 {appointment.meetingLink}
                                </div>
                              )}
                              {appointment.appointmentType === 'OFFLINE' && appointment.venue && (
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                  📍 {appointment.venue}
                                </div>
                              )}
                              <div className="event-footer">
                                <div className="event-contact">
                                  <div className="mini-avatar">👩‍💼</div>
                                  <span>{appointment.providerName || 'Provider'}</span>
                                </div>
                                {appointment.status === 'PENDING' && appointment.citizenConfirmRequired && (
                                  <button className="btn-join-call" style={{ backgroundColor: '#10b981' }}>Accept</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            <div className={`secure-chat-container ${activeChat ? 'chat-active' : 'list-active'}`}>
              {/* Chat Sidebar */}
              <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                  <div className="chat-search-container">
                    <svg className="chat-search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" className="chat-search-input" placeholder="Search conversations..." />
                  </div>
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: wsConnected ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: wsConnected ? '#10b981' : '#ef4444'
                    }}></div>
                    {wsConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                <div className="conversation-list">
                  {loadingConversations ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Loading conversations...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', opacity: 0.5 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p style={{ fontWeight: '600', marginBottom: '8px' }}>No conversations yet</p>
                      <p style={{ fontSize: '13px', lineHeight: '1.5' }}>
                        To start chatting:
                        <br />1. Go to "My Matches" and accept a match
                        <br />2. Once accepted, click "Chat" on the match
                        <br />3. Or wait for the provider to accept your case
                      </p>
                    </div>
                  ) : (
                    conversations.map((convo) => (
                      <div
                        key={convo.matchId}
                        className={`conversation-item ${activeChat === convo.matchId ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(convo.matchId)}
                      >
                        <div className="convo-avatar">
                          <div className="convo-avatar-inner">
                            {convo.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="convo-details">
                          <div className="convo-header">
                            <span className="convo-name">
                              {convo.otherUserName} ({convo.otherUserRole})
                            </span>
                            <span className="convo-time">
                              {formatConversationTime(convo.lastMessageTime)}
                            </span>
                          </div>
                          <div className="convo-last-msg">
                            <span>{convo.lastMessage || 'No messages yet'}</span>
                            {convo.unreadCount > 0 && (
                              <span className="unread-badge">{convo.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Main Chat Window */}
              <div className="chat-window">
                <div className="chat-header">
                  <button className="btn-back-mobile" onClick={() => handleSelectConversation(null)}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div className="chat-contact-info">
                    {currentContact ? (
                      <>
                        <div className="chat-contact-avatar-inner">
                          {currentContact.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="chat-contact-details">
                          <h3>{currentContact.otherUserName} ({currentContact.otherUserRole})</h3>
                          <span className="match-score-pill">Case: {currentContact.caseTitle}</span>
                        </div>
                      </>
                    ) : (
                      <div className="chat-contact-details">
                        <h3>Select a conversation</h3>
                      </div>
                    )}
                  </div>
                  <div className="chat-header-actions">
                    <button className="btn-header-action btn-view-profile">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>View Profile</span>
                    </button>
                    <button className="btn-header-action btn-schedule" onClick={handleOpenScheduleModal}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Schedule Call</span>
                    </button>
                  </div>
                </div>

                <div className="messages-container">
                  {loadingMessages ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      {currentContact ? 'No messages yet. Start the conversation!' : 'Select a conversation to view messages'}
                    </div>
                  ) : (
                    <>
                      <div className="message-date-divider">
                        <span>Messages</span>
                      </div>
                      {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                          <div className="message-bubble">
                            {msg.text}
                            <div className="message-info">
                              <span>{msg.time}</span>
                              {msg.sender === 'user' && (
                                <svg className="msg-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7m-12 6l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="message contact">
                          <div className="message-bubble">
                            <span style={{ fontStyle: 'italic', color: '#64748b' }}>Typing...</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {currentContact && (
                  <div className="suggested-replies">
                    {['Thanks!', 'Got it.', 'Okay, sounds good.', 'When are you free for a call?', 'Please elaborate.'].map((reply, i) => (
                      <button key={i} className="suggested-reply-btn" onClick={() => setMessageText(reply)}>
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <div className="chat-input-container">
                  <div className="chat-input-wrapper">
                    <button className="btn-input-icon" onClick={() => setShowAttachMenu(!showAttachMenu)}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    {showAttachMenu && (
                      <div className="attach-menu-dropdown">
                        <button className="attach-menu-item" onClick={() => { alert('Image upload not implemented yet'); setShowAttachMenu(false); }}>
                          <div className="attach-menu-icon icon-image">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span>Photos & Videos</span>
                        </button>
                        <button className="attach-menu-item" onClick={() => { alert('Document upload not implemented yet'); setShowAttachMenu(false); }}>
                          <div className="attach-menu-icon icon-document">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span>Document</span>
                        </button>
                        <button className="attach-menu-item" onClick={() => { alert('Camera not implemented yet'); setShowAttachMenu(false); }}>
                          <div className="attach-menu-icon icon-camera">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span>Camera</span>
                        </button>
                      </div>
                    )}
                    <textarea
                      className="chat-input-field"
                      placeholder={currentContact ? "Type your message here..." : "Select a conversation to start chatting"}
                      rows="1"
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={!currentContact || !wsConnected}
                    ></textarea>
                    <button
                      className="btn-input-icon"
                      disabled={!currentContact}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    {showEmojiPicker && (
                      <div className="emoji-picker-dropdown" style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '50px',
                        marginBottom: '10px',
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        zIndex: 50,
                        width: '200px'
                      }}>
                        {['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😐', '🙄', '😥', '😭', '😱', '😡', '👍', '👎', '👋', '🙏', '🔥', '✨', '🎉', '💯', '❤️', '💔', '💩', '🤝'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              setMessageText(prev => prev + emoji);
                              // Optional: keep picker open or close it. Typically keep open for multiple emojis or close?
                              // User request: "send the message with is icon only" might imply single click send? No, "send the message with this icon only" might mean they want to send emojis.
                              // "when click on the show some emoji Icon user can send the message with is icon only"
                              // Phrasing is slightly ambiguous. "send the message with is icon only" -> maybe "send the message with his icon only"?
                              // Or maybe "user can send the message with THIS icon only" (implying the emoji button sends it?)
                              // Most likely: User wants to be able to insert emojis into the message.
                              // I will append to text.
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '20px',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      className="btn-send-msg"
                      onClick={handleSendMessage}
                      disabled={!currentContact || !messageText.trim() || !wsConnected}
                      style={{ opacity: (!currentContact || !messageText.trim() || !wsConnected) ? 0.5 : 1 }}
                    >
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
            <MyMatchesView />
          )}

          {activeTab === 'my-appointments' && (
            <MyAppointments />
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

      {/* Schedule Appointment Modal */}
      {showScheduleModal && currentContact && (
        <div className="modal-overlay" onClick={handleCloseScheduleModal} style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', borderRadius: '12px', border: 'none', overflow: 'hidden' }}>
            <div className="modal-header" style={{ backgroundColor: '#f1f5f9', padding: '24px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <div className="schedule-header">
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Schedule an Appointment</h2>
                <div className="schedule-subtitle" style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Propose a time to connect with {currentContact.otherUserName}</div>
              </div>
              <button className="modal-close" onClick={handleCloseScheduleModal} style={{ fontSize: '24px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginTop: '-4px', lineHeight: 1 }}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '24px 20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="contact-preview-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: 'none', padding: 0 }}>
                <div className="contact-preview-avatar" style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {currentContact.otherUserName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="contact-preview-info">
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '600' }}>
                    {currentContact.otherUserName} <span className="contact-preview-role" style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentContact.otherUserRole}</span>
                  </h4>
                  <div style={{ marginTop: '4px', color: '#64748b', fontSize: '14px' }}>
                    Case: {currentContact.caseTitle}
                  </div>
                </div>
              </div>

              {appointmentError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  border: '1px solid #fecaca'
                }}>
                  {appointmentError}
                </div>
              )}

              <div className="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Appointment Type Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Appointment Type</label>
                  <div className="appointment-type-selector" style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className={`type-btn ${appointmentForm.appointmentType === 'call' ? 'selected' : ''}`}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: appointmentForm.appointmentType === 'call' ? '#1e40af' : '#e2e8f0',
                        backgroundColor: appointmentForm.appointmentType === 'call' ? '#eff6ff' : '#f8fafc',
                        color: appointmentForm.appointmentType === 'call' ? '#1e40af' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleAppointmentFormChange('appointmentType', 'call')}
                    >
                      <span>📞</span> Call
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${appointmentForm.appointmentType === 'offline' ? 'selected' : ''}`}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: appointmentForm.appointmentType === 'offline' ? '#1e40af' : '#e2e8f0',
                        backgroundColor: appointmentForm.appointmentType === 'offline' ? '#eff6ff' : '#f8fafc',
                        color: appointmentForm.appointmentType === 'offline' ? '#1e40af' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleAppointmentFormChange('appointmentType', 'offline')}
                    >
                      <span>🏢</span> Offline Meeting
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Date</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '15px',
                        outline: 'none',
                        color: '#1e293b',
                        backgroundColor: '#fff'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Time (24-hour format)</label>
                  <div className="time-slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
                    {['09:00', '10:30', '14:00', '15:30', '17:00'].map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        style={{
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: appointmentForm.time === slot ? '#1e40af' : '#e2e8f0',
                          backgroundColor: appointmentForm.time === slot ? '#eff6ff' : '#fff',
                          color: appointmentForm.time === slot ? '#1e40af' : '#64748b',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '15px',
                        outline: 'none',
                        color: '#1e293b'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>
                    {appointmentForm.appointmentType === 'offline' ? 'Venue *' : 'Phone Number or Meeting Link *'}
                  </label>
                  <input
                    type="text"
                    placeholder={appointmentForm.appointmentType === 'offline' ? "e.g., City Legal Aid Center" : "e.g., +1-234-567-8900"}
                    value={appointmentForm.appointmentType === 'offline' ? appointmentForm.venue : appointmentForm.meetingLink}
                    onChange={(e) => handleAppointmentFormChange(appointmentForm.appointmentType === 'offline' ? 'venue' : 'meetingLink', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '15px',
                      outline: 'none',
                      color: '#1e293b'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Duration (minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 30"
                    value={appointmentForm.durationMinutes}
                    onChange={(e) => handleAppointmentFormChange('durationMinutes', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '15px',
                      outline: 'none',
                      color: '#1e293b'
                    }}
                  />
                </div>

                {appointmentForm.appointmentType === 'offline' && (
                  <>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Location *</label>
                      <input
                        type="text"
                        placeholder="e.g., Downtown, City Center"
                        value={appointmentForm.location}
                        onChange={(e) => handleAppointmentFormChange('location', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '15px',
                          outline: 'none',
                          color: '#1e293b'
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Address *</label>
                      <input
                        type="text"
                        placeholder="e.g., 123 Main Street, Suite 400"
                        value={appointmentForm.address}
                        onChange={(e) => handleAppointmentFormChange('address', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '15px',
                          outline: 'none',
                          color: '#1e293b'
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '10px', display: 'block' }}>Notes *</label>
                  <textarea
                    placeholder="Add any additional notes or requirements..."
                    value={appointmentForm.notes}
                    onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '15px',
                      outline: 'none',
                      color: '#1e293b',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', gap: '12px', background: 'white' }}>
              <button
                className="btn-secondary"
                onClick={handleCloseScheduleModal}
                disabled={submittingAppointment}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmitAppointment}
                disabled={submittingAppointment}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1e40af',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: submittingAppointment ? 'not-allowed' : 'pointer',
                  opacity: submittingAppointment ? 0.7 : 1
                }}
              >
                {submittingAppointment ? 'Scheduling...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardCitizen;
