import React, { useState, useEffect } from 'react';
import './Directory.css';
import { apiClient } from './services/authService';

const PRACTICE_AREAS = [
  'Family Law', 'Property Disputes', 'Human Rights', 'Environmental Law',
  'Corporate Law', 'Litigation', 'Criminal Defense', 'Victim Support',
  'Intellectual Property'
];

const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati'
];

const Directory = () => {
  const [role, setRole] = useState('Lawyer'); // 'Lawyer' or 'NGO'
  const [selectedPracticeAreas, setSelectedPracticeAreas] = useState([]);
  const [availability, setAvailability] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(100);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [sortBy, setSortBy] = useState('Relevance');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(50);
  const [viewMode, setViewMode] = useState('List'); // 'List' or 'Map'
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [role, selectedPracticeAreas, verifiedOnly, sortBy, location, searchKeyword]);

  useEffect(() => {
    fetchProfiles();
  }, [role, selectedPracticeAreas, verifiedOnly, sortBy, currentPage, location, searchKeyword]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'Lawyer' ? '/directory/lawyers/search' : '/directory/ngos/search';

      const requestBody = {
        expertise: selectedPracticeAreas.length > 0 ? selectedPracticeAreas.join(',') : '',
        keyword: searchKeyword,
        location: location,
        verified: verifiedOnly,
        page: currentPage - 1,
        size: 8,
        sortBy: sortBy.toLowerCase(),
        sortOrder: 'asc'
      };

      const response = await apiClient.post(endpoint, requestBody);
      const data = response.data;
      setProfiles(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePracticeArea = (area) => {
    setSelectedPracticeAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderProfileCard = (profile) => {
    const isLawyer = role === 'Lawyer';
    const name = profile.username;
    const email = profile.email;
    const specialization = isLawyer ? profile.specialization : profile.focusArea;
    const detail1 = isLawyer ? profile.barNumber : profile.organizationName;
    const detail2 = isLawyer ? null : profile.registrationNumber;

    return (
      <div key={profile.userId} className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{getInitials(name)}</div>
          <div className="profile-info">
            <div className="profile-name">{name}</div>
            <div className="profile-role">{role}</div>
          </div>
          {profile.verified && (
            <div className="verified-badge">
              ✓ Verified
            </div>
          )}
        </div>
        <div className="profile-details">
          {specialization && (
            <div className="detail-row">
              <span className="detail-icon">⚖️</span>
              <span className="detail-text">{specialization}</span>
            </div>
          )}
          {detail1 && (
            <div className="detail-row">
              <span className="detail-icon">📋</span>
              <span className="detail-text">{detail1}</span>
            </div>
          )}
          {detail2 && (
            <div className="detail-row">
              <span className="detail-icon">🆔</span>
              <span className="detail-text">{detail2}</span>
            </div>
          )}
          {profile.location && (
            <div className="detail-row">
              <span className="detail-icon">📍</span>
              <span className="detail-text">{profile.location}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-icon">📧</span>
            <span className="detail-text">{email}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="directory-container">
      {/* Sidebar Filters */}
      <aside className="directory-sidebar">
        <div className="sidebar-section">
          <h3>Filters</h3>
        </div>

        {/* Role Selection */}
        <div className="sidebar-section">
          <h3>Role</h3>
          <div className="role-toggle">
            <button
              className={`role-btn ${role === 'Lawyer' ? 'active' : ''}`}
              onClick={() => setRole('Lawyer')}
            >
              Lawyer
            </button>
            <button
              className={`role-btn ${role === 'NGO' ? 'active' : ''}`}
              onClick={() => setRole('NGO')}
            >
              NGO
            </button>
          </div>
        </div>

        {/* Practice Areas */}
        <div className="sidebar-section">
          <h3>Practice Areas</h3>
          <div className="practice-areas">
            {PRACTICE_AREAS.map(area => (
              <button
                key={area}
                className={`practice-tag ${selectedPracticeAreas.includes(area) ? 'active' : ''}`}
                onClick={() => togglePracticeArea(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="sidebar-section">
          <h3>Availability</h3>
          <select
            className="filter-dropdown"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="">Select availability</option>
            <option value="immediate">Immediate</option>
            <option value="within-week">Within a week</option>
            <option value="within-month">Within a month</option>
          </select>
        </div>

        {/* Verified Status */}
        <div className="sidebar-section">
          <h3>Verified Status</h3>
          <div className="verified-toggle">
            <span>Only verified</span>
            <div
              className={`toggle-switch ${verifiedOnly ? 'active' : ''}`}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
            >
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>

        {/* Max Distance */}
        <div className="sidebar-section">
          <h3>Max Distance: {maxDistance} km</h3>
          <div className="distance-slider">
            <input
              type="range"
              min="0"
              max="200"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="slider"
            />
          </div>
        </div>

        {/* Languages */}
        <div className="sidebar-section">
          <h3>Languages</h3>
          <div className="languages-grid">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                className={`language-tag ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="sidebar-section">
          <h3>Sort By</h3>
          <select
            className="filter-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="Relevance">Relevance</option>
            <option value="Username">Name</option>
            <option value="Specialization">Specialization</option>
          </select>
        </div>
      </aside>

      {/* Main Content */}
      <main className="directory-main">
        {/* Header with Search and Filters */}
        <div className="directory-header">
          <div className="search-filters">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="location-input-wrapper">
              <input
                type="text"
                placeholder="Location"
                className="location-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="radius-control">
              <span className="radius-label">Radius: {radius} km</span>
              <input
                type="range"
                min="0"
                max="100"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="slider radius-slider"
              />
            </div>
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'List' ? 'active' : ''}`}
              onClick={() => setViewMode('List')}
            >
              List
            </button>
            <button
              className={`view-btn ${viewMode === 'Map' ? 'active' : ''}`}
              onClick={() => setViewMode('Map')}
            >
              Map
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          <h2 className="results-header">
            Matching Profiles <span className="results-count">({totalElements})</span>
          </h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No profiles found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="profiles-grid">
                {profiles.map(profile => renderProfileCard(profile))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`pagination-btn page-number ${currentPage === index + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Directory;
