import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { X, Search, BookOpen, Sparkles, ArrowRight, Users, Compass } from 'lucide-react';
import { surahList } from '@/data/surahList';
import { azkarCategories } from '@/data/azkarData';
import { PROPHETS } from '@/data/prophets';
import type { Page } from '@/types';
import { useI18n } from '@/i18n';

interface SearchOverlayProps {
  onClose: () => void;
  onOpenSurah: (surahNumber: number) => void;
  onOpenAzkar: (azkarId: string) => void;
  onNavigate: (page: Page) => void;
}

// Normalize Arabic so searches match regardless of tashkeel, hamza/alef form,
// ta-marbuta, tatweel, and the definite article "ال".
function normAr(s: string): string {
  return (s || '')
    .replace(/[ً-ْٰـ]/g, '') // harakat + tatweel
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim();
}
const stripAl = (s: string) => s.replace(/^ال/, '');
const has = (target: string, q: string) => {
  const a = stripAl(normAr(target));
  const b = stripAl(normAr(q));
  return a.includes(b);
};

// Navigable sections/features (everything reachable from the app).
const FEATURES: { page: Page; en: string; ar: string; kw: string; icon: typeof Compass; color: string }[] = [
  { page: 'prayer', en: 'Prayer Times', ar: 'مواقيت الصلاة', kw: 'صلاة اذان اذان مواقيت athan adhan prayer', icon: Compass, color: '#14879c' },
  { page: 'qibla', en: 'Qibla Compass', ar: 'بوصلة القبلة', kw: 'قبله بوصله compass kaaba كعبه', icon: Compass, color: '#f472b6' },
  { page: 'guide', en: 'Muslim Guide', ar: 'دليل المسلم', kw: 'وضوء غسل تيمم صلاه حج عمره تسابيح وتر سنن جنازه wudu ghusl hajj umrah guide', icon: BookOpen, color: '#10b981' },
  { page: 'mushaf', en: 'Paper Mushaf', ar: 'المصحف الورقي', kw: 'مصحف صفحه page mushaf', icon: BookOpen, color: '#14879c' },
  { page: 'tasbih', en: 'Tasbih', ar: 'السبحة', kw: 'ذكر تسبيح سبحه مسبحه dhikr counter', icon: Sparkles, color: '#14879c' },
  { page: 'asma', en: '99 Names of Allah', ar: 'أسماء الله الحسنى', kw: 'اسماء الحسنى names allah', icon: Sparkles, color: '#14879c' },
  { page: 'hadith', en: '40 Hadith Nawawi', ar: 'الأربعون النووية', kw: 'حديث اربعون نوويه hadith', icon: BookOpen, color: '#d4af37' },
  { page: 'khatma', en: 'Khatma Plan', ar: 'خطة الختمة', kw: 'ختمه khatma plan', icon: BookOpen, color: '#14879c' },
  { page: 'fasting', en: 'Fasting', ar: 'صيام التطوّع', kw: 'صيام صوم نوافل fasting', icon: Sparkles, color: '#10b981' },
  { page: 'ramadan', en: 'Ramadan', ar: 'وضع رمضان', kw: 'رمضان ramadan', icon: Sparkles, color: '#d4af37' },
  { page: 'ledger', en: 'Soul Ledger', ar: 'سجل الخيرات', kw: 'سجل خيرات حسنات ledger', icon: Sparkles, color: '#10b981' },
  { page: 'bookmarks', en: 'Bookmarks', ar: 'المفضّلة', kw: 'محفوظات علامات bookmarks', icon: Sparkles, color: '#d4af37' },
  { page: 'settings', en: 'Settings', ar: 'الإعدادات', kw: 'اعدادات settings reciter قارئ', icon: Sparkles, color: '#94a3b8' },
];

export default function SearchOverlay({ onClose, onOpenSurah, onOpenAzkar, onNavigate }: SearchOverlayProps) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return { surahs: [], azkar: [], prophets: [], features: [] };

    const surahs = surahList.filter((s) =>
      s.englishName.toLowerCase().includes(q.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(q.toLowerCase()) ||
      String(s.number) === q ||
      has(s.name, q),
    ).slice(0, 8);

    const azkar = azkarCategories.filter((cat) =>
      cat.name.toLowerCase().includes(q.toLowerCase()) ||
      has(cat.arabicName, q) ||
      cat.items?.some((it) => has(it.arabic, q) || (it.reference ? has(it.reference, q) : false)),
    ).slice(0, 6);

    const prophets = PROPHETS.filter((p) =>
      has(p.name, q) || p.en.toLowerCase().includes(q.toLowerCase()) || has(p.note, q),
    ).slice(0, 6);

    const features = FEATURES.filter((f) =>
      f.en.toLowerCase().includes(q.toLowerCase()) || has(f.ar, q) || has(f.kw, q),
    ).slice(0, 6);

    return { surahs, azkar, prophets, features };
  }, [query]);

  const hasResults = results.surahs.length || results.azkar.length || results.prophets.length || results.features.length;
  const go = (fn: () => void) => { fn(); onClose(); };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(var(--glass-2), 0.97)' }}
    >
      {/* Search Header */}
      <div className="px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <div
            className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.9), rgba(var(--glass-2), 0.95))',
              border: '1px solid rgba(var(--hair), 0.1)',
              borderTop: '1px solid rgba(var(--hair), 0.18)',
            }}
          >
            <Search size={18} className="text-[#14879c]" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('Search the whole app…', 'ابحث في كل التطبيق…')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-[color:var(--text-muted)]/50 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-white/10">
                <X size={14} className="text-[color:var(--text-muted)]" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-3 py-3 text-xs text-[color:var(--text-muted)] hover:text-white transition-colors">
            {t('Cancel', 'إلغاء')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="mx-auto max-w-lg space-y-5">
          {!query.trim() ? (
            <div className="text-center py-12 space-y-3">
              <Search size={32} className="text-[color:var(--text-muted)]/30 mx-auto" />
              <p className="text-sm text-[color:var(--text-muted)]">{t('Search surahs, adhkar, prophets, and every section', 'ابحث في السور والأذكار والأنبياء وكل الأقسام')}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {(lang === 'ar'
                  ? ['الفاتحة', 'الكهف', 'الرحمن', 'الصباح', 'الوضوء', 'يوسف']
                  : ['Fatiha', 'Kahf', 'Rahman', 'Morning', 'Wudu', 'Yusuf']
                ).map((s) => (
                  <button key={s} onClick={() => setQuery(s)} className="px-3 py-1.5 rounded-full text-xs text-[color:var(--text-muted)] bg-white/5 hover:bg-white/10 transition-all arabic-text">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-12">
              <p className="text-sm text-[color:var(--text-muted)]">{t('No results for', 'لا نتائج لـ')} &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <>
              {results.surahs.length > 0 && (
                <Group icon={<BookOpen size={12} className="text-[#14879c]" />} title={`${t('Surahs', 'السور')} (${results.surahs.length})`}>
                  {results.surahs.map((s) => (
                    <Row key={s.number} onClick={() => go(() => onOpenSurah(s.number))}
                      left={<span className="text-xs font-bold text-[#14879c]">{s.number}</span>} leftBg="#14879c"
                      title={s.englishName} titleAr={s.name} sub={`${s.verses} ${t('verses', 'آية')} · ${s.type}`} />
                  ))}
                </Group>
              )}

              {results.features.length > 0 && (
                <Group icon={<Compass size={12} className="text-[#14879c]" />} title={t('Sections', 'الأقسام')}>
                  {results.features.map((f) => {
                    const Icon = f.icon;
                    return (
                      <Row key={f.page} onClick={() => go(() => onNavigate(f.page))}
                        left={<Icon size={16} style={{ color: f.color }} />} leftBg={f.color}
                        title={f.en} titleAr={f.ar} sub="" />
                    );
                  })}
                </Group>
              )}

              {results.azkar.length > 0 && (
                <Group icon={<Sparkles size={12} className="text-[#d4af37]" />} title={t('Adhkar', 'الأذكار')}>
                  {results.azkar.map((c) => (
                    <Row key={c.id} onClick={() => go(() => onOpenAzkar(c.id))}
                      left={<Sparkles size={16} className="text-[#d4af37]" />} leftBg="#d4af37"
                      title={c.name} titleAr={c.arabicName} sub="" />
                  ))}
                </Group>
              )}

              {results.prophets.length > 0 && (
                <Group icon={<Users size={12} className="text-[#d4af37]" />} title={t('Prophets', 'الأنبياء')}>
                  {results.prophets.map((p) => (
                    <Row key={p.id} onClick={() => go(() => onNavigate('prophets'))}
                      left={<Users size={16} className="text-[#d4af37]" />} leftBg="#d4af37"
                      title={p.en} titleAr={p.name} sub={p.note} subAr />
                  ))}
                </Group>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 px-1">{icon}{title}</h3>
      {children}
    </div>
  );
}

function Row({ onClick, left, leftBg, title, titleAr, sub, subAr }: {
  onClick: () => void; left: ReactNode; leftBg: string; title: string; titleAr?: string; sub?: string; subAr?: boolean;
}) {
  return (
    <button onClick={onClick} className="glass-card-sm w-full p-3 flex items-center gap-3 text-left group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${leftBg}26` }}>{left}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          {titleAr && <p className="text-sm arabic-text text-white/60 flex-shrink-0">{titleAr}</p>}
        </div>
        {sub ? <p className={`text-[10px] text-[color:var(--text-muted)] truncate ${subAr ? 'arabic-text' : ''}`} dir={subAr ? 'rtl' : 'ltr'}>{sub}</p> : null}
      </div>
      <ArrowRight size={14} className="text-[color:var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}
