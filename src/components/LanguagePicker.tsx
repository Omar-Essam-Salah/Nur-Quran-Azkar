import { useState } from 'react';
import { X, Check, Search, Globe } from 'lucide-react';
import { useI18n } from '@/i18n';

// A searchable language sheet. Picking a language changes only the app's
// interface — the Quran text always stays Arabic.
export function LanguagePicker({ onClose }: { onClose: () => void }) {
  const { lang, setLang, languages, t } = useI18n();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const list = languages.filter((l) =>
    !query || l.native.toLowerCase().includes(query) || l.en.toLowerCase().includes(query) || l.code.includes(query));

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center" style={{ background: 'rgba(4,12,16,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl max-h-[82vh] flex flex-col" onClick={(e) => e.stopPropagation()}
        style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1),0.98), rgba(var(--glass-2),0.98))', border: '1px solid rgba(212,175,55,0.25)' }}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-white arabic-text flex items-center gap-2">
              <Globe size={16} className="text-[#14879c]" /> {t('Choose your language', 'اختر لغتك')}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label={t('Close', 'إغلاق')}>
              <X size={18} className="text-[color:var(--text-muted)]" />
            </button>
          </div>
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed">
            {t('The Quran stays in Arabic — only the app interface changes.', 'القرآن يبقى بالعربية — تتغيّر واجهة التطبيق فقط.')}
          </p>
          <div className="relative mt-2.5">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 left-3 text-[color:var(--text-muted)] pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search language…', 'ابحث عن لغة…')}
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none"
              style={{ background: 'rgba(var(--glass-1),0.8)', border: '1px solid rgba(var(--hair),0.12)' }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {list.map((l) => {
            const active = l.code === lang;
            return (
              <button key={l.code} onClick={() => { setLang(l.code); onClose(); }}
                className="w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all"
                style={active ? { background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.4)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: active ? '#d4af37' : '#fff' }} dir={l.code === 'ar' ? 'rtl' : 'ltr'}>{l.native}</p>
                  <p className="text-[10px] text-[color:var(--text-muted)]">{l.en}</p>
                </div>
                {active && <Check size={16} className="text-[#d4af37]" />}
              </button>
            );
          })}
          <div className="h-3" />
        </div>
      </div>
    </div>
  );
}
