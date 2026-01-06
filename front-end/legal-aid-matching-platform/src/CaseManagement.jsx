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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCase, setEditedCase] = useState(null);
  const [saving, setSaving] = useState(false);

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
    setIsEditMode(false);
    setEditedCase(null);
  };

  const handleEditCase = () => {
    setIsEditMode(true);
    setEditedCase({
      title: selectedCase.title,
      description: selectedCase.description,
      caseType: selectedCase.caseType,
      priority: selectedCase.priority,
      location: selectedCase.location || '',
      preferredLanguage: selectedCase.preferredLanguage || '',
      expertiseTags: selectedCase.expertiseTags || []
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedCase(null);
  };

  const handleSaveCase = async () => {
    try {
      setSaving(true);
      const updateData = {
        title: editedCase.title,
        description: editedCase.description,
        caseType: editedCase.caseType,
        priority: editedCase.priority,
        location: editedCase.location,
        preferredLanguage: editedCase.preferredLanguage,
        expertiseTags: editedCase.expertiseTags
      };

      await apiClient.put(`/cases/${selectedCase.id}`, updateData);
      
      // Refresh the case details
      const response = await apiClient.get(`/cases/${selectedCase.id}`);
      setSelectedCase(response.data);
      
      // Refresh the cases list
      await fetchMyCases();
      
      setIsEditMode(false);
      setEditedCase(null);
      alert('Case updated successfully!');
    } catch (error) {
      console.error('Error updating case:', error);
      alert('Failed to update case. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedCase(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagChange = (index, value) => {
    const newTags = [...editedCase.expertiseTags];
    newTags[index] = value;
    setEditedCase(prev => ({
      ...prev,
      expertiseTags: newTags
    }));
  };

  const addTag = () => {
    setEditedCase(prev => ({
      ...prev,
      expertiseTags: [...prev.expertiseTags, '']
    }));
  };

  const removeTag = (index) => {
    const newTags = editedCase.expertiseTags.filter((_, i) => i !== index);
    setEditedCase(prev => ({
      ...prev,
      expertiseTags: newTags
    }));
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
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedCase.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '20px',
                        fontWeight: '600',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                      placeholder="Case Title"
                    />
                  ) : (
                    <h3>{selectedCase.title}</h3>
                  )}
                  <span className={getStatusBadgeClass(selectedCase.status)}>
                    {getStatusLabel(selectedCase.status)}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Description</h4>
                {isEditMode ? (
                  <textarea
                    value={editedCase.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      minHeight: '120px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Case Description"
                  />
                ) : (
                  <p className="detail-text">{selectedCase.description}</p>
                )}
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Case Type</span>
                  {isEditMode ? (
                    <select
                      value={editedCase.caseType}
                      onChange={(e) => handleInputChange('caseType', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Type</option>
                      <option value="Family Law">Family Law</option>
                      <option value="Criminal Law">Criminal Law</option>
                      <option value="Civil Rights">Civil Rights</option>
                      <option value="Employment Law">Employment Law</option>
                      <option value="Housing Law">Housing Law</option>
                      <option value="Immigration Law">Immigration Law</option>
                      <option value="Consumer Rights">Consumer Rights</option>
                      <option value="Tax Law">Tax Law</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="detail-value">{selectedCase.caseType || 'N/A'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  {isEditMode ? (
                    <select
                      value={editedCase.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  ) : (
                    <span className={getPriorityBadgeClass(selectedCase.priority)}>
                      {selectedCase.priority || 'N/A'}
                    </span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Case ID</span>
                  <span className="detail-value">#{selectedCase.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created By</span>
                  <span className="detail-value">User #{selectedCase.createdBy}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location</span>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedCase.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="Enter location"
                    />
                  ) : (
                    <span className="detail-value">{selectedCase.location || 'Not specified'}</span>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred Language</span>
                  {isEditMode ? (
                    <select
                      value={editedCase.preferredLanguage}
                      onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Russian">Russian</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="detail-value">{selectedCase.preferredLanguage || 'Not specified'}</span>
                  )}
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Expertise Tags</span>
                  {isEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editedCase.expertiseTags.map((tag, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) => handleTagChange(index, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                            placeholder="Enter tag"
                          />
                          <button
                            onClick={() => removeTag(index)}
                            style={{
                              padding: '8px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addTag}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        + Add Tag
                      </button>
                    </div>
                  ) : (
                    <div className="detail-tags-container">
                      {selectedCase.expertiseTags && selectedCase.expertiseTags.filter(tag => tag && tag.trim() !== '').length > 0 ? (
                        selectedCase.expertiseTags.filter(tag => tag && tag.trim() !== '').map((tag, index) => (
                          <span key={index} className="detail-tag-badge">{tag}</span>
                        ))
                      ) : (
                        <span className="detail-value">No tags</span>
                      )}
                    </div>
                  )}
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
              {isEditMode ? (
                <>
                  <button
                    className="btn-edit"
                    onClick={handleSaveCase}
                    disabled={saving}
                    style={{
                      background: saving ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn-secondary" onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`btn-edit ${selectedCase.status?.toLowerCase() !== 'submitted' ? 'disabled' : ''}`}
                    disabled={selectedCase.status?.toLowerCase() !== 'submitted'}
                    onClick={handleEditCase}
                    title={selectedCase.status?.toLowerCase() !== 'submitted' ? 'Can only edit cases with SUBMITTED status' : ''}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Case
                  </button>
                  <button className="btn-secondary" onClick={closeModal}>Close</button>
                </>
              )}
            </div>
          </div>
        </div >
      )}
    </div >
  );
};

export default CaseManagement;
