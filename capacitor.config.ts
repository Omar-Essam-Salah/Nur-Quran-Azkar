import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nur.quranazkar',
  appName: 'Nur — Quran & Azkar',
  webDir: 'dist',
  backgroundColor: '#081d23',
  android: {
    backgroundColor: '#081d23',
    // The app is fully offline; allow it to run without a cleartext server.
    allowMixedContent: false,
  },
};

export default config;
