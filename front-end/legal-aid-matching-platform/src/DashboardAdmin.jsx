import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import authService, { apiClient } from './services/authService';
import logService from './services/logService';
import analyticsService from './services/analyticsService';
import DirectoryIngestion from './DirectoryIngestion';
import Directory from './Directory';
import HealthMonitoring from './HealthMonitoring';
import './AdminDashboard.css';
import MapVisualization from './MapVisualization';

function DashboardAdmin() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analyticsTab, setAnalyticsTab] = useState('overview');
  const [profileTab, setProfileTab] = useState('verification-queue');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
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
  const [filterRole, setFilterRole] = useState(''); // Filter for user roles
  const [filterStatus, setFilterStatus] = useState(''); // Filter for approval status
  const [userManagementFilterRole, setUserManagementFilterRole] = useState(''); // Filter for user management tab
  const [userManagementFilterStatus, setUserManagementFilterStatus] = useState(''); // Filter status in user management
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // For delete confirmation dialog

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logSortBy, setLogSortBy] = useState('timestamp');
  const [logSortOrder, setLogSortOrder] = useState('desc');
  const [logPageSize, setLogPageSize] = useState(20);
  const [logPage, setLogPage] = useState(0);
  const [totalLogPages, setTotalLogPages] = useState(0);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Cases state
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [caseFilterStatus, setCaseFilterStatus] = useState('');
  const [caseFilterPriority, setCaseFilterPriority] = useState('');
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);
  const [showCaseDetailModal, setShowCaseDetailModal] = useState(false);

  // KPI Stats
  const [kpiStats, setKpiStats] = useState({
    totalUsers: 0,
    totalLawyers: 0,
    totalNgos: 0,
    totalCases: 0,
    totalMatches: 0,
    activeAppointments: 0,
    resolvedCases: 0
  });

  // Analytics Data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTabsData, setAnalyticsTabsData] = useState({
    overview: null,
    users: null,
    cases: null,
    matches: null,
    activity: null
  });

  useEffect(() => {
    // Initial fetch
    fetchUsers();
    fetchAnalyticsData();

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

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
      fetchLogStats();
    }
  }, [activeTab, logPage, logPageSize, logSortBy, logSortOrder]);

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchCases();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsTabData();
    }
  }, [activeTab, analyticsTab]);

  // Handle Escape key to close log modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogModal) {
        handleCloseLogModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogModal]);

  const fetchAnalyticsTabData = async () => {
    setAnalyticsLoading(true);
    try {
      if (!analyticsTabsData[analyticsTab]) {
        const fetchMap = {
          overview: analyticsService.getOverview,
          users: analyticsService.getUsers,
          cases: analyticsService.getCases,
          matches: analyticsService.getMatches,
          activity: analyticsService.getActivity
        };
        const response = await fetchMap[analyticsTab]();
        setAnalyticsTabsData(prev => ({ ...prev, [analyticsTab]: response }));
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set empty data for this tab to prevent rendering errors
      setAnalyticsTabsData(prev => ({ 
        ...prev, 
        [analyticsTab]: {
          error: error.response?.data?.error || error.message || 'Failed to load analytics data'
        }
      }));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      // Use noPagination=true to get all cases as an array
      const response = await apiClient.get('/admin/cases?noPagination=true');
      console.log('Cases API response:', response.data);

      // Handle both paginated response (with content) and direct array (noPagination=true)
      if (response.data && Array.isArray(response.data)) {
        setCases(response.data);
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        setCases(response.data.content);
      } else {
        console.error('Unexpected response format:', response.data);
        setCases([]);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    }
    setCasesLoading(false);
  };

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
            flatUser.yearsOfExperience = user.profile.yearsOfExperience;
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
      setAllUsers(flattenedUsers); // Store all users for user management tab

      // Calculate KPI stats from users data
      const lawyers = flattenedUsers.filter(u => u.role === 'LAWYER').length;
      const ngos = flattenedUsers.filter(u => u.role === 'NGO').length;

      // Update will be complete when analytics data is fetched
      setKpiStats(prev => ({
        ...prev,
        totalUsers: flattenedUsers.length,
        totalLawyers: lawyers,
        totalNgos: ngos,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const result = await analyticsService.getAllAnalytics();

      if (result.success && result.data) {
        setAnalyticsData(result.data);

        // Update KPI stats with real analytics data from all endpoints
        const { overview, users, cases, matches, activity } = result.data;

        setKpiStats(prev => ({
          ...prev,
          totalUsers: overview?.totalUsers || 0,
          totalLawyers: users?.totalLawyers || 0,
          totalNgos: users?.totalNgos || 0,
          totalCases: overview?.totalCases || 0,
          totalMatches: matches?.acceptedMatches || 0,  // Only count accepted matches
          activeAppointments: activity?.upcomingAppointments || 0,  // Only count upcoming appointments
          resolvedCases: cases?.closedCases || 0
        }));
      } else {
        console.error('Failed to fetch analytics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
    setAnalyticsLoading(false);
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

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`⚠️ Are you sure you want to delete ${username}? This action cannot be undone.`)) {
      return;
    }
    if (!confirm(`Final confirmation: Delete ${username} permanently?`)) {
      return;
    }
    setActionLoading(userId);
    try {
      await authService.deleteUser(userId);
      await fetchUsers();
      alert('User has been deleted successfully.');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
    setActionLoading(null);
    setDeleteConfirmId(null);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const searchRequest = {
        page: logPage,
        size: logPageSize,
        sortBy: logSortBy,
        sortOrder: logSortOrder
      };

      // Add filter based on sortBy field
      if (logSearchTerm) {
        if (logSortBy === 'level') {
          searchRequest.level = logSearchTerm;
        } else if (logSortBy === 'username') {
          searchRequest.username = logSearchTerm;
        } else if (logSortBy === 'endpoint') {
          searchRequest.endpoint = logSearchTerm;
        } else if (logSortBy === 'timestamp') {
          // Parse date and create date range for the entire day
          try {
            const searchDate = new Date(logSearchTerm);
            if (!isNaN(searchDate.getTime())) {
              // Start of day
              const startDate = new Date(searchDate);
              startDate.setHours(0, 0, 0, 0);

              // End of day
              const endDate = new Date(searchDate);
              endDate.setHours(23, 59, 59, 999);

              searchRequest.startDate = startDate.toISOString();
              searchRequest.endDate = endDate.toISOString();
            }
          } catch (error) {
            console.error('Invalid date format:', error);
          }
        }
      }

      const result = await logService.searchLogs(searchRequest);
      if (result.success) {
        setLogs(result.data.content || []);
        setTotalLogPages(result.data.totalPages || 0);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogStats = async () => {
    try {
      const result = await logService.getLogStats();
      if (result.success) {
        setLogStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching log stats:', error);
    }
  };

  const handleLogSearch = () => {
    setLogPage(0);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setLogSearchTerm('');
    setLogPage(0);
    setTimeout(fetchLogs, 100);
  };

  const handleCleanupOldLogs = async () => {
    if (!window.confirm('Are you sure you want to delete logs older than 7 days? This action cannot be undone.')) {
      return;
    }

    setCleanupLoading(true);
    setCleanupMessage('');

    try {
      const result = await logService.deleteLogsOlderThanSevenDays();

      if (result.success) {
        setCleanupMessage(`✓ Successfully deleted ${result.data.deletedCount} old log entries. Logs from the past 7 days have been preserved.`);
        // Refresh log stats
        setTimeout(() => {
          fetchLogStats();
          fetchLogs();
        }, 500);
      } else {
        setCleanupMessage(`✗ Error: ${result.error}`);
      }
    } catch (error) {
      setCleanupMessage('✗ Failed to cleanup logs. Please try again.');
    } finally {
      setCleanupLoading(false);
      // Clear the message after 5 seconds
      setTimeout(() => setCleanupMessage(''), 5000);
    }
  };

  const getSearchPlaceholder = () => {
    switch (logSortBy) {
      case 'level': return 'Search by level (ERROR, WARN, INFO, DEBUG)...';
      case 'username': return 'Search by username...';
      case 'endpoint': return 'Search by endpoint...';
      case 'timestamp': return 'Search by date (e.g., 2025-12-24 or Dec 24, 2025)...';
      default: return 'Search logs...';
    }
  };

  const handleLogRowClick = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const handleCloseLogModal = () => {
    setShowLogModal(false);
    setTimeout(() => setSelectedLog(null), 300); // Clear after animation
  };

  const formatLogTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR': return '#dc2626';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      case 'DEBUG': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/signin', { replace: true });
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

  const filterUsers = (users) => users.filter(u => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesStatus = !filterStatus || u.approvalStatus === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredPending = filterUsers(pendingUsers);
  const filteredApproved = filterUsers(approvedUsers);

  // Filter for user management tab
  const filteredAllUsers = allUsers.filter(u => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !userManagementFilterRole || u.role === userManagementFilterRole;
    const matchesStatus = !userManagementFilterStatus || u.approvalStatus === userManagementFilterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get growth data from analytics or use fallback
  const getGrowthData = () => {
    // Real data from API
    if (analyticsData?.users?.userGrowthTrend && analyticsData?.cases?.casesCreatedTrend && analyticsData?.matches?.matchesGeneratedTrend) {
      const userTrend = analyticsData.users.userGrowthTrend || [];
      const caseTrend = analyticsData.cases.casesCreatedTrend || [];
      const matchTrend = analyticsData.matches.matchesGeneratedTrend || [];

      // Get the last 6 data points, ensuring they're properly aligned
      const maxLen = Math.min(6, userTrend.length, caseTrend.length, matchTrend.length);
      const startIdx = Math.max(0, userTrend.length - maxLen);

      return userTrend.slice(startIdx, startIdx + maxLen).map((userItem, idx) => {
        const caseItem = caseTrend[startIdx + idx];
        const matchItem = matchTrend[startIdx + idx];

        // Extract timestamp and format as month/week label
        const timestamp = userItem.timestamp ? new Date(userItem.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Period ${idx + 1}`;

        return {
          name: timestamp,
          users: userItem.count || 0,
          cases: caseItem?.count || 0,
          matches: matchItem?.count || 0,
        };
      });
    }
    // Fallback mock data
    return [
      { name: 'Week 1', users: 40, cases: 24, matches: 20 },
      { name: 'Week 2', users: 55, cases: 35, matches: 28 },
      { name: 'Week 3', users: 70, cases: 48, matches: 40 },
      { name: 'Week 4', users: 95, cases: 62, matches: 55 },
      { name: 'Week 5', users: 120, cases: 88, matches: 75 },
      { name: 'Week 6', users: 150, cases: 110, matches: 95 },
    ];
  };

  // Get case categories from analytics or use fallback
  const getCategoryData = () => {
    // Real data from API
    if (analyticsData?.cases?.casesByType && Object.keys(analyticsData.cases.casesByType).length > 0) {
      return Object.entries(analyticsData.cases.casesByType).map(([name, value]) => ({
        name,
        value: typeof value === 'number' ? value : 0
      })).sort((a, b) => b.value - a.value); // Sort by value descending
    }
    // Fallback mock data
    return [
      { name: 'Civil', value: 120 },
      { name: 'Criminal', value: 85 },
      { name: 'Family', value: 65 },
      { name: 'Property', value: 45 },
      { name: 'Labor', value: 30 },
      { name: 'Constitutional', value: 25 },
      { name: 'Consumer Protection', value: 40 },
      { name: 'Human Rights', value: 20 },
      { name: 'Immigration', value: 35 },
      { name: 'Tax', value: 15 },
      { name: 'Environmental', value: 10 },
      { name: 'Other', value: 22 },
    ];
  };

  // Get role data from analytics or use fallback
  const getRoleData = () => {
    // Real data from API
    if (analyticsData?.overview?.usersByRole && Object.keys(analyticsData.overview.usersByRole).length > 0) {
      const roles = analyticsData.overview.usersByRole;
      return [
        { name: 'Citizens', value: roles.CITIZEN || roles.citizen || 0 },
        { name: 'Lawyers', value: roles.LAWYER || roles.lawyer || 0 },
        { name: 'NGOs', value: roles.NGO || roles.ngo || 0 },
        { name: 'Admins', value: roles.ADMIN || roles.admin || 0 },
      ].filter(item => item.value > 0); // Filter out empty values
    }
    // Fallback mock data
    return [
      { name: 'Citizens', value: 850 },
      { name: 'Lawyers', value: 320 },
      { name: 'NGOs', value: 145 },
      { name: 'Admins', value: 15 },
    ];
  };

  const growthData = getGrowthData();
  const categoryData = getCategoryData();
  const roleData = getRoleData();
  const ROLE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#dc2626'];

  // Helper to access current analytics tab data
  const currentTabData = analyticsTabsData[analyticsTab];

  const renderDashboard = () => (
    <div className="admin-dashboard-overview">
      <div className="section-header-new">
        <h2 className="section-title-new">Platform Overview</h2>
        <p className="section-subtitle">Monitor platform metrics and performance at a glance.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#dbeafe' }}>
            <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Total Users</h3>
            <p className="kpi-value">{kpiStats.totalUsers}</p>
            <p className="kpi-subtitle">All registered users</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#fef3c7' }}>
            <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Total Lawyers</h3>
            <p className="kpi-value">{kpiStats.totalLawyers}</p>
            <p className="kpi-subtitle">Verified legal professionals</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
            <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Total NGOs</h3>
            <p className="kpi-value">{kpiStats.totalNgos}</p>
            <p className="kpi-subtitle">Registered organizations</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#e0e7ff' }}>
            <svg width="24" height="24" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Total Cases</h3>
            <p className="kpi-value">{kpiStats.totalCases}</p>
            <p className="kpi-subtitle">Cases submitted</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#fce7f3' }}>
            <svg width="24" height="24" fill="none" stroke="#ec4899" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Total Matches</h3>
            <p className="kpi-value">{kpiStats.totalMatches}</p>
            <p className="kpi-subtitle">Successful connections</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#ddd6fe' }}>
            <svg width="24" height="24" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Active Appointments</h3>
            <p className="kpi-value">{kpiStats.activeAppointments}</p>
            <p className="kpi-subtitle">Scheduled meetings</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
            <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">Resolved Cases</h3>
            <p className="kpi-value">{kpiStats.resolvedCases}</p>
            <p className="kpi-subtitle">Successfully closed</p>
          </div>
        </div>

        <div className="kpi-card kpi-card-highlight">
          <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
            <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-title">System Health</h3>
            <p className="kpi-value">{analyticsData?.overview?.systemHealthScore ? `${analyticsData.overview.systemHealthScore.toFixed(1)}%` : '98.2%'}</p>
            <p className="kpi-subtitle">Platform uptime</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Growth Trends Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Growth Trends</h3>
              <p>Users, Cases, and Successful Matches over time</p>
            </div>
            {analyticsData?.users?.userGrowthTrend && (
              <span className="data-badge" style={{ background: '#d1fae5', color: '#059669' }}>📊 Live Data</span>
            )}
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="cases"
                  name="New Cases"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="matches"
                  name="Matches"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Categories Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Case Categories</h3>
              <p>Distribution of legal issues across categories</p>
            </div>
            {analyticsData?.cases?.casesByType && (
              <span className="data-badge" style={{ background: '#d1fae5', color: '#059669' }}>📊 Live Data</span>
            )}
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={categoryData}
                layout={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                {window.innerWidth < 768 ? (
                  <>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                  </>
                )}
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" name="Number of Cases" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#a855f7', '#6366f1', '#64748b'][index % 12]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Role Distribution</h3>
              <p>Platform user base composition by role</p>
            </div>
            {analyticsData?.overview?.usersByRole && (
              <span className="data-badge" style={{ background: '#d1fae5', color: '#059669' }}>📊 Live Data</span>
            )}
          </div>
          <div className="chart-container pie-chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [value, name]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="quick-stats-row">
        <div className="quick-stat-card">
          <div className="stat-info">
            <span className="label">System Health</span>
            <span className="value">{analyticsData?.overview?.systemHealthScore ? `${analyticsData.overview.systemHealthScore.toFixed(1)}%` : '98.2%'}</span>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-fill" style={{ width: `${analyticsData?.overview?.systemHealthScore || 98.2}%`, background: '#10b981' }}></div>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-info">
            <span className="label">Verification Rate</span>
            <span className="value">{analyticsData?.users?.approvedUsers && analyticsData?.users?.totalUsers ? `${((analyticsData.users.approvedUsers / analyticsData.users.totalUsers) * 100).toFixed(1)}%` : '85.4%'}</span>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-fill" style={{ width: analyticsData?.users?.approvedUsers && analyticsData?.users?.totalUsers ? `${(analyticsData.users.approvedUsers / analyticsData.users.totalUsers) * 100}%` : '85.4%', background: '#3b82f6' }}></div>
          </div>
        </div>
        <div className="quick-stat-card">
          <div className="stat-info">
            <span className="label">Avg Match Time</span>
            <span className="value">{analyticsData?.matches?.averageTimeToAcceptance ? `${analyticsData.matches.averageTimeToAcceptance.toFixed(1)} Days` : '2.4 Days'}</span>
          </div>
          <div className="stat-progress-bg">
            <div className="stat-progress-fill" style={{ width: analyticsData?.matches?.acceptanceRate ? `${Math.min(analyticsData.matches.acceptanceRate, 100)}%` : '70%', background: '#8b5cf6' }}></div>
          </div>
        </div>
      </div>
      <MapVisualization />
    </div>
  );

  const renderAnalytics = () => {
    const currentTabData = analyticsTabsData[analyticsTab];
    const hasError = currentTabData?.error;

    const tabConfig = [
      { key: 'overview', icon: '📈', label: 'Overview', color: '#3b82f6' },
      { key: 'users', icon: '👥', label: 'Users', color: '#10b981' },
      { key: 'cases', icon: '📋', label: 'Cases', color: '#f59e0b' },
      { key: 'matches', icon: '🔗', label: 'Matches', color: '#8b5cf6' },
      { key: 'activity', icon: '⚡', label: 'Activity', color: '#06b6d4' }
    ];

    return (
      <div className="analytics-container">
        <div className="analytics-header" style={{ marginBottom: '28px' }}>
          <div>
            <h2 className="analytics-title" style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '4px' }}>📊 Impact Analytics</h2>
            <p className="analytics-subtitle" style={{ fontSize: '14px', color: '#6b7280' }}>Real-time platform performance metrics and insights</p>
          </div>
        </div>

        {hasError && (
          <div style={{
            padding: '14px 18px',
            marginBottom: '20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <span>⚠️</span>
            <span>{hasError}</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '28px',
          borderBottom: '2px solid #f3f4f6',
          flexWrap: 'wrap'
        }}>
          {tabConfig.map(({ key, icon, label, color }) => (
            <button
              key={key}
              onClick={() => setAnalyticsTab(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: analyticsTab === key ? '12px 20px' : '12px 20px',
                backgroundColor: analyticsTab === key ? `${color}10` : 'transparent',
                border: analyticsTab === key ? `2px solid ${color}` : '2px solid transparent',
                borderRadius: '10px',
                color: analyticsTab === key ? color : '#6b7280',
                fontSize: '14px',
                fontWeight: analyticsTab === key ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: analyticsTab === key ? 'translateY(0)' : 'translateY(0)',
                boxShadow: analyticsTab === key ? `0 4px 12px ${color}20` : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '18px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {analyticsLoading && !currentTabData && (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{
              display: 'inline-block',
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '16px', fontSize: '15px' }}>Loading analytics data...</p>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {analyticsTab === 'overview' && currentTabData && !hasError && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { icon: '👥', title: 'Total Users', value: analyticsTabsData.overview?.totalUsers || 0, subtitle: `${analyticsTabsData.overview?.newUsersThisMonth || 0} new`, color: '#3b82f6' },
                { icon: '📋', title: 'Total Cases', value: analyticsTabsData.overview?.totalCases || 0, subtitle: `${analyticsTabsData.overview?.newCasesThisMonth || 0} new`, color: '#f59e0b' },
                { icon: '🔗', title: 'Total Matches', value: analyticsTabsData.overview?.totalMatches || 0, subtitle: `${analyticsTabsData.overview?.newMatchesThisMonth || 0} new`, color: '#10b981' },
                { icon: '📅', title: 'Appointments', value: analyticsTabsData.overview?.totalAppointments || 0, subtitle: 'Total bookings', color: '#8b5cf6' },
                { icon: '💚', title: 'System Health', value: `${analyticsTabsData.overview?.systemHealthScore?.toFixed(1) || 0}%`, subtitle: 'Platform uptime', color: '#06b6d4' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  border: `1px solid #e5e7eb`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  transform: 'translateY(0)',
                  ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>{stat.title}</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{stat.subtitle}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Users by Role */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>👥 Users by Role</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Lawyers', value: analyticsTabsData.overview?.usersByRole?.LAWYER || 0 },
                        { name: 'NGOs', value: analyticsTabsData.overview?.usersByRole?.NGO || 0 },
                        { name: 'Citizens', value: analyticsTabsData.overview?.usersByRole?.CITIZEN || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} users`, 'Count']} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cases by Status */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>📋 Cases by Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { name: 'OPEN', value: analyticsTabsData.overview?.casesByStatus?.OPEN || 0 },
                    { name: 'ASSIGNED', value: analyticsTabsData.overview?.casesByStatus?.ASSIGNED || 0 },
                    { name: 'CLOSED', value: analyticsTabsData.overview?.casesByStatus?.CLOSED || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cases by Priority */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>⚡ Cases by Priority</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { name: 'HIGH', value: analyticsTabsData.overview?.casesByPriority?.HIGH || 0 },
                    { name: 'MEDIUM', value: analyticsTabsData.overview?.casesByPriority?.MEDIUM || 0 },
                    { name: 'LOW', value: analyticsTabsData.overview?.casesByPriority?.LOW || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Expertise Tags */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>🏷️ Top Expertise Tags</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(analyticsTabsData.overview?.topExpertiseTags || []).slice(0, 5).map((tag, i) => (
                    <div key={i} style={{
                      background: '#f3f4f6',
                      padding: '12px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{tag}</span>
                      <span style={{ background: '#3b82f6', color: 'white', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Status */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>🔗 Match Status Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: analyticsTabsData.overview?.matchesByStatus?.PENDING || 0 },
                        { name: 'Accepted', value: analyticsTabsData.overview?.matchesByStatus?.ACCEPTED_BY_PROVIDER || 0 },
                        { name: 'Rejected (Citizen)', value: analyticsTabsData.overview?.matchesByStatus?.REJECTED_BY_CITIZEN || 0 },
                        { name: 'Rejected (Provider)', value: analyticsTabsData.overview?.matchesByStatus?.REJECTED_BY_PROVIDER || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(value) => `${value} matches`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* User Approval Status */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>✅ User Approval Status</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[
                      { name: 'PENDING', value: analyticsTabsData.overview?.usersByApprovalStatus?.PENDING || 0 },
                      { name: 'APPROVED', value: analyticsTabsData.overview?.usersByApprovalStatus?.APPROVED || 0 },
                      { name: 'REJECTED', value: analyticsTabsData.overview?.usersByApprovalStatus?.REJECTED || 0 }
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* USERS TAB */}
        {analyticsTab === 'users' && currentTabData && !hasError && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {[
                { label: 'Lawyers', value: analyticsTabsData.users?.totalLawyers || 0, icon: '⚖️', color: '#3b82f6' },
                { label: 'NGOs', value: analyticsTabsData.users?.totalNgos || 0, icon: '🏢', color: '#10b981' },
                { label: 'Citizens', value: analyticsTabsData.users?.totalCitizens || 0, icon: '👤', color: '#f59e0b' },
                { label: 'Pending', value: analyticsTabsData.users?.pendingApprovals || 0, icon: '⏳', color: '#ef4444' },
                { label: 'Active Today', value: analyticsTabsData.users?.activeUsersToday || 0, icon: '🟢', color: '#06b6d4' },
                { label: 'Retention', value: `${analyticsTabsData.users?.userRetentionRate?.toFixed(1) || 0}%`, icon: '📈', color: '#8b5cf6' },
                { label: 'Approval Rate', value: `${analyticsTabsData.users?.approvalRate?.toFixed(1) || 0}%`, icon: '✅', color: '#ec4899' },
                { label: 'Avg Approval', value: `${analyticsTabsData.users?.averageApprovalTime || 0}d`, icon: '⏱️', color: '#059669' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  border: `2px solid ${stat.color}20`,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Users by Role */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Role Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Lawyers', value: analyticsTabsData.users?.totalLawyers || 0 },
                    { name: 'NGOs', value: analyticsTabsData.users?.totalNgos || 0 },
                    { name: 'Citizens', value: analyticsTabsData.users?.totalCitizens || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* User Approval Status */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Approval Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Approved', value: analyticsTabsData.users?.approvedUsers || 0 },
                        { name: 'Pending', value: analyticsTabsData.users?.pendingApprovals || 0 },
                        { name: 'Rejected', value: analyticsTabsData.users?.rejectedUsers || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(value) => `${value} users`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Locations */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', gridColumn: 'span 1' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>📍 Top Locations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(analyticsTabsData.users?.topLocations || []).map((location, i) => {
                    const count = analyticsTabsData.users?.usersByLocation?.[location] || 0;
                    const maxCount = Math.max(...Object.values(analyticsTabsData.users?.usersByLocation || {}));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                          <span style={{ fontWeight: '500', color: '#374151' }}>{location}</span>
                          <span style={{ color: '#6b7280' }}>{count} users</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* CASES TAB */}
        {analyticsTab === 'cases' && currentTabData && !hasError && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {[
                { label: 'Open', value: analyticsTabsData.cases?.openCases || 0, icon: '📂', color: '#3b82f6' },
                { label: 'Assigned', value: analyticsTabsData.cases?.assignedCases || 0, icon: '👤', color: '#f59e0b' },
                { label: 'Closed', value: analyticsTabsData.cases?.closedCases || 0, icon: '✅', color: '#10b981' },
                { label: 'High Priority', value: analyticsTabsData.cases?.casesByPriority?.HIGH || 0, icon: '🔴', color: '#ef4444' },
                { label: 'Avg Age (days)', value: analyticsTabsData.cases?.averageCaseAge || 0, icon: '📅', color: '#8b5cf6' },
                { label: 'Resolution Rate', value: `${analyticsTabsData.cases?.caseResolutionRate?.toFixed(1) || 0}%`, icon: '📈', color: '#06b6d4' },
                { label: 'Median Age (days)', value: analyticsTabsData.cases?.medianCaseAge || 0, icon: '⏱️', color: '#ec4899' },
                { label: 'Avg Resolution', value: `${analyticsTabsData.cases?.averageResolutionTime || 0}d`, icon: '✏️', color: '#059669' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  border: `2px solid ${stat.color}20`,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Cases by Status */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Open', value: analyticsTabsData.cases?.casesByStatus?.OPEN || 0 },
                    { name: 'Assigned', value: analyticsTabsData.cases?.casesByStatus?.ASSIGNED || 0 },
                    { name: 'Closed', value: analyticsTabsData.cases?.casesByStatus?.CLOSED || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cases by Priority */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Priority Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High', value: analyticsTabsData.cases?.casesByPriority?.HIGH || 0 },
                        { name: 'Medium', value: analyticsTabsData.cases?.casesByPriority?.MEDIUM || 0 },
                        { name: 'Low', value: analyticsTabsData.cases?.casesByPriority?.LOW || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" /><Cell fill="#f59e0b" /><Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip formatter={(value) => `${value} cases`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cases by Type (Top 5) */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>📚 Top Case Types</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(analyticsTabsData.cases?.casesByType || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count], i) => {
                      const maxCount = Math.max(...Object.values(analyticsTabsData.cases?.casesByType || {}));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span style={{ fontWeight: '500', color: '#374151' }}>{type}</span>
                            <span style={{ color: '#6b7280' }}>{count} cases</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' }}></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top Case Locations */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>📍 Top Case Locations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(analyticsTabsData.cases?.topCaseLocations || []).slice(0, 5).map((location, i) => {
                    const count = analyticsTabsData.cases?.casesByLocation?.[location] || 0;
                    const maxCount = Math.max(...Object.values(analyticsTabsData.cases?.casesByLocation || {}));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                          <span style={{ fontWeight: '500', color: '#374151' }}>{location}</span>
                          <span style={{ color: '#6b7280' }}>{count} cases</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Most Requested Expertise */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>🏷️ Most Requested Expertise</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(analyticsTabsData.cases?.mostRequestedExpertiseTags || []).slice(0, 5).map((tag, i) => (
                    <div key={i} style={{
                      background: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{tag}</span>
                      <span style={{ background: '#10b981', color: 'white', padding: '1px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* MATCHES TAB */}
        {analyticsTab === 'matches' && currentTabData && !hasError && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {[
                { label: 'Total Matches', value: analyticsTabsData.matches?.totalMatches || 0, icon: '🔗', color: '#3b82f6' },
                { label: 'Pending', value: analyticsTabsData.matches?.pendingMatches || 0, icon: '⏳', color: '#f59e0b' },
                { label: 'Accepted', value: analyticsTabsData.matches?.acceptedMatches || 0, icon: '✅', color: '#10b981' },
                { label: 'Rejected', value: analyticsTabsData.matches?.rejectedMatches || 0, icon: '❌', color: '#ef4444' },
                { label: 'Avg Score', value: `${analyticsTabsData.matches?.averageMatchScore?.toFixed(1) || 0}%`, icon: '⭐', color: '#f59e0b' },
                { label: 'High Quality', value: `${analyticsTabsData.matches?.highQualityMatchesPercentage?.toFixed(1) || 0}%`, icon: '🌟', color: '#8b5cf6' },
                { label: 'Match Ratio', value: `${analyticsTabsData.matches?.matchRatioPerCase?.toFixed(1) || 0}`, icon: '📊', color: '#06b6d4' },
                { label: 'Acceptance Rate', value: `${analyticsTabsData.matches?.acceptanceRate?.toFixed(1) || 0}%`, icon: '📈', color: '#ec4899' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  border: `2px solid ${stat.color}20`,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Match Status */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Match Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: analyticsTabsData.matches?.matchesByStatus?.PENDING || 0 },
                        { name: 'Accepted', value: analyticsTabsData.matches?.matchesByStatus?.ACCEPTED_BY_PROVIDER || 0 },
                        { name: 'Rejected (Citizen)', value: analyticsTabsData.matches?.matchesByStatus?.REJECTED_BY_CITIZEN || 0 },
                        { name: 'Rejected (Provider)', value: analyticsTabsData.matches?.matchesByStatus?.REJECTED_BY_PROVIDER || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip formatter={(value) => `${value}`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quality Distribution */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Quality Tiers</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'High (>70%)', value: analyticsTabsData.matches?.highQualityMatchesPercentage || 0 },
                    { name: 'Medium (40-70%)', value: analyticsTabsData.matches?.mediumQualityMatchesPercentage || 0 },
                    { name: 'Low (<40%)', value: analyticsTabsData.matches?.lowQualityMatchesPercentage || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Match Locations */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>📍 Top Match Locations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(analyticsTabsData.matches?.topMatchLocations || []).slice(0, 5).map((location, i) => {
                    const count = analyticsTabsData.matches?.matchesByLocation?.[location] || 0;
                    const maxCount = Math.max(...Object.values(analyticsTabsData.matches?.matchesByLocation || {}));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                          <span style={{ fontWeight: '500', color: '#374151' }}>{location}</span>
                          <span style={{ color: '#6b7280' }}>{count} matches</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Response Time Metrics */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>⏱️ Response Times</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Avg Time to Acceptance', value: `${analyticsTabsData.matches?.averageTimeToAcceptance || 0} days` },
                    { label: 'Avg Time to Rejection', value: `${analyticsTabsData.matches?.averageTimeToRejection || 0} days` }
                  ].map((stat, i) => (
                    <div key={i} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ACTIVITY TAB */}
        {analyticsTab === 'activity' && currentTabData && !hasError && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {[
                { label: 'Appointments (Total)', value: analyticsTabsData.activity?.totalAppointments || 0, icon: '📅', color: '#3b82f6' },
                { label: 'This Month', value: analyticsTabsData.activity?.appointmentsThisMonth || 0, icon: '📊', color: '#f59e0b' },
                { label: 'Completed', value: analyticsTabsData.activity?.completedAppointments || 0, icon: '✅', color: '#10b981' },
                { label: 'Cancelled', value: analyticsTabsData.activity?.cancelledAppointments || 0, icon: '❌', color: '#ef4444' },
                { label: 'Chat Messages', value: analyticsTabsData.activity?.totalChatMessages || 0, icon: '💬', color: '#06b6d4' },
                { label: 'This Month', value: analyticsTabsData.activity?.messagesThisMonth || 0, icon: '📨', color: '#8b5cf6' },
                { label: 'Active Conversations', value: analyticsTabsData.activity?.activeConversations || 0, icon: '🗨️', color: '#ec4899' },
                { label: 'Notifications Sent', value: analyticsTabsData.activity?.notificationsThisMonth || 0, icon: '🔔', color: '#059669' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  border: `2px solid ${stat.color}20`,
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Activity by User Role */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Activity by Role</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Lawyers', value: analyticsTabsData.activity?.activityByUserRole?.LAWYER || 0 },
                    { name: 'NGOs', value: analyticsTabsData.activity?.activityByUserRole?.NGO || 0 },
                    { name: 'Citizens', value: analyticsTabsData.activity?.activityByUserRole?.CITIZEN || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Engagement Rates */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>Engagement Rates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Lawyer Engagement', value: `${analyticsTabsData.activity?.lawyerEngagementRate?.toFixed(1) || 0}%`, color: '#3b82f6' },
                    { label: 'NGO Engagement', value: `${analyticsTabsData.activity?.ngoEngagementRate?.toFixed(1) || 0}%`, color: '#10b981' },
                    { label: 'Citizen Engagement', value: `${analyticsTabsData.activity?.citizenEngagementRate?.toFixed(1) || 0}%`, color: '#f59e0b' }
                  ].map((stat, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{stat.label}</span>
                        <span style={{ color: stat.color, fontWeight: '700' }}>{stat.value}</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: stat.value, background: stat.color, transition: 'width 0.3s ease' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Activity Hours */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>🕐 Peak Activity Hours</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(analyticsTabsData.activity?.peakActivityHours || []).map((hour, i) => (
                    <div key={i} style={{
                      background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{hour}</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>Peak hours</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '14px', padding: '12px', background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', color: '#1e40af' }}>
                  <strong>Peak Activity:</strong> {analyticsTabsData.activity?.peakHourActivityPercentage?.toFixed(1) || 0}% of daily activity
                </div>
              </div>

              {/* Top Activity Locations */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>📍 Most Active Locations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(analyticsTabsData.activity?.mostActiveLocations || []).slice(0, 5).map((location, i) => {
                    const count = analyticsTabsData.activity?.activityByLocation?.[location] || 0;
                    const maxCount = Math.max(...Object.values(analyticsTabsData.activity?.activityByLocation || {}));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                          <span style={{ fontWeight: '500', color: '#374151' }}>{location}</span>
                          <span style={{ color: '#6b7280' }}>{count} activities</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Average Response Times */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>⏱️ Response Times</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Avg Response Time', value: `${analyticsTabsData.activity?.averageResponseTime || 0} min`, icon: '💬' },
                    { label: 'Avg Case Review Time', value: `${analyticsTabsData.activity?.averageCaseReviewTime || 0} hours`, icon: '📋' },
                    { label: 'Avg Match Decision', value: `${analyticsTabsData.activity?.averageMatchDecisionTime || 0} hours`, icon: '🔗' }
                  ].map((stat, i) => (
                    <div key={i} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{stat.label}</div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Breakdown */}
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', gridColumn: analyticsTab === 'activity' && window.innerWidth > 768 ? 'span 1' : 'span 1' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' }}>🔔 Notification Types</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(analyticsTabsData.activity?.notificationsByType || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count], i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f9fafb',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{type}</span>
                        <span style={{ background: '#3b82f6', color: 'white', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

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
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'profile-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile-management')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile Management</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Directory Ingestion</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'lawyer-directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('lawyer-directory')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Lawyer/NGO Directory</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Application Logs</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Case Management</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Impact Analytics</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>System Health</span>
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

        {activeTab === 'dashboard' ? (
          renderDashboard()
        ) : activeTab === 'profile-management' ? (
          <div className="admin-content-section">
            <div className="section-header-new">
              <h2 className="section-title-new">User Management</h2>
              <p className="section-subtitle">Manage user profiles, approvals, and account status.</p>
            </div>

            {/* Profile Management Tabs */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
              {[
                { key: 'verification-queue', icon: '✅', label: 'Verification Queue', color: '#3b82f6' },
                { key: 'user-management', icon: '👥', label: 'User Management', color: '#10b981' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setProfileTab(tab.key)}
                  style={{
                    padding: '12px 20px',
                    border: '2px solid transparent',
                    borderBottom: profileTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
                    background: profileTab === tab.key ? `${tab.color}10` : 'transparent',
                    color: profileTab === tab.key ? tab.color : '#666',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer',
                    fontWeight: profileTab === tab.key ? '600' : '500',
                    fontSize: '14px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    if (profileTab !== tab.key) {
                      e.target.style.background = `${tab.color}05`;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (profileTab !== tab.key) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Verification Queue Tab */}
            {profileTab === 'verification-queue' && (
              <div>
                <div className="search-filter-container">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="search-input-new"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="filters-row">
                    <div className="filter-group">
                      <label className="filter-label">Filter by Role:</label>
                      <select
                        className="filter-select"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                      >
                        <option value="">All Roles</option>
                        <option value="LAWYER">Lawyer</option>
                        <option value="NGO">NGO</option>
                        <option value="CITIZEN">Citizen</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">Filter by Status:</label>
                      <select
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="REAPPROVAL_PENDING">Re-approval Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>

                    <button
                      className="reset-filters-btn"
                      onClick={() => {
                        setFilterRole('');
                        setFilterStatus('');
                        setSearchTerm('');
                      }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Filters
                    </button>
                  </div>
                </div>

                <div className="table-results-summary">
                  <p className="results-text">
                    Showing <strong>{filteredPending.length + filteredApproved.length}</strong> result{(filteredPending.length + filteredApproved.length) !== 1 ? 's' : ''}
                    {(filterRole || filterStatus) && (
                      <span className="filter-applied">
                        {' '}with filters applied
                      </span>
                    )}
                  </p>
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
                            <td className="name-cell" data-label="Name">{u.username}</td>
                            <td className="role-cell" data-label="Role">{u.role}</td>
                            <td className="email-cell" data-label="Email">{u.email}</td>
                            <td className="date-cell" data-label="Submitted Date">
                              {new Date(u.createdAt || Date.now()).toLocaleDateString('en-CA')}
                            </td>
                            <td className="status-cell" data-label="Status">
                              <span className="status-badge status-pending">
                                {u.approvalStatus === 'REAPPROVAL_PENDING' ? 'Re-approval Pending' : 'Pending'}
                              </span>
                            </td>
                            <td className="actions-cell" data-label="Actions">
                              <button
                                onClick={() => handleViewDetails(u)}
                                style={{
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = '#bfdbfe';
                                  e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.2)';
                                  e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = '#dbeafe';
                                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                  e.target.style.transform = 'translateY(0)';
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Details
                              </button>
                              <button
                                onClick={() => handleApprove(u.id, u.username)}
                                disabled={actionLoading === u.id}
                                style={{
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: '#dcfce7',
                                  color: '#166534',
                                  borderRadius: '6px',
                                  cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  opacity: actionLoading === u.id ? 0.6 : 1,
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseOver={(e) => {
                                  if (actionLoading !== u.id) {
                                    e.target.style.background = '#bbf7d0';
                                    e.target.style.boxShadow = '0 4px 8px rgba(22, 101, 52, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (actionLoading !== u.id) {
                                    e.target.style.background = '#dcfce7';
                                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                    e.target.style.transform = 'translateY(0)';
                                  }
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {actionLoading === u.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(u.id, u.username)}
                                disabled={actionLoading === u.id}
                                style={{
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  borderRadius: '6px',
                                  cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  opacity: actionLoading === u.id ? 0.6 : 1,
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseOver={(e) => {
                                  if (actionLoading !== u.id) {
                                    e.target.style.background = '#fecaca';
                                    e.target.style.boxShadow = '0 4px 8px rgba(153, 27, 27, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (actionLoading !== u.id) {
                                    e.target.style.background = '#fee2e2';
                                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                    e.target.style.transform = 'translateY(0)';
                                  }
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {actionLoading === u.id ? 'Rejecting...' : 'Reject'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredApproved.map((u) => (
                          <tr key={u.id}>
                            <td className="name-cell" data-label="Name">{u.username}</td>
                            <td className="role-cell" data-label="Role">{u.role}</td>
                            <td className="email-cell" data-label="Email">{u.email}</td>
                            <td className="date-cell" data-label="Submitted Date">
                              {new Date(u.createdAt || Date.now()).toLocaleDateString('en-CA')}
                            </td>
                            <td className="status-cell" data-label="Status">
                              <span className={`status-badge ${u.approvalStatus === 'APPROVED' ? 'status-approved' :
                                u.approvalStatus === 'SUSPENDED' ? 'status-suspended' :
                                  'status-rejected'
                                }`}>
                                {u.approvalStatus === 'APPROVED' ? 'Approved' :
                                  u.approvalStatus === 'SUSPENDED' ? 'Suspended' :
                                    'Rejected'}
                              </span>
                            </td>
                            <td className="actions-cell" data-label="Actions">
                              <button
                                onClick={() => handleViewDetails(u)}
                                style={{
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = '#bfdbfe';
                                  e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.2)';
                                  e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = '#dbeafe';
                                  e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                  e.target.style.transform = 'translateY(0)';
                                }}
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Details
                              </button>
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
              </div>
            )}

            {/* User Management Tab */}
            {profileTab === 'user-management' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  {/* Search Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* Role Filter */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Role
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['All', 'Citizen', 'Lawyer', 'NGO'].map(role => {
                          const isSelected = userManagementFilterRole === (role === 'All' ? '' : role.toUpperCase());
                          return (
                            <button
                              key={role}
                              onClick={() => setUserManagementFilterRole(role === 'All' ? '' : role.toUpperCase())}
                              style={{
                                padding: '8px 14px',
                                border: 'none',
                                background: isSelected ? '#3b82f6' : '#f3f4f6',
                                color: isSelected ? '#fff' : '#6b7280',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: isSelected ? '600' : '500',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) {
                                  e.target.style.background = '#e5e7eb';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) {
                                  e.target.style.background = '#f3f4f6';
                                }
                              }}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Status
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'All', value: '' },
                          { label: 'Approved', value: 'APPROVED' },
                          { label: 'Suspended', value: 'SUSPENDED' },
                          { label: 'Pending', value: 'PENDING' },
                          { label: 'Rejected', value: 'REJECTED' }
                        ].map(status => {
                          const isSelected = userManagementFilterStatus === status.value;
                          let bgColor = '#f3f4f6';
                          let bgColorSelected = '#3b82f6';
                          
                          if (status.value === 'APPROVED') {
                            bgColor = '#ecfdf5';
                            bgColorSelected = '#10b981';
                          } else if (status.value === 'SUSPENDED') {
                            bgColor = '#fef2f2';
                            bgColorSelected = '#dc2626';
                          } else if (status.value === 'PENDING') {
                            bgColor = '#fffbeb';
                            bgColorSelected = '#f59e0b';
                          } else if (status.value === 'REJECTED') {
                            bgColor = '#fef2f2';
                            bgColorSelected = '#ef4444';
                          }

                          return (
                            <button
                              key={status.value}
                              onClick={() => setUserManagementFilterStatus(status.value)}
                              style={{
                                padding: '8px 14px',
                                border: 'none',
                                background: isSelected ? bgColorSelected : bgColor,
                                color: isSelected ? '#fff' : (status.value === 'APPROVED' ? '#059669' : status.value === 'SUSPENDED' ? '#991b1b' : status.value === 'PENDING' ? '#92400e' : status.value === 'REJECTED' ? '#7f1d1d' : '#6b7280'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: isSelected ? '600' : '500',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected ? `0 2px 8px rgba(0, 0, 0, 0.1)` : 'none'
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) {
                                  e.target.style.opacity = '0.8';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) {
                                  e.target.style.opacity = '1';
                                }
                              }}
                            >
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reset Button */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setUserManagementFilterRole('');
                          setUserManagementFilterStatus('');
                          setSearchTerm('');
                        }}
                        style={{
                          padding: '8px 14px',
                          border: '1px solid #d1d5db',
                          background: '#fff',
                          color: '#6b7280',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.borderColor = '#9ca3af';
                          e.target.style.background = '#f9fafb';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.background = '#fff';
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="table-results-summary">
                  <p className="results-text">
                    Showing <strong>{filteredAllUsers.length}</strong> user{filteredAllUsers.length !== 1 ? 's' : ''}
                    {(userManagementFilterRole || userManagementFilterStatus) && (
                      <span className="filter-applied">
                        {' '} (
                        {userManagementFilterRole && `Role: ${userManagementFilterRole}`}
                        {userManagementFilterRole && userManagementFilterStatus && ', '}
                        {userManagementFilterStatus && `Status: ${userManagementFilterStatus}`}
                        )
                      </span>
                    )}
                  </p>
                </div>

                <div className="table-wrapper">
                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner"></div>
                      <p>Loading users...</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Created Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAllUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="empty-cell">No users found</td>
                          </tr>
                        ) : (
                          filteredAllUsers.map((u) => (
                            <tr key={u.id}>
                              <td className="name-cell" data-label="Username">
                                <span style={{ fontWeight: '500' }}>{u.username}</span>
                              </td>
                              <td className="email-cell" data-label="Email">{u.email}</td>
                              <td className="role-cell" data-label="Role">
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: u.role === 'LAWYER' ? '#dbeafe' : u.role === 'NGO' ? '#dcfce7' : '#fef3c7',
                                  color: u.role === 'LAWYER' ? '#1e40af' : u.role === 'NGO' ? '#166534' : '#92400e'
                                }}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="status-cell" data-label="Status">
                                <span className={`status-badge ${u.approvalStatus === 'APPROVED' ? 'status-approved' :
                                  u.approvalStatus === 'SUSPENDED' ? 'status-suspended' :
                                  u.approvalStatus === 'PENDING' || u.approvalStatus === 'REAPPROVAL_PENDING' ? 'status-pending' :
                                    'status-rejected'
                                  }`}>
                                  {u.approvalStatus === 'REAPPROVAL_PENDING' ? 'Re-approval Pending' : u.approvalStatus}
                                </span>
                              </td>
                              <td className="date-cell" data-label="Created Date">
                                {new Date(u.createdAt || Date.now()).toLocaleDateString('en-CA')}
                              </td>
                              <td className="actions-cell" data-label="Actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {/* View Button */}
                                <button
                                  onClick={() => handleViewDetails(u)}
                                  title="View user details"
                                  style={{
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                  }}
                                  onMouseOver={(e) => {
                                    e.target.style.background = '#bfdbfe';
                                    e.target.style.boxShadow = '0 4px 8px rgba(30, 64, 175, 0.2)';
                                    e.target.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.background = '#dbeafe';
                                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                    e.target.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>

                                {/* Suspend Button */}
                                {u.approvalStatus === 'APPROVED' && (
                                  <button
                                    onClick={() => handleSuspend(u.id, u.username)}
                                    disabled={actionLoading === u.id}
                                    title="Temporarily suspend this user account"
                                    style={{
                                      padding: '8px 12px',
                                      border: 'none',
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      borderRadius: '6px',
                                      cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      opacity: actionLoading === u.id ? 0.6 : 1,
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                    }}
                                    onMouseOver={(e) => {
                                      if (actionLoading !== u.id) {
                                        e.target.style.background = '#fcd34d';
                                        e.target.style.boxShadow = '0 4px 8px rgba(146, 64, 14, 0.2)';
                                        e.target.style.transform = 'translateY(-1px)';
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (actionLoading !== u.id) {
                                        e.target.style.background = '#fef3c7';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                        e.target.style.transform = 'translateY(0)';
                                      }
                                    }}
                                  >
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {actionLoading === u.id ? 'Suspending...' : 'Suspend'}
                                  </button>
                                )}

                                {/* Activate Button */}
                                {u.approvalStatus === 'SUSPENDED' && (
                                  <button
                                    onClick={() => handleReactivate(u.id, u.username)}
                                    disabled={actionLoading === u.id}
                                    title="Reactivate this user account"
                                    style={{
                                      padding: '8px 12px',
                                      border: 'none',
                                      background: '#dcfce7',
                                      color: '#166534',
                                      borderRadius: '6px',
                                      cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      opacity: actionLoading === u.id ? 0.6 : 1,
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                    }}
                                    onMouseOver={(e) => {
                                      if (actionLoading !== u.id) {
                                        e.target.style.background = '#bbf7d0';
                                        e.target.style.boxShadow = '0 4px 8px rgba(22, 101, 52, 0.2)';
                                        e.target.style.transform = 'translateY(-1px)';
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (actionLoading !== u.id) {
                                        e.target.style.background = '#dcfce7';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                        e.target.style.transform = 'translateY(0)';
                                      }
                                    }}
                                  >
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {actionLoading === u.id ? 'Activating...' : 'Activate'}
                                  </button>
                                )}

                                {/* Delete Button - Hidden for Admin users */}
                                {u.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    disabled={actionLoading === u.id}
                                    title="Permanently delete this user"
                                    style={{
                                      padding: '8px 12px',
                                      border: 'none',
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      borderRadius: '6px',
                                      cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      opacity: actionLoading === u.id ? 0.6 : 1,
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                                    }}
                                    onMouseOver={(e) => {
                                      if (actionLoading !== u.id) {
                                        e.target.style.background = '#fca5a5';
                                        e.target.style.color = '#7f1d1d';
                                        e.target.style.boxShadow = '0 4px 12px rgba(153, 27, 27, 0.25)';
                                        e.target.style.transform = 'translateY(-1px)';
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (actionLoading !== u.id) {
                                        e.target.style.background = '#fee2e2';
                                        e.target.style.color = '#991b1b';
                                        e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                                        e.target.style.transform = 'translateY(0)';
                                      }
                                    }}
                                  >
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {actionLoading === u.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'directory' ? (
          <DirectoryIngestion />
        ) : activeTab === 'lawyer-directory' ? (
          <Directory />
        ) : activeTab === 'logs' ? (
          <div className="admin-content-section">
            <div className="section-header-new">
              <h2 className="section-title-new">Application Logs</h2>
              <p className="section-subtitle">Monitor system activity and troubleshoot issues</p>
            </div>

            {/* Log Statistics */}
            {logStats && (
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#dbeafe' }}>
                    <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Total Logs</p>
                    <p className="stat-value">{logStats.totalLogs || 0}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fee2e2' }}>
                    <svg width="24" height="24" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Errors (24h)</p>
                    <p className="stat-value" style={{ color: '#dc2626' }}>{logStats.errorCount || 0}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef3c7' }}>
                    <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Warnings (24h)</p>
                    <p className="stat-value" style={{ color: '#f59e0b' }}>{logStats.warnCount || 0}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#dbeafe' }}>
                    <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Info Logs (24h)</p>
                    <p className="stat-value">{logStats.infoCount || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Log Filters */}
            <div className="log-filters" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                className="search-input-new"
                style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '300px', flex: '1' }}
                value={logSearchTerm}
                onChange={(e) => setLogSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogSearch()}
              />
              <select
                className="filter-select"
                style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                value={logSortBy}
                onChange={(e) => setLogSortBy(e.target.value)}
                title="Sort By"
              >
                <option value="timestamp">Sort: Timestamp</option>
                <option value="level">Sort: Level</option>
                <option value="endpoint">Sort: Endpoint</option>
                <option value="username">Sort: Username</option>
              </select>
              <select
                className="filter-select"
                style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                value={logSortOrder}
                onChange={(e) => setLogSortOrder(e.target.value)}
                title="Sort Order"
              >
                <option value="desc">↓ Newest First</option>
                <option value="asc">↑ Oldest First</option>
              </select>
              <select
                className="filter-select"
                style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                value={logPageSize}
                onChange={(e) => { setLogPageSize(Number(e.target.value)); setLogPage(0); }}
                title="Page Size"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              <button
                className="btn-primary"
                onClick={handleLogSearch}
                style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
              <button
                className="btn-secondary"
                onClick={handleClearFilters}
                style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
              <button
                className="btn-danger"
                onClick={handleCleanupOldLogs}
                disabled={cleanupLoading}
                style={{ padding: '10px 20px', whiteSpace: 'nowrap', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: cleanupLoading ? 'not-allowed' : 'pointer', opacity: cleanupLoading ? 0.6 : 1 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {cleanupLoading ? 'Cleaning...' : 'Cleanup Logs (7+ days)'}
              </button>
            </div>

            {/* Cleanup Status Message */}
            {cleanupMessage && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: cleanupMessage.includes('✓') ? '#d1fae5' : '#fee2e2',
                color: cleanupMessage.includes('✓') ? '#065f46' : '#7f1d1d',
                border: `1px solid ${cleanupMessage.includes('✓') ? '#6ee7b7' : '#fecaca'}`,
                fontSize: '0.875rem'
              }}>
                {cleanupMessage}
              </div>
            )}

            {/* Logs Table */}
            <div className="table-wrapper">
              {logsLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="empty-state">
                  <svg width="80" height="80" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3>No Logs Found</h3>
                  <p>No logs match your search criteria</p>
                </div>
              ) : (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Level</th>
                        <th>Logger</th>
                        <th>Endpoint</th>
                        <th>Message</th>
                        <th>Username</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => handleLogRowClick(log)}
                          style={{
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td data-label="Timestamp" style={{ fontSize: '0.875rem' }}>{formatLogTimestamp(log.timestamp)}</td>
                          <td data-label="Level">
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#fff',
                                backgroundColor: getLogLevelColor(log.level)
                              }}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td data-label="Logger" style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.logger || 'N/A'}
                          </td>
                          <td data-label="Endpoint" style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{log.endpoint || '-'}</td>
                          <td data-label="Message" style={{ fontSize: '0.875rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.message}
                          </td>
                          <td data-label="Username" style={{ fontSize: '0.875rem' }}>{log.username || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Log Detail Modal */}
                  {showLogModal && selectedLog && (
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        animation: 'fadeIn 0.2s ease'
                      }}
                      onClick={handleCloseLogModal}
                    >
                      <div
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          padding: '24px',
                          maxWidth: '900px',
                          width: '95%',
                          maxHeight: '85vh',
                          overflowY: 'auto',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                          animation: 'slideUp 0.3s ease'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
                          <div>
                            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                              Log Details
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                              Logged at {formatLogTimestamp(selectedLog.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={handleCloseLogModal}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              fontSize: '24px',
                              cursor: 'pointer',
                              color: '#6b7280',
                              transition: 'color 0.2s ease',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                            title="Close modal (Esc)"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                          {/* Left Column - Metadata */}
                          <div>
                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                Level
                              </label>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 16px',
                                  borderRadius: '12px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: '#fff',
                                  backgroundColor: getLogLevelColor(selectedLog.level)
                                }}
                              >
                                {selectedLog.level}
                              </span>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                Logger
                              </label>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                              }}>
                                {selectedLog.logger || 'N/A'}
                              </p>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                Endpoint
                              </label>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                              }}>
                                {selectedLog.endpoint || '-'}
                              </p>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                Username
                              </label>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                padding: '8px 12px',
                                borderRadius: '6px'
                              }}>
                                {selectedLog.username || '-'}
                              </p>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                                Thread Name
                              </label>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace'
                              }}>
                                {selectedLog.threadName || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Right Column - Message and Exception */}
                          <div style={{ gridColumn: 'auto', minWidth: '0' }}>
                            <div style={{ marginBottom: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                                  Message
                                </label>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedLog.message);
                                    alert('Message copied to clipboard!');
                                  }}
                                  style={{
                                    backgroundColor: '#e5e7eb',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    color: '#374151',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                >
                                  Copy
                                </button>
                              </div>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#1f2937',
                                backgroundColor: '#f9fafb',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                fontFamily: 'monospace'
                              }}>
                                {selectedLog.message}
                              </p>
                            </div>

                            {selectedLog.exception && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                                    Exception / Stack Trace
                                  </label>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedLog.exception);
                                      alert('Stack trace copied to clipboard!');
                                    }}
                                    style={{
                                      backgroundColor: '#e5e7eb',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      color: '#374151',
                                      fontWeight: '500',
                                      transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                                  >
                                    Copy
                                  </button>
                                </div>
                                <pre style={{
                                  margin: 0,
                                  fontSize: '0.75rem',
                                  color: '#b91c1c',
                                  backgroundColor: '#fef2f2',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: '1px solid #fecaca',
                                  overflowX: 'auto',
                                  maxHeight: '400px',
                                  overflowY: 'auto',
                                  fontFamily: 'monospace'
                                }}>
                                  {selectedLog.exception}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button
                            onClick={handleCloseLogModal}
                            className="btn-secondary"
                            style={{
                              padding: '8px 16px',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalLogPages > 1 && (
                    <div className="pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setLogPage(Math.max(0, logPage - 1))}
                        disabled={logPage === 0}
                        style={{ padding: '8px 16px' }}
                      >
                        Previous
                      </button>
                      <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                        Page {logPage + 1} of {totalLogPages}
                      </span>
                      <button
                        className="btn-secondary"
                        onClick={() => setLogPage(Math.min(totalLogPages - 1, logPage + 1))}
                        disabled={logPage >= totalLogPages - 1}
                        style={{ padding: '8px 16px' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : activeTab === 'cases' ? (
          <div className="admin-content-section">
            <div className="section-header-new">
              <h2 className="section-title-new">Case Management</h2>
              <p className="section-subtitle">View and manage all submitted cases in the system</p>
            </div>

            <div className="search-filter-container">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search cases by title, category, or submitter..."
                  className="search-input-new"
                  value={caseSearchTerm}
                  onChange={(e) => setCaseSearchTerm(e.target.value)}
                />
              </div>

              <div className="filters-row">
                <div className="filter-group">
                  <label className="filter-label">Filter by Status:</label>
                  <select
                    className="filter-select"
                    value={caseFilterStatus}
                    onChange={(e) => setCaseFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Filter by Priority:</label>
                  <select
                    className="filter-select"
                    value={caseFilterPriority}
                    onChange={(e) => setCaseFilterPriority(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <button
                  className="reset-filters-btn"
                  onClick={() => {
                    setCaseSearchTerm('');
                    setCaseFilterStatus('');
                    setCaseFilterPriority('');
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="table-results-summary">
              <p className="results-text">
                Showing <strong>{
                  cases.filter(c => {
                    const matchesSearch = !caseSearchTerm ||
                      c.title?.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                      c.caseType?.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                      c.createdByUsername?.toLowerCase().includes(caseSearchTerm.toLowerCase());
                    const matchesStatus = !caseFilterStatus || c.status === caseFilterStatus;
                    const matchesPriority = !caseFilterPriority || c.priority === caseFilterPriority;
                    return matchesSearch && matchesStatus && matchesPriority;
                  }).length
                }</strong> case{cases.filter(c => {
                  const matchesSearch = !caseSearchTerm ||
                    c.title?.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                    c.caseType?.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                    c.createdByUsername?.toLowerCase().includes(caseSearchTerm.toLowerCase());
                  const matchesStatus = !caseFilterStatus || c.status === caseFilterStatus;
                  const matchesPriority = !caseFilterPriority || c.priority === caseFilterPriority;
                  return matchesSearch && matchesStatus && matchesPriority;
                }).length !== 1 ? 's' : ''}
                {(caseFilterStatus || caseFilterPriority || caseSearchTerm) && (
                  <span className="filter-applied">
                    {' '}with filters applied
                  </span>
                )}
              </p>
            </div>

            <div className="table-wrapper">
              {casesLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading cases...</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No cases found in the system</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Submitted By</th>
                      <th>Assigned To</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases
                      .filter(c => {
                        const matchesSearch = !caseSearchTerm ||
                          c.title?.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                          c.caseType?.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                          c.createdByUsername?.toLowerCase().includes(caseSearchTerm.toLowerCase());
                        const matchesStatus = !caseFilterStatus || c.status === caseFilterStatus;
                        const matchesPriority = !caseFilterPriority || c.priority === caseFilterPriority;
                        return matchesSearch && matchesStatus && matchesPriority;
                      })
                      .map(caseItem => (
                        <tr key={caseItem.id}>
                          <td data-label="Case ID">
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              #{caseItem.id}
                            </span>
                          </td>
                          <td data-label="Title">
                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {caseItem.title || 'Untitled'}
                            </div>
                          </td>
                          <td data-label="Category">
                            <span className="category-badge">
                              {caseItem.caseType || 'N/A'}
                            </span>
                          </td>
                          <td data-label="Status">
                            <span className={`status-badge status-${caseItem.status?.toLowerCase().replace('_', '-') || 'unknown'}`}>
                              {caseItem.status?.replace('_', ' ') || 'Unknown'}
                            </span>
                          </td>
                          <td data-label="Priority">
                            <span className={`priority-badge priority-${caseItem.priority?.toLowerCase() || 'medium'}`}>
                              {caseItem.priority || 'Medium'}
                            </span>
                          </td>
                          <td data-label="Submitted By">
                            <div className="user-cell">
                              <div className="user-avatar-small">
                                {caseItem.createdByUsername?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="user-name">{caseItem.createdByUsername || 'Unknown'}</div>
                                <div className="user-email">{caseItem.createdByEmail || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Assigned To">
                            {caseItem.assignedProviderUsername ? (
                              <div className="user-cell">
                                <div className="user-avatar-small" style={{ backgroundColor: '#10b981' }}>
                                  {caseItem.assignedProviderUsername?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                <div>
                                  <div className="user-name">{caseItem.assignedProviderUsername}</div>
                                  <div className="user-role-small">{caseItem.assignedProviderRole || ''}</div>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not assigned</span>
                            )}
                          </td>
                          <td data-label="Created">
                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              {caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <button
                              className="btn-view"
                              onClick={() => {
                                setSelectedCaseDetail(caseItem);
                                setShowCaseDetailModal(true);
                              }}
                              title="View Details"
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}

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
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
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
                  {selectedUser.yearsOfExperience && (
                    <div className="detail-item">
                      <label className="detail-label">Years of Experience</label>
                      <p className="detail-value">{selectedUser.yearsOfExperience} years</p>
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

        {/* Case Detail Modal */}
        {showCaseDetailModal && selectedCaseDetail && (
          <div className="modal-overlay" onClick={() => setShowCaseDetailModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Case Details - #{selectedCaseDetail.id}</h3>
                <button className="modal-close" onClick={() => setShowCaseDetailModal(false)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="case-detail-grid">
                  {/* Case Information Section */}
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Case Information
                    </h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label className="detail-label">Title</label>
                        <p className="detail-value">{selectedCaseDetail.title || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label className="detail-label">Category</label>
                        <p className="detail-value">
                          <span className="category-badge">{selectedCaseDetail.caseType || 'N/A'}</span>
                        </p>
                      </div>
                      <div className="detail-item">
                        <label className="detail-label">Status</label>
                        <p className="detail-value">
                          <span className={`status-badge status-${selectedCaseDetail.status?.toLowerCase().replace('_', '-') || 'unknown'}`}>
                            {selectedCaseDetail.status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      <div className="detail-item">
                        <label className="detail-label">Priority</label>
                        <p className="detail-value">
                          <span className={`priority-badge priority-${selectedCaseDetail.priority?.toLowerCase() || 'medium'}`}>
                            {selectedCaseDetail.priority || 'Medium'}
                          </span>
                        </p>
                      </div>
                      <div className="detail-item">
                        <label className="detail-label">Location</label>
                        <p className="detail-value">{selectedCaseDetail.location || 'N/A'}</p>
                      </div>
                      <div className="detail-item">
                        <label className="detail-label">Created Date</label>
                        <p className="detail-value">
                          {selectedCaseDetail.createdAt
                            ? new Date(selectedCaseDetail.createdAt).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="detail-item full-width">
                        <label className="detail-label">Description</label>
                        <p className="detail-value description-text">
                          {selectedCaseDetail.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submitter Information Section */}
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Submitted By
                    </h4>
                    <div className="user-info-card">
                      <div className="user-avatar-medium">
                        {selectedCaseDetail.createdByUsername?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-info-details">
                        <div className="detail-item">
                          <label className="detail-label">Username</label>
                          <p className="detail-value">{selectedCaseDetail.createdByUsername || 'N/A'}</p>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">Email</label>
                          <p className="detail-value">{selectedCaseDetail.createdByEmail || 'N/A'}</p>
                        </div>
                        <div className="detail-item">
                          <label className="detail-label">User ID</label>
                          <p className="detail-value">#{selectedCaseDetail.createdById || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Provider Section */}
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Assigned Provider
                    </h4>
                    {selectedCaseDetail.assignedProviderUsername ? (
                      <div className="user-info-card provider-card">
                        <div className="user-avatar-medium" style={{ backgroundColor: '#10b981' }}>
                          {selectedCaseDetail.assignedProviderUsername?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div className="user-info-details">
                          <div className="detail-item">
                            <label className="detail-label">Provider Name</label>
                            <p className="detail-value">{selectedCaseDetail.assignedProviderUsername}</p>
                          </div>
                          <div className="detail-item">
                            <label className="detail-label">Email</label>
                            <p className="detail-value">{selectedCaseDetail.assignedProviderEmail || 'N/A'}</p>
                          </div>
                          <div className="detail-item">
                            <label className="detail-label">Role</label>
                            <p className="detail-value">
                              <span className="role-badge">{selectedCaseDetail.assignedProviderRole || 'N/A'}</span>
                            </p>
                          </div>
                          <div className="detail-item">
                            <label className="detail-label">Assigned Date</label>
                            <p className="detail-value">
                              {selectedCaseDetail.assignedAt
                                ? new Date(selectedCaseDetail.assignedAt).toLocaleString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-provider-message">
                        <svg width="40" height="40" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No provider has been assigned to this case yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowCaseDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'health' && <HealthMonitoring token={localStorage.getItem('accessToken')} />}
      </div>
    </div>
  );
}

export default DashboardAdmin;