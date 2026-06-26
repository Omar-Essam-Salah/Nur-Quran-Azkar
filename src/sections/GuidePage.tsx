import { useState } from 'react';
import { ArrowLeft, ChevronDown, Droplets, Sun, Building2, Heart } from 'lucide-react';
import { GUIDE, type GuideSection } from '@/data/guide';
import { useI18n } from '@/i18n';

interface GuidePageProps { onBack: () => void }

const SECTION_ICON: Record<string, typeof Droplets> = { droplets: Droplets, sun: Sun, kaaba: Building2, heart: Heart };

export default function GuidePage({ onBack }: GuidePageProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);

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
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t("The Muslim's Guide", 'دليل المسلم')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Purification, prayers, Hajj & Umrah', 'الطهارة والصلاة والحج والعمرة')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-6">
        {GUIDE.map((section) => (
          <Section key={section.id} section={section} open={open} setOpen={setOpen} />
        ))}
        <div className="h-8" />
      </div>
    </div>
  );
}

function Section({ section, open, setOpen }: { section: GuideSection; open: string | null; setOpen: (id: string | null) => void }) {
  const Icon = SECTION_ICON[section.icon] ?? Droplets;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-7 h-7 rounded-lg bg-[#14879c]/15 flex items-center justify-center">
          <Icon size={15} className="text-[#14879c]" />
        </div>
        <h2 className="text-sm font-semibold text-white arabic-text">{section.title}</h2>
        <span className="text-[10px] text-[color:var(--text-muted)]">{section.en}</span>
      </div>

      <div className="space-y-2">
        {section.topics.map((topic) => {
          const isOpen = open === topic.id;
          return (
            <div key={topic.id} className="glass-card-sm overflow-hidden" style={{ scrollMarginTop: '76px' }}>
              <button
                onClick={(e) => {
                  const willOpen = !isOpen;
                  setOpen(willOpen ? topic.id : null);
                  // Bring the opened topic to the top so it loads from its start.
                  if (willOpen) {
                    const card = e.currentTarget.parentElement;
                    setTimeout(() => card?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                  }
                }}
                className="w-full p-4 flex items-center gap-3 text-right"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white arabic-text">{topic.title}</p>
                  <p className="text-[10px] text-[color:var(--text-muted)]">{topic.en}</p>
                </div>
                <ChevronDown size={16} className={`text-[color:var(--text-muted)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3" dir="rtl">
                  {topic.intro && (
                    <p className="text-[13px] arabic-text leading-loose" style={{ color: 'rgba(var(--text-strong-rgb), 0.85)' }}>
                      {topic.intro}
                    </p>
                  )}
                  <ol className="space-y-2.5">
                    {topic.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 mt-0.5 rounded-full bg-[#14879c]/15 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#14879c]">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-[14px] arabic-text leading-loose" style={{ color: 'rgba(var(--text-strong-rgb), 0.92)' }}>{s.text}</p>
                          {s.note && <p className="text-[11px] text-[color:var(--text-muted)] arabic-text mt-0.5">{s.note}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                  {topic.ref && (
                    <p className="text-[11px] text-[#d4af37] arabic-text leading-relaxed border-t border-white/5 pt-2 mt-1">
                      ⚑ {topic.ref}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
