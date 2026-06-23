# Nur — Quran & Azkar · Deployment Guide

The app is **offline-first** (full Quran text, prayer times, fonts, azkar, tasbih,
fasting calendar, prophet stories and hadith are bundled/local; recitation audio,
mushaf images, tafsir and extra translations stream once then cache for offline).

It can ship two ways:

---

## A) Web / PWA (installable, works offline) — fastest

```bash
npm install
npm run build      # outputs ./dist  (or double-click build-and-preview.bat)
npm run preview    # local test of the production PWA
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages,
Cloudflare Pages). On a phone, open the URL → browser menu → **Add to Home
Screen**. It then runs full-screen and offline.

> Note: `vite.config.ts` uses `base: './'`, so `dist` works from any subpath.

---

## B) Android APK / AAB for Google Play

The native Android project already exists in **`android/`** (Capacitor).
`appId = com.nur.quranazkar`, `appName = Nur — Quran & Azkar`.

### Option B1 — PWABuilder (no Android Studio / SDK needed) ✅ easiest from Windows
1. Deploy the PWA (step A) to a public URL.
2. Go to **https://www.pwabuilder.com**, paste the URL.
3. Package for **Android** → download the signed **.aab/.apk** → upload to Play Console.

### Option B2 — Capacitor + Android Studio (full native control)
Requires: **Android Studio** + Android SDK + JDK 17.
```bash
npm run build
npx cap sync android
npx cap open android        # opens Android Studio
```
In Android Studio: **Build → Generate Signed Bundle / APK** → create a keystore →
build **AAB** (for Play) or **APK** (for sideload/testing).

Command-line release build (after a keystore is configured in `android/`):
```bash
cd android
./gradlew assembleRelease   # APK  → android/app/build/outputs/apk/release/
./gradlew bundleRelease     # AAB  → android/app/build/outputs/bundle/release/
```

### App icons / splash
Generated from the new logo via `@capacitor/assets` (source in `assets/`):
```bash
npx @capacitor/assets generate --android --iconBackgroundColor "#081d23"
```
Re-run after replacing `assets/icon-only.png`.

---

## C) iOS (App Store)
Requires a **Mac + Xcode** (cannot be built on Windows).
```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios            # archive & upload via Xcode on a Mac
```

---

## Store checklist
- [x] App icon (512 + adaptive) — from the new logo
- [x] Offline functionality
- [x] No ads / no telemetry
- [ ] Privacy policy URL (required by Play/App Store — the app collects nothing;
      a simple "no data collected" policy suffices)
- [ ] Screenshots (phone) + short/full description
- [ ] Content rating questionnaire

## Whenever the web code changes
```bash
npm run build && npx cap sync android
```
