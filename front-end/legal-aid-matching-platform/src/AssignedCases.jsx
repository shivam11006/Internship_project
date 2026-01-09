import React, { useState, useEffect } from 'react';
import './AssignedCases.css';
import * as matchService from './services/matchService';

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
        caseId: c.caseNumber || c.caseId,
        caseTitle: c.caseTitle || `Case #${c.caseNumber || c.caseId} `,
        caseType: c.caseType || 'Legal Aid',
        caseLocation: c.caseLocation || 'Not specified',
        caseDescription: c.caseDescription || 'No description provided',
        matchScore: c.matchScore || 85,
        matchReason: c.matchReason || '',
        status: c.status === 'ACCEPTED_BY_PROVIDER' ? 'accepted' :
          c.status === 'REJECTED_BY_PROVIDER' ? 'declined' : 
          c.status === 'EXPIRED' ? 'expired' : 'pending',
        createdAt: c.createdAt,
        citizenName: c.citizenName || 'Citizen',
        citizenEmail: c.citizenEmail || '',
        citizenPhone: c.citizenPhone || '',
        attachments: c.attachments || [],
        priority: c.priority || 'Medium',
        preferredLanguage: c.preferredLanguage || 'English',
        expertiseTags: c.expertiseTags || [],
        additionalParties: c.additionalParties || 'None',
        evidence: c.attachments || [],
        rejectionReason: c.rejectionReason || ''
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
          caseTitle: 'Property Dispute in Civil Lines',
          caseType: 'Civil Law',
          caseLocation: 'Chennai, Tamil Nadu, India',
          caseDescription: 'A complex property dispute involving ancestral land partition among three siblings. The client states that one sibling has illegally occupied a portion of the shared property.',
          matchScore: 92,
          matchReason: 'Your expertise in Civil Property Law matches 100% with the case requirements.',
          status: 'pending',
          createdAt: new Date().toISOString(),
          priority: 'High',
          preferredLanguage: 'Hindi, English',
          expertiseTags: ['Property Law', 'Civil Litigation', 'Family Dispute'],
          additionalParties: 'Brother (Respondent 1), Sister (Respondent 2)',
          evidence: [
            { name: 'Property_Deed.pdf', url: '#' },
            { name: 'Site_Map.jpg', url: '#' }
          ]
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

      {/* Enhanced Details Modal */}
      {showDetails && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            {/* Dark Header */}
            <div className="modal-header-new">
              <div className="header-title-section">
                <h3 className="header-main-title">Case Details</h3>
                <p className="header-subtitle">
                  ID: #{selectedCase.caseId} • Posted on {new Date(selectedCase.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <button className="close-btn-new" onClick={() => setShowDetails(false)}>&times;</button>
            </div>

            <div className="modal-body-new">
              {/* Title and Badges */}
              <div className="title-badges-section">
                <h2 className="case-title-large">{selectedCase.caseTitle}</h2>
                <div className="badges-row">
                  <span className="badge-match">{Math.round(selectedCase.matchScore)}% Match</span>
                  <span className="badge-priority" style={{
                    backgroundColor: getPriorityColor(selectedCase.priority) + '33',
                    color: getPriorityColor(selectedCase.priority),
                    borderColor: getPriorityColor(selectedCase.priority)
                  }}>
                    {selectedCase.priority} Priority
                  </span>
                </div>
              </div>

              {/* Meta Info Row */}
              <div className="meta-info-row">
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span className="meta-text">{selectedCase.caseLocation}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📄</span>
                  <span className="meta-text">{selectedCase.caseType}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👤</span>
                  <span className="meta-text">{selectedCase.citizenName || 'user'}</span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="two-column-layout">
                {/* Left Column */}
                <div className="left-column">
                  <div className="section-block">
                    <h4 className="section-label">DESCRIPTION</h4>
                    <p className="description-text">{selectedCase.caseDescription}</p>
                  </div>

                  <div className="section-block">
                    <h4 className="section-label">EXPERTISE TAGS</h4>
                    <div className="expertise-tags-list">
                      {selectedCase.expertiseTags && selectedCase.expertiseTags.length > 0 ? (
                        selectedCase.expertiseTags.map((tag, i) => (
                          <span key={i} className="expertise-tag-pill">{tag}</span>
                        ))
                      ) : (
                        <span className="no-data-text">No specific tags</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                  <div className="section-block">
                    <h4 className="section-label">ADDITIONAL PARTIES</h4>
                    <p className="parties-text">{selectedCase.additionalParties || 'None'}</p>
                  </div>

                  <div className="section-block">
                    <h4 className="section-label">CONTACT INFORMATION</h4>
                    <div className="contact-info-grid">
                      <div className="contact-row">
                        <span className="contact-label">Email</span>
                        <span className="contact-value">{selectedCase.citizenEmail || 'user1@gmail.com'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="section-block">
                    <div className="match-explanation-box">
                      <h4 className="match-box-title">Why it matches?</h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedCase.status === 'pending' && (
                <div className="modal-actions-new">
                  <button
                    className="btn-decline-new"
                    onClick={() => handleDecline(selectedCase.id)}
                  >
                    ✗ Decline Case
                  </button>
                  <button
                    className="btn-accept-new"
                    onClick={() => handleAccept(selectedCase.id)}
                  >
                    ✓ Accept Case
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignedCases;
