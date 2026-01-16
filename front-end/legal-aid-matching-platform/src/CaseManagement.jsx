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
  const [caseMatches, setCaseMatches] = useState({});

  useEffect(() => {
    fetchMyCases();
  }, []);

  const fetchMyCases = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/cases/my');
      setCases(response.data);
      
      // Fetch match history for each case to check for rejections
      const matchesData = {};
      for (const caseItem of response.data) {
        try {
          const matchResponse = await matchService.getMatchesForCase(caseItem.id);
          matchesData[caseItem.id] = matchResponse;
        } catch (err) {
          console.error(`Error fetching matches for case ${caseItem.id}:`, err);
          matchesData[caseItem.id] = [];
        }
      }
      setCaseMatches(matchesData);
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
      
      // Fetch match history if not already loaded
      if (!caseMatches[caseId]) {
        try {
          const matchResponse = await matchService.getMatchesForCase(caseId);
          setCaseMatches(prev => ({ ...prev, [caseId]: matchResponse }));
        } catch (err) {
          console.error(`Error fetching matches for case ${caseId}:`, err);
        }
      }
      
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  // Helper function to get rejected match details
  const getRejectedMatchInfo = (caseId) => {
    const matches = caseMatches[caseId];
    if (!matches || !Array.isArray(matches)) return null;
    const rejectedMatch = matches.find(match => match.status === 'REJECTED_BY_PROVIDER');
    return rejectedMatch;
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'status-badge status-submitted';
      case 'pending_approval':
        return 'status-badge status-pending-approval';
      case 'accepted':
        return 'status-badge status-accepted';
      case 'in_progress':
        return 'status-badge status-in-progress';
      case 'under_review':
        return 'status-badge status-under-review';
      case 'resolved':
        return 'status-badge status-resolved';
      case 'closed':
        return 'status-badge status-closed';
      case 'rejected':
        return 'status-badge status-rejected';
      case 'cancelled':
        return 'status-badge status-cancelled';
      case 'in_review':
        return 'status-badge status-in-review';
      case 'matched':
        return 'status-badge status-matched';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'in_progress':
        return 'In Progress';
      case 'under_review':
        return 'Under Review';
      case 'in_review':
        return 'In Review';
      case 'rejected':
        return 'Rejected';
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
      // Support both old (type/name) and new (fileType/fileName) field names
      const fileType = attachment.fileType || attachment.type;
      const fileName = attachment.fileName || attachment.name;
      const linkSource = `data:${fileType};base64,${attachment.content}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download attachment');
    }
  };

  // Helper function to get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📝';
    return '📎';
  };

  // Handle resolving a case
  const handleResolveCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to mark this case as resolved? This action indicates that your legal matter has been successfully addressed.')) {
      return;
    }
    
    try {
      setSaving(true);
      await apiClient.patch(`/cases/${caseId}/status`, { status: 'RESOLVED' });
      
      // Refresh the case details
      const response = await apiClient.get(`/cases/${caseId}`);
      setSelectedCase(response.data);
      
      // Refresh the cases list
      await fetchMyCases();
      
      alert('Case has been marked as resolved successfully!');
    } catch (error) {
      console.error('Error resolving case:', error);
      alert('Failed to resolve case. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Check if case can be resolved (only when accepted or in progress)
  const canResolveCase = (status) => {
    const resolvableStatuses = ['accepted', 'in_progress', 'under_review'];
    return resolvableStatuses.includes(status?.toLowerCase());
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
              
              {/* Show alert for rejected cases only */}
              {caseItem.status?.toLowerCase() === 'rejected' && (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  margin: '12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1rem' }}>❌</span>
                  <span style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: '500' }}>
                    Your case was rejected - Please select another match below
                  </span>
                </div>
              )}
              
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
                  {generatingMatches ? '⏳ Generating Matches...' : 'View Matches Lawyer / NGO'}
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
          <div className="modal-content case-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            {/* Modern Header */}
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2e5a8a 100%)', color: 'white', padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ color: 'white', marginBottom: '4px', fontSize: '1.25rem' }}>Case Details</h2>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  ID: #{selectedCase.caseNumber || selectedCase.id} • Created {formatDateTime(selectedCase.createdAt)}
                </div>
              </div>
              <button className="modal-close" onClick={closeModal} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Title and Status Bar */}
              <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedCase.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      style={{ flex: 1, minWidth: '200px', padding: '8px 12px', fontSize: '1.25rem', fontWeight: '600', border: '2px solid #667eea', borderRadius: '8px' }}
                      placeholder="Case Title"
                    />
                  ) : (
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>{selectedCase.title}</h3>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={getStatusBadgeClass(selectedCase.status)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {getStatusLabel(selectedCase.status)}
                    </span>
                    <span className={getPriorityBadgeClass(selectedCase.priority)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                      {selectedCase.priority || 'Medium'} Priority
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0' }}>
                {/* Left Column */}
                <div style={{ padding: '24px', borderRight: '1px solid #e5e7eb' }}>
                  {/* Description Section */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</h4>
                    {isEditMode ? (
                      <textarea
                        value={editedCase.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        style={{ width: '100%', padding: '12px', fontSize: '14px', border: '2px solid #667eea', borderRadius: '8px', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                        placeholder="Case Description"
                      />
                    ) : (
                      <p style={{ color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedCase.description}</p>
                    )}
                  </section>

                  {/* Case Info Grid */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Case Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Case Type</div>
                        {isEditMode ? (
                          <select value={editedCase.caseType} onChange={(e) => handleInputChange('caseType', e.target.value)} style={{ width: '100%', padding: '8px', border: '2px solid #667eea', borderRadius: '6px', fontSize: '14px' }}>
                            <option value="">Select Type</option>
                            <option value="Family Law">Family Law</option>
                            <option value="Criminal Law">Criminal Law</option>
                            <option value="Civil Rights">Civil Rights</option>
                            <option value="Employment Law">Employment Law</option>
                            <option value="Labor Law">Labor Law</option>
                            <option value="Housing Law">Housing Law</option>
                            <option value="Immigration Law">Immigration Law</option>
                            <option value="Consumer Rights">Consumer Rights</option>
                            <option value="Tax Law">Tax Law</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <div style={{ fontWeight: '600', color: '#111827' }}>{selectedCase.caseType || 'N/A'}</div>
                        )}
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Priority</div>
                        {isEditMode ? (
                          <select value={editedCase.priority} onChange={(e) => handleInputChange('priority', e.target.value)} style={{ width: '100%', padding: '8px', border: '2px solid #667eea', borderRadius: '6px', fontSize: '14px' }}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        ) : (
                          <div style={{ fontWeight: '600', color: selectedCase.priority?.toLowerCase() === 'high' ? '#dc2626' : selectedCase.priority?.toLowerCase() === 'medium' ? '#d97706' : '#16a34a' }}>{selectedCase.priority || 'Medium'}</div>
                        )}
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Location</div>
                        {isEditMode ? (
                          <input type="text" value={editedCase.location} onChange={(e) => handleInputChange('location', e.target.value)} style={{ width: '100%', padding: '8px', border: '2px solid #667eea', borderRadius: '6px', fontSize: '14px' }} placeholder="Enter location" />
                        ) : (
                          <div style={{ fontWeight: '600', color: '#111827' }}>{selectedCase.location || 'Not specified'}</div>
                        )}
                      </div>
                      <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Preferred Language</div>
                        {isEditMode ? (
                          <select value={editedCase.preferredLanguage} onChange={(e) => handleInputChange('preferredLanguage', e.target.value)} style={{ width: '100%', padding: '8px', border: '2px solid #667eea', borderRadius: '6px', fontSize: '14px' }}>
                            <option value="">Select Language</option>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Arabic">Arabic</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <div style={{ fontWeight: '600', color: '#111827' }}>{selectedCase.preferredLanguage || 'Not specified'}</div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Expertise Tags Section */}
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expertise Tags</h4>
                    {isEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {editedCase.expertiseTags.map((tag, index) => (
                          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="text" value={tag} onChange={(e) => handleTagChange(index, e.target.value)} style={{ flex: 1, padding: '8px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }} placeholder="Enter tag" />
                            <button onClick={() => removeTag(index)} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Remove</button>
                          </div>
                        ))}
                        <button onClick={addTag} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start' }}>+ Add Tag</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedCase.expertiseTags && selectedCase.expertiseTags.filter(tag => tag && tag.trim() !== '').length > 0 ? (
                          selectedCase.expertiseTags.filter(tag => tag && tag.trim() !== '').map((tag, index) => (
                            <span key={index} style={{ backgroundColor: '#eef2ff', color: '#4338ca', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600', border: '1px solid #c7d2fe' }}>{tag}</span>
                          ))
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags specified</span>
                        )}
                      </div>
                    )}
                  </section>
                </div>

                {/* Right Column */}
                <div style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
                  {/* Timeline Section */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Timeline</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#667eea' }}></div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>Case Submitted</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDateTime(selectedCase.createdAt)}</div>
                        </div>
                      </div>
                      {selectedCase.updatedAt && selectedCase.updatedAt !== selectedCase.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem' }}>Last Updated</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDateTime(selectedCase.updatedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Current Status Section */}
                  <section style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Status</h4>
                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <span className={getStatusBadgeClass(selectedCase.status)} style={{ marginBottom: '8px', display: 'inline-block' }}>
                        {getStatusLabel(selectedCase.status)}
                      </span>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                        {selectedCase.status?.toLowerCase() === 'rejected' && (
                          <>
                            <span style={{ display: 'block', color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>
                              ❌ Your selected legal professional was unable to take this case.
                            </span>
                            {(() => {
                              const rejectedMatch = getRejectedMatchInfo(selectedCase.id);
                              return rejectedMatch?.rejectionReason && (
                                <span style={{ display: 'block', marginBottom: '8px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#7f1d1d', fontSize: '0.875rem' }}>
                                  <strong>Reason:</strong> {rejectedMatch.rejectionReason}
                                </span>
                              );
                            })()}
                            <span style={{ display: 'block', marginTop: '8px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '4px', color: '#92400e', fontWeight: '500' }}>
                              👉 Please click the "View Matches" button below to select another legal professional from your available matches.
                            </span>
                          </>
                        )}
                        {selectedCase.status?.toLowerCase() === 'submitted' && (
                          <>
                            Your case has been submitted. Click the "View Matches" button below to find and select a legal professional to help you.
                            <span style={{ display: 'block', marginTop: '8px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', color: '#92400e', fontWeight: '500' }}>
                              💡 Tip: Review all available matches carefully before selecting one
                            </span>
                          </>
                        )}
                        {selectedCase.status?.toLowerCase() === 'pending_approval' && 'You have selected a legal professional. Waiting for them to accept your case.'}
                        {selectedCase.status?.toLowerCase() === 'accepted' && 'A legal professional has accepted your case and will start working on it soon.'}
                        {selectedCase.status?.toLowerCase() === 'in_progress' && 'Your case is currently being worked on by the assigned legal professional.'}
                        {selectedCase.status?.toLowerCase() === 'under_review' && 'Your case is under review by the legal professional.'}
                        {selectedCase.status?.toLowerCase() === 'resolved' && 'Your case has been resolved. Please review the outcome.'}
                        {selectedCase.status?.toLowerCase() === 'closed' && 'This case has been closed.'}
                        {selectedCase.status?.toLowerCase() === 'cancelled' && 'This case has been cancelled.'}
                        {selectedCase.status?.toLowerCase() === 'in_review' && 'Your case is currently being reviewed by our team.'}
                        {selectedCase.status?.toLowerCase() === 'matched' && 'Your case has been matched with a legal professional.'}
                      </p>
                    </div>
                  </section>

                  {/* Evidence & Documents Section */}
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Evidence & Documents</h4>
                    {selectedCase.attachments && selectedCase.attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedCase.attachments.map((attachment, index) => {
                          const fileType = attachment.fileType || attachment.type;
                          const fileName = attachment.fileName || attachment.name;
                          return (
                            <div
                              key={index}
                              onClick={() => downloadAttachment(attachment)}
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              <span style={{ fontSize: '1.5rem' }}>{getFileIcon(fileType)}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatFileSize(attachment.fileSize) || fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                              </div>
                              <span style={{ color: '#667eea', fontWeight: '600', fontSize: '0.75rem' }}>⬇️ Download</span>
                            </div>
                          );
                        })}
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
            <div className="modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {isEditMode ? (
                <>
                  <button onClick={handleCancelEdit} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveCase} disabled={saving} style={{ padding: '10px 20px', background: saving ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {saving ? '⏳ Saving...' : '✓ Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  {/* Resolve Case Button - shown when case is accepted/in progress */}
                  {canResolveCase(selectedCase.status) && (
                    <button
                      onClick={() => handleResolveCase(selectedCase.id)}
                      disabled={saving}
                      title="Mark this case as resolved"
                      style={{ 
                        padding: '10px 20px', 
                        background: saving ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontWeight: '600', 
                        cursor: saving ? 'not-allowed' : 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}
                    >
                      ✅ {saving ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  )}
                  <button
                    onClick={handleEditCase}
                    disabled={selectedCase.status?.toLowerCase() !== 'submitted'}
                    title={selectedCase.status?.toLowerCase() !== 'submitted' ? 'Can only edit cases with SUBMITTED status' : ''}
                    style={{ padding: '10px 20px', background: selectedCase.status?.toLowerCase() !== 'submitted' ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: selectedCase.status?.toLowerCase() !== 'submitted' ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: selectedCase.status?.toLowerCase() !== 'submitted' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    ✏️ Edit Case
                  </button>
                  <button onClick={closeModal} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default CaseManagement;
