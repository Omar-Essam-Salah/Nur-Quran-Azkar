import type { PrayerTime } from '@/types';

// Prayer time calculation using simplified algorithm
// In a real app, you'd use a proper prayer time library like adhan-js
export const calculatePrayerTimes = (_date: Date, _latitude?: number, _longitude?: number): PrayerTime[] => {
  // Simplified calculation - for production, use a proper library
  const times = getSimplifiedPrayerTimes();
  return times;
};

// Get prayer times based on location
// This is a simplified version - real implementation would use proper astronomical calculations
const getSimplifiedPrayerTimes = (): PrayerTime[] => {
  // These are sample times - in production, calculate based on location and date
  return [
    { name: 'Fajr', arabicName: 'الفجر', time: '05:23', rakats: 2, type: 'fard' },
    { name: 'Sunrise', arabicName: 'الشروق', time: '06:45', rakats: 0, type: 'sunnah' },
    { name: 'Dhuhr', arabicName: 'الظهر', time: '12:30', rakats: 4, type: 'fard' },
    { name: 'Asr', arabicName: 'العصر', time: '15:45', rakats: 4, type: 'fard' },
    { name: 'Maghrib', arabicName: 'المغرب', time: '18:12', rakats: 3, type: 'fard' },
    { name: 'Isha', arabicName: 'العشاء', time: '19:32', rakats: 4, type: 'fard' },
  ];
};

// Get next prayer
export const getNextPrayer = (times: PrayerTime[]): { prayer: PrayerTime; timeRemaining: string } | null => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const prayer of times) {
    if (prayer.name === 'Sunrise') continue;
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerMinutes = hours * 60 + minutes;
    if (prayerMinutes > currentMinutes) {
      const diff = prayerMinutes - currentMinutes;
      const hoursRemaining = Math.floor(diff / 60);
      const minsRemaining = diff % 60;
      return {
        prayer,
        timeRemaining: `${hoursRemaining}h ${minsRemaining}m`,
      };
    }
  }
  
  // If all prayers have passed, next is Fajr of tomorrow
  return {
    prayer: times[0],
    timeRemaining: 'Tomorrow',
  };
};

// Get current Hijri date (simplified)
export const getHijriDate = (): string => {
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];
  
  // Approximate conversion - in production use a proper Hijri library
  const gregorianDate = new Date();
  // Rough approximation
  const hijriYear = 1447;
  const hijriMonth = hijriMonths[(gregorianDate.getMonth() + 3) % 12];
  const hijriDay = ((gregorianDate.getDate() + 15) % 30) || 1;
  
  return `${hijriDay} ${hijriMonth} ${hijriYear} AH`;
};

// Qibla direction calculation
export const calculateQibla = (latitude: number, longitude: number): number => {
  // Kaaba coordinates
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  
  const latRad = (latitude * Math.PI) / 180;
  const lngRad = (longitude * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const kaabaLngRad = (kaabaLng * Math.PI) / 180;
  
  const y = Math.sin(kaabaLngRad - lngRad);
  const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(kaabaLngRad - lngRad);
  
  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  qibla = (qibla + 360) % 360;
  
  return Math.round(qibla);
};

// Format prayer time for display
export const formatPrayerTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};
