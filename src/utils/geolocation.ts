export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Captures actual browser geolocation associated with a verification attempt.
 * Does not use mock or hardcoded coordinates.
 * Returns an informative error if permission is denied or coordinates are unavailable.
 */
export async function getBrowserGeolocation(): Promise<GeolocationCoordinates> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Location access is required for face verification.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission is required for face verification. Please enable location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable. Please ensure GPS or device location services are enabled.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
          default:
            msg = error.message || 'Location error occurred.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}
