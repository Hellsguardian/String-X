import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Platform and environment detection for String X.
 *
 * Accurately distinguishes:
 * 1. Mobile browser (iPhone Safari, iPhone Chrome, Android Chrome, Android mobile browsers)
 * 2. Capacitor / native Android app
 * 3. Desktop browser
 * 4. Tablet
 */

export const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function') {
      return Capacitor.isNativePlatform();
    }
  } catch {
    // fallback
  }
  const cap = (window as any).Capacitor;
  if (cap) {
    if (typeof cap.isNativePlatform === 'function') {
      return cap.isNativePlatform();
    }
    if (typeof cap.getPlatform === 'function') {
      const p = cap.getPlatform();
      return p === 'android' || p === 'ios';
    }
    if (cap.platform && cap.platform !== 'web') {
      return true;
    }
    return true;
  }
  if ((window as any)._isNativeAndroid || (window as any).Android) {
    return true;
  }
  return false;
};

export type DeviceEnvironment = 'mobile-browser' | 'native-android' | 'desktop' | 'tablet';

export const getDeviceEnvironment = (): DeviceEnvironment => {
  if (typeof window === 'undefined') return 'desktop';

  // 1. Native Capacitor / Android application
  if (isCapacitorNative()) {
    return 'native-android';
  }

  // 2. Desktop and Tablet vs Mobile Browser
  const width = window.innerWidth;
  if (width >= 1024) {
    return 'desktop';
  }
  if (width >= 640) {
    return 'tablet';
  }

  // 3. Mobile browser (iPhone Safari, iPhone Chrome, Android Chrome, etc.)
  return 'mobile-browser';
};

export const useDeviceEnvironment = (): DeviceEnvironment => {
  const [env, setEnv] = useState<DeviceEnvironment>(getDeviceEnvironment);

  useEffect(() => {
    const handleResize = () => {
      setEnv(getDeviceEnvironment());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return env;
};
