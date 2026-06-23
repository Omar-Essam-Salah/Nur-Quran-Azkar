<div align="center">

# نُور · Nur — Quran & Azkar

**An ad-free, zero-tracking, offline-first Islamic companion for Android.**

Built as a digital *Waqf* (صدقة جارية) — free, forever, *fi sabilillah*.

![platform](https://img.shields.io/badge/platform-Android-3ddc84)
![offline](https://img.shields.io/badge/offline--first-yes-14879c)
![ads](https://img.shields.io/badge/ads-none-d4af37)
![license](https://img.shields.io/badge/code-MIT-blue)

</div>

---

## What it is

Nur is a calm, distraction-free pocket reference for Muslims. It works on a plane,
in a tunnel, or with the router down — the text, prayer times, fonts and core
features are bundled locally; heavier media (recitation audio, mushaf pages,
tafsir) streams on demand and is then cached for offline reuse.

Packaged as a single **~29 MB** Android APK that installs on any phone.

## Features

- **Qur'an reader** — word-by-word Arabic with tajweed colouring, many
  translations, exact word↔audio sync, and offline downloads.
- **Recitation** — 14 reciters (12 with word-by-word highlight + Maher Al-Muaiqly
  and Yasser Al-Dossari), per-ayah playback, repeat, speed, download-for-offline.
- **Paper Mushaf** — Madani Hafs pages, zoom, page recitation, and a translucent
  tafsir window that follows the recitation ayah-by-ayah.
- **Prayer times & Adhan** — computed locally (no API), multiple muezzins,
  notifications, and an in-app "Prayer Focus" do-not-disturb.
- **Qibla compass** — sensor-fused heading with a rotate-to-align Kaaba marker.
- **Azkar & Ruqyah**, **Tasbih**, **99 Names**, **40 Hadith**, **Stories of the
  Prophets** (with their Qur'anic passages), and a complete **Muslim Guide**
  (wudu, ghusl, every prayer, salat al-tasabih, Hajj & Umrah).
- **Khatma plan**, **Fasting calendar**, **Ramadan mode**.
- **The Heartbeat** — gentle spiritual reminders (with a 14-day no-repeat ledger
  and a sleep-window guard) and a private **Soul Ledger** of devotion.
- **Light / Dark** themes, full **Arabic ⇄ English** UI toggle, permanent snow.
- **Backup & restore** your data to a new phone — no account, all on-device.

## Engineering principles

1. **Offline-first.** The app must never degrade into a blank screen because a
   network blinked.
2. **Zero bloat.** A feature that drops frames or leaks memory is a bug.
3. **Data sovereignty.** The user's device is the source of truth — local storage
   over vendor clouds. No analytics, no tracking.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS (token-based theming) · shadcn/Radix ·
Capacitor 8 (Android) · adhan-js · vite-plugin-pwa (Workbox) · IndexedDB.

## Build it yourself

```bash
npm install

# Regenerate the local Qur'an/hadith/asma data (not committed — see below)
npm run setup:content

npm run dev        # web preview at http://localhost:3000
npm run build      # production web build

# Android APK (requires JDK 21 + Android SDK)
npx cap sync android
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

## A note on content & licensing

The **source code** is MIT-licensed © 2026 Omar Essam Salah.

This repository intentionally **does not** ship third-party Islamic media
(specific Qur'an translations, reciter/adhan recordings, mushaf images). Those
belong to their respective owners and are streamed/generated at runtime under
their own terms. The Qur'an Arabic text is public domain. See **[CREDITS.md](CREDITS.md)**
for full attribution. `public/data` and `public/adhan` are git-ignored; run
`npm run setup:content` to regenerate the data locally.

## License

[MIT](LICENSE) — © 2026 Omar Essam Salah. The license covers the original code
only; bundled/streamed Islamic content remains the property of its sources.

<div align="center">

اللهم اجعله صدقةً جارية لوجهك الكريم 🤍

</div>
