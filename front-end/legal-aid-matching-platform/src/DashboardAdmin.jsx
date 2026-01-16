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
import './AdminDashboard.css';
import MapVisualization from './MapVisualization';

function DashboardAdmin() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analyticsTab, setAnalyticsTab] = useState('overview');
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
  const [filterRole, setFilterRole] = useState(''); // Filter for user roles
  const [filterStatus, setFilterStatus] = useState(''); // Filter for approval status

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
  const [overviewData, setOverviewData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [casesData, setCasesData] = useState(null);
  const [matchesData, setMatchesData] = useState(null);
  const [activityData, setActivityData] = useState(null);

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

  const fetchAnalyticsTabData = async () => {
    setAnalyticsLoading(true);
    try {
      if (analyticsTab === 'overview' && !overviewData) {
        const response = await analyticsService.getOverview();
        setOverviewData(response);
      } else if (analyticsTab === 'users' && !usersData) {
        const response = await analyticsService.getUsers();
        setUsersData(response);
      } else if (analyticsTab === 'cases' && !casesData) {
        const response = await analyticsService.getCases();
        setCasesData(response);
      } else if (analyticsTab === 'matches' && !matchesData) {
        const response = await analyticsService.getMatches();
        setMatchesData(response);
      } else if (analyticsTab === 'activity' && !activityData) {
        const response = await analyticsService.getActivity();
        setActivityData(response);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
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

  const filteredPending = pendingUsers.filter(u => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesStatus = !filterStatus || u.approvalStatus === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredApproved = approvedUsers.filter(u => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesStatus = !filterStatus || u.approvalStatus === filterStatus;
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
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h2 className="analytics-title">Impact Analytics</h2>
          <p className="analytics-subtitle">Platform performance metrics and insights</p>
        </div>

        {/* Analytics Tabs */}
        <div className="analytics-tabs">
          <button
            className={`analytics-tab ${analyticsTab === 'overview' ? 'active' : ''}`}
            onClick={() => setAnalyticsTab('overview')}
          >
            Overview
          </button>
          <button
            className={`analytics-tab ${analyticsTab === 'users' ? 'active' : ''}`}
            onClick={() => setAnalyticsTab('users')}
          >
            Users
          </button>
          <button
            className={`analytics-tab ${analyticsTab === 'cases' ? 'active' : ''}`}
            onClick={() => setAnalyticsTab('cases')}
          >
            Cases
          </button>
          <button
            className={`analytics-tab ${analyticsTab === 'matches' ? 'active' : ''}`}
            onClick={() => setAnalyticsTab('matches')}
          >
            Matches
          </button>
          <button
            className={`analytics-tab ${analyticsTab === 'activity' ? 'active' : ''}`}
            onClick={() => setAnalyticsTab('activity')}
          >
            Activity
          </button>
        </div>

        {/* Overview Tab */}
        {analyticsTab === 'overview' && (
          <>
            {/* Overview KPI Cards */}
            <div className="kpi-cards-grid" style={{ marginTop: '24px' }}>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#dbeafe' }}>
                  <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total Users</p>
                  <p className="kpi-value">{overviewData?.totalUsers || 0}</p>
                  <p className="kpi-subtitle">{overviewData?.newUsersThisMonth || 0} new this month</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7' }}>
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total Cases</p>
                  <p className="kpi-value">{overviewData?.totalCases || 0}</p>
                  <p className="kpi-subtitle">{overviewData?.newCasesThisMonth || 0} new this month</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
                  <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total Matches</p>
                  <p className="kpi-value">{overviewData?.totalMatches || 0}</p>
                  <p className="kpi-subtitle">{overviewData?.newMatchesThisMonth || 0} new this month</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#ede9fe' }}>
                  <svg width="24" height="24" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total Appointments</p>
                  <p className="kpi-value">{overviewData?.totalAppointments || 0}</p>
                  <p className="kpi-subtitle">Active bookings</p>
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginTop: '24px' }}>
            {/* Users by Role */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Users by Role</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'LAWYER', value: overviewData?.usersByRole?.LAWYER || 0 },
                  { name: 'NGO', value: overviewData?.usersByRole?.NGO || 0 },
                  { name: 'CITIZEN', value: overviewData?.usersByRole?.CITIZEN || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Users by Status */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Users by Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'PENDING', value: overviewData?.usersByApprovalStatus?.PENDING || 0 },
                  { name: 'APPROVED', value: overviewData?.usersByApprovalStatus?.APPROVED || 0 },
                  { name: 'REJECTED', value: overviewData?.usersByApprovalStatus?.REJECTED || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cases by Status */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Cases by Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'OPEN', value: overviewData?.casesByStatus?.OPEN || 0 },
                  { name: 'ASSIGNED', value: overviewData?.casesByStatus?.ASSIGNED || 0 },
                  { name: 'CLOSED', value: overviewData?.casesByStatus?.CLOSED || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cases by Priority */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Cases by Priority</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'HIGH', value: overviewData?.casesByPriority?.HIGH || 0 },
                  { name: 'MEDIUM', value: overviewData?.casesByPriority?.MEDIUM || 0 },
                  { name: 'LOW', value: overviewData?.casesByPriority?.LOW || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
        )}

        {/* Users Tab */}
        {analyticsTab === 'users' && (
          <>
            {/* Users KPI Cards */}
            <div className="kpi-cards-grid" style={{ marginTop: '24px' }}>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#dbeafe' }}>
                  <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total Lawyers</p>
                  <p className="kpi-value">{usersData?.totalLawyers || 0}</p>
                  <p className="kpi-subtitle">Registered lawyers</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
                  <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total NGOs</p>
                  <p className="kpi-value">{usersData?.totalNgos || 0}</p>
                  <p className="kpi-subtitle">Registered organizations</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7' }}>
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Total Citizens</p>
                  <p className="kpi-value">{usersData?.totalCitizens || 0}</p>
                  <p className="kpi-subtitle">Seeking help</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fee2e2' }}>
                  <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Pending Approvals</p>
                  <p className="kpi-value">{usersData?.pendingApprovals || 0}</p>
                  <p className="kpi-subtitle">Awaiting review</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#e0e7ff' }}>
                  <svg width="24" height="24" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Active Users Today</p>
                  <p className="kpi-value">{usersData?.activeUsersToday || 0}</p>
                  <p className="kpi-subtitle">{usersData?.activeUsersThisWeek || 0} this week</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#ede9fe' }}>
                  <svg width="24" height="24" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Retention Rate</p>
                  <p className="kpi-value">{usersData?.userRetentionRate?.toFixed(1) || 0}%</p>
                  <p className="kpi-subtitle">User engagement</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fce7f3' }}>
                  <svg width="24" height="24" fill="none" stroke="#ec4899" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Approval Rate</p>
                  <p className="kpi-value">{usersData?.approvalRate?.toFixed(1) || 0}%</p>
                  <p className="kpi-subtitle">Avg {usersData?.averageApprovalTime || 0} days</p>
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginTop: '24px' }}>
            {/* Users by Role */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Users by Role</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'LAWYER', value: overviewData?.usersByRole?.LAWYER || 0 },
                  { name: 'NGO', value: overviewData?.usersByRole?.NGO || 0 },
                  { name: 'CITIZEN', value: overviewData?.usersByRole?.CITIZEN || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Users by Status */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Users by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'PENDING', value: overviewData?.usersByApprovalStatus?.PENDING || 0 },
                  { name: 'APPROVED', value: overviewData?.usersByApprovalStatus?.APPROVED || 0 },
                  { name: 'REJECTED', value: overviewData?.usersByApprovalStatus?.REJECTED || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
        )}

        {/* Cases Tab */}
        {analyticsTab === 'cases' && (
          <>
            {/* Cases KPI Cards */}
            <div className="kpi-cards-grid" style={{ marginTop: '24px' }}>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#dbeafe' }}>
                  <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Open Cases</p>
                  <p className="kpi-value">{casesData?.openCases || 0}</p>
                  <p className="kpi-subtitle">Awaiting assignment</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7' }}>
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Assigned Cases</p>
                  <p className="kpi-value">{casesData?.assignedCases || 0}</p>
                  <p className="kpi-subtitle">In progress</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
                  <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Closed Cases</p>
                  <p className="kpi-value">{casesData?.closedCases || 0}</p>
                  <p className="kpi-subtitle">Resolved</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fee2e2' }}>
                  <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">High Priority</p>
                  <p className="kpi-value">{casesData?.casesByPriority?.HIGH || 0}</p>
                  <p className="kpi-subtitle">Urgent attention needed</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#e0e7ff' }}>
                  <svg width="24" height="24" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Avg Case Age</p>
                  <p className="kpi-value">{casesData?.averageCaseAge || 0}</p>
                  <p className="kpi-subtitle">Days open</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#ede9fe' }}>
                  <svg width="24" height="24" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Resolution Rate</p>
                  <p className="kpi-value">{casesData?.caseResolutionRate?.toFixed(1) || 0}%</p>
                  <p className="kpi-subtitle">{casesData?.averageResolutionTime || 0} days avg</p>
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginTop: '24px' }}>
            {/* Cases by Status */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Cases by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'OPEN', value: overviewData?.casesByStatus?.OPEN || 0 },
                  { name: 'ASSIGNED', value: overviewData?.casesByStatus?.ASSIGNED || 0 },
                  { name: 'CLOSED', value: overviewData?.casesByStatus?.CLOSED || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cases by Priority */}
            <div className="analytics-chart-card">
              <h3 className="chart-title">Cases by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'HIGH', value: overviewData?.casesByPriority?.HIGH || 0 },
                  { name: 'MEDIUM', value: overviewData?.casesByPriority?.MEDIUM || 0 },
                  { name: 'LOW', value: overviewData?.casesByPriority?.LOW || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
        )}

        {/* Matches Tab */}
        {analyticsTab === 'matches' && (
          <>
            {/* Matches KPI Cards */}
            <div className="kpi-cards-grid" style={{ marginTop: '24px' }}>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#dbeafe' }}>
                  <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Pending Matches</p>
                  <p className="kpi-value">{matchesData?.pendingMatches || 0}</p>
                  <p className="kpi-subtitle">Awaiting decision</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
                  <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Accepted Matches</p>
                  <p className="kpi-value">{matchesData?.acceptedMatches || 0}</p>
                  <p className="kpi-subtitle">{matchesData?.acceptanceRate?.toFixed(1) || 0}% rate</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fee2e2' }}>
                  <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Rejected Matches</p>
                  <p className="kpi-value">{matchesData?.rejectedMatches || 0}</p>
                  <p className="kpi-subtitle">{matchesData?.rejectionRate?.toFixed(1) || 0}% rate</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7' }}>
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Avg Match Score</p>
                  <p className="kpi-value">{matchesData?.averageMatchScore?.toFixed(1) || 0}%</p>
                  <p className="kpi-subtitle">Quality metric</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#e0e7ff' }}>
                  <svg width="24" height="24" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">High Quality</p>
                  <p className="kpi-value">{matchesData?.highQualityMatchesPercentage?.toFixed(1) || 0}%</p>
                  <p className="kpi-subtitle">&gt;70% score</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#ede9fe' }}>
                  <svg width="24" height="24" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Avg Response Time</p>
                  <p className="kpi-value">{matchesData?.averageTimeToAcceptance || 0}</p>
                  <p className="kpi-subtitle">Days to decision</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fce7f3' }}>
                  <svg width="24" height="24" fill="none" stroke="#ec4899" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Match Ratio</p>
                  <p className="kpi-value">{matchesData?.matchRatioPerCase?.toFixed(1) || 0}</p>
                  <p className="kpi-subtitle">Matches per case</p>
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginTop: '24px' }}>
            <div className="analytics-chart-card">
              <h3 className="chart-title">Match Statistics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Total Matches', value: overviewData?.totalMatches || 0 },
                  { name: 'Successful', value: overviewData?.successfulMatches || 0 },
                  { name: 'Pending', value: overviewData?.pendingMatches || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
        )}

        {/* Activity Tab */}
        {analyticsTab === 'activity' && (
          <>
            {/* Activity KPI Cards */}
            <div className="kpi-cards-grid" style={{ marginTop: '24px' }}>
              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#dbeafe' }}>
                  <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Appointments Today</p>
                  <p className="kpi-value">{activityData?.appointmentsToday || 0}</p>
                  <p className="kpi-subtitle">{activityData?.appointmentsThisWeek || 0} this week</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#d1fae5' }}>
                  <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Completed</p>
                  <p className="kpi-value">{activityData?.completedAppointments || 0}</p>
                  <p className="kpi-subtitle">Total appointments</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fef3c7' }}>
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Chat Messages</p>
                  <p className="kpi-value">{activityData?.messagesThisMonth || 0}</p>
                  <p className="kpi-subtitle">This month</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#ede9fe' }}>
                  <svg width="24" height="24" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Active Conversations</p>
                  <p className="kpi-value">{activityData?.activeConversations || 0}</p>
                  <p className="kpi-subtitle">Ongoing chats</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#e0e7ff' }}>
                  <svg width="24" height="24" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Notifications Sent</p>
                  <p className="kpi-value">{activityData?.notificationsThisMonth || 0}</p>
                  <p className="kpi-subtitle">This month</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fee2e2' }}>
                  <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Avg Response Time</p>
                  <p className="kpi-value">{activityData?.averageResponseTime || 0}</p>
                  <p className="kpi-subtitle">Minutes</p>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrapper" style={{ background: '#fce7f3' }}>
                  <svg width="24" height="24" fill="none" stroke="#ec4899" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <p className="kpi-title">Lawyer Engagement</p>
                  <p className="kpi-value">{activityData?.lawyerEngagementRate?.toFixed(1) || 0}%</p>
                  <p className="kpi-subtitle">Activity rate</p>
                </div>
              </div>
            </div>

            <div className="charts-grid" style={{ marginTop: '24px' }}>
            <div className="analytics-chart-card">
              <h3 className="chart-title">Platform Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'New Users', value: overviewData?.newUsers || 0 },
                  { name: 'New Cases', value: overviewData?.newCases || 0 },
                  { name: 'Active Sessions', value: overviewData?.activeSessions || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
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
              <h2 className="section-title-new">User Verification Queue</h2>
              <p className="section-subtitle">Review and approve/reject profiles for Lawyers and NGOs.</p>
            </div>

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
            </div>

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
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.875rem' }}>{formatLogTimestamp(log.timestamp)}</td>
                          <td>
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
                          <td style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.logger || 'N/A'}
                          </td>
                          <td style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{log.endpoint || '-'}</td>
                          <td style={{ fontSize: '0.875rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.message}
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>{log.username || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

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
        ) : activeTab === 'logs' ? (
          <div className="admin-content-section">
            <div className="admin-panel-header">
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
            </div>

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
                        <tr key={log.id}>
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
      </div>
    </div>
  );
}

export default DashboardAdmin;
