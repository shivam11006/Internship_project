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
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [practiceAreaSearch, setPracticeAreaSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [sortBy, setSortBy] = useState('Relevance');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [viewMode, setViewMode] = useState('List'); // 'List' or 'Map'
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProfiles({ page: 0 });
  }, [role]);

  const fetchProfiles = async (overrideParams = {}) => {
    setLoading(true);
    try {
      const endpoint = role === 'Lawyer' ? '/directory/lawyers/search' : '/directory/ngos/search';

      // Use practiceAreaSearch text if no areas are explicitly selected
      const expertiseValue = overrideParams.expertise !== undefined
        ? overrideParams.expertise
        : (selectedPracticeAreas.length > 0
          ? selectedPracticeAreas.join(',')
          : (practiceAreaSearch.trim() || ''));

      const languagesValue = overrideParams.languages !== undefined
        ? overrideParams.languages
        : (selectedLanguages.length > 0
          ? selectedLanguages.join(',')
          : '');

      const requestBody = {
        expertise: expertiseValue,
        keyword: overrideParams.keyword !== undefined ? overrideParams.keyword : searchKeyword,
        location: overrideParams.location !== undefined ? overrideParams.location : location,
        languages: languagesValue,
        verified: overrideParams.verified !== undefined ? overrideParams.verified : verifiedOnly,
        page: overrideParams.page !== undefined ? overrideParams.page : (currentPage - 1),
        size: 8,
        sortBy: overrideParams.sortBy !== undefined ? overrideParams.sortBy : sortBy.toLowerCase(),
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
          {isLawyer ? (
            <>
              <div className="detail-row">
                <span className="detail-label">PRACTICE AREA:</span>
                <span className="detail-text">{profile.specialization || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">BAR NUMBER:</span>
                <span className="detail-text">{profile.barNumber || 'N/A'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="detail-row">
                <span className="detail-label">ORGANIZATION NAME:</span>
                <span className="detail-text">{profile.organizationName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">REGISTRATION NUMBER:</span>
                <span className="detail-text">{profile.registrationNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">FOCUS AREA:</span>
                <span className="detail-text">{profile.focusArea || 'N/A'}</span>
              </div>
            </>
          )}
          <div className="detail-row">
            <span className="detail-label">EMAIL:</span>
            <span className="detail-text">{email || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">LOCATION:</span>
            <span className="detail-text">{profile.location || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">ADDRESS:</span>
            <span className="detail-text" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{profile.address || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">LANGUAGES:</span>
            <span className="detail-text">{profile.languages || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="directory-container">
      {/* Mobile Filter Toggle */}
      <button
        className="mobile-filter-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Sidebar Filters */}
      <aside className={`directory-sidebar ${showMobileFilters ? 'mobile-show' : ''}`}>
        <div className="sidebar-header-mobile">
          <h3>Filters</h3>
          <button className="close-filters-btn" onClick={() => setShowMobileFilters(false)}>×</button>
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
          <input
            type="text"
            placeholder="Type to search practice areas..."
            value={practiceAreaSearch}
            onChange={(e) => setPracticeAreaSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                fetchProfiles();
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              marginBottom: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <div className="practice-areas">
            {practiceAreaSearch === '' ? (
              PRACTICE_AREAS.map(area => (
                <button
                  key={area}
                  className={`practice-tag ${selectedPracticeAreas.includes(area) ? 'active' : ''}`}
                  onClick={() => togglePracticeArea(area)}
                >
                  {area}
                </button>
              ))
            ) : (
              PRACTICE_AREAS.filter(area =>
                area.toLowerCase().includes(practiceAreaSearch.toLowerCase())
              ).length > 0 ? (
                PRACTICE_AREAS.filter(area =>
                  area.toLowerCase().includes(practiceAreaSearch.toLowerCase())
                ).map(area => (
                  <button
                    key={area}
                    className={`practice-tag ${selectedPracticeAreas.includes(area) ? 'active' : ''}`}
                    onClick={() => togglePracticeArea(area)}
                  >
                    {area}
                  </button>
                ))
              ) : (
                <p style={{ color: '#6b7280', fontSize: '14px', padding: '8px 0' }}>No matching practice areas</p>
              )
            )}
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

        {/* Languages */}
        <div className="sidebar-section">
          <h3>Languages</h3>
          <input
            type="text"
            placeholder="Type to search languages..."
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                fetchProfiles();
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              marginBottom: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <div className="languages-grid">
            {languageSearch === '' ? (
              LANGUAGES.map(lang => (
                <button
                  key={lang}
                  className={`language-tag ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                  onClick={() => toggleLanguage(lang)}
                >
                  {lang}
                </button>
              ))
            ) : (
              LANGUAGES.filter(lang =>
                lang.toLowerCase().includes(languageSearch.toLowerCase())
              ).length > 0 ? (
                LANGUAGES.filter(lang =>
                  lang.toLowerCase().includes(languageSearch.toLowerCase())
                ).map(lang => (
                  <button
                    key={lang}
                    className={`language-tag ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </button>
                ))
              ) : (
                <p style={{ color: '#6b7280', fontSize: '14px', padding: '8px 0' }}>No matching languages</p>
              )
            )}
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

        {/* Action Buttons */}
        <div className="sidebar-section" style={{ marginTop: '20px' }}>
          <button
            className="show-results-btn"
            onClick={() => {
              setCurrentPage(1);
              fetchProfiles();
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Show Results
          </button>
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSelectedPracticeAreas([]);
              setAvailability('');
              setVerifiedOnly(false);
              setSelectedLanguages([]);
              setPracticeAreaSearch('');
              setLanguageSearch('');
              setSortBy('Relevance');
              setSearchKeyword('');
              setLocation('');
              setCurrentPage(1);
              // Immediately fetch with cleared values
              fetchProfiles({
                expertise: '',
                keyword: '',
                location: '',
                languages: '',
                verified: false,
                page: 0,
                sortBy: 'relevance'
              });
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear All Filters
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="directory-main">
        {/* Header with Search and Filters */}
        <div className="directory-header">
          <div className="search-filters" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                  fetchProfiles();
                }
              }}
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '12px 16px',
                border: '2px solid #4F46E5',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Location"
              className="location-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                  fetchProfiles();
                }
              }}
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '12px 16px',
                border: '2px solid #4F46E5',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              className="go-btn"
              onClick={() => {
                setCurrentPage(1);
                fetchProfiles();
              }}
              style={{
                padding: '12px 32px',
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                height: '46px'
              }}
            >
              Go
            </button>
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
