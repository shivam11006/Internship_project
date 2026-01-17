import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import chatService from './services/chatService';
import * as matchService from './services/matchService';
import appointmentService from './services/appointmentService';
import NotificationPanel from './NotificationPanel';
import AssignedCases from './AssignedCases';
import MyAppointments from './MyAppointments';
import './Dashboard.css';
import './SecureChat.css';

function DashboardLawyer() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, profile, assigned-cases, secure-chat
  const [activeChat, setActiveChat] = useState(null); // Will store matchId
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const typingTimeoutRef = useRef(null);
  const hasAutoSelectedRef = useRef(false); // Track if we've already auto-selected a conversation

  // Case Details Modal state
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    specialization: '',
    barNumber: '',
    address: '',
    location: '',
    languages: '',
  });

  // Pending case requests from backend
  const [newRequests, setNewRequests] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [casesError, setCasesError] = useState(null);
  const [refreshAssignedCases, setRefreshAssignedCases] = useState(0);

  // Appointment State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Appointment form state (for new citizen-style scheduling UI)
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

  // Real Chat Data
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [showMatchProfileModal, setShowMatchProfileModal] = useState(false);
  const [selectedMatchProfile, setSelectedMatchProfile] = useState(null);

  // Mock Notification Data
  const [mockNotifications, setMockNotifications] = useState({
    messages: [
      { id: 1, sender: 'Rahul Sharma', text: 'Hello sir, can we reschedule?', time: '2m ago' },
      { id: 2, sender: 'Priya Singh', text: 'I have uploaded the documents.', time: '1h ago' }
    ],
    appointments: [
      { id: 101, name: 'Anjali Gupta', date: 'Jan 12, 2026', time: '10:00 AM' },
      { id: 102, name: 'Vikram Malhotra', date: 'Jan 14, 2026', time: '2:30 PM' }
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

  // Fetch pending assigned cases from backend
  useEffect(() => {
    const fetchPendingCases = async () => {
      try {
        setLoadingCases(true);
        setCasesError(null);

        const response = await matchService.getAssignedCases();

        // Filter for only PENDING status cases (not yet accepted/declined)
        let casesData = Array.isArray(response) ? response : (response.data || []);
        const pendingCases = casesData.filter(c =>
          c.status === 'SELECTED_BY_CITIZEN' || c.status === 'PENDING'
        );

        // Transform backend response to match component expectations
        const transformedCases = pendingCases.map(c => ({
          id: c.id,
          matchId: c.id,
          caseId: c.caseNumber || c.caseId,
          title: c.caseTitle || `Case #${c.caseNumber || c.caseId}`,
          caseTitle: c.caseTitle || `Case #${c.caseNumber || c.caseId}`,
          description: c.caseDescription || 'No description provided',
          location: c.caseLocation || 'Not specified',
          date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          matchScore: c.matchScore || 0,
          status: c.status === 'SELECTED_BY_CITIZEN' ? 'pending' : c.status,
          caseType: c.caseType || 'Legal Aid',
          matchReason: c.matchReason || 'Expertise matches case type, Verified provider',
          citizenName: c.citizenName || 'Not available',
          citizenEmail: c.citizenEmail || 'Not available',
          citizenPhone: c.citizenPhone || 'Not available',
          createdAt: c.createdAt,
          // Case details from API
          priority: c.casePriority || 'Medium',
          preferredLanguage: c.preferredLanguage || 'Not specified',
          expertiseTags: Array.isArray(c.expertiseTags) ? c.expertiseTags : [],
          additionalParties: 'None',
          category: c.caseType || 'General',
          // Attachments - map to expected format
          evidence: (c.attachments || []).map(att => ({
            id: att.id,
            name: att.fileName,
            type: att.fileType,
            fileSize: att.fileSize
          })),
        }));

        setNewRequests(transformedCases);
      } catch (err) {
        console.error('Failed to fetch pending cases:', err);
        setCasesError('Failed to load case requests. Please try again.');
        setNewRequests([]);
      } finally {
        setLoadingCases(false);
      }
    };

    fetchPendingCases();
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

  const handleAcceptRequest = async (id) => {
    const caseItem = newRequests.find(req => req.id === id);
    if (!caseItem) return;

    if (window.confirm(`Accept case: "${caseItem.title}"?`)) {
      try {
        // Call backend to accept the case assignment
        await matchService.acceptCaseAssignment(caseItem.matchId || caseItem.id);

        // Remove from pending list
        setNewRequests(prev => prev.filter(req => req.id !== id));

        // Trigger refresh of assigned cases list
        setRefreshAssignedCases(prev => prev + 1);

        alert(`Case "${caseItem.title}" accepted successfully! Check your assigned cases.`);
      } catch (err) {
        console.error('Error accepting case:', err);
        alert('Failed to accept case. Please try again.');
      }
    }
  };

  const handleRejectRequest = async (id) => {
    const caseItem = newRequests.find(req => req.id === id);
    if (!caseItem) return;

    if (window.confirm(`Decline case: "${caseItem.title}"?`)) {
      try {
        // Call backend to decline the case assignment
        await matchService.declineCaseAssignment(caseItem.matchId || caseItem.id);

        // Remove from pending list
        setNewRequests(prev => prev.filter(req => req.id !== id));

        alert(`Case "${caseItem.title}" declined.`);
      } catch (err) {
        console.error('Error declining case:', err);
        alert('Failed to decline case. Please try again.');
      }
    }
  };

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

  // Accept appointment
  const handleAcceptAppointment = async (id) => {
    if (window.confirm('Accept this appointment?')) {
      try {
        const result = await appointmentService.acceptAppointment(id);
        alert('Appointment accepted successfully!');
        loadUpcomingAppointments(); // Reload appointments
      } catch (error) {
        console.error('Error accepting appointment:', error);
        alert('Failed to accept appointment: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Cancel appointment
  const handleCancelAppointment = async (id) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason && reason.trim()) {
      try {
        await appointmentService.cancelAppointment(id, reason);
        alert('Appointment cancelled successfully');
        loadUpcomingAppointments(); // Reload appointments
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Request reschedule
  const handleRequestReschedule = async (id) => {
    const reason = prompt('Please provide a reason for rescheduling:');
    if (reason && reason.trim()) {
      try {
        const result = await appointmentService.requestReschedule(id, reason);
        if (result.success) {
          alert('Reschedule request sent successfully');
          loadUpcomingAppointments(); // Reload appointments
        } else {
          alert('Failed to request reschedule: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error requesting reschedule:', error);
        alert('Failed to request reschedule');
      }
    }
  };

  // Complete appointment
  const handleCompleteAppointment = async (id) => {
    const notes = prompt('Add completion notes (optional):');
    if (notes !== null) { // User didn't click Cancel
      try {
        const result = await appointmentService.completeAppointment(id, notes || '');
        if (result.success) {
          alert('Appointment marked as complete!');
          loadUpcomingAppointments(); // Reload appointments
        } else {
          alert('Failed to complete appointment: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error completing appointment:', error);
        alert('Failed to complete appointment');
      }
    }
  };

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

  // Load messages for a match
  const loadMessages = useCallback(async (matchId) => {
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
  }, []);

  const handleChatAvatarClick = async (e, conversation) => {
    e.stopPropagation(); // Prevent selecting the conversation

    if (!conversation.otherUserId) {
      console.error('No user ID available for this conversation');
      return;
    }

    try {
      const result = await authService.getUserById(conversation.otherUserId);
      if (result.success && result.data) {
        const userData = result.data;

        // Transform user data to match profile modal format
        const profileData = {
          id: userData.id,
          name: userData.username || conversation.otherUserName,
          role: userData.role || conversation.otherUserRole,
          email: userData.email || '',
          location: userData.location || '',
          phone: userData.phone || '',
          rating: userData.rating || 'N/A',
          avatar: userData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.otherUserName || 'User')}&background=random`,
          practiceAreas: userData.specialization ? [userData.specialization] : (userData.focusArea ? [userData.focusArea] : []),
          availability: userData.availability || 'Contact for availability',
          matchPercentage: 85, // Default value
          website: userData.website || '',
          caseHistory: userData.bio || userData.description || 'No additional information available',
          languages: userData.languages || []
        };

        setSelectedMatchProfile(profileData);
        setShowMatchProfileModal(true);
      } else {
        console.error('Failed to fetch user details:', result.error);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleCloseMatchProfile = () => {
    setShowMatchProfileModal(false);
    setSelectedMatchProfile(null);
  };

  // Handle selecting a conversation
  const handleSelectConversation = useCallback(async (matchId) => {
    if (!matchId) return;

    console.log('Selecting conversation:', matchId, 'Current activeChat:', activeChat);

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

    // Don't call loadConversations here to avoid infinite loop
  }, [currentMatchId, activeChat, loadMessages]);

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
          // Don't include handleSelectConversation in dependencies to break the cycle
          setTimeout(() => {
            const currentActiveChat = activeChat; // Capture current value
            if (!currentActiveChat) { // Double-check activeChat hasn't changed
              // Call handleSelectConversation directly without dependency
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

  const currentContact = conversations.find(c => c.matchId === activeChat);

  // Appointment scheduling handlers
  const handleOpenScheduleModal = () => {
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
    } catch (error) {
      console.error('Error creating appointment:', error);
      setAppointmentError(error.message || 'Failed to create appointment');
    } finally {
      setSubmittingAppointment(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      <div className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>


        <nav className="dashboard-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Overview</span>
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

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="dashboard-logo">
              <div className="logo-icon">⚖️</div>
              <span className="logo-text">LegalMatch Pro</span>
            </div>
            <div className="header-divider"></div>
            <h1 className="dashboard-title">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'profile' && 'Lawyer Dashboard'}
              {activeTab === 'secure-chat' && 'Secure Chat'}
              {activeTab === 'assigned-cases' && 'Assigned Cases'}
              {activeTab === 'my-appointments' && 'My Appointments'}
            </h1>
          </div>
          <div className="header-right">
            {/* Notification Panel */}
            <NotificationPanel />

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
        </div>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-container">
              {/* Upcoming Appointments Section */}
              <div className="upcoming-events-section" style={{ marginTop: 0, marginBottom: '2rem' }}>
                <div className="section-header-row">
                  <h3 className="section-title">Upcoming Schedule</h3>
                  <button className="view-all-link">View All</button>
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
                            <div className="event-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', flexWrap: 'wrap', marginBottom: '8px', position: 'relative' }}>
                              <h4 style={{ fontWeight: '600', color: '#111827', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{appointment.caseTitle || 'Appointment'}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`event-status-pill ${statusClass}`} style={{ whiteSpace: 'nowrap' }}>{appointment.status}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === appointment.id ? null : appointment.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '4px'
                                  }}
                                  className="three-dot-btn"
                                >
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                                  </svg>
                                </button>

                                {activeMenuId === appointment.id && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    zIndex: 10,
                                    minWidth: '160px',
                                    marginTop: '4px'
                                  }}>
                                    <button
                                      onClick={() => {
                                        handleCompleteAppointment(appointment.id);
                                        setActiveMenuId(null);
                                      }}
                                      style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '10px 16px',
                                        fontSize: '14px',
                                        color: '#374151',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}
                                      onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                      <span>✅ Mark as Complete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
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
                            <div className="event-footer" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                              {/* Accept/Reject for appointments requiring provider approval */}
                              {(appointment.status === 'PENDING_PROVIDER_APPROVAL' || appointment.status === 'RESCHEDULE_REQUESTED' || appointment.status === 'RESCHEDULED') && (
                                <>
                                  <button
                                    className="btn-join-call"
                                    style={{ backgroundColor: '#10b981', flex: '1', minWidth: '80px', color: 'white', fontWeight: '600' }}
                                    onClick={() => handleAcceptAppointment(appointment.id)}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="btn-join-call"
                                    style={{ backgroundColor: '#ef4444', flex: '1', minWidth: '80px', color: 'white', fontWeight: '600' }}
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {/* Status indicator for confirmed appointments */}
                              {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING_CITIZEN_APPROVAL' || appointment.status === 'SCHEDULED') && (
                                <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                                  ✓ Scheduled - View in My Appointments for more options
                                </div>
                              )}
                              {/* Complete button for past confirmed appointments */}
                              {appointment.status === 'CONFIRMED' && new Date(appointment.scheduledDateTime) < new Date() && (
                                <button
                                  className="btn-join-call"
                                  style={{ backgroundColor: '#8b5cf6', flex: '1', minWidth: '80px' }}
                                  onClick={() => handleCompleteAppointment(appointment.id)}
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>New Case Requests</h2>

              {loadingCases && (
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
                  <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading case requests...</p>
                </div>
              )}

              {casesError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: 0, fontWeight: '500' }}>{casesError}</p>
                </div>
              )}

              {!loadingCases && newRequests.length === 0 ? (
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '2rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                    No new case requests at the moment. Check back later!
                  </p>
                </div>
              ) : (
                <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                  {newRequests.map(req => (
                    <div key={req.id} className="request-card" style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontWeight: '600', color: '#111827', marginRight: '1rem', flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{req.title}</h3>
                        <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                          {Math.round(req.matchScore)}% Match
                        </span>
                      </div>
                      <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.5', wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'break-word', maxHeight: '4.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{req.description}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        <span>📍 {req.location}</span>
                        <span>📅 {req.date}</span>
                        {req.caseType && <span>📋 {req.caseType}</span>}
                      </div>
                      {req.citizenName && (
                        <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                          <p style={{ margin: '0.25rem 0', color: '#374151' }}><strong>Citizen:</strong> {req.citizenName}</p>
                          {req.citizenPhone && <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>{req.citizenPhone}</p>}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCase(req);
                          setShowCaseDetails(true);
                        }}
                        style={{
                          width: '100%',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: '500',
                          border: 'none',
                          cursor: 'pointer',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View details
                      </button>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          style={{ flex: 1, backgroundColor: '#10b981', color: 'white', padding: '0.5rem', borderRadius: '0.375rem', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', padding: '0.5rem', borderRadius: '0.375rem', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                        >
                          ✗ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                      No conversations yet.
                    </div>
                  ) : (
                    conversations.map((convo) => (
                      <div
                        key={convo.matchId}
                        className={`conversation-item ${activeChat === convo.matchId ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(convo.matchId)}
                      >
                        <div
                          className="convo-avatar"
                          onClick={(e) => handleChatAvatarClick(e, convo)}
                          style={{ cursor: 'pointer' }}
                          title="View profile"
                        >
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
                    <button
                      className="btn-header-action btn-view-profile"
                      onClick={(e) => currentContact && handleChatAvatarClick(e, currentContact)}
                      disabled={!currentContact}
                      style={{ opacity: !currentContact ? 0.5 : 1, cursor: !currentContact ? 'not-allowed' : 'pointer' }}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>View Profile</span>
                    </button>
                    <button className="btn-header-action btn-schedule" onClick={handleOpenScheduleModal}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Schedule Appointment</span>
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
                    {['Understood.', 'Please send the documents.', 'I am available for a call.', 'What is the current status?', 'Let\'s meet next week.'].map((reply, i) => (
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
                    {/* Add Missing State: This is UI render logic, not state definition. I need to find state definition location again. */}

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

          {activeTab === 'assigned-cases' && (
            <AssignedCases
              refreshTrigger={refreshAssignedCases}
              onNavigateToChat={(name) => {
                const convo = conversations.find(c => c.otherUserName?.toLowerCase().includes(name.toLowerCase()));
                if (convo) {
                  handleSelectConversation(convo.matchId);
                }
                setActiveTab('secure-chat');
              }}
              onScheduleCall={(name) => {
                const convo = conversations.find(c => c.otherUserName?.toLowerCase().includes(name.toLowerCase()));
                if (convo) {
                  handleSelectConversation(convo.matchId);
                }
                handleOpenScheduleModal();
              }}
            />
          )}

          {activeTab === 'my-appointments' && (
            <MyAppointments />
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {
        showProfileModal && (
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
        )
      }

      {/* Schedule Appointment Modal (Citizen-style UI) */}
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

      {/* Case Details Modal */}
      {
        showCaseDetails && selectedCase && (
          <div className="modal-overlay" onClick={() => setShowCaseDetails(false)}>
            <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2e5a8a 100%)', color: 'white' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ color: 'white', marginBottom: '4px' }}>Case Details</h2>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>ID: #{selectedCase.caseId} • Posted on {selectedCase.date}</div>
                </div>
                <button className="modal-close" style={{ color: 'white' }} onClick={() => setShowCaseDetails(false)}>×</button>
              </div>

              <div className="modal-body" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>{selectedCase.title}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {Math.round(selectedCase.matchScore)}% Match
                      </span>
                      <span style={{
                        backgroundColor: selectedCase.priority?.toLowerCase() === 'high' ? '#fee2e2' : '#fef3c7',
                        color: selectedCase.priority?.toLowerCase() === 'high' ? '#991b1b' : '#92400e',
                        padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600'
                      }}>
                        {selectedCase.priority} Priority
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', color: '#4b5563', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>📍</span>
                      <span>{selectedCase.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>📋</span>
                      <span>{selectedCase.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>🗣️</span>
                      <span>{selectedCase.preferredLanguage}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>👤</span>
                      <span>{selectedCase.citizenName}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0' }}>
                  <div style={{ padding: '24px', borderRight: '1px solid #e5e7eb' }}>
                    <section style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</h4>
                      <p style={{ color: '#4b5563', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedCase.description}</p>
                    </section>

                    <section>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expertise Tags</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedCase.expertiseTags.map((tag, i) => (
                          <span key={i} style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '6px 12px', borderRadius: '6px', fontSize: '0.875rem' }}>{tag}</span>
                        ))}
                        {selectedCase.expertiseTags.length === 0 && <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags specified</span>}
                      </div>
                    </section>
                  </div>

                  <div style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
                    <section style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Parties</h4>
                      <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>{selectedCase.additionalParties}</p>
                    </section>

                    <section style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Information</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Name</span>
                          <span style={{ color: '#111827', fontWeight: '500' }}>{selectedCase.citizenName || 'Not available'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Email</span>
                          <span style={{ color: '#111827', fontWeight: '500' }}>{selectedCase.citizenEmail || 'Not available'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Phone</span>
                          <span style={{ color: '#111827', fontWeight: '500' }}>{selectedCase.citizenPhone || 'Not available'}</span>
                        </div>
                      </div>
                    </section>

                    <div style={{
                      marginTop: '32px',
                      padding: '16px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h5 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '8px', fontSize: '0.875rem' }}>Why it matches?</h5>
                      <p style={{ color: '#1e40af', fontSize: '0.75rem', lineHeight: '1.5' }}>
                        {selectedCase.matchReason || 'Based on your profile specializations and location, this case is highly relevant to your expertise.'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedCase.evidence && selectedCase.evidence.length > 0 && (
                  <div style={{ padding: '24px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents & Evidence</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                      {selectedCase.evidence.map((doc, idx) => (
                        <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }}>
                          {doc.type && doc.type.startsWith('image/') ? (
                            <div style={{ position: 'relative', height: '120px' }}>
                              <img
                                src={`data:${doc.type};base64,${doc.content}`}
                                alt={doc.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div style={{ height: '120px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '2.5rem' }}>
                                {doc.type && doc.type.includes('pdf') ? '📕' : '📄'}
                              </span>
                            </div>
                          )}
                          <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              color: '#374151',
                              marginBottom: '8px',
                              wordBreak: 'break-all',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '2.4rem'
                            }}>
                              {doc.name}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                              <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
                                {doc.type ? doc.type.split('/')[1].toUpperCase() : 'FILE'}
                              </span>
                              <a
                                href={`data:${doc.type};base64,${doc.content}`}
                                download={doc.name}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  color: '#2563eb',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Save
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ justifyContent: 'center', gap: '16px', padding: '24px' }}>
                <button
                  onClick={() => {
                    handleAcceptRequest(selectedCase.id);
                    setShowCaseDetails(false);
                  }}
                  style={{ flex: 1, backgroundColor: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  ✓ Accept Case
                </button>
                <button
                  onClick={() => {
                    handleRejectRequest(selectedCase.id);
                    setShowCaseDetails(false);
                  }}
                  style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  ✗ Decline Case
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* User Profile Modal from Chat */}
      {showMatchProfileModal && selectedMatchProfile && (
        <div className="modal-overlay" onClick={handleCloseMatchProfile}>
          <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="modal-close" onClick={handleCloseMatchProfile}>×</button>
            </div>
            <div className="modal-body profile-modal-body">
              <div className="profile-modal-grid">
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
                          {selectedMatchProfile.role}
                        </span>
                      </div>
                      <div className="profile-rating">
                        <span className="stars">⭐ {selectedMatchProfile.rating || 'N/A'}</span>
                      </div>
                      <div className="profile-contact-info">
                        <div className="contact-row">
                          <span className="icon">📍</span> {selectedMatchProfile.location || 'Location N/A'}
                        </div>
                        <div className="contact-row">
                          <span className="icon">✉️</span> {selectedMatchProfile.email || 'email@example.com'}
                        </div>
                        {selectedMatchProfile.phone && (
                          <div className="contact-row">
                            <span className="icon">📞</span> {selectedMatchProfile.phone}
                          </div>
                        )}
                        {selectedMatchProfile.website && (
                          <div className="contact-row">
                            <span className="icon">🌐</span> {selectedMatchProfile.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedMatchProfile.practiceAreas && selectedMatchProfile.practiceAreas.length > 0 && (
                    <div className="profile-section-block">
                      <h3>Specialization / Focus Area</h3>
                      <div className="practice-areas-list">
                        {selectedMatchProfile.practiceAreas.map((area, idx) => (
                          <span key={idx} className="practice-area-tag">{area}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="profile-section-block">
                    <h3>About</h3>
                    <p className="case-history-text">
                      {selectedMatchProfile.caseHistory || 'No additional information available'}
                    </p>
                  </div>

                  {selectedMatchProfile.languages && selectedMatchProfile.languages.length > 0 && (
                    <div className="profile-section-block">
                      <h3>Languages</h3>
                      <p>{Array.isArray(selectedMatchProfile.languages) ? selectedMatchProfile.languages.join(', ') : selectedMatchProfile.languages}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLawyer;
