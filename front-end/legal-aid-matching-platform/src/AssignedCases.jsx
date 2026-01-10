import React, { useState, useEffect } from 'react';
import './AssignedCases.css';
import * as matchService from './services/matchService';
import * as caseService from './services/caseService';

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
        caseId: c.caseId,
        caseTitle: c.caseTitle || `Case #${c.caseId} `,
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
                  onClick={async () => {
                    // Set basic details first for immediate feedback
                    setSelectedCase(caseItem);
                    setShowDetails(true);

                    // Fetch full details from DB to get evidence/docs
                    try {
                      console.log("Fetching details for caseId:", caseItem.caseId);
                      const fullCaseDetails = await caseService.getCaseById(caseItem.caseId);
                      console.log("Full case details received:", fullCaseDetails);

                      if (fullCaseDetails) {
                        const attachments = fullCaseDetails.attachments || fullCaseDetails.documents || [];
                        console.log("Attachments found:", attachments);

                        // Process attachments to create download URLs from base64 if needed
                        const processedEvidence = attachments.map(att => {
                          // Handle AttachmentDTO structure (name, type, content)
                          // If content is base64 and no URL, create one
                          if (att.content && !att.url) {
                            try {
                              const byteCharacters = atob(att.content);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: att.type || 'application/pdf' });
                              const blobUrl = URL.createObjectURL(blob);
                              return { ...att, url: blobUrl };
                            } catch (e) {
                              console.error("Error converting base64 to blob:", e);
                              return att;
                            }
                          }
                          return att;
                        });

                        setSelectedCase(prev => ({
                          ...prev,
                          ...fullCaseDetails,
                          matchScore: prev.matchScore,
                          status: prev.status,
                          id: prev.id, // match ID
                          evidence: processedEvidence
                        }));
                      }
                    } catch (err) {
                      console.error("Failed to fetch full case details:", err);
                      // Fallback or just show what we have
                    }
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
                  ID: #{selectedCase.caseId} • Posted on {new Date(selectedCase.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button className="close-btn-new" onClick={() => setShowDetails(false)}>&times;</button>
            </div>

            <div className="modal-body-scollable">
              <div className="modal-body-content">

                {/* 1. Description Section */}
                <div className="section-block mb-large">
                  <h2 className="case-title-large">{selectedCase.caseTitle || 'N/A'}</h2>
                  <div className="badges-row mb-medium">
                    <span className="badge-match">{Math.round(selectedCase.matchScore || 0)}% Match</span>
                  </div>
                  <h4 className="section-label">DESCRIPTION</h4>
                  <p className="description-text">
                    {selectedCase.caseDescription || 'N/A'}
                  </p>
                </div>

                <hr className="divider" />

                {/* 2. Details Grid */}
                <div className="details-grid">
                  {/* Row 1 */}
                  <div className="grid-item">
                    <label>CASE TYPE</label>
                    <div className="value-text">{selectedCase.caseType || 'N/A'}</div>
                  </div>
                  <div className="grid-item">
                    <label>PRIORITY</label>
                    <div className="value-component">
                      <span className={`priority-pill ${selectedCase.priority?.toLowerCase() || 'medium'}`}>
                        {selectedCase.priority || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid-item">
                    <label>CASE ID</label>
                    <div className="value-text">#{selectedCase.caseId || 'N/A'}</div>
                  </div>
                  <div className="grid-item">
                    <label>CREATED BY</label>
                    <div className="value-text">{selectedCase.citizenName ? `User ${selectedCase.citizenName}` : 'User #N/A'}</div>
                    {/* fallback naming logic as per screenshot style "User #253", assuming citizenName might be a name or ID */}
                  </div>

                  {/* Row 3 */}
                  <div className="grid-item">
                    <label>LOCATION</label>
                    <div className="value-text">{selectedCase.caseLocation || 'N/A'}</div>
                  </div>
                  <div className="grid-item">
                    <label>PREFERRED LANGUAGE</label>
                    <div className="value-text">{selectedCase.preferredLanguage || 'N/A'}</div>
                  </div>

                  {/* Row 4 - Full Width Tags */}
                  <div className="grid-item full-width">
                    <label>EXPERTISE TAGS</label>
                    <div className="expertise-tags-list">
                      {selectedCase.expertiseTags && selectedCase.expertiseTags.length > 0 ? (
                        selectedCase.expertiseTags.map((tag, i) => (
                          <span key={i} className="expertise-tag-outline">{tag}</span>
                        ))
                      ) : (
                        <span className="value-text">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* 3. Timeline Section */}
                <div className="section-block">
                  <h4 className="section-label">TIMELINE</h4>
                  <div className="timeline-container">
                    <div className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">Case Submitted</div>
                        <div className="timeline-date">
                          {selectedCase.createdAt
                            ? new Date(selectedCase.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Date N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* 4. Evidence & Documents Section */}
                <div className="section-block">
                  <h4 className="section-label">EVIDENCE & DOCUMENTS</h4>
                  <div className="evidence-list">
                    {selectedCase.evidence && selectedCase.evidence.length > 0 ? (
                      selectedCase.evidence.map((doc, idx) => (
                        <div key={idx} className="evidence-card">
                          <div className="file-icon">📄</div>
                          <div className="file-info">
                            <div className="file-name">{doc.name || `Document ${idx + 1}`}</div>
                            <div className="file-type">PDF</div> {/* Assuming PDF for now as per screenshot */}
                          </div>
                          <a href={doc.url || '#'} className="download-link" target="_blank" rel="noopener noreferrer">
                            ⬇
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="no-data-text">No documents attached (N/A)</div>
                    )}
                  </div>
                </div>

                <hr className="divider" />

                {/* 5. Additional Info (Parties, Contact) - Kept for completeness but styled to fit */}
                <div className="details-grid">
                  <div className="grid-item">
                    <label>ADDITIONAL PARTIES</label>
                    <div className="value-text">{selectedCase.additionalParties || 'N/A'}</div>
                  </div>
                  <div className="grid-item">
                    <label>CONTACT EMAIL</label>
                    <div className="value-text">{selectedCase.citizenEmail || 'N/A'}</div>
                  </div>
                </div>

                <div className="section-block mt-large">
                  <button className="why-match-btn">
                    Why it matches?
                  </button>
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
        </div>
      )}
    </div>
  );
}

export default AssignedCases;
