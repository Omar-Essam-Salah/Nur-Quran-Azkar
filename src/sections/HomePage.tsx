import { useMemo } from 'react';
import { BookOpen, Sparkles, Clock, Compass, Heart, Search, Settings, Bookmark, Book, ChevronLeft, ScrollText, Languages, Moon, Target } from 'lucide-react';
import { useI18n } from '@/i18n';
import { surahList } from '@/data/surahList';
import { azkarCategories } from '@/data/azkarData';
import { getHijriDate } from '@/data/prayerTimes';
import type { Page } from '@/types';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onOpenSurah: (surahNumber: number, ayahNumber?: number) => void;
  onOpenAzkar: (azkarId: string) => void;
  lastRead: { surahNumber: number; ayahNumber: number; timestamp: number } | null;
  bookmarksCount: number;
  onToggleSearch: () => void;
}

export default function HomePage({ 
  onNavigate, 
  onOpenSurah, 
  onOpenAzkar, 
  lastRead, 
  bookmarksCount,
  onToggleSearch
}: HomePageProps) {
  const { lang, toggle, t } = useI18n();
  const isAr = lang === 'ar';
  // Selected language goes on top (large); the other below (small).
  const primary = (en: string, ar: string) => (isAr ? ar : en);
  const secondary = (en: string, ar: string) => (isAr ? en : ar);
  const hijriDate = useMemo(() => getHijriDate(), []);
  const gregorianDate = useMemo(() => 
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  []);

  // Get last read surah info
  const lastReadSurah = lastRead ? surahList.find(s => s.number === lastRead.surahNumber) : null;

  // Get random daily verse
  const dailyVerses = [
    { text: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', translation: 'And He is with you wherever you are.', source: 'Al-Hadid 57:4' },
    { text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship [will be] ease.', source: 'Ash-Sharh 94:5' },
    { text: 'وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ', translation: 'And rely upon the Ever-Living who does not die.', source: 'Al-Furqan 25:58' },
    { text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', translation: 'And say, "My Lord, increase me in knowledge."', source: 'Ta-Ha 20:114' },
    { text: 'رَبَّنَا عَلَيْكَ تَوَكَّلْنَا', translation: 'Our Lord, upon You we have relied.', source: 'Al-Mumtahanah 60:4' },
  ];
  const dailyVerse = useMemo(() => 
    dailyVerses[Math.floor((Date.now() / (1000 * 60 * 60 * 24)) % dailyVerses.length)],
  []);

  // Quick access items
  const quickAccess = [
    { 
      label: 'Quran', 
      arabic: 'القرآن', 
      icon: BookOpen, 
      color: '#14879c',
      onClick: () => onNavigate('quran')
    },
    { 
      label: 'Azkar', 
      arabic: 'الأذكار', 
      icon: Sparkles, 
      color: '#d4af37',
      onClick: () => onNavigate('azkar')
    },
    { 
      label: 'Prayer', 
      arabic: 'الصلاة', 
      icon: Clock, 
      color: '#4ade80',
      onClick: () => onNavigate('prayer')
    },
    { 
      label: 'Qibla', 
      arabic: 'القبلة', 
      icon: Compass, 
      color: '#f472b6',
      onClick: () => onNavigate('qibla')
    },
  ];

  // Popular surahs for quick access
  const popularSurahs = [
    { number: 36, name: 'Ya-Sin', arabic: 'يس', reason: 'Heart of the Quran' },
    { number: 67, name: 'Al-Mulk', arabic: 'الملك', reason: 'Protects from punishment' },
    { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', reason: 'The Merciful' },
    { number: 18, name: 'Al-Kahf', arabic: 'الكهف', reason: 'Friday reading' },
  ];

  // Popular azkar categories
  const popularAzkar = [
    { id: 'morning', name: 'Morning', arabic: 'الصباح', color: '#f59e0b' },
    { id: 'evening', name: 'Evening', arabic: 'المساء', color: '#6366f1' },
    { id: 'after-prayer', name: 'After Prayer', arabic: 'بعد الصلاة', color: '#10b981' },
  ];

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3">
        <div 
          className="mx-auto max-w-lg flex items-center justify-between rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div>
            <h1 className="text-lg font-semibold text-white">Nur</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider">{t('Quran & Azkar', 'قرآن وأذكار')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="px-2.5 py-2 rounded-xl transition-all hover:bg-white/10 flex items-center gap-1"
              title="Language / اللغة"
            >
              <Languages size={16} className="text-[#14879c]" />
              <span className="text-[10px] font-bold text-[#14879c]">{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>
            <button
              onClick={onToggleSearch}
              className="p-2.5 rounded-xl transition-all hover:bg-white/10"
            >
              <Search size={18} className="text-[color:var(--text-muted)]" />
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className="p-2.5 rounded-xl transition-all hover:bg-white/10"
            >
              <Settings size={18} className="text-[color:var(--text-muted)]" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 space-y-6 max-w-lg mx-auto">
        {/* Date Display */}
        <div className="text-center space-y-1">
          <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-widest">{gregorianDate}</p>
          <p className="text-sm text-[#14879c] font-medium">{hijriDate}</p>
        </div>

        {/* Hero Glass Card */}
        <div className="glass-card p-6 text-center space-y-4 relative overflow-hidden">
          {/* Decorative glow */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #14879c, transparent)' }}
          />
          
          <div className="relative">
            {/* Gold crescent (same shape as moon.svg) — stays visible in light mode too */}
            <svg viewBox="0 0 120 120" className="w-16 h-16 mx-auto opacity-90" fill="none"
              stroke="#d4af37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-label="Moon">
              <path d="M90 60C90 76.57 76.57 90 60 90C43.43 90 30 76.57 30 60C30 43.43 43.43 30 60 30C55 30 45 38 45 55C45 72 58 78 68 76C80 74 90 65 90 60Z"
                fill="rgba(212,175,55,0.06)" stroke="#d4af37" strokeWidth={2} />
              <circle cx="75" cy="35" r="2" fill="#d4af37" opacity={0.55} stroke="none" />
              <circle cx="85" cy="50" r="1.5" fill="#d4af37" opacity={0.4} stroke="none" />
            </svg>
            <h2 className="text-3xl font-bold mt-3 gradient-text">{t('Nur', 'نور')}</h2>
            <p className="text-xs text-[color:var(--text-muted)] mt-2 uppercase tracking-wider arabic-text">{t('Your Daily Devotion', 'عبادتك اليومية')}</p>
            <p className="text-xs text-[color:var(--text-muted)]/70 mt-1 arabic-text">{t('Ad-free, private, designed for peace', 'بلا إعلانات، خصوصيّة تامة، مصمّم للسكينة')}</p>
          </div>

          {/* Daily Verse */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-[#d4af37] uppercase tracking-wider mb-2">{t('Daily Verse', 'آية اليوم')}</p>
            <p className="arabic-text text-lg text-white/90 leading-relaxed">{dailyVerse.text}</p>
            <p className="text-xs text-[color:var(--text-muted)] mt-2 italic">{dailyVerse.translation}</p>
            <p className="text-[10px] text-[#14879c] mt-1">{dailyVerse.source}</p>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div>
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider mb-3 px-1">{t('Quick Access', 'وصول سريع')}</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickAccess.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="glass-card-sm p-3 flex flex-col items-center gap-2 group"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: `${item.color}15` }}
                  >
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <span className={`text-[10px] text-white/80 ${isAr ? 'arabic-text' : ''}`}>{primary(item.label, item.arabic)}</span>
                  <span className={`text-[8px] text-white/30 -mt-1 ${isAr ? '' : 'arabic-text'}`}>{secondary(item.label, item.arabic)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper Mushaf */}
        <button
          onClick={() => onNavigate('mushaf')}
          className="glass-card w-full p-4 flex items-center gap-4 text-left group"
          style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(20, 135, 156, 0.06))' }}
        >
          <div className="w-12 h-12 rounded-xl bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
            <Book size={22} className="text-[#d4af37]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary('Paper Mushaf', 'المصحف الشريف')}</p>
            <p className="text-xs text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Read the printed Madani Mushaf, page by page', 'اقرأ المصحف المدني المطبوع صفحة بصفحة')}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#d4af37]/15 flex items-center justify-center group-hover:bg-[#d4af37]/25 transition-all">
            <ChevronLeft size={16} className="text-[#d4af37]" />
          </div>
        </button>

        {/* Islamic content */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNavigate('prophets')} className="glass-card-sm p-4 flex flex-col items-start gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#14879c]/15 flex items-center justify-center">
              <BookOpen size={18} className="text-[#14879c]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary('Stories of the Prophets', 'قصص الأنبياء')}</p>
              <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary('Stories of the Prophets', 'قصص الأنبياء')}</p>
            </div>
          </button>
          <button onClick={() => onNavigate('hadith')} className="glass-card-sm p-4 flex flex-col items-start gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center">
              <ScrollText size={18} className="text-[#d4af37]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary('40 Hadith', 'الأربعون النووية')}</p>
              <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary('40 Hadith', 'الأربعون النووية')}</p>
            </div>
          </button>
          <button onClick={() => onNavigate('asma')} className="glass-card-sm p-4 flex flex-col items-start gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#14879c]/15 flex items-center justify-center">
              <Sparkles size={18} className="text-[#14879c]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary('99 Names', 'الأسماء الحسنى')}</p>
              <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary('99 Names', 'الأسماء الحسنى')}</p>
            </div>
          </button>
          <button onClick={() => onNavigate('khatma')} className="glass-card-sm p-4 flex flex-col items-start gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#14879c]/15 flex items-center justify-center">
              <Target size={18} className="text-[#14879c]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary('Khatma Plan', 'خطة الختمة')}</p>
              <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary('Khatma Plan', 'خطة الختمة')}</p>
            </div>
          </button>
          <button onClick={() => onNavigate('ramadan')} className="glass-card-sm p-4 flex flex-col items-start gap-2 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 flex items-center justify-center">
              <Moon size={18} className="text-[#d4af37]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary('Ramadan', 'وضع رمضان')}</p>
              <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary('Ramadan', 'وضع رمضان')}</p>
            </div>
          </button>
        </div>

        {/* Last Read */}
        {lastRead && lastReadSurah && (
          <div>
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider mb-3 px-1">{t('Continue Reading', 'متابعة القراءة')}</h3>
            <button
              onClick={() => onOpenSurah(lastRead.surahNumber, lastRead.ayahNumber)}
              className="glass-card w-full p-4 flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#14879c]/20 flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-[#14879c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{isAr ? lastReadSurah.name : lastReadSurah.englishName}</p>
                <p className="text-xs text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Verse', 'آية')} {lastRead.ayahNumber} {t('of', 'من')} {lastReadSurah.verses}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#14879c]/20 flex items-center justify-center group-hover:bg-[#14879c]/30 transition-all">
                <Bookmark size={14} className="text-[#14879c]" />
              </div>
            </button>
          </div>
        )}

        {/* Popular Surahs */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">{t('Popular Surahs', 'سور مختارة')}</h3>
            <button 
              onClick={() => onNavigate('quran')}
              className="text-[10px] text-[#14879c] hover:text-[#14879c]/80 transition-colors"
            >
              {t('View All', 'عرض الكل')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popularSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => onOpenSurah(surah.number)}
                className="glass-card-sm p-4 text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#14879c]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#14879c]">{surah.number}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium text-white truncate ${isAr ? 'arabic-text' : ''}`}>{primary(surah.name, surah.arabic)}</p>
                    <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary(surah.name, surah.arabic)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#14879c]/70 mt-2">{surah.reason}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Azkar Categories */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">{t('Adhkar', 'الأذكار')}</h3>
            <button 
              onClick={() => onNavigate('azkar')}
              className="text-[10px] text-[#d4af37] hover:text-[#d4af37]/80 transition-colors"
            >
              {t('View All', 'عرض الكل')}
            </button>
          </div>
          <div className="space-y-2">
            {popularAzkar.map((azkar) => (
              <button
                key={azkar.id}
                onClick={() => onOpenAzkar(azkar.id)}
                className="glass-card-sm w-full p-4 flex items-center gap-4 text-left group"
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${azkar.color}15` }}
                >
                  <Sparkles size={18} style={{ color: azkar.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{primary(azkar.name, azkar.arabic)}</p>
                  <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{secondary(azkar.name, azkar.arabic)}</p>
                </div>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: `${azkar.color}10` }}
                >
                  <span className="text-[8px]" style={{ color: azkar.color }}>
                    {azkarCategories.find(c => c.id === azkar.id)?.items.length || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bookmarks Summary */}
        {bookmarksCount > 0 && (
          <button
            onClick={() => onNavigate('bookmarks')}
            className="glass-card w-full p-4 flex items-center gap-4 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#f472b6]/20 flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-[#f472b6]" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{t('Your Bookmarks', 'محفوظاتك')}</p>
              <p className="text-xs text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{bookmarksCount} {t('saved items', 'عنصرًا محفوظًا')}</p>
            </div>
          </button>
        )}

        {/* Extra Tools */}
        <div>
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider mb-3 px-1">{t('More Tools', 'أدوات أخرى')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('tasbih')}
              className="glass-card-sm p-4 flex flex-col items-center gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/15 flex items-center justify-center">
                <span className="text-xl text-[#10b981] font-bold">33</span>
              </div>
              <div>
                <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{t('Tasbih', 'السبحة')}</p>
                <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Digital Counter', 'عدّاد رقمي')}</p>
              </div>
            </button>
            <button
              onClick={() => onNavigate('bookmarks')}
              className="glass-card-sm p-4 flex flex-col items-center gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f472b6]/15 flex items-center justify-center">
                <Bookmark size={20} className="text-[#f472b6]" />
              </div>
              <div>
                <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{t('Bookmarks', 'المحفوظات')}</p>
                <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Saved Verses', 'آيات محفوظة')}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Spacer for bottom nav */}
        <div className="h-8" />
      </div>
    </div>
  );
}
