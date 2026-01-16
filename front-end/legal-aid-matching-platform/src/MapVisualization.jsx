import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './AdminDashboard.css';
import analyticsService from './services/analyticsService';
import { getLocationCoordinates } from './services/locationCoordinates';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fallback mock data for location analytics
const MOCK_LOCATION_DATA = {
    cases: {
        "New Delhi": 1450, "Mumbai": 1200, "Bangalore": 980, "Chennai": 850,
        "Kolkata": 780, "Hyderabad": 720, "Pune": 650, "Ahmedabad": 590,
        "Jaipur": 480, "Lucknow": 420
    },
    lawyers: {
        "New Delhi": 85, "Mumbai": 120, "Bangalore": 95, "Chennai": 65,
        "Kolkata": 55, "Hyderabad": 72, "Pune": 48, "Ahmedabad": 40,
        "Jaipur": 35, "Lucknow": 28
    },
    ngo: {
        "New Delhi": 45, "Mumbai": 60, "Bangalore": 35, "Chennai": 25,
        "Kolkata": 30, "Hyderabad": 28, "Pune": 20, "Ahmedabad": 15,
        "Jaipur": 18, "Lucknow": 12
    }
};

const MapVisualization = () => {
    const [filter, setFilter] = useState('cases'); // cases, lawyers, ngo
    const [locationData, setLocationData] = useState({});
    const [loading, setLoading] = useState(true);
    const [realDataLoaded, setRealDataLoaded] = useState(false);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default: center of India

    useEffect(() => {
        fetchLocationData();
    }, []);

    const fetchLocationData = async () => {
        setLoading(true);
        try {
            const result = await analyticsService.getLocationAnalytics();

            if (result.success && result.data) {
                // Set location data with role-distributed users
                const combinedData = {
                    cases: result.data.cases || {},
                    lawyers: result.data.lawyers || {},   // Lawyers from role distribution
                    ngo: result.data.ngos || {}           // NGOs from role distribution
                };

                setLocationData(combinedData);
                setRealDataLoaded(true);

                // Set map center to the first top location if available
                if (result.data.topLocations && result.data.topLocations.length > 0) {
                    const centerCoords = getLocationCoordinates(result.data.topLocations[0]);
                    setMapCenter(centerCoords);
                }
            } else {
                console.warn('Failed to fetch location analytics, using mock data');
                setLocationData({
                    cases: MOCK_LOCATION_DATA.cases,
                    lawyers: MOCK_LOCATION_DATA.lawyers,
                    ngo: MOCK_LOCATION_DATA.ngo
                });
            }
        } catch (error) {
            console.error('Error fetching location analytics:', error);
            setLocationData({
                cases: MOCK_LOCATION_DATA.cases,
                lawyers: MOCK_LOCATION_DATA.lawyers,
                ngo: MOCK_LOCATION_DATA.ngo
            });
        }
        setLoading(false);
    };

    const getMetricLabel = () => {
        switch (filter) {
            case 'cases': return 'Cases';
            case 'lawyers': return 'Lawyers';
            case 'ngo': return 'NGOs';
            default: return '';
        }
    };

    const getMetricColor = () => {
        switch (filter) {
            case 'cases': return '#ec4899'; // Pink
            case 'lawyers': return '#f59e0b'; // Amber
            case 'ngo': return '#10b981'; // Green
            default: return '#6b7280';
        }
    };

    const getCurrentMetricData = () => {
        if (!locationData[filter]) {
            return {};
        }
        return locationData[filter];
    };

    const getMarkers = () => {
        const currentData = getCurrentMetricData();
        
        return Object.entries(currentData).map(([locationName, value], idx) => {
            const position = getLocationCoordinates(locationName);
            
            return (
                <Marker key={`${locationName}-${idx}`} position={position}>
                    <Popup className="custom-popup">
                        <div className="popup-content">
                            <h3>{locationName}</h3>
                            <div className="popup-stat">
                                <span className="popup-label">{getMetricLabel()}:</span>
                                <span className="popup-value" style={{ color: getMetricColor() }}>
                                    {value}
                                </span>
                            </div>
                            {locationData.cases && locationData.cases[locationName] && (
                                <div className="popup-mini-stats">
                                    <small>Cases: {locationData.cases[locationName]}</small>
                                </div>
                            )}
                            {locationData.users && locationData.users[locationName] && (
                                <div className="popup-mini-stats">
                                    <small>Users: {locationData.users[locationName]}</small>
                                </div>
                            )}
                            {locationData.matches && locationData.matches[locationName] && (
                                <div className="popup-mini-stats">
                                    <small>Matches: {locationData.matches[locationName]}</small>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        });
    };

    return (
        <div className="map-visualization-section">
            <div className="map-header">
                <div>
                    <h2 className="section-title-new">Location Analytics</h2>
                    <p className="section-subtitle">
                        Geographical distribution of platform activity
                        {realDataLoaded && <span style={{ marginLeft: '8px', color: '#059669' }}>📍 Live Data</span>}
                    </p>
                </div>
                <div className="map-filters">
                    <button
                        className={`map-filter-btn ${filter === 'cases' ? 'active' : ''}`}
                        onClick={() => setFilter('cases')}
                        title="View case distribution by location"
                    >
                        Cases
                    </button>
                    <button
                        className={`map-filter-btn ${filter === 'lawyers' ? 'active' : ''}`}
                        onClick={() => setFilter('lawyers')}
                        title="View lawyer distribution by location"
                    >
                        Lawyers
                    </button>
                    <button
                        className={`map-filter-btn ${filter === 'ngo' ? 'active' : ''}`}
                        onClick={() => setFilter('ngo')}
                        title="View NGO distribution by location"
                    >
                        NGO
                    </button>
                </div>
            </div>

            <div className="map-container-wrapper">
                {loading ? (
                    <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                        <span>Loading location data...</span>
                    </div>
                ) : (
                    <MapContainer
                        center={mapCenter}
                        zoom={5}
                        scrollWheelZoom={true}
                        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {getMarkers()}
                    </MapContainer>
                )}
            </div>

            {/* Location Statistics Summary */}
            <div className="location-stats-summary" style={{ marginTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {Object.entries(getCurrentMetricData()).slice(0, 5).map(([location, value]) => (
                        <div key={location} style={{
                            padding: '12px 16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                {location}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: getMetricColor() }}>
                                {value}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                {getMetricLabel()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapVisualization;
