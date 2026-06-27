import {
  Compass, Hash, BookMarked, Moon, Target, CalendarDays, Sparkles, BookOpen, ScrollText,
  Bookmark, Settings as SettingsIcon, Languages, ChevronLeft, HeartHandshake, BookText,
  Coins, Star, MessageSquarePlus, ShieldCheck, PersonStanding, BookOpenCheck,
} from 'lucide-react';
import { useEffect } from 'react';
import type { Page } from '@/types';
import { useI18n } from '@/i18n';

interface MorePageProps {
  onNavigate: (p: Page) => void;
}

// Remember where the user scrolled, so returning from a sub-page lands them
// back at the same spot instead of jumping to the top.
let savedScroll = 0;

interface Item { page: Page; en: string; ar: string; icon: typeof Compass; color: string }

const GROUPS: { en: string; ar: string; items: Item[] }[] = [
  {
    en: 'Worship', ar: 'العبادات',
    items: [
      { page: 'prayer-learn', en: 'Learn to Pray', ar: 'تعلّم الصلاة', icon: PersonStanding, color: '#34d399' },
      { page: 'guide', en: 'Muslim Guide', ar: 'دليل المسلم', icon: BookText, color: '#10b981' },
      { page: 'tasbih', en: 'Tasbih', ar: 'السبحة', icon: Hash, color: '#14879c' },
      { page: 'qibla', en: 'Qibla', ar: 'القبلة', icon: Compass, color: '#f472b6' },
      { page: 'fasting', en: 'Fasting', ar: 'صيام التطوّع', icon: CalendarDays, color: '#10b981' },
      { page: 'ramadan', en: 'Ramadan', ar: 'وضع رمضان', icon: Moon, color: '#d4af37' },
      { page: 'zakat', en: 'Zakat Calculator', ar: 'حاسبة الزكاة', icon: Coins, color: '#d4af37' },
    ],
  },
  {
    en: 'Quran', ar: 'القرآن',
    items: [
      { page: 'mushaf', en: 'Paper Mushaf', ar: 'المصحف الورقي', icon: BookMarked, color: '#14879c' },
      { page: 'muhkamat', en: 'Clear Verses', ar: 'الآيات المحكمات', icon: BookOpenCheck, color: '#d4af37' },
      { page: 'khatma', en: 'Khatma Plan', ar: 'خطة الختمة', icon: Target, color: '#14879c' },
      { page: 'kids', en: "Kids' Corner", ar: 'ركن الأطفال', icon: Star, color: '#f59e0b' },
    ],
  },
  {
    en: 'Knowledge', ar: 'العلم',
    items: [
      { page: 'asma', en: '99 Names', ar: 'الأسماء الحسنى', icon: Sparkles, color: '#14879c' },
      { page: 'prophets', en: 'Stories of the Prophets', ar: 'قصص الأنبياء', icon: BookOpen, color: '#d4af37' },
      { page: 'hadith', en: '40 Hadith', ar: 'الأربعون النووية', icon: ScrollText, color: '#d4af37' },
    ],
  },
  {
    en: 'App', ar: 'التطبيق',
    items: [
      { page: 'ledger', en: 'Soul Ledger', ar: 'سجل الخيرات', icon: HeartHandshake, color: '#10b981' },
      { page: 'bookmarks', en: 'Bookmarks', ar: 'المفضّلة', icon: Bookmark, color: '#d4af37' },
      { page: 'feedback', en: 'Feedback', ar: 'الشكاوى والمقترحات', icon: MessageSquarePlus, color: '#14879c' },
      { page: 'authenticity', en: 'Authenticity', ar: 'التوثيق والأصالة', icon: ShieldCheck, color: '#10b981' },
      { page: 'settings', en: 'Settings', ar: 'الإعدادات', icon: SettingsIcon, color: '#94a3b8' },
    ],
  },
];

export default function MorePage({ onNavigate }: MorePageProps) {
  const { t, lang, toggle } = useI18n();

  // Restore the saved scroll on mount; save it on the way out.
  useEffect(() => {
    if (savedScroll) requestAnimationFrame(() => window.scrollTo(0, savedScroll));
    return () => { savedScroll = window.scrollY; };
  }, []);

  const open = (p: Page) => { savedScroll = window.scrollY; onNavigate(p); };

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div
          className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))',
            border: '1px solid rgba(var(--hair), 0.08)',
            borderTop: '1px solid rgba(var(--hair), 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{t('More', 'المزيد')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('All features', 'كل المزايا')}</p>
          </div>
          <button
            onClick={toggle}
            className="px-2.5 py-2 rounded-xl transition-all hover:bg-white/10 flex items-center gap-1"
            title="Language / اللغة"
          >
            <Languages size={16} className="text-[#14879c]" />
            <span className="text-[10px] font-bold text-[#14879c]">{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-5">
        {GROUPS.map((g) => (
          <div key={g.en}>
            <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider mb-2 px-1">{t(g.en, g.ar)}</h3>
            <div className="space-y-2">
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.page}
                    onClick={() => open(it.page)}
                    className="glass-card-sm w-full p-4 flex items-center gap-4 text-left"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${it.color}1f` }}>
                      <Icon size={20} style={{ color: it.color }} />
                    </div>
                    <p className="flex-1 text-sm font-medium text-white arabic-text">{t(it.en, it.ar)}</p>
                    <ChevronLeft size={16} className="text-[color:var(--text-muted)]" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Dedication — Sadaqah Jariyah */}
        <div className="glass-card p-5 text-center space-y-2 mt-2" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
          <p className="text-[11px] text-[#d4af37] arabic-text leading-relaxed">
            هذا التطبيق صدقةٌ جارية، لوجه الله تعالى ولعائلتي
          </p>
          <p className="text-base font-semibold text-white arabic-text">عمر عصام صلاح الدين</p>
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed">
            اللهم اجعله في ميزان حسناتي ووالديَّ وأهلي، وتقبّله بقبولٍ حسن، وانفع به المسلمين.
            <br />
            ولا تنسَ من برمجه ومن نشره بدعوةٍ بظهر الغيب 🤍
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
