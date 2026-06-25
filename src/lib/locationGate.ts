import { registerPlugin, Capacitor } from '@capacitor/core';

// Bridge to the native LocationGate plugin (see android/.../LocationGatePlugin.java).
// Granting the location PERMISSION is not the same as the device's location
// SERVICE (GPS) being switched on. This lets us detect that and send the user
// straight to the right toggle.
interface LocationGatePlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openSettings(): Promise<void>;
}

const LocationGate = registerPlugin<LocationGatePlugin>('LocationGate');

/** Is the device's location service (GPS/network) actually switched on? */
export async function isLocationEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true; // web: the browser prompt handles it
  try {
    const { enabled } = await LocationGate.isEnabled();
    return enabled;
  } catch {
    return true; // plugin missing → don't block; geolocation will still try
  }
}

/** Open the system Location (GPS) settings page so the user can switch it on. */
export async function openLocationSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try { await LocationGate.openSettings(); } catch { /* ignore */ }
}

/** True when running inside the installed app (vs a web browser). */
export const isNative = (): boolean => Capacitor.isNativePlatform();
