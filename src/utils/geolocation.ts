import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Captures actual geolocation associated with a verification attempt.
 * When running natively on Android/iOS via Capacitor, requests native permissions
 * and acquires device coordinates via @capacitor/geolocation (supporting both precise and coarse).
 * In web browsers, uses navigator.geolocation.
 * Does not use mock or hardcoded coordinates.
 * Returns an informative error if permission is denied or coordinates are unavailable.
 */
export async function getBrowserGeolocation(): Promise<GeolocationCoordinates> {
  if (Capacitor.isNativePlatform()) {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted' && permissionStatus.coarseLocation !== 'granted') {
        const req = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
        if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
          throw new Error('Location permission is required for face verification. Please enable location access in app settings and try again.');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (err: any) {
      console.error('[geolocation] Native Capacitor location error:', err);
      if (err?.message && err.message.toLowerCase().includes('permission')) {
        throw new Error('Location permission is required for face verification. Please grant location access and try again.');
      }
      if (typeof window !== 'undefined' && navigator.geolocation) {
        return getWebGeolocation();
      }
      throw new Error(err?.message || 'Location information is currently unavailable. Please ensure GPS is enabled.');
    }
  }

  return getWebGeolocation();
}

function getWebGeolocation(): Promise<GeolocationCoordinates> {
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
