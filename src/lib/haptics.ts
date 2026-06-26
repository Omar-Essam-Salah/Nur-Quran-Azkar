// Subtle native haptics for that "pampered" iOS-style feel. Fire-and-forget and
// fully safe: no-op on web / where the device has no vibrator. Import `haptic`
// and call haptic.light() etc. on meaningful taps (counters, page turns, toggles).
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const safe = (fn: () => Promise<unknown>) => {
  try { void fn().catch(() => {}); } catch { /* not native / unsupported */ }
};

export const haptic = {
  light: () => safe(() => Haptics.impact({ style: ImpactStyle.Light })),
  medium: () => safe(() => Haptics.impact({ style: ImpactStyle.Medium })),
  heavy: () => safe(() => Haptics.impact({ style: ImpactStyle.Heavy })),
  /** A crisp little tick — great for counters & selection changes. */
  tick: () => safe(() => Haptics.selectionChanged()),
  success: () => safe(() => Haptics.notification({ type: NotificationType.Success })),
  warning: () => safe(() => Haptics.notification({ type: NotificationType.Warning })),
};
