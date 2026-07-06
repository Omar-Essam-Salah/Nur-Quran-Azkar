import { useState } from 'react';
import { ArrowLeft, ChevronDown, Copy, Heart, Plane, BookOpen, HeartPulse, ShieldCheck, Coins, Sparkles, CloudRain, Building2, Home, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { DUA_CATEGORIES, type DuaCategory, type Dua } from '@/data/duas';
import { SpeakButton } from '@/components/SpeakButton';
import { useI18n } from '@/i18n';

interface Props { onBack: () => void }

const ICON: Record<string, typeof Heart> = {
  heart: Heart, plane: Plane, book: BookOpen, pulse: HeartPulse, shield: ShieldCheck,
  coins: Coins, sparkles: Sparkles, rain: CloudRain, mosque: Building2, home: Home, food: Utensils,
};

export default function DuasPage({ onBack }: Props) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [open, setOpen] = useState<string | null>(DUA_CATEGORIES[0]?.id ?? null);

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Duʿāʾ for every situation', 'أدعية لكل موقف')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Authentic supplications with their sources', 'أدعية صحيحة بمصادرها')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-2.5">
        {DUA_CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} isAr={isAr} open={open === cat.id} onToggle={() => setOpen(open === cat.id ? null : cat.id)} />
        ))}
        <div className="h-8" />
      </div>
    </div>
  );
}

function CategoryCard({ cat, isAr, open, onToggle }: { cat: DuaCategory; isAr: boolean; open: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  const Icon = ICON[cat.icon] ?? Heart;
  return (
    <div className="glass-card-sm overflow-hidden" style={{ scrollMarginTop: '76px' }}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-right">
        <div className="w-9 h-9 rounded-xl bg-[#14879c]/15 flex items-center justify-center flex-shrink-0">
          <Icon size={17} className="text-[#14879c]" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-semibold text-white arabic-text">{isAr ? cat.title : cat.en}</p>
          <p className="text-[10px] text-[color:var(--text-muted)]">{isAr ? cat.en : cat.title} · {cat.duas.length} {t('duʿāʾ', 'دعاء')}</p>
        </div>
        <ChevronDown size={16} className={`text-[color:var(--text-muted)] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-3">
          {cat.duas.map((d, i) => <DuaBlock key={i} dua={d} isAr={isAr} />)}
        </div>
      )}
    </div>
  );
}

function DuaBlock({ dua, isAr }: { dua: Dua; isAr: boolean }) {
  const { t } = useI18n();
  const copy = () => {
    const text = `${dua.ar}\n${dua.en}\n— ${isAr ? dua.ref : dua.refEn}`;
    navigator.clipboard?.writeText(text).then(
      () => toast.success(t('Copied', 'تم النسخ')),
      () => toast.error(t('Could not copy', 'تعذّر النسخ')),
    );
  };
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.16)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="arabic-text text-[17px] leading-loose text-white flex-1" dir="rtl">{dua.ar}</p>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <SpeakButton text={dua.ar} lang="ar-SA" size={15} />
          <button onClick={copy} className="p-1.5 rounded-lg hover:bg-white/10" aria-label={t('Copy', 'نسخ')}>
            <Copy size={14} className="text-[color:var(--text-muted)]" />
          </button>
        </div>
      </div>
      {dua.translit && <p className="text-[11px] text-[#14879c] italic mt-1.5 leading-snug" dir="ltr">{dua.translit}</p>}
      <p className="text-[12px] text-[color:var(--text-muted)] mt-1.5 leading-relaxed" dir="ltr">{dua.en}</p>
      <p className="text-[11px] text-[#d4af37] arabic-text mt-2 pt-1.5 border-t border-white/5">⚑ {isAr ? dua.ref : dua.refEn}</p>
    </div>
  );
}
