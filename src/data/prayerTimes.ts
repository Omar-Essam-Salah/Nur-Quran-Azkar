// Qibla direction (great-circle bearing from a location to the Kaaba).
//
// NOTE: real prayer times and the Hijri date come from `@/lib/prayer`
// (computePrayerTimes / getHijriDate). An earlier version of this file also
// exported hardcoded sample prayer times and a rough Hijri approximation —
// those were unused and misleading (the Home screen once showed the wrong
// Hijri date through them), so they were removed. Keep only the Qibla math here.

// Kaaba coordinates.
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/** Compass bearing (0–359°, clockwise from true north) toward the Kaaba. */
export const calculateQibla = (latitude: number, longitude: number): number => {
  const latRad = (latitude * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(dLng);
  const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);

  const qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((qibla + 360) % 360);
};
