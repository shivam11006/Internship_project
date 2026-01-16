// Location coordinate mappings for major cities across different regions
// These coordinates are used to place markers on the map

const LOCATION_COORDINATES = {
  // India (if backend serves Indian cities)
  'New Delhi': [28.6139, 77.2090],
  'Mumbai': [19.0760, 72.8777],
  'Bangalore': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Hyderabad': [17.3850, 78.4867],
  'Pune': [18.5204, 73.8567],
  'Ahmedabad': [23.0225, 72.5714],
  'Jaipur': [26.9124, 75.7873],
  'Lucknow': [26.8467, 80.9462],
  'Chandigarh': [30.7333, 76.7833],
  'Bhopal': [23.1815, 79.9864],
  'Patna': [25.5941, 85.1376],
  'Indore': [22.7196, 75.8577],
  'Vadodara': [22.3072, 73.1812],
  'Surat': [21.1695, 72.8295],
  'Nagpur': [21.1458, 79.0882],
  'Guwahati': [26.1445, 91.7362],

  // US Cities (if backend serves US cities)
  'New York': [40.7128, -74.0060],
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'Houston': [29.7604, -95.3698],
  'Phoenix': [33.4484, -112.0742],
  'Philadelphia': [39.9526, -75.1652],
  'San Antonio': [29.4241, -98.4936],
  'San Diego': [32.7157, -117.1611],
  'Dallas': [32.7767, -96.7970],
  'San Jose': [37.3382, -121.8863],
  'Austin': [30.2672, -97.7431],
  'Jacksonville': [30.3322, -81.6557],
  'Fort Worth': [32.7555, -97.3308],
  'Columbus': [39.9612, -82.9988],
  'Boston': [42.3601, -71.0589],
  'Memphis': [35.1495, -90.0490],
  'Baltimore': [39.2904, -76.6122],
  'Louisville': [38.2527, -85.7585],
  'Portland': [45.5152, -122.6784],
  'Las Vegas': [36.1699, -115.1398],
  'Detroit': [42.3314, -83.0458],
  'Miami': [25.7617, -80.1918],
  'Atlanta': [33.7490, -84.3880],
  'Seattle': [47.6062, -122.3321],
  'Denver': [39.7392, -104.9903],

  // UK Cities
  'London': [51.5074, -0.1278],
  'Manchester': [53.4808, -2.2426],
  'Birmingham': [52.5086, -1.8756],
  'Leeds': [53.8008, -1.5491],
  'Glasgow': [55.8642, -4.2518],

  // Generic fallback for unknown locations
  'Default': [20.5937, 78.9629] // Center of India
};

/**
 * Get coordinates for a location by name
 * @param {string} locationName - Name of the location
 * @returns {Array} [latitude, longitude] or default coordinates if not found
 */
export const getLocationCoordinates = (locationName) => {
  if (!locationName) return LOCATION_COORDINATES['Default'];
  
  // Try exact match first
  if (LOCATION_COORDINATES[locationName]) {
    return LOCATION_COORDINATES[locationName];
  }

  // Try case-insensitive match
  const key = Object.keys(LOCATION_COORDINATES).find(
    k => k.toLowerCase() === locationName.toLowerCase()
  );
  
  return key ? LOCATION_COORDINATES[key] : LOCATION_COORDINATES['Default'];
};

/**
 * Get all available locations with their coordinates
 * @returns {Object} Object with location names as keys and coordinates as values
 */
export const getAllLocationCoordinates = () => {
  return { ...LOCATION_COORDINATES };
};

/**
 * Add new location coordinates (useful for extending the mapping)
 * @param {string} locationName - Name of the location
 * @param {Array} coordinates - [latitude, longitude]
 */
export const addLocationCoordinate = (locationName, coordinates) => {
  if (locationName && Array.isArray(coordinates) && coordinates.length === 2) {
    LOCATION_COORDINATES[locationName] = coordinates;
  }
};

export default { getLocationCoordinates, getAllLocationCoordinates, addLocationCoordinate };
