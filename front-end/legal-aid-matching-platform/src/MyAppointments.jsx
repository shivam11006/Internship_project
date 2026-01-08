import React, { useState, useEffect } from 'react';
import appointmentService from './services/appointmentService';
import authService from './services/authService';
import './MyAppointments.css';

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'pending', 'past'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    preferredDate: '',
    preferredTime: '',
    reason: '',
    message: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const user = authService.getCurrentUser();
  const isCitizen = user?.role === 'CITIZEN';
  const isProvider = user?.role === 'LAWYER' || user?.role === 'NGO';

  // Load pending count on mount
  useEffect(() => {
    loadPendingCount();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadPendingCount = async () => {
    try {
      const pendingData = await appointmentService.getPendingAppointments();
      setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0);
    } catch (err) {
      console.error('Error loading pending count:', err);
      setPendingCount(0);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      switch (filter) {
        case 'upcoming':
          data = await appointmentService.getUpcomingAppointments();
          break;
        case 'pending':
          data = await appointmentService.getPendingAppointments();
          break;
        case 'past':
          data = await appointmentService.getPastAppointments();
          break;
        default:
          data = await appointmentService.getMyAppointments();
      }
      // Ensure data is an array
      setAppointments(Array.isArray(data) ? data : []);
      // Also refresh pending count
      loadPendingCount();
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAppointment = async (appointmentId) => {
    setActionLoading(true);
    try {
      if (isCitizen) {
        await appointmentService.confirmAppointment(appointmentId);
      } else if (isProvider) {
        await appointmentService.acceptAppointment(appointmentId);
      }
      alert('Appointment accepted successfully!');
      loadAppointments();
      loadPendingCount();
      setShowDetailModal(false);
    } catch (err) {
      alert(`Error accepting appointment: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleForm({
      preferredDate: '',
      preferredTime: '',
      reason: '',
      message: ''
    });
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleForm.preferredDate || !rescheduleForm.preferredTime || !rescheduleForm.reason) {
      alert('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const preferredDateTime = `${rescheduleForm.preferredDate}T${rescheduleForm.preferredTime}:00`;
      await appointmentService.requestReschedule(selectedAppointment.id, {
        preferredDateTime,
        reason: rescheduleForm.reason,
        message: rescheduleForm.message
      });
      alert('Reschedule request submitted successfully!');
      setShowRescheduleModal(false);
      loadAppointments();
    } catch (err) {
      alert(`Error requesting reschedule: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await appointmentService.cancelAppointment(appointmentId, reason);
      alert('Appointment cancelled successfully');
      loadAppointments();
      setShowDetailModal(false);
    } catch (err) {
      alert(`Error cancelling appointment: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'CONFIRMED': 'status-confirmed',
      'PENDING_CITIZEN_APPROVAL': 'status-pending',
      'PENDING_PROVIDER_APPROVAL': 'status-pending',
      'RESCHEDULE_REQUESTED': 'status-warning',
      'RESCHEDULED': 'status-warning',
      'CANCELLED': 'status-cancelled',
      'COMPLETED': 'status-completed',
      'NO_SHOW': 'status-error'
    };
    return statusMap[status] || 'status-default';
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Not set';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return 'Not set';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Not set';
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>📅 My Appointments</h1>
        <p className="subtitle">Manage your legal consultations and meetings</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Appointments
        </button>
        <button
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending Action
          {pendingCount > 0 && (
            <span className="badge">{pendingCount}</span>
          )}
        </button>
        <button
          className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={loadAppointments} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Appointments List */}
      {!loading && !error && (
        <div className="appointments-list">
          {appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No appointments found</h3>
              <p>
                {filter === 'pending' 
                  ? 'You have no pending appointments requiring action'
                  : filter === 'upcoming'
                  ? 'You have no upcoming appointments scheduled'
                  : filter === 'past'
                  ? 'You have no past appointments'
                  : 'You have not created or received any appointments yet'}
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-card-header">
                  <div className="appointment-title-section">
                    <h3>{appointment.caseTitle || 'Consultation'}</h3>
                    <span className={`appointment-type-badge ${appointment.appointmentType?.toLowerCase()}`}>
                      {appointment.appointmentType === 'CALL' ? '📞 Call' : '🏢 In-Person'}
                    </span>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                    {appointment.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="appointment-card-body">
                  <div className="appointment-info-grid">
                    <div className="info-item">
                      <span className="info-label">📅 Date & Time</span>
                      <span className="info-value">{formatDateTime(appointment.scheduledDateTime)}</span>
                    </div>

                    {appointment.appointmentType === 'OFFLINE' && appointment.venue && (
                      <div className="info-item">
                        <span className="info-label">📍 Venue</span>
                        <span className="info-value">{appointment.venue}</span>
                      </div>
                    )}

                    {appointment.appointmentType === 'CALL' && appointment.venue && (
                      <div className="info-item">
                        <span className="info-label">📱 Meeting Link</span>
                        <span className="info-value">{appointment.venue}</span>
                      </div>
                    )}

                    {appointment.location && (
                      <div className="info-item">
                        <span className="info-label">🗺️ Location</span>
                        <span className="info-value">{appointment.location}</span>
                      </div>
                    )}

                    <div className="info-item">
                      <span className="info-label">👤 {isCitizen ? 'Provider' : 'Citizen'}</span>
                      <span className="info-value">
                        {isCitizen ? `${appointment.providerName} (${appointment.providerRole})` : appointment.citizenName}
                      </span>
                    </div>

                    {appointment.durationMinutes && (
                      <div className="info-item">
                        <span className="info-label">⏱️ Duration</span>
                        <span className="info-value">{appointment.durationMinutes} minutes</span>
                      </div>
                    )}
                  </div>

                  {appointment.statusDescription && (
                    <div className="status-description">
                      ℹ️ {appointment.statusDescription}
                    </div>
                  )}

                  {/* Action Required Alert */}
                  {((isCitizen && appointment.actionRequiredByCitizen) || 
                    (isProvider && appointment.actionRequiredByProvider)) && (
                    <div className="action-required-alert">
                      ⚠️ Action Required: Please review and respond to this appointment
                    </div>
                  )}
                </div>

                <div className="appointment-card-footer">
                  <button 
                    className="btn-secondary"
                    onClick={() => handleViewDetails(appointment)}
                  >
                    View Details
                  </button>

                  {/* Accept Button - for initial appointments and reschedule requests */}
                  {((isCitizen && (appointment.status === 'PENDING_CITIZEN_APPROVAL' || appointment.status === 'RESCHEDULE_REQUESTED' || appointment.status === 'RESCHEDULED')) ||
                    (isProvider && (appointment.status === 'PENDING_PROVIDER_APPROVAL' || appointment.status === 'RESCHEDULE_REQUESTED' || appointment.status === 'RESCHEDULED'))) && (
                    <button 
                      className="btn-primary"
                      onClick={() => handleAcceptAppointment(appointment.id)}
                      disabled={actionLoading}
                    >
                      ✓ Accept
                    </button>
                  )}

                  {/* Reject Button - for reschedule requests */}
                  {(appointment.status === 'RESCHEDULE_REQUESTED' || appointment.status === 'RESCHEDULED') && (
                    <button 
                      className="btn-danger"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={actionLoading}
                    >
                      ✕ Reject
                    </button>
                  )}

                  {/* Reschedule Button */}
                  {(appointment.status === 'CONFIRMED' || 
                    appointment.status === 'PENDING_CITIZEN_APPROVAL' ||
                    appointment.status === 'PENDING_PROVIDER_APPROVAL') && (
                    <button 
                      className="btn-warning"
                      onClick={() => handleOpenRescheduleModal(appointment)}
                      disabled={actionLoading}
                    >
                      🔄 Request Reschedule
                    </button>
                  )}

                  {/* Cancel Button */}
                  {(appointment.status === 'CONFIRMED' || 
                    appointment.status === 'PENDING_CITIZEN_APPROVAL' ||
                    appointment.status === 'PENDING_PROVIDER_APPROVAL') && (
                    <button 
                      className="btn-danger"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={actionLoading}
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Appointment Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>{selectedAppointment.caseTitle || 'Consultation'}</h3>
                <span className={`status-badge ${getStatusBadgeClass(selectedAppointment.status)}`}>
                  {selectedAppointment.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Date</label>
                  <p>{formatDate(selectedAppointment.scheduledDateTime)}</p>
                </div>
                <div className="detail-item">
                  <label>Time</label>
                  <p>{formatTime(selectedAppointment.scheduledDateTime)}</p>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <p>{selectedAppointment.appointmentType === 'CALL' ? '📞 Call/Video' : '🏢 In-Person Meeting'}</p>
                </div>
                {selectedAppointment.durationMinutes && (
                  <div className="detail-item">
                    <label>Duration</label>
                    <p>{selectedAppointment.durationMinutes} minutes</p>
                  </div>
                )}
              </div>

              {selectedAppointment.appointmentType === 'OFFLINE' && (
                <>
                  {selectedAppointment.venue && (
                    <div className="detail-item full-width">
                      <label>Venue</label>
                      <p>{selectedAppointment.venue}</p>
                    </div>
                  )}
                  {selectedAppointment.location && (
                    <div className="detail-item full-width">
                      <label>Location</label>
                      <p>{selectedAppointment.location}</p>
                    </div>
                  )}
                  {selectedAppointment.address && (
                    <div className="detail-item full-width">
                      <label>Full Address</label>
                      <p>{selectedAppointment.address}</p>
                    </div>
                  )}
                </>
              )}

              {selectedAppointment.appointmentType === 'CALL' && selectedAppointment.venue && (
                <div className="detail-item full-width">
                  <label>Meeting Link / Phone</label>
                  <p className="meeting-link">{selectedAppointment.venue}</p>
                </div>
              )}

              <div className="detail-grid">
                <div className="detail-item">
                  <label>{isCitizen ? 'Provider Name' : 'Citizen Name'}</label>
                  <p>{isCitizen ? selectedAppointment.providerName : selectedAppointment.citizenName}</p>
                </div>
                {isCitizen && (
                  <div className="detail-item">
                    <label>Provider Role</label>
                    <p>{selectedAppointment.providerRole}</p>
                  </div>
                )}
                <div className="detail-item">
                  <label>Email</label>
                  <p>{isCitizen ? selectedAppointment.providerEmail : selectedAppointment.citizenEmail}</p>
                </div>
              </div>

              {selectedAppointment.agenda && (
                <div className="detail-item full-width">
                  <label>Agenda</label>
                  <p className="agenda-text">{selectedAppointment.agenda}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="detail-item full-width">
                  <label>Notes</label>
                  <p className="notes-text">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Created By</label>
                  <p>{selectedAppointment.createdByName || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Created At</label>
                  <p>{formatDateTime(selectedAppointment.createdAt)}</p>
                </div>
              </div>

              {selectedAppointment.statusDescription && (
                <div className="status-info">
                  <strong>Status:</strong> {selectedAppointment.statusDescription}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {/* Accept Button - for initial appointments and reschedule requests */}
              {((isCitizen && (selectedAppointment.status === 'PENDING_CITIZEN_APPROVAL' || selectedAppointment.status === 'RESCHEDULE_REQUESTED' || selectedAppointment.status === 'RESCHEDULED')) ||
                (isProvider && (selectedAppointment.status === 'PENDING_PROVIDER_APPROVAL' || selectedAppointment.status === 'RESCHEDULE_REQUESTED' || selectedAppointment.status === 'RESCHEDULED'))) && (
                <button 
                  className="btn-primary"
                  onClick={() => handleAcceptAppointment(selectedAppointment.id)}
                  disabled={actionLoading}
                >
                  ✓ Accept Appointment
                </button>
              )}

              {/* Reject Button - for reschedule requests */}
              {(selectedAppointment.status === 'RESCHEDULE_REQUESTED' || selectedAppointment.status === 'RESCHEDULED') && (
                <button 
                  className="btn-danger"
                  onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  disabled={actionLoading}
                >
                  ✕ Reject
                </button>
              )}
              
              {(selectedAppointment.status === 'CONFIRMED' || 
                selectedAppointment.status === 'PENDING_CITIZEN_APPROVAL' ||
                selectedAppointment.status === 'PENDING_PROVIDER_APPROVAL') && (
                <>
                  <button 
                    className="btn-warning"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenRescheduleModal(selectedAppointment);
                    }}
                    disabled={actionLoading}
                  >
                    🔄 Request Reschedule
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    disabled={actionLoading}
                  >
                    ✕ Cancel Appointment
                  </button>
                </>
              )}
              
              <button 
                className="btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Reschedule</h2>
              <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <p className="reschedule-info">
                Current appointment: <strong>{formatDateTime(selectedAppointment.scheduledDateTime)}</strong>
              </p>

              <div className="form-group">
                <label>Preferred Date *</label>
                <input
                  type="date"
                  value={rescheduleForm.preferredDate}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, preferredDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Preferred Time * (24-hour format, e.g., 14:00)</label>
                <input
                  type="time"
                  value={rescheduleForm.preferredTime}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, preferredTime: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Reason for Reschedule *</label>
                <select
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                >
                  <option value="">Select a reason</option>
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Illness">Illness</option>
                  <option value="Transportation issues">Transportation issues</option>
                  <option value="Court hearing">Court hearing</option>
                  <option value="Other commitment">Other commitment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Additional Message (Optional)</label>
                <textarea
                  value={rescheduleForm.message}
                  onChange={(e) => setRescheduleForm({...rescheduleForm, message: e.target.value})}
                  placeholder="Provide any additional details..."
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowRescheduleModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSubmitReschedule}
                disabled={actionLoading}
              >
                {actionLoading ? 'Submitting...' : 'Submit Reschedule Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
