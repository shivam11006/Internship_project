import React, { useState, useEffect } from 'react';
import './AssignedCases.css';
import * as matchService from './services/matchService';

function AssignedCases({ additionalCases = [] }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAssignedCases();
  }, []);

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

      setCases(casesData);
    } catch (err) {
      console.error('Failed to fetch assigned cases:', err);
      // For demo purposes, we don't want to block the UI if backend fails
      // setError('Failed to load assigned cases. Please check your connection.');
      setCases([]);
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
        alert('Failed to accept case. Please try again.');
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
        alert('Failed to decline case. Please try again.');
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
      case 'accepted': return { text: 'Accepted', color: '#10b981' };
      case 'rejected':
      case 'declined': return { text: 'Declined', color: '#ef4444' };
      default: return { text: 'Pending', color: '#f59e0b' };
    }
  };

  const filteredCases = [...cases, ...additionalCases].filter(c => {
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

  if (error) {
    return (
      <div className="assigned-cases-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={fetchAssignedCases}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
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

      {(cases.length > 0 || additionalCases.length > 0) && (
        <div className="assigned-controls">
          <div className="filter-group">
            <label>Filter by status:</label>
            <div className="filter-buttons">
              <button
                className={filterStatus === 'all' ? 'active' : ''}
                onClick={() => setFilterStatus('all')}
              >
                All ({[...cases, ...additionalCases].length})
              </button>
              <button
                className={filterStatus === 'pending' ? 'active' : ''}
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({[...cases, ...additionalCases].filter(c => c.status === 'pending').length})
              </button>
              <button
                className={filterStatus === 'accepted' ? 'active' : ''}
                onClick={() => setFilterStatus('accepted')}
              >
                Accepted ({[...cases, ...additionalCases].filter(c => c.status === 'accepted').length})
              </button>
              <button
                className={filterStatus === 'declined' ? 'active' : ''}
                onClick={() => setFilterStatus('declined')}
              >
                Declined ({[...cases, ...additionalCases].filter(c => c.status === 'declined').length})
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
      )}

      <div className="cases-list">
        {sortedCases.length === 0 ? (
          <div className="no-cases">
            <p>No cases {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'assigned to you yet'}.</p>
          </div>
        ) : (
          sortedCases.map(caseItem => (
            <div
              key={caseItem.id}
              className={`case-card ${caseItem.status !== 'pending' ? 'case-' + caseItem.status : ''}`}
            >
              <div className="case-card-header">
                <div className="case-title-section">
                  <h3>{caseItem.caseTitle || 'Case #' + caseItem.id}</h3>
                  <p className="case-type">{caseItem.caseType}</p>
                </div>
                <div className="case-badges">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadge(caseItem.status).color }}
                  >
                    {getStatusBadge(caseItem.status).text}
                  </span>
                  <span className="match-badge">
                    ⭐ {Math.round(caseItem.matchScore || 0)}% Match
                  </span>
                </div>
              </div>

              <div className="case-info">
                {caseItem.caseLocation && (
                  <div className="info-item">
                    <span className="icon">📍</span>
                    <span>{caseItem.caseLocation}</span>
                  </div>
                )}

                {caseItem.createdAt && (
                  <div className="info-item">
                    <span className="icon">📅</span>
                    <span>{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                  </div>
                )}

                {caseItem.matchReason && (
                  <div className="info-item">
                    <span className="icon">💡</span>
                    <span>{caseItem.matchReason}</span>
                  </div>
                )}
              </div>

              {caseItem.status === 'pending' && (
                <div className="case-actions">
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
                    className="btn-quick-accept"
                    onClick={() => handleAccept(caseItem.id)}
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn-quick-decline"
                    onClick={() => handleDecline(caseItem.id)}
                  >
                    ✗ Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCase.caseTitle || 'Case #' + selectedCase.id}</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Case Information</h4>
                <div className="info-grid">
                  <div><strong>Type:</strong> {selectedCase.caseType}</div>
                  <div><strong>Location:</strong> {selectedCase.caseLocation || 'N/A'}</div>
                  <div><strong>Match Score:</strong> {Math.round(selectedCase.matchScore || 0)}%</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedCase.status).text}</div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Match Reason</h4>
                <p>{selectedCase.matchReason || 'N/A'}</p>
              </div>

              {selectedCase.status === 'pending' && (
                <div className="modal-actions">
                  <button
                    className="btn-accept-case"
                    onClick={() => handleAccept(selectedCase.id)}
                  >
                    ✓ Accept This Case
                  </button>
                  <button
                    className="btn-decline-case"
                    onClick={() => handleDecline(selectedCase.id)}
                  >
                    ✗ Decline This Case
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
