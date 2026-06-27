import { useState, useCallback, useEffect } from 'react';
import type { Page, BottomNavPage } from '@/types';
import { useBookmarks, useLastRead, useSettings, useTasbih } from '@/hooks/useLocalStorage';
import Starfield from '@/components/Starfield';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/sections/HomePage';
import QuranPage from '@/sections/QuranPage';
import QuranReader from '@/sections/QuranReader';
import AzkarPage from '@/sections/AzkarPage';
import AzkarDetail from '@/sections/AzkarDetail';
import PrayerTimesPage from '@/sections/PrayerTimesPage';
import QiblaPage from '@/sections/QiblaPage';
import MushafPage from '@/sections/MushafPage';
import FastingPage from '@/sections/FastingPage';
import ProphetsPage from '@/sections/ProphetsPage';
import HadithPage from '@/sections/HadithPage';
import AsmaPage from '@/sections/AsmaPage';
import KhatmaPage from '@/sections/KhatmaPage';
import RamadanPage from '@/sections/RamadanPage';
import ZakatPage from '@/sections/ZakatPage';
import KidsPage from '@/sections/KidsPage';
import FeedbackPage from '@/sections/FeedbackPage';
import AuthenticityPage from '@/sections/AuthenticityPage';
import PrayerLearnPage from '@/sections/PrayerLearnPage';
import MuhkamatPage from '@/sections/MuhkamatPage';
import MorePage from '@/sections/MorePage';
import TasbihPage from '@/sections/TasbihPage';
import BookmarksPage from '@/sections/BookmarksPage';
import SettingsPage from '@/sections/SettingsPage';
import SearchOverlay from '@/sections/SearchOverlay';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { App as CapApp } from '@capacitor/app';
import Splash from '@/components/Splash';
import DailyReminder from '@/components/DailyReminder';
import Onboarding from '@/components/Onboarding';
import LedgerPage from '@/sections/LedgerPage';
import GuidePage from '@/sections/GuidePage';
import { scheduleSpiritualNudges } from '@/lib/reminders';
import { runBack } from '@/lib/backStack';
import { initDailySync } from '@/lib/dailySync';
import { recordDeed } from '@/lib/ledger';
import { requestStartupPermissions } from '@/lib/permissions';
import { useI18n } from '@/i18n';

function App() {
  // نظام History Stack لتتبع التنقلات بشكل دقيق وحل مشكلة أزرار الرجوع
  const [history, setHistory] = useState<Page[]>(['home']);
  const currentPage = history[history.length - 1];

  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedAzkar, setSelectedAzkar] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('nur-onboarded') === '1'; } catch { return true; }
  });
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);

  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { lastRead, updateLastRead } = useLastRead();
  const { settings, setSettings } = useSettings();
  const { t } = useI18n();
  const { counts, activeDhikr, setActiveDhikr, increment, reset, getCount } = useTasbih();

  // Navigation handler
  const navigateTo = useCallback((page: Page) => {
    setHistory(prev => prev[prev.length - 1] === page ? prev : [...prev, page]);
    window.scrollTo(0, 0);
  }, []);

  // دالة الرجوع المحسنة
  const goBack = useCallback(() => {
    setHistory(prev => {
      // لو في سجل للخطوات، احذف آخر خطوة وارجع للي قبلها
      if (prev.length > 1) return prev.slice(0, -1);
      // لو مفيش سجل وإنت مش في الصفحة الرئيسية، ارجع للرئيسية
      if (prev[0] !== 'home') return ['home'];
      return prev;
    });
    window.scrollTo(0, 0);
  }, []);

  // Open surah reader
  const openSurah = useCallback((surahNumber: number, ayahNumber?: number) => {
    setSelectedSurah(surahNumber);
    setSelectedAyah(ayahNumber || null); // تصفير الآية لو مش مبعوتة عشان ميروحش لآية قديمة
    setHistory(prev => prev[prev.length - 1] === 'quran-reader' ? prev : [...prev, 'quran-reader']);
    window.scrollTo(0, 0);
  }, []);

  // Open azkar detail
  const openAzkar = useCallback((azkarId: string) => {
    setSelectedAzkar(azkarId);
    setHistory(prev => prev[prev.length - 1] === 'azkar-detail' ? prev : [...prev, 'azkar-detail']);
    window.scrollTo(0, 0);
  }, []);

  // Handle bookmark with toast
  const handleBookmark = useCallback((bookmark: Omit<typeof bookmarks[0], 'id' | 'timestamp'>) => {
    if (isBookmarked(bookmark.type, bookmark.surahNumber, bookmark.ayahNumber)) {
      const existing = bookmarks.find(b => 
        b.type === bookmark.type && 
        b.surahNumber === bookmark.surahNumber && 
        b.ayahNumber === bookmark.ayahNumber
      );
      if (existing) {
        removeBookmark(existing.id);
        toast(t('Removed from bookmarks', 'أُزيل من المفضّلة'), { description: t('The item has been removed from your bookmarks.', 'تمّت إزالة العنصر من مفضّلتك.') });
      }
    } else {
      addBookmark(bookmark);
      toast(t('Added to bookmarks', 'أُضيف للمفضّلة'), { description: t('The item has been saved to your bookmarks.', 'تمّ حفظ العنصر في مفضّلتك.') });
    }
  }, [bookmarks, isBookmarked, addBookmark, removeBookmark]);

  // Handle bottom nav
  const handleBottomNav = useCallback((page: BottomNavPage) => {
    // The "Quran" tab opens the paper Mushaf — the primary way to read the
    // Quran. (The verse-by-verse reader with audio/translation is "تعلّم".)
    const target: Page = page === 'quran' ? 'mushaf' : (page as Page);
    setHistory([target]); // تصفير الذاكرة وبدء سلسلة جديدة عند استخدام القائمة السفلية
    window.scrollTo(0, 0);
  }, []);

  // Get active bottom nav page — secondary pages live under "More".
  const getActiveNavPage = (): BottomNavPage => {
    if (currentPage === 'home') return 'home';
    if (currentPage === 'mushaf' || currentPage === 'quran' || currentPage === 'quran-reader') return 'quran';
    if (currentPage === 'azkar' || currentPage === 'azkar-detail') return 'azkar';
    if (currentPage === 'prayer') return 'prayer';
    return 'more';
  };

  // Schedule the gentle spiritual nudges for the coming days (native only; no-op on web).
  // Also mark today active in the Soul Ledger (streak / active-days tracking).
  useEffect(() => {
    // First launch is handled by the Onboarding screen (explicit prompts); on
    // later launches re-check permissions silently.
    if (onboarded) void requestStartupPermissions();
    void scheduleSpiritualNudges();
    initDailySync(); // once-a-day refresh on (re)connect
    recordDeed('open');
  }, [onboarded]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reader emits this when navigating between surahs (next/prev/retry).
  useEffect(() => {
    const handler = (e: Event) => {
      const n = (e as CustomEvent<{ surahNumber: number }>).detail?.surahNumber;
      if (typeof n === 'number') openSurah(n);
    };
    window.addEventListener('navigate-to-surah', handler);
    return () => window.removeEventListener('navigate-to-surah', handler);
  }, [openSurah]);

  // Apply theme. Default 'dark' adds no class (identical to before); 'light'
  // toggles the soft-daylight token set; 'auto' follows the OS preference.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLight = settings.theme === 'light' || (settings.theme === 'auto' && !prefersDark);
      root.classList.toggle('light', isLight);
    };
    apply();
    if (settings.theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [settings.theme]);

  // Elderly mode — enlarge the whole UI.
  useEffect(() => {
    document.documentElement.classList.toggle('large-ui', !!settings.elderMode);
  }, [settings.elderMode]);

  // Android hardware back button → navigate within the app, don't close it.
  useEffect(() => {
    let remove: (() => void) | undefined;
    CapApp.addListener('backButton', () => {
      if (runBack()) return; // an open overlay (mushaf index, tafsir…) handled it
      if (showSearch) { setShowSearch(false); return; }
      if (history.length > 1) {
        goBack();
      } else if (history[history.length - 1] !== 'home') {
        setHistory(['home']);
      } else {
        CapApp.exitApp();
      }
    }).then((l) => { remove = () => l.remove(); });
    return () => { remove?.(); };
  }, [history, goBack, showSearch]);

  // Show the starfield background on every page except the immersive Mushaf,
  // so all pages share the same look (Prayer, Qibla, etc. were inconsistent).
  const showStarfield = currentPage !== 'mushaf';
  const showBottomNav = ['home', 'quran', 'azkar', 'prayer', 'more', 'bookmarks'].includes(currentPage);

  return (
    <div className="relative min-h-screen bg-[color:var(--app-bg)] text-white overflow-x-hidden">
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      {!showSplash && !onboarded && <Onboarding onDone={() => setOnboarded(true)} />}
      {!showSplash && onboarded && <DailyReminder />}
      {/* Background Starfield */}
      {showStarfield && <Starfield />}
      
      {/* Main Content */}
      <main className="relative z-10 min-h-screen pb-20">
        {/* Home Page */}
        {currentPage === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onOpenSurah={openSurah}
            onOpenAzkar={openAzkar}
            lastRead={lastRead}
            bookmarksCount={bookmarks.length}
            onToggleSearch={() => setShowSearch(true)}
          />
        )}

        {/* Quran List Page */}
        {currentPage === 'quran' && (
          <QuranPage
            onOpenSurah={openSurah}
            onBack={goBack}
            onToggleSearch={() => setShowSearch(true)}
          />
        )}

        {/* Quran Reader */}
        {currentPage === 'quran-reader' && selectedSurah && (
          <QuranReader
            surahNumber={selectedSurah}
            initialAyah={selectedAyah || undefined}
            onBack={goBack}
            onBookmark={handleBookmark}
            isBookmarked={isBookmarked}
            updateLastRead={updateLastRead}
            settings={settings}
          />
        )}

        {/* Azkar Categories */}
        {currentPage === 'azkar' && (
          <AzkarPage
            onOpenAzkar={openAzkar}
            onBack={goBack}
          />
        )}

        {/* Azkar Detail */}
        {currentPage === 'azkar-detail' && selectedAzkar && (
          <AzkarDetail
            categoryId={selectedAzkar}
            onBack={goBack}
            onBookmark={handleBookmark}
            isBookmarked={isBookmarked}
          />
        )}

        {/* Prayer Times */}
        {currentPage === 'prayer' && (
          <PrayerTimesPage
            onBack={goBack}
            onNavigate={navigateTo}
          />
        )}

        {/* Qibla Compass */}
        {currentPage === 'qibla' && (
          <QiblaPage
            onBack={goBack}
          />
        )}

        {/* Paper Mushaf */}
        {currentPage === 'mushaf' && (
          <MushafPage
            onBack={goBack}
          />
        )}

        {/* Voluntary Fasting Calendar */}
        {currentPage === 'fasting' && (
          <FastingPage
            onBack={goBack}
          />
        )}

        {/* Stories of the Prophets */}
        {currentPage === 'prophets' && (
          <ProphetsPage
            onBack={goBack}
            onOpenSurah={openSurah}
          />
        )}

        {/* Hadith (Nawawi 40) */}
        {currentPage === 'hadith' && (
          <HadithPage
            onBack={goBack}
          />
        )}

        {/* 99 Names of Allah */}
        {currentPage === 'asma' && (
          <AsmaPage
            onBack={goBack}
          />
        )}

        {/* Khatma plan */}
        {currentPage === 'khatma' && (
          <KhatmaPage
            onBack={goBack}
            onNavigate={navigateTo}
          />
        )}

        {/* Zakat calculator */}
        {currentPage === 'zakat' && (
          <ZakatPage onBack={goBack} />
        )}

        {/* Kids' corner */}
        {currentPage === 'kids' && (
          <KidsPage onBack={goBack} onOpenSurah={openSurah} onNavigate={navigateTo} />
        )}

        {/* Feedback / suggestions */}
        {currentPage === 'feedback' && (
          <FeedbackPage onBack={goBack} />
        )}

        {/* Authenticity / verify */}
        {currentPage === 'authenticity' && (
          <AuthenticityPage onBack={goBack} />
        )}

        {/* Learn to pray (wudū + ṣalāh) */}
        {currentPage === 'prayer-learn' && (
          <PrayerLearnPage onBack={goBack} />
        )}

        {/* Clear verses (muḥkamāt) */}
        {currentPage === 'muhkamat' && (
          <MuhkamatPage onBack={goBack} />
        )}

        {/* Ramadan mode */}
        {currentPage === 'ramadan' && (
          <RamadanPage
            onBack={goBack}
          />
        )}

        {/* More — features hub */}
        {currentPage === 'more' && (
          <MorePage
            onNavigate={navigateTo}
          />
        )}

        {/* Soul Ledger — private record of devotion */}
        {currentPage === 'ledger' && (
          <LedgerPage onBack={goBack} />
        )}

        {/* Muslim Guide — purification, prayers, Hajj & Umrah */}
        {currentPage === 'guide' && (
          <GuidePage onBack={goBack} />
        )}

        {/* Tasbih Counter */}
        {currentPage === 'tasbih' && (
          <TasbihPage
            onBack={goBack}
            counts={counts}
            activeDhikr={activeDhikr}
            setActiveDhikr={setActiveDhikr}
            increment={increment}
            reset={reset}
            getCount={getCount}
          />
        )}

        {/* Bookmarks */}
        {currentPage === 'bookmarks' && (
          <BookmarksPage
            bookmarks={bookmarks}
            onRemoveBookmark={removeBookmark}
            onOpenSurah={openSurah}
            onBack={goBack}
            onNavigate={navigateTo}
          />
        )}

        {/* Settings */}
        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            setSettings={setSettings}
            onBack={goBack}
          />
        )}
      </main>

      {/* Search Overlay */}
      {showSearch && (
        <SearchOverlay
          onClose={() => setShowSearch(false)}
          onOpenSurah={openSurah}
          onOpenAzkar={openAzkar}
          onNavigate={navigateTo}
        />
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          activePage={getActiveNavPage()}
          onNavigate={handleBottomNav}
        />
      )}

      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.9), rgba(255, 255, 255, 0.05))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}

export default App;