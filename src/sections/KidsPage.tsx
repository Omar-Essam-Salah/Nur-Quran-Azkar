import { ArrowLeft, Play, Star, Sparkles, Hash } from 'lucide-react';
import type { Page } from '@/types';
import { surahList } from '@/data/surahList';
import { useI18n } from '@/i18n';

interface KidsPageProps {
  onBack: () => void;
  onOpenSurah: (n: number) => void;
  onNavigate: (p: Page) => void;
}

// Short, easy surahs to start memorizing — bright cards, big touch targets.
const SHORT_SURAHS = [1, 112, 113, 114, 108, 110, 111, 109, 106, 105, 107, 103];
const COLORS = ['#f59e0b', '#14879c', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#6366f1', '#0ea5e9'];

export default function KidsPage({ onBack, onOpenSurah, onNavigate }: KidsPageProps) {
  const { t } = useI18n();

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(20,135,156,0.12))', border: '1px solid rgba(212,175,55,0.2)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t("Kids' Corner", 'ركن الأطفال')} 🌙</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={t('ltr', 'rtl')}>{t('Short surahs to learn & repeat', 'سور قصيرة نتعلّمها ونردّدها')}</p>
          </div>
          <Star size={20} className="text-[#d4af37]" fill="currentColor" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-5">
        <div className="glass-card p-5 text-center space-y-1">
          <p className="text-2xl">🤍📖</p>
          <p className="text-sm text-white arabic-text">{t('Tap a surah to listen and repeat after the reciter.', 'اضغط على السورة عشان تسمعها وتردّد ورا الشيخ.')}</p>
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text" dir={t('ltr', 'rtl')}>{t('Tip: use the repeat button to loop an ayah.', 'فكرة: استخدم زر التكرار عشان يعيد الآية.')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SHORT_SURAHS.map((n, i) => {
            const s = surahList.find((x) => x.number === n);
            if (!s) return null;
            const color = COLORS[i % COLORS.length];
            return (
              <button key={n} onClick={() => onOpenSurah(n)}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-transform active:scale-95"
                // Vibrant, opaque card so the white text stays readable in BOTH day & night.
                style={{ background: `linear-gradient(135deg, ${color}f2, ${color}c4)`, border: `1px solid ${color}`, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <Play size={20} className="text-white ml-0.5" fill="currentColor" />
                </div>
                <p className="text-base font-bold text-white arabic-text leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>{s.name}</p>
                <p className="text-[10px] text-white/85 arabic-text">{s.verses} {t('verses', 'آية')}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider px-1 arabic-text">{t('More', 'كمان')}</h3>
          <button onClick={() => onNavigate('azkar')} className="glass-card-sm w-full p-4 flex items-center gap-4 text-left">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
              <Sparkles size={20} className="text-[#d4af37]" />
            </div>
            <p className="flex-1 text-sm font-medium text-white arabic-text">{t('Little Adhkar', 'أذكاري الصغيرة')}</p>
          </button>
          <button onClick={() => onNavigate('tasbih')} className="glass-card-sm w-full p-4 flex items-center gap-4 text-left">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,135,156,0.15)' }}>
              <Hash size={20} className="text-[#14879c]" />
            </div>
            <p className="flex-1 text-sm font-medium text-white arabic-text">{t('Counting beads (Tasbih)', 'السبحة — نعدّ التسبيح')}</p>
          </button>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
