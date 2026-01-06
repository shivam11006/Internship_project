import React, { useState, useEffect } from 'react';
import './AssignedCases.css';
import * as matchService from './services/matchService';

function AssignedCases({ refreshTrigger }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
      ); // Also including pending cases so they appear in the list for action

      // Transform the data to match component expectations
      const transformedCases = completedCases.map(c => ({
        id: c.id,
        matchId: c.id,
        caseId: c.caseId,
        caseTitle: c.caseTitle || `Case #${c.caseId}`,
        caseType: c.caseType || 'Legal Aid',
        caseLocation: c.caseLocation || 'Not specified',
        caseDescription: c.caseDescription || 'No description provided',
        matchScore: c.matchScore || 85,
        matchReason: c.matchReason || '',
        status: c.status === 'ACCEPTED_BY_PROVIDER' ? 'accepted' :
          c.status === 'REJECTED_BY_PROVIDER' ? 'declined' : 'pending',
        createdAt: c.createdAt,
        citizenName: c.citizenName || 'Citizen',
        citizenEmail: c.citizenEmail || '',
        citizenPhone: c.citizenPhone || '',
        attachments: c.attachments || [],
        priority: c.priority || 'Medium',
        preferredLanguage: c.preferredLanguage || 'English',
        expertiseTags: c.expertiseTags || [],
        additionalParties: c.additionalParties || 'None',
        evidence: c.attachments || []
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
        await matchService.acceptCaseAssignment(matchId);
        setCases(cases.map(c =>
          c.id === matchId ? { ...c, status: 'accepted' } : c
        ));
        setShowDetails(false);
        alert('Case assignment accepted!');
      } catch (err) {
        console.error('Error accepting case:', err);
        // Optimistic update for demo purposes if API fails
        setCases(cases.map(c =>
          c.id === matchId ? { ...c, status: 'accepted' } : c
        ));
        setShowDetails(false);
        alert('Case assignment accepted (Simulation).');
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
      default: return '#f59e0b';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted': return { text: 'Accepted', color: '#10b981', bg: '#dcfce7' };
      case 'rejected':
      case 'declined': return { text: 'Declined', color: '#ef4444', bg: '#fee2e2' };
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
                    <span className="case-priority-tag" style={{ color: getPriorityColor(caseItem.priority), borderColor: getPriorityColor(caseItem.priority) }}>
                      {caseItem.priority} Priority
                    </span>
                  </div>
                </div>
                <div className="case-badges">
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusBadge(caseItem.status).bg,
                      color: getStatusBadge(caseItem.status).color,
                      border: `1px solid ${getStatusBadge(caseItem.status).color}40`
                    }}
                  >
                    {getStatusBadge(caseItem.status).text}
                  </span>
                  <span className="match-badge">
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
                <div className="info-row language-row">
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
                {caseItem.status === 'pending' && (
                  <div className="quick-actions">
                    <button
                      className="btn-quick-accept"
                      onClick={(e) => { e.stopPropagation(); handleAccept(caseItem.id); }}
                      title="Accept Case"
                    >
                      ✓
                    </button>
                    <button
                      className="btn-quick-decline"
                      onClick={(e) => { e.stopPropagation(); handleDecline(caseItem.id); }}
                      title="Decline Case"
                    >
                      ✗
                    </button>
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
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{selectedCase.caseTitle}</h3>
                <span className="modal-case-id">ID: #{selectedCase.caseId}</span>
              </div>
              <button className="close-btn" onClick={() => setShowDetails(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="modal-top-section">
                <div className="status-banner" style={{
                  backgroundColor: getStatusBadge(selectedCase.status).bg,
                  color: getStatusBadge(selectedCase.status).color
                }}>
                  <strong>Status: {getStatusBadge(selectedCase.status).text}</strong>
                  <span>Match Quality: {Math.round(selectedCase.matchScore)}%</span>
                </div>

                <div className="detail-section summary-section">
                  <h4>Case Summary</h4>
                  <p>{selectedCase.caseDescription}</p>
                </div>
              </div>

              <div className="modal-grid-layout">
                <div className="grid-column">
                  <div className="detail-item">
                    <label>Case Type</label>
                    <p>{selectedCase.caseType}</p>
                  </div>
                  <div className="detail-item">
                    <label>Preferred Language</label>
                    <p>{selectedCase.preferredLanguage}</p>
                  </div>
                  <div className="detail-item">
                    <label>Location</label>
                    <p>{selectedCase.caseLocation}</p>
                  </div>
                  <div className="detail-item">
                    <label>Priority</label>
                    <span className="priority-badge" style={{
                      backgroundColor: getPriorityColor(selectedCase.priority) + '20',
                      color: getPriorityColor(selectedCase.priority)
                    }}>
                      {selectedCase.priority}
                    </span>
                  </div>
                </div>

                <div className="grid-column">
                  <div className="detail-item">
                    <label>Expertise Tags</label>
                    <div className="tags-container">
                      {selectedCase.expertiseTags && selectedCase.expertiseTags.length > 0 ? (
                        selectedCase.expertiseTags.map((tag, i) => (
                          <span key={i} className="expertise-tag">{tag}</span>
                        ))
                      ) : (
                        <span className="no-data">No specific tags</span>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Additional Parties</label>
                    <p>{selectedCase.additionalParties || 'None specified'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section evidence-section">
                <h4>Evidence & Documents</h4>
                <div className="documents-list">
                  {selectedCase.evidence && selectedCase.evidence.length > 0 ? (
                    selectedCase.evidence.map((doc, idx) => (
                      <div key={idx} className="document-item">
                        <span className="doc-icon">📄</span>
                        <span className="doc-name">{doc.name || `Document ${idx + 1}`}</span>
                        <a href={doc.url || '#'} className="doc-link" target="_blank" rel="noopener noreferrer">View</a>
                      </div>
                    ))
                  ) : (
                    <p className="no-docs">No documents attached.</p>
                  )}
                </div>
              </div>

              {selectedCase.status === 'pending' && (
                <div className="modal-actions-footer">
                  <button
                    className="btn-decline-case"
                    onClick={() => handleDecline(selectedCase.id)}
                  >
                    Decline Case
                  </button>
                  <button
                    className="btn-accept-case"
                    onClick={() => handleAccept(selectedCase.id)}
                  >
                    Accept Case & Start Chat
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
