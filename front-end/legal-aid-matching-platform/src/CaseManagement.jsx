import React, { useState, useEffect } from 'react';
import './CaseManagement.css';

const CaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchMyCases();
  }, []);

  const fetchMyCases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/cases/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data);
      } else {
        console.error('Failed to fetch cases');
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewCaseDetails = async (caseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/cases/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCase(data);
        setShowDetailModal(true);
      } else {
        console.error('Failed to fetch case details');
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'status-badge status-submitted';
      case 'in_review':
        return 'status-badge status-in-review';
      case 'matched':
        return 'status-badge status-matched';
      case 'closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_review':
        return 'In Review';
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'priority-badge priority-high';
      case 'medium':
        return 'priority-badge priority-medium';
      case 'low':
        return 'priority-badge priority-low';
      default:
        return 'priority-badge';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedCase(null);
  };

  return (
    <div className="case-management">
      <div className="case-header">
        <h2>My Cases</h2>
        <p className="case-subtitle">View and manage all your submitted cases</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Cases Yet</h3>
          <p>You haven't submitted any cases. Go to Case Submission to create your first case.</p>
        </div>
      ) : (
        <div className="cases-grid">
          {cases.map((caseItem) => (
            <div key={caseItem.id} className="case-card" onClick={() => viewCaseDetails(caseItem.id)}>
              <div className="case-card-header">
                <h3 className="case-title">{caseItem.title}</h3>
                <span className={getStatusBadgeClass(caseItem.status)}>
                  {getStatusLabel(caseItem.status)}
                </span>
              </div>
              <div className="case-card-body">
                <p className="case-description">
                  {caseItem.description?.length > 150
                    ? `${caseItem.description.substring(0, 150)}...`
                    : caseItem.description}
                </p>
                <div className="case-meta">
                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{caseItem.caseType || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Priority:</span>
                    <span className={getPriorityBadgeClass(caseItem.priority)}>
                      {caseItem.priority || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="case-timestamp">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submitted {formatDateTime(caseItem.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Detail Modal */}
      {showDetailModal && selectedCase && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content case-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Case Details</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-header">
                  <h3>{selectedCase.title}</h3>
                  <span className={getStatusBadgeClass(selectedCase.status)}>
                    {getStatusLabel(selectedCase.status)}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Description</h4>
                <p className="detail-text">{selectedCase.description}</p>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Case Type</span>
                  <span className="detail-value">{selectedCase.caseType || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className={getPriorityBadgeClass(selectedCase.priority)}>
                    {selectedCase.priority || 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Case ID</span>
                  <span className="detail-value">#{selectedCase.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By</span>
                  <span className="detail-value">User #{selectedCase.createdBy}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">Case Submitted</div>
                      <div className="timeline-time">{formatDateTime(selectedCase.createdAt)}</div>
                    </div>
                  </div>
                  {selectedCase.updatedAt && selectedCase.updatedAt !== selectedCase.createdAt && (
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">Last Updated</div>
                        <div className="timeline-time">{formatDateTime(selectedCase.updatedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section current-status-section">
                <h4>Current Status</h4>
                <div className="status-info">
                  <div className="status-indicator">
                    <span className={getStatusBadgeClass(selectedCase.status)}>
                      {getStatusLabel(selectedCase.status)}
                    </span>
                  </div>
                  <p className="status-description">
                    {selectedCase.status?.toLowerCase() === 'submitted' && 
                      'Your case has been submitted and is awaiting review.'}
                    {selectedCase.status?.toLowerCase() === 'in_review' && 
                      'Your case is currently being reviewed by our team.'}
                    {selectedCase.status?.toLowerCase() === 'matched' && 
                      'Your case has been matched with a legal professional.'}
                    {selectedCase.status?.toLowerCase() === 'closed' && 
                      'This case has been closed.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
