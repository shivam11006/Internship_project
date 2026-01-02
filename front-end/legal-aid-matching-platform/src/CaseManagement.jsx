import React, { useState, useEffect } from 'react';
import './CaseManagement.css';
import { apiClient } from './services/authService';
import * as matchService from './services/matchService';
import Matches from './Matches';

const CaseManagement = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [selectedCaseIdForMatches, setSelectedCaseIdForMatches] = useState(null);
  const [generatingMatches, setGeneratingMatches] = useState(false);

  useEffect(() => {
    fetchMyCases();
  }, []);

  const fetchMyCases = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/cases/my');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewCaseDetails = async (caseId) => {
    try {
      const response = await apiClient.get(`/cases/${caseId}`);
      setSelectedCase(response.data);
      setShowDetailModal(true);
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

  const handleViewMatches = async (caseId) => {
    try {
      setGeneratingMatches(true);
      console.log('Generating matches for case:', caseId);
      
      // Call the generate matches API
      const generateResponse = await matchService.generateMatches(caseId);
      console.log('Matches generated:', generateResponse);
      
      // Now open the matches modal
      setSelectedCaseIdForMatches(caseId);
      setShowMatchesModal(true);
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Failed to generate matches. Please try again.');
    } finally {
      setGeneratingMatches(false);
    }
  };

  const downloadAttachment = (attachment) => {
    try {
      const linkSource = `data:${attachment.type};base64,${attachment.content}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = attachment.name;
      downloadLink.click();
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download attachment');
    }
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
                {caseItem.expertiseTags && caseItem.expertiseTags.filter(tag => tag && tag.trim() !== '').length > 0 && (
                  <div className="case-tags-preview">
                    {caseItem.expertiseTags.filter(tag => tag && tag.trim() !== '').map((tag, index) => (
                      <span key={index} className="case-tag-mini">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="case-timestamp">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submitted {formatDateTime(caseItem.createdAt)}</span>
                </div>
                <button
                  className="btn-view-matches"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewMatches(caseItem.id);
                  }}
                  disabled={generatingMatches}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '10px',
                    background: generatingMatches 
                      ? '#ccc' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: generatingMatches ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => !generatingMatches && (e.target.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => !generatingMatches && (e.target.style.transform = 'translateY(0)')}
                >
                  {generatingMatches ? '⏳ Generating Matches...' : '💘 View Matches'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Matches Modal */}
      {showMatchesModal && selectedCaseIdForMatches && (
        <Matches
          caseId={selectedCaseIdForMatches}
          onClose={() => {
            setShowMatchesModal(false);
            setSelectedCaseIdForMatches(null);
          }}
        />
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
                {selectedCase.expertiseTags && selectedCase.expertiseTags.filter(tag => tag && tag.trim() !== '').length > 0 && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Expertise Tags</span>
                    <div className="detail-tags-container">
                      {selectedCase.expertiseTags.filter(tag => tag && tag.trim() !== '').map((tag, index) => (
                        <span key={index} className="detail-tag-badge">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
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

              {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                <div className="detail-section attachments-section">
                  <h4>Evidence & Documents</h4>
                  <div className="attachments-grid">
                    {selectedCase.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="attachment-item"
                        onClick={() => downloadAttachment(attachment)}
                        title="Click to download"
                      >
                        <div className="attachment-icon">
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="attachment-info">
                          <span className="attachment-name">{attachment.name}</span>
                          <span className="attachment-type">{attachment.type.split('/')[1] || 'file'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              <button
                className={`btn-edit ${selectedCase.status?.toLowerCase() !== 'submitted' ? 'disabled' : ''}`}
                disabled={selectedCase.status?.toLowerCase() !== 'submitted'}
                onClick={() => alert('Edit functionality is under development.')}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Case
              </button>
              <button className="btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div >
      )}
    </div >
  );
};

export default CaseManagement;
