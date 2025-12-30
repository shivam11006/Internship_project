import React, { useState, useEffect } from 'react';
import './AssignedCases.css';

function AssignedCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, accepted, declined
  const [sortBy, setSortBy] = useState('date'); // date, priority, location
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetch('/api/my-assigned-cases')
    fetchMockCases();
  }, []);

  const fetchMockCases = () => {
    // Mock data - replace with actual API call later
    setTimeout(() => {
      const mockCases = [
        {
          id: 1,
          title: 'Custody Dispute - Child Welfare',
          description: 'Need legal assistance for child custody case. Ex-spouse is not following court orders regarding visitation rights. Looking for immediate help to file contempt motion.',
          caseType: 'Family Law',
          priority: 'High',
          location: 'Mumbai, Maharashtra',
          preferredLanguage: 'Hindi, English',
          expertiseTags: ['Child Custody', 'Family Law', 'Court Motions'],
          status: 'pending', // pending, accepted, declined
          citizenName: 'Priya Mehta',
          citizenEmail: 'priya.mehta@example.com',
          submittedDate: '2025-12-28',
          matchScore: 95,
          matchReason: 'High expertise match and location proximity',
          attachments: [
            { name: 'court_order.pdf', size: '2.3 MB' },
            { name: 'evidence_docs.pdf', size: '1.8 MB' }
          ],
          urgency: 'Requires immediate attention',
          estimatedTimeframe: '2-3 weeks'
        },
        {
          id: 2,
          title: 'Property Inheritance Dispute',
          description: 'Family property dispute after father\'s death. Need help with will verification and property division among siblings. Multiple legal heirs involved.',
          caseType: 'Property Law',
          priority: 'Medium',
          location: 'Thane, Maharashtra',
          preferredLanguage: 'Marathi, English',
          expertiseTags: ['Property Law', 'Inheritance', 'Will Verification'],
          status: 'pending',
          citizenName: 'Rahul Deshmukh',
          citizenEmail: 'rahul.d@example.com',
          submittedDate: '2025-12-27',
          matchScore: 88,
          matchReason: 'Expertise in property law and inheritance cases',
          attachments: [
            { name: 'will_document.pdf', size: '1.2 MB' },
            { name: 'property_papers.pdf', size: '3.5 MB' }
          ],
          urgency: 'Standard processing',
          estimatedTimeframe: '4-6 weeks'
        },
        {
          id: 3,
          title: 'Domestic Violence Case - Protection Order',
          description: 'Urgent help needed to file protection order against abusive spouse. Already contacted local police. Need legal representation for court proceedings.',
          caseType: 'Domestic Violence',
          priority: 'Urgent',
          location: 'Mumbai, Maharashtra',
          preferredLanguage: 'Hindi',
          expertiseTags: ['Domestic Violence', 'Protection Orders', 'Women Rights'],
          status: 'accepted',
          citizenName: 'Anonymous (Protected)',
          citizenEmail: 'protected@legalaid.org',
          submittedDate: '2025-12-29',
          matchScore: 92,
          matchReason: 'Specialization in domestic violence and urgent cases',
          attachments: [
            { name: 'police_complaint.pdf', size: '890 KB' },
            { name: 'medical_report.pdf', size: '1.5 MB' }
          ],
          urgency: 'URGENT - Immediate action required',
          estimatedTimeframe: '1 week',
          acceptedDate: '2025-12-29'
        },
        {
          id: 4,
          title: 'Employment Termination - Wrongful Dismissal',
          description: 'Was terminated without proper notice or severance pay. Company violated labor laws. Need help to file complaint and recover dues.',
          caseType: 'Labor Law',
          priority: 'Medium',
          location: 'Navi Mumbai, Maharashtra',
          preferredLanguage: 'English',
          expertiseTags: ['Labor Law', 'Employment Rights', 'Wrongful Termination'],
          status: 'declined',
          citizenName: 'Amit Sharma',
          citizenEmail: 'amit.sharma@example.com',
          submittedDate: '2025-12-26',
          matchScore: 76,
          matchReason: 'Basic expertise match',
          attachments: [
            { name: 'termination_letter.pdf', size: '450 KB' },
            { name: 'employment_contract.pdf', size: '980 KB' }
          ],
          urgency: 'Standard processing',
          estimatedTimeframe: '3-4 weeks',
          declinedDate: '2025-12-27',
          declineReason: 'Conflict of interest - currently handling similar case with same employer'
        }
      ];
      setCases(mockCases);
      setLoading(false);
    }, 1000);
  };

  const handleAccept = async (caseId) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/assigned-cases/${caseId}/accept`, { method: 'POST' })
    
    const confirmed = window.confirm(
      'Accept this case? This will notify the citizen and start the case process.'
    );
    
    if (confirmed) {
      setCases(cases.map(c => 
        c.id === caseId 
          ? { ...c, status: 'accepted', acceptedDate: new Date().toISOString().split('T')[0] }
          : c
      ));
      setShowDetails(false);
      alert('Case accepted! The citizen has been notified.');
    }
  };

  const handleDecline = async (caseId) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/assigned-cases/${caseId}/decline`, { method: 'POST' })
    
    const reason = prompt(
      'Please provide a reason for declining (optional but recommended):'
    );
    
    if (reason !== null) { // User didn't cancel
      setCases(cases.map(c => 
        c.id === caseId 
          ? { 
              ...c, 
              status: 'declined', 
              declinedDate: new Date().toISOString().split('T')[0],
              declineReason: reason || 'No reason provided'
            }
          : c
      ));
      setShowDetails(false);
      alert('Case declined. The system will find alternative matches for the citizen.');
    }
  };

  const viewDetails = (caseItem) => {
    setSelectedCase(caseItem);
    setShowDetails(true);
  };

  const getPriorityColor = (priority) => {
    if (priority === 'Urgent') return '#ef4444';
    if (priority === 'High') return '#f59e0b';
    if (priority === 'Medium') return '#3b82f6';
    return '#6b7280';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending Review', color: '#f59e0b' },
      accepted: { text: 'Accepted', color: '#10b981' },
      declined: { text: 'Declined', color: '#ef4444' }
    };
    return badges[status] || badges.pending;
  };

  const filteredCases = cases.filter(c => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.submittedDate) - new Date(a.submittedDate);
    }
    if (sortBy === 'priority') {
      const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === 'location') {
      return a.location.localeCompare(b.location);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="assigned-cases-container">
        <div className="loading-section">
          <div className="spinner"></div>
          <p>Loading assigned cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-cases-container">
      <div className="cases-header">
        <div>
          <h2>📋 Assigned Cases</h2>
          <p className="cases-subtitle">
            {cases.length} case{cases.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        <div className="cases-summary">
          <div className="summary-stat">
            <span className="stat-number pending">{cases.filter(c => c.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number accepted">{cases.filter(c => c.status === 'accepted').length}</span>
            <span className="stat-label">Accepted</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number declined">{cases.filter(c => c.status === 'declined').length}</span>
            <span className="stat-label">Declined</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cases-controls">
        <div className="filter-group">
          <label>Status:</label>
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
            <option value="date">Date</option>
            <option value="priority">Priority</option>
            <option value="location">Location</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      <div className="cases-list">
        {sortedCases.length === 0 ? (
          <div className="no-cases">
            <p>📂 No cases with the selected filter.</p>
          </div>
        ) : (
          sortedCases.map(caseItem => (
            <div key={caseItem.id} className={`case-card case-${caseItem.status}`}>
              <div className="case-header">
                <div>
                  <div className="case-badges">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(caseItem.priority) }}
                    >
                      {caseItem.priority} Priority
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusBadge(caseItem.status).color }}
                    >
                      {getStatusBadge(caseItem.status).text}
                    </span>
                  </div>
                  <h3>{caseItem.title}</h3>
                </div>
                <div className="match-score-small">
                  <span className="score-value">{caseItem.matchScore}%</span>
                  <span className="score-text">Match</span>
                </div>
              </div>

              <p className="case-description">{caseItem.description}</p>

              <div className="case-details-grid">
                <div className="detail-item">
                  <strong>📁 Type:</strong>
                  <span>{caseItem.caseType}</span>
                </div>
                <div className="detail-item">
                  <strong>📍 Location:</strong>
                  <span>{caseItem.location}</span>
                </div>
                <div className="detail-item">
                  <strong>📅 Submitted:</strong>
                  <span>{new Date(caseItem.submittedDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <strong>🗣️ Language:</strong>
                  <span>{caseItem.preferredLanguage}</span>
                </div>
              </div>

              <div className="case-tags">
                {caseItem.expertiseTags.map((tag, idx) => (
                  <span key={idx} className="case-tag">{tag}</span>
                ))}
              </div>

              {caseItem.status === 'accepted' && (
                <div className="case-status-message accepted">
                  ✓ Accepted on {new Date(caseItem.acceptedDate).toLocaleDateString()}
                </div>
              )}

              {caseItem.status === 'declined' && (
                <div className="case-status-message declined">
                  ✗ Declined on {new Date(caseItem.declinedDate).toLocaleDateString()}
                  {caseItem.declineReason && (
                    <div className="decline-reason">Reason: {caseItem.declineReason}</div>
                  )}
                </div>
              )}

              <div className="case-actions">
                <button 
                  className="btn-view-details"
                  onClick={() => viewDetails(caseItem)}
                >
                  👁️ View Full Details
                </button>
                {caseItem.status === 'pending' && (
                  <>
                    <button 
                      className="btn-accept-case"
                      onClick={() => handleAccept(caseItem.id)}
                    >
                      ✓ Accept Case
                    </button>
                    <button 
                      className="btn-decline-case"
                      onClick={() => handleDecline(caseItem.id)}
                    >
                      ✗ Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Case Details Modal */}
      {showDetails && selectedCase && (
        <div className="case-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Case Details</h2>
              <button className="close-btn" onClick={() => setShowDetails(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>{selectedCase.title}</h3>
                <div className="case-badges">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedCase.priority) }}
                  >
                    {selectedCase.priority} Priority
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadge(selectedCase.status).color }}
                  >
                    {getStatusBadge(selectedCase.status).text}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Description</h4>
                <p>{selectedCase.description}</p>
              </div>

              <div className="detail-section">
                <h4>Case Information</h4>
                <div className="info-grid">
                  <div><strong>Type:</strong> {selectedCase.caseType}</div>
                  <div><strong>Priority:</strong> {selectedCase.priority}</div>
                  <div><strong>Location:</strong> {selectedCase.location}</div>
                  <div><strong>Language:</strong> {selectedCase.preferredLanguage}</div>
                  <div><strong>Submitted:</strong> {new Date(selectedCase.submittedDate).toLocaleDateString()}</div>
                  <div><strong>Timeframe:</strong> {selectedCase.estimatedTimeframe}</div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Citizen Information</h4>
                <div className="info-grid">
                  <div><strong>Name:</strong> {selectedCase.citizenName}</div>
                  <div><strong>Email:</strong> {selectedCase.citizenEmail}</div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Expertise Tags</h4>
                <div className="case-tags">
                  {selectedCase.expertiseTags.map((tag, idx) => (
                    <span key={idx} className="case-tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Attachments ({selectedCase.attachments.length})</h4>
                <div className="attachments-list">
                  {selectedCase.attachments.map((att, idx) => (
                    <div key={idx} className="attachment-item">
                      <span className="attachment-icon">📎</span>
                      <span className="attachment-name">{att.name}</span>
                      <span className="attachment-size">({att.size})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section urgency-section">
                <h4>⚠️ Urgency</h4>
                <p className="urgency-text">{selectedCase.urgency}</p>
              </div>

              <div className="detail-section">
                <h4>📊 Match Score: {selectedCase.matchScore}%</h4>
                <p><strong>Reason:</strong> {selectedCase.matchReason}</p>
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
