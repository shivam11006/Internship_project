import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './AdminDashboard.css'; // Ensure we can use dashboard styles if needed

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const locationData = [
    { id: 1, name: "New Delhi", position: [28.6139, 77.2090], cases: 1450, lawyers: 320, ngos: 45 },
    { id: 2, name: "Mumbai", position: [19.0760, 72.8777], cases: 1200, lawyers: 450, ngos: 60 },
    { id: 3, name: "Bangalore", position: [12.9716, 77.5946], cases: 980, lawyers: 280, ngos: 35 },
    { id: 4, name: "Chennai", position: [13.0827, 80.2707], cases: 850, lawyers: 210, ngos: 25 },
    { id: 5, name: "Kolkata", position: [22.5726, 88.3639], cases: 780, lawyers: 190, ngos: 30 },
    { id: 6, name: "Hyderabad", position: [17.3850, 78.4867], cases: 720, lawyers: 200, ngos: 28 },
    { id: 7, name: "Pune", position: [18.5204, 73.8567], cases: 650, lawyers: 180, ngos: 20 },
    { id: 8, name: "Ahmedabad", position: [23.0225, 72.5714], cases: 590, lawyers: 150, ngos: 15 },
    { id: 9, name: "Jaipur", position: [26.9124, 75.7873], cases: 480, lawyers: 120, ngos: 18 },
    { id: 10, name: "Lucknow", position: [26.8467, 80.9462], cases: 420, lawyers: 110, ngos: 12 },
];

const MapVisualization = () => {
    const [filter, setFilter] = useState('cases'); // cases, lawyers, ngos

    const getMetricLabel = () => {
        switch (filter) {
            case 'cases': return 'Active Cases';
            case 'lawyers': return 'Available Lawyers';
            case 'ngos': return 'Active NGOs';
            default: return '';
        }
    };

    const getMetricValue = (city) => {
        return city[filter];
    };

    return (
        <div className="map-visualization-section">
            <div className="map-header">
                <div>
                    <h2 className="section-title-new">Location Analytics</h2>
                    <p className="section-subtitle">Geographical distribution of platform activity</p>
                </div>
                <div className="map-filters">
                    <button
                        className={`map-filter-btn ${filter === 'cases' ? 'active' : ''}`}
                        onClick={() => setFilter('cases')}
                    >
                        Cases
                    </button>
                    <button
                        className={`map-filter-btn ${filter === 'lawyers' ? 'active' : ''}`}
                        onClick={() => setFilter('lawyers')}
                    >
                        Lawyers
                    </button>
                    <button
                        className={`map-filter-btn ${filter === 'ngos' ? 'active' : ''}`}
                        onClick={() => setFilter('ngos')}
                    >
                        NGOs
                    </button>
                </div>
            </div>

            <div className="map-container-wrapper">
                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    scrollWheelZoom={true}
                    style={{ height: '500px', width: '100%', borderRadius: '12px' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {locationData.map((city) => (
                        <Marker key={city.id} position={city.position}>
                            <Popup className="custom-popup">
                                <div className="popup-content">
                                    <h3>{city.name}</h3>
                                    <div className="popup-stat">
                                        <span className="popup-label">{getMetricLabel()}:</span>
                                        <span className="popup-value">{getMetricValue(city)}</span>
                                    </div>
                                    <div className="popup-mini-stats">
                                        <small>Cases: {city.cases}</small>
                                        <small>Lawyers: {city.lawyers}</small>
                                        <small>NGOs: {city.ngos}</small>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MapVisualization;
