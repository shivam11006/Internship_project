import React, { useState, useEffect } from 'react';
import './Matches.css';
import * as matchService from './services/matchService';

function Matches({ caseId, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('score');

  useEffect(() => {
    fetchMatches();
  }, [caseId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await matchService.getMatchResults(caseId);
      
      // Backend returns { results: [...], totalMatches: N } with MatchResultDTO
      let matchesData = [];
      if (response.results && Array.isArray(response.results)) {
        matchesData = response.results;
      } else if (Array.isArray(response)) {
        matchesData = response;
      }
      
      setMatches(matchesData);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load matches. Please check your connection.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId) => {
    const confirmed = window.confirm('Accept this match? The lawyer/NGO will be notified.');
    if (confirmed) {
      try {
        await matchService.selectMatch(matchId);
        // Remove the accepted match from the list
        setMatches(matches.filter(match => match.matchId !== matchId));
        alert('Match accepted! The legal provider has been notified.');
      } catch (err) {
        console.error('Error accepting match:', err);
        alert('Failed to accept match. Please try again.');
      }
    }
  };

  const handleReject = async (matchId) => {
    const confirmed = window.confirm('Reject this match? This action cannot be undone.');
    if (confirmed) {
      try {
        await matchService.rejectMatch(matchId);
        // Remove the rejected match from the list
        setMatches(matches.filter(match => match.matchId !== matchId));
      } catch (err) {
        console.error('Error rejecting match:', err);
        alert('Failed to reject match. Please try again.');
      }
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Low Match';
  };

  const filteredMatches = matches.filter(match => {
    if (filterType === 'all') return true;
    return match.providerType === filterType.toUpperCase();
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
    if (sortBy === 'location') return (a.city || '').localeCompare(b.city || '');
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
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

  if (error) {
    return (
      <div className="matches-modal">
        <div className="matches-container">
          <div className="matches-header">
            <h2>Error Loading Matches</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
            <button 
              onClick={fetchMatches}
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
        {matches.length > 0 && (
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
                  Lawyers ({matches.filter(m => m.providerType === 'LAWYER').length})
                </button>
                <button 
                  className={filterType === 'ngo' ? 'active' : ''}
                  onClick={() => setFilterType('ngo')}
                >
                  NGOs ({matches.filter(m => m.providerType === 'NGO').length})
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
        )}

        {/* Matches List */}
        <div className="matches-list">
          {sortedMatches.length === 0 ? (
            <div className="no-matches">
              <p>No matches found {matches.length === 0 ? 'for your case' : 'with the selected filters'}.</p>
            </div>
          ) : (
            sortedMatches.map(match => (
              <div 
                key={match.matchId} 
                className={`match-card`}
              >
                {/* Match Score Badge */}
                <div 
                  className="match-score-badge"
                  style={{ backgroundColor: getScoreColor(match.score || 0) }}
                >
                  <div className="score-number">{Math.round(match.score || 0)}%</div>
                  <div className="score-label">{getScoreLabel(match.score || 0)}</div>
                </div>

                {/* Provider Info */}
                <div className="match-content">
                  <div className="match-header-row">
                    <div>
                      <div className="provider-type-badge">
                        {match.providerType === 'LAWYER' ? '⚖️ Lawyer' : '🏢 NGO'}
                      </div>
                      <h3>{match.name}</h3>
                    </div>
                  </div>

                  {/* Expertise/Specialization */}
                  {match.expertise && (
                    <div className="match-info-row">
                      <strong>📚 Expertise:</strong>
                      <span>{match.expertise}</span>
                    </div>
                  )}

                  {/* Location */}
                  {match.city && (
                    <div className="match-info-row">
                      <strong>📍 Location:</strong>
                      <span>{match.city}</span>
                    </div>
                  )}

                  {/* Verification Status */}
                  {match.verified !== undefined && (
                    <div className="match-info-row">
                      <strong>✓ Verified:</strong>
                      <span>{match.verified ? 'Yes' : 'No'}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="match-actions">
                    <button 
                      className="btn-accept"
                      onClick={() => handleAccept(match.matchId)}
                    >
                      ✓ Accept Match
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleReject(match.matchId)}
                    >
                      ✗ Reject Match
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {matches.length > 0 && (
          <div className="matches-footer">
            <p className="footer-note">
              💡 <strong>Tip:</strong> Accept multiple matches to increase your chances. 
              You'll be notified once a provider accepts your case.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Matches;
