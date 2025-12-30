import React, { useState, useEffect } from 'react';
import './Matches.css';

function Matches({ caseId, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, lawyer, ngo
  const [sortBy, setSortBy] = useState('score'); // score, location, name

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetch(`/api/cases/${caseId}/matches`)
    fetchMockMatches();
  }, [caseId]);

  const fetchMockMatches = () => {
    // Mock data - replace with actual API call later
    setTimeout(() => {
      const mockMatches = [
        {
          id: 1,
          type: 'LAWYER',
          name: 'Advocate Priya Sharma',
          specialization: 'Family Law',
          location: 'Mumbai, Maharashtra',
          languages: 'English, Hindi, Marathi',
          matchScore: 95,
          matchReasons: ['Location Match', 'Expertise Match', 'Language Match'],
          barNumber: 'MH/12345/2015',
          experience: '8 years',
          rating: 4.8,
          casesHandled: 156,
          status: 'pending', // pending, accepted, rejected
          availability: 'Available',
          profileImage: null
        },
        {
          id: 2,
          type: 'NGO',
          name: 'Legal Aid Society Mumbai',
          focusArea: 'Family Law, Women Rights',
          location: 'Mumbai, Maharashtra',
          languages: 'English, Hindi, Marathi, Gujarati',
          matchScore: 88,
          matchReasons: ['Location Match', 'Focus Area Match', 'High Success Rate'],
          registrationNumber: 'NGO/MH/2010/123',
          established: '2010',
          rating: 4.6,
          casesHandled: 342,
          status: 'pending',
          availability: 'Available',
          profileImage: null
        },
        {
          id: 3,
          type: 'LAWYER',
          name: 'Advocate Rajesh Kumar',
          specialization: 'Family Law, Property Disputes',
          location: 'Navi Mumbai, Maharashtra',
          languages: 'English, Hindi',
          matchScore: 82,
          matchReasons: ['Expertise Match', 'High Rating'],
          barNumber: 'MH/23456/2012',
          experience: '11 years',
          rating: 4.9,
          casesHandled: 203,
          status: 'pending',
          availability: 'Available from Jan 5',
          profileImage: null
        },
        {
          id: 4,
          type: 'NGO',
          name: 'Citizens Rights Forum',
          focusArea: 'Human Rights, Family Law',
          location: 'Thane, Maharashtra',
          languages: 'English, Hindi, Marathi',
          matchScore: 76,
          matchReasons: ['Focus Area Match', 'Language Match'],
          registrationNumber: 'NGO/MH/2015/456',
          established: '2015',
          rating: 4.4,
          casesHandled: 178,
          status: 'pending',
          availability: 'Available',
          profileImage: null
        }
      ];
      setMatches(mockMatches);
      setLoading(false);
    }, 800);
  };

  const handleAccept = async (matchId) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/matches/${matchId}/accept`, { method: 'POST' })
    
    const confirmed = window.confirm('Accept this match? The lawyer/NGO will be notified.');
    if (confirmed) {
      setMatches(matches.map(match => 
        match.id === matchId ? { ...match, status: 'accepted' } : match
      ));
      alert('Match accepted! The legal provider has been notified.');
    }
  };

  const handleReject = async (matchId) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/matches/${matchId}/reject`, { method: 'POST' })
    
    const confirmed = window.confirm('Reject this match? This action cannot be undone.');
    if (confirmed) {
      setMatches(matches.map(match => 
        match.id === matchId ? { ...match, status: 'rejected' } : match
      ));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 75) return '#3b82f6'; // blue
    if (score >= 60) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Low Match';
  };

  const filteredMatches = matches.filter(match => {
    if (filterType === 'all') return true;
    return match.type === filterType.toUpperCase();
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'score') return b.matchScore - a.matchScore;
    if (sortBy === 'location') return a.location.localeCompare(b.location);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  if (loading) {
    return (
      <div className="matches-modal">
        <div className="matches-container">
          <div className="matches-header">
            <h2>Finding Matches...</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Analyzing your case and finding the best matches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-modal">
      <div className="matches-container">
        <div className="matches-header">
          <div>
            <h2>Recommended Matches</h2>
            <p className="matches-subtitle">
              {sortedMatches.length} legal provider{sortedMatches.length !== 1 ? 's' : ''} matched for your case
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Filters and Sort */}
        <div className="matches-controls">
          <div className="filter-group">
            <label>Filter by:</label>
            <div className="filter-buttons">
              <button 
                className={filterType === 'all' ? 'active' : ''}
                onClick={() => setFilterType('all')}
              >
                All ({matches.length})
              </button>
              <button 
                className={filterType === 'lawyer' ? 'active' : ''}
                onClick={() => setFilterType('lawyer')}
              >
                Lawyers ({matches.filter(m => m.type === 'LAWYER').length})
              </button>
              <button 
                className={filterType === 'ngo' ? 'active' : ''}
                onClick={() => setFilterType('ngo')}
              >
                NGOs ({matches.filter(m => m.type === 'NGO').length})
              </button>
            </div>
          </div>

          <div className="sort-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">Match Score</option>
              <option value="name">Name</option>
              <option value="location">Location</option>
            </select>
          </div>
        </div>

        {/* Matches List */}
        <div className="matches-list">
          {sortedMatches.length === 0 ? (
            <div className="no-matches">
              <p>No matches found with the selected filters.</p>
            </div>
          ) : (
            sortedMatches.map(match => (
              <div 
                key={match.id} 
                className={`match-card ${match.status !== 'pending' ? 'match-' + match.status : ''}`}
              >
                {/* Match Score Badge */}
                <div 
                  className="match-score-badge"
                  style={{ backgroundColor: getScoreColor(match.matchScore) }}
                >
                  <div className="score-number">{match.matchScore}%</div>
                  <div className="score-label">{getScoreLabel(match.matchScore)}</div>
                </div>

                {/* Provider Info */}
                <div className="match-content">
                  <div className="match-header-row">
                    <div>
                      <div className="provider-type-badge">
                        {match.type === 'LAWYER' ? '⚖️ Lawyer' : '🏢 NGO'}
                      </div>
                      <h3>{match.name}</h3>
                    </div>
                    <div className="match-status-badge">
                      {match.status === 'accepted' && (
                        <span className="status-accepted">✓ Accepted</span>
                      )}
                      {match.status === 'rejected' && (
                        <span className="status-rejected">✗ Rejected</span>
                      )}
                    </div>
                  </div>

                  {/* Specialization/Focus Area */}
                  <div className="match-info-row">
                    <strong>
                      {match.type === 'LAWYER' ? 'Specialization:' : 'Focus Area:'}
                    </strong>
                    <span>{match.type === 'LAWYER' ? match.specialization : match.focusArea}</span>
                  </div>

                  {/* Location */}
                  <div className="match-info-row">
                    <strong>📍 Location:</strong>
                    <span>{match.location}</span>
                  </div>

                  {/* Languages */}
                  <div className="match-info-row">
                    <strong>🗣️ Languages:</strong>
                    <span>{match.languages}</span>
                  </div>

                  {/* Credentials */}
                  <div className="match-info-row">
                    <strong>
                      {match.type === 'LAWYER' ? '📜 Bar Number:' : '🏛️ Registration:'}
                    </strong>
                    <span>
                      {match.type === 'LAWYER' ? match.barNumber : match.registrationNumber}
                    </span>
                  </div>

                  {/* Experience/Established */}
                  <div className="match-info-row">
                    <strong>
                      {match.type === 'LAWYER' ? '💼 Experience:' : '📅 Established:'}
                    </strong>
                    <span>
                      {match.type === 'LAWYER' ? match.experience : match.established}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="match-stats">
                    <div className="stat-item">
                      <span className="stat-value">⭐ {match.rating}</span>
                      <span className="stat-label">Rating</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{match.casesHandled}</span>
                      <span className="stat-label">Cases Handled</span>
                    </div>
                    <div className="stat-item">
                      <span className={`stat-value ${match.availability === 'Available' ? 'available' : 'limited'}`}>
                        {match.availability === 'Available' ? '✓' : '⏰'}
                      </span>
                      <span className="stat-label">{match.availability}</span>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="match-reasons">
                    <strong>Why matched:</strong>
                    <div className="reason-tags">
                      {match.matchReasons.map((reason, idx) => (
                        <span key={idx} className="reason-tag">{reason}</span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {match.status === 'pending' && (
                    <div className="match-actions">
                      <button 
                        className="btn-accept"
                        onClick={() => handleAccept(match.id)}
                      >
                        ✓ Accept Match
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleReject(match.id)}
                      >
                        ✗ Reject Match
                      </button>
                    </div>
                  )}

                  {match.status === 'accepted' && (
                    <div className="match-accepted-message">
                      <p>✓ You accepted this match. The provider will review and respond soon.</p>
                    </div>
                  )}

                  {match.status === 'rejected' && (
                    <div className="match-rejected-message">
                      <p>✗ You rejected this match.</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="matches-footer">
          <p className="footer-note">
            💡 <strong>Tip:</strong> Accept multiple matches to increase your chances. 
            You'll be notified once a provider accepts your case.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Matches;
