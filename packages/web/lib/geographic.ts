// Geographic utility functions for location-based features

interface Location {
  latitude: number;
  longitude: number;
}

interface GeocodeResult {
  city?: string;
  territory?: string;
  country?: string;
  state?: string;
}

// Simple reverse geocoding function (in production, you'd use Google Maps or similar API)
export async function reverseGeocode(location: Location): Promise<GeocodeResult> {
  try {
    // This is a placeholder implementation
    // In production, you would use a real geocoding service like Google Maps
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    return {
      city: data.city || data.locality,
      territory: data.principalSubdivision || data.countryName,
      country: data.countryName,
      state: data.principalSubdivision,
    };
  } catch (error) {
    // Silently handle geocoding errors - return null values
    return {
      city: undefined,
      territory: undefined,
      country: undefined,
      state: undefined,
    };
  }
}

// Get user's current location using browser geolocation API
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Territory definitions for leaderboards
export const TERRITORIES = {
  'North America': {
    countries: ['United States', 'Canada', 'Mexico'],
    regions: ['US', 'CA', 'MX'],
  },
  'Europe': {
    countries: ['United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland'],
    regions: ['GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'],
  },
  'Asia Pacific': {
    countries: ['Japan', 'Australia', 'New Zealand', 'Singapore', 'South Korea', 'Hong Kong'],
    regions: ['JP', 'AU', 'NZ', 'SG', 'KR', 'HK'],
  },
  'South America': {
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela'],
    regions: ['BR', 'AR', 'CL', 'CO', 'PE', 'VE'],
  },
  'Middle East & Africa': {
    countries: ['South Africa', 'United Arab Emirates', 'Saudi Arabia', 'Egypt', 'Israel'],
    regions: ['ZA', 'AE', 'SA', 'EG', 'IL'],
  },
};

// Determine territory from country
export function getTerritoryFromCountry(country: string): string | null {
  for (const [territory, config] of Object.entries(TERRITORIES)) {
    if (config.countries.includes(country)) {
      return territory;
    }
  }
  return null;
}

// Popular cities for quick selection
export const POPULAR_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'London', 'Paris', 'Berlin', 'Madrid', 'Rome',
  'Tokyo', 'Sydney', 'Melbourne', 'Singapore', 'Hong Kong',
  'São Paulo', 'Buenos Aires', 'Santiago', 'Bogotá',
  'Dubai', 'Cape Town', 'Tel Aviv',
];

// Validate coordinates
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Format coordinates for display
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
} 