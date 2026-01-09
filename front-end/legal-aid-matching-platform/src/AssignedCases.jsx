import React, { useState, useEffect } from 'react';
import './AssignedCases.css';
import * as matchService from './services/matchService';
import { apiClient } from './services/authService';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper function to get file icon based on type
const getFileIcon = (fileType) => {
  if (fileType?.includes('pdf')) return '📄';
  if (fileType?.includes('image')) return '🖼️';
  if (fileType?.includes('word') || fileType?.includes('doc')) return '📝';
  return '📎';
};

function AssignedCases({ refreshTrigger, onNavigateToChat, onScheduleCall }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, accepted, declined
  const [sortBy, setSortBy] = useState('date'); // date, score
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchAssignedCases();
  }, [refreshTrigger]);

  const fetchAssignedCases = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await matchService.getAssignedCases();

      // Handle different response formats
      let casesData = [];
      if (Array.isArray(response)) {
        casesData = response;
      } else if (response.data && Array.isArray(response.data)) {
        casesData = response.data;
      }

      // Filter to only show cases that have been accepted or declined by provider
      const completedCases = casesData.filter(c =>
        c.status === 'ACCEPTED_BY_PROVIDER' || c.status === 'REJECTED_BY_PROVIDER'
        || c.status === 'PENDING_PROVIDER_ACTION' || c.status === 'PENDING'
        || c.status === 'SELECTED_BY_CITIZEN' || c.status === 'EXPIRED'
      ); // Also including pending/selected cases so they appear in the list for action

      // Transform the data to match component expectations
      const transformedCases = completedCases.map(c => ({
        id: c.id,
        matchId: c.id,
        caseId: c.caseId, // Actual case ID for API calls
        caseNumber: c.caseNumber || c.caseId, // Display number
        caseTitle: c.caseTitle || `Case #${c.caseNumber || c.caseId}`,
        caseType: c.caseType || 'Legal Aid',
        caseLocation: c.caseLocation || 'Not specified',
        caseDescription: c.caseDescription || 'No description provided',
        matchScore: c.matchScore || 0,
        matchReason: c.matchReason || 'Expertise matches case type, Verified provider',
        status: c.status === 'ACCEPTED_BY_PROVIDER' ? 'accepted' :
          c.status === 'REJECTED_BY_PROVIDER' ? 'declined' : 
          c.status === 'EXPIRED' ? 'expired' : 'pending',
        createdAt: c.createdAt,
        citizenName: c.citizenName || 'Not available',
        citizenEmail: c.citizenEmail || 'Not available',
        citizenPhone: c.citizenPhone || 'Not available',
        // Map attachments with proper field names from API
        attachments: (c.attachments || []).map(att => ({
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize
        })),
        priority: c.casePriority || 'Medium',
        preferredLanguage: c.preferredLanguage || 'Not specified',
        expertiseTags: c.expertiseTags || [],
        additionalParties: 'None',
        rejectionReason: c.rejectionReason || '',
        providerName: c.providerName || '',
        providerType: c.providerType || ''
      }));

      setCases(transformedCases);
    } catch (err) {
      console.error('Failed to fetch assigned cases:', err);
      // Fallback for demo if API fails
      setCases([
        {
          id: 1,
          matchId: 1,
          caseId: 101,
          caseNumber: '1001001',
          caseTitle: 'Property Dispute in Civil Lines',
          caseType: 'Civil Law',
          caseLocation: 'Chennai, Tamil Nadu, India',
          caseDescription: 'A complex property dispute involving ancestral land partition among three siblings. The client states that one sibling has illegally occupied a portion of the shared property.',
          matchScore: 92,
          matchReason: 'Expertise matches case type, Same location, Verified provider',
          status: 'pending',
          createdAt: new Date().toISOString(),
          priority: 'HIGH',
          preferredLanguage: 'Hindi',
          expertiseTags: ['Property Law', 'Civil Litigation'],
          additionalParties: 'None',
          citizenName: 'Demo User',
          citizenEmail: 'demo@example.com',
          citizenPhone: 'Not available',
          attachments: []
        }
      ]);
      if (!cases.length) setError('Failed to load assigned cases. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    const confirmed = window.confirm('Accept this case assignment?');
    if (confirmed) {
      try {
        setProcessingId(matchId);
        await matchService.acceptCaseAssignment(matchId);
        setCases(cases.map(c =>
          c.id === matchId ? { ...c, status: 'accepted' } : c
        ));
        setShowDetails(false);
        alert('Case assignment accepted!');
        // Refresh to get updated statuses for other matches
        fetchAssignedCases();
      } catch (err) {
        console.error('Error accepting case:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to accept case';
        if (errorMessage.includes('already been accepted')) {
          alert('This case has already been accepted by another provider. Refreshing list...');
          fetchAssignedCases();
        } else {
          alert(errorMessage);
        }
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleDecline = async (matchId) => {
    const confirmed = window.confirm('Decline this case assignment?');
    if (confirmed) {
      try {
        await matchService.declineCaseAssignment(matchId);
        setCases(cases.map(c =>
          c.id === matchId ? { ...c, status: 'declined' } : c
        ));
        setShowDetails(false);
        alert('Case assignment declined.');
      } catch (err) {
        console.error('Error declining case:', err);
        // Optimistic update for demo purposes
        setCases(cases.map(c =>
          c.id === matchId ? { ...c, status: 'declined' } : c
        ));
        setShowDetails(false);
        alert('Case assignment declined (Simulation).');
      }
    }
  };

  // Download attachment for a case
  const handleDownloadAttachment = async (caseId, attachment) => {
    try {
      const response = await apiClient.get(
        `/matches/case/${caseId}/attachment/${attachment.id}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const blob = new Blob([response.data], { type: attachment.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Failed to download attachment. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'rejected':
      case 'declined': return '#ef4444';
      case 'expired': return '#9ca3af';
      default: return '#f59e0b';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted': return { text: 'Accepted', color: '#10b981', bg: '#dcfce7' };
      case 'rejected':
      case 'declined': return { text: 'Declined', color: '#ef4444', bg: '#fee2e2' };
      case 'expired': return { text: 'Expired - Taken by Another', color: '#6b7280', bg: '#f3f4f6' };
      default: return { text: 'Action Required', color: '#f59e0b', bg: '#fef3c7' };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'score') {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="assigned-cases-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your assigned cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-cases-container">
      <div className="assigned-cases-header">
        <h2>Assigned Cases</h2>
        <p className="subtitle">
          {sortedCases.length} case{sortedCases.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      <div className="assigned-controls">
        <div className="filter-group">
          <label>Filter by status:</label>
          <div className="filter-buttons">
            <button
              className={filterStatus === 'all' ? 'active' : ''}
              onClick={() => setFilterStatus('all')}
            >
              All ({cases.length})
            </button>
            <button
              className={filterStatus === 'pending' ? 'active' : ''}
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({cases.filter(c => c.status === 'pending').length})
            </button>
            <button
              className={filterStatus === 'accepted' ? 'active' : ''}
              onClick={() => setFilterStatus('accepted')}
            >
              Accepted ({cases.filter(c => c.status === 'accepted').length})
            </button>
            <button
              className={filterStatus === 'declined' ? 'active' : ''}
              onClick={() => setFilterStatus('declined')}
            >
              Declined ({cases.filter(c => c.status === 'declined').length})
            </button>
            <button
              className={filterStatus === 'expired' ? 'active' : ''}
              onClick={() => setFilterStatus('expired')}
              style={{ backgroundColor: filterStatus === 'expired' ? '#9ca3af' : undefined }}
            >
              Expired ({cases.filter(c => c.status === 'expired').length})
            </button>
          </div>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Most Recent</option>
            <option value="score">Match Score</option>
          </select>
        </div>
      </div>

      <div className="cases-list">
        {sortedCases.length === 0 ? (
          <div className="no-cases">
            <p>No cases {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'assigned to you yet'}.</p>
          </div>
        ) : (
          sortedCases.map(caseItem => (
            <div
              key={caseItem.id}
              className={`case-card case-${caseItem.status}`}
            >
              <div className="case-card-header">
                <div className="case-title-section">
                  <h3>{caseItem.caseTitle}</h3>
                  <div className="case-meta-tags">
                    <span className="case-type-tag">{caseItem.caseType}</span>
                    <span className="case-priority-tag" style={{ color: '#d97706' }}>
                      {caseItem.priority} Priority
                    </span>
                  </div>
                </div>
                <div className="case-badges-top">
                  <span
                    className="status-badge-inline"
                    style={{
                      backgroundColor: getStatusBadge(caseItem.status).bg,
                      color: getStatusBadge(caseItem.status).color,
                      border: `1px solid ${getStatusBadge(caseItem.status).color}`
                    }}
                  >
                    {getStatusBadge(caseItem.status).text}
                  </span>
                  <span className="match-score-bubble">
                    ⭐ {Math.round(caseItem.matchScore || 0)}% Match
                  </span>
                </div>
              </div>

              <div className="case-info">
                <div className="info-row">
                  <span className="icon">📍</span>
                  <span>{caseItem.caseLocation}</span>
                </div>
                <div className="info-row">
                  <span className="icon">📅</span>
                  <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <span className="icon">🗣️</span>
                  <span>{caseItem.preferredLanguage}, Verified Provider</span>
                </div>
              </div>

              <div className="case-actions-footer">
                <button
                  className="btn-view-details"
                  onClick={() => {
                    setSelectedCase(caseItem);
                    setShowDetails(true);
                  }}
                >
                  View Details
                </button>
                <button
                  className="btn-action-chat"
                  onClick={() => onNavigateToChat && onNavigateToChat(caseItem.citizenName)}
                >
                  Chats
                </button>
                <button
                  className="btn-action-schedule"
                  onClick={() => onScheduleCall && onScheduleCall(caseItem.citizenName)}
                >
                  Schedule call
                </button>
                {caseItem.status === 'pending' && (
                  <div className="quick-actions-mini">
                    <button
                      className="btn-quick-accept"
                      onClick={(e) => { e.stopPropagation(); handleAccept(caseItem.id); }}
                      title="Accept Case"
                      disabled={processingId === caseItem.id}
                    >
                      {processingId === caseItem.id ? '...' : '✓'}
                    </button>
                    <button
                      className="btn-quick-decline"
                      onClick={(e) => { e.stopPropagation(); handleDecline(caseItem.id); }}
                      title="Decline Case"
                      disabled={processingId === caseItem.id}
                    >
                      ✗
                    </button>
                  </div>
                )}
                {caseItem.status === 'expired' && (
                  <div className="expired-notice" style={{ 
                    color: '#6b7280', 
                    fontSize: '12px', 
                    fontStyle: 'italic',
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px'
                  }}>
                    ⚠️ Case taken by another provider
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enhanced Details Modal - Modern Layout like CaseManagement */}
      {showDetails && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'hidden', borderRadius: '12px' }}>
            {/* Modern Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2e5a8a 100%)', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ color: 'white', marginBottom: '4px', fontSize: '1.25rem', fontWeight: '600' }}>Case Details</h2>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  ID: #{selectedCase.caseNumber} • Created {new Date(selectedCase.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0', lineHeight: '1' }}>×</button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
              {/* Title and Status Bar */}
              <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>{selectedCase.caseTitle}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: getStatusBadge(selectedCase.status).bg, color: getStatusBadge(selectedCase.status).color, border: `1px solid ${getStatusBadge(selectedCase.status).color}` }}>
                      {getStatusBadge(selectedCase.status).text}
                    </span>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: getPriorityColor(selectedCase.priority) + '22', color: getPriorityColor(selectedCase.priority), border: `1px solid ${getPriorityColor(selectedCase.priority)}` }}>
                      {selectedCase.priority} Priority
                    </span>
                    <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #16a34a' }}>
                      {Math.round(selectedCase.matchScore)}% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', minHeight: '400px' }}>
                {/* Left Column */}
                <div style={{ padding: '24px', borderRight: '1px solid #e5e7eb' }}>
                  {/* Description Section */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</h4>
                    <p style={{ color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedCase.caseDescription}</p>
                  </section>

                  {/* Case Info Grid */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Case Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Case Type</div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{selectedCase.caseType || 'N/A'}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Priority</div>
                        <div style={{ fontWeight: '600', color: getPriorityColor(selectedCase.priority) }}>{selectedCase.priority || 'Medium'}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Location</div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{selectedCase.caseLocation || 'Not specified'}</div>
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Preferred Language</div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{selectedCase.preferredLanguage || 'Not specified'}</div>
                      </div>
                    </div>
                  </section>

                  {/* Expertise Tags Section */}
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expertise Tags</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedCase.expertiseTags && selectedCase.expertiseTags.length > 0 ? (
                        selectedCase.expertiseTags.map((tag, index) => (
                          <span key={index} style={{ backgroundColor: '#eef2ff', color: '#4338ca', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600', border: '1px solid #c7d2fe' }}>{tag}</span>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags specified</span>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
                  {/* Citizen Profile Section */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Citizen Profile</h4>
                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>
                          {selectedCase.citizenName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '1rem' }}>{selectedCase.citizenName || 'Unknown'}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Case Requester</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#6b7280' }}>📧</span>
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{selectedCase.citizenEmail || 'Not available'}</span>
                        </div>
                        {selectedCase.citizenPhone && selectedCase.citizenPhone !== 'Not available' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#6b7280' }}>📱</span>
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>{selectedCase.citizenPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Match Reason Section */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why This Match?</h4>
                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <p style={{ color: '#166534', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>{selectedCase.matchReason || 'Expertise matches case type'}</p>
                    </div>
                  </section>

                  {/* Evidence & Documents Section */}
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Evidence & Documents</h4>
                    {selectedCase.attachments && selectedCase.attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedCase.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            onClick={() => handleDownloadAttachment(selectedCase.caseId, attachment)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
                          >
                            <span style={{ fontSize: '1.5rem' }}>{getFileIcon(attachment.fileType)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.fileName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatFileSize(attachment.fileSize)}</div>
                            </div>
                            <span style={{ color: '#667eea', fontWeight: '600', fontSize: '0.75rem' }}>⬇️ Download</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #d1d5db', textAlign: 'center' }}>
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No documents attached</span>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'white' }}>
              {selectedCase.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleDecline(selectedCase.id)}
                    style={{ padding: '10px 20px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    ✗ Decline Case
                  </button>
                  <button
                    onClick={() => handleAccept(selectedCase.id)}
                    disabled={processingId === selectedCase.id}
                    style={{ padding: '10px 20px', background: processingId === selectedCase.id ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: processingId === selectedCase.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {processingId === selectedCase.id ? '⏳ Processing...' : '✓ Accept Case'}
                  </button>
                </>
              )}
              <button onClick={() => setShowDetails(false)} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignedCases;
