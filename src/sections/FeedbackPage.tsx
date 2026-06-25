import { useState } from 'react';
import { ArrowLeft, Mail, Github, MessageSquarePlus, Check } from 'lucide-react';
import { useI18n } from '@/i18n';

interface FeedbackPageProps { onBack: () => void }

const EMAIL = 'omar.essam.salahh@gmail.com';
const REPO = 'Omar-Essam-Salah/Nur-Quran-Azkar';

export default function FeedbackPage({ onBack }: FeedbackPageProps) {
  const { t } = useI18n();
  const [kind, setKind] = useState<'suggestion' | 'complaint'>('suggestion');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const subject = `Nur — ${kind === 'complaint' ? t('Complaint', 'شكوى') : t('Suggestion', 'اقتراح')}`;

  const sendEmail = () => {
    if (!msg.trim()) return;
    setSent(true);
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
  };
  const openGithub = () => {
    if (!msg.trim()) return;
    setSent(true);
    window.open(`https://github.com/${REPO}/issues/new?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">الشكاوى والمقترحات</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Help us improve Nur', 'ساعدنا نطوّر نُور')}</p>
          </div>
          <MessageSquarePlus size={18} className="text-[#14879c]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-4">
        <div className="glass-card-sm p-4 space-y-4">
          {/* kind */}
          <div className="grid grid-cols-2 gap-2">
            {([['suggestion', t('Suggestion', 'اقتراح')], ['complaint', t('Complaint', 'شكوى')]] as const).map(([k, label]) => {
              const on = kind === k;
              return (
                <button key={k} onClick={() => setKind(k)} className="py-2.5 rounded-xl text-sm arabic-text transition-all"
                  style={{ background: on ? 'rgba(20,135,156,0.18)' : 'rgba(var(--hair),0.04)', color: on ? '#14879c' : 'var(--text-muted)', border: on ? '1px solid rgba(20,135,156,0.35)' : '1px solid transparent' }}>
                  {label}
                </button>
              );
            })}
          </div>

          <textarea
            value={msg} onChange={(e) => { setMsg(e.target.value); setSent(false); }}
            placeholder={t('Write your message here…', 'اكتب رسالتك هنا…')}
            dir={t('ltr', 'rtl')} rows={6}
            className="w-full p-3 rounded-xl bg-white/5 text-sm text-white arabic-text outline-none border border-transparent focus:border-[#14879c]/40 resize-none placeholder:text-[color:var(--text-muted)]/50"
          />

          <button onClick={sendEmail} disabled={!msg.trim()}
            className="glass-btn w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-40">
            {sent ? <Check size={16} className="text-emerald-400" /> : <Mail size={16} />} {t('Send by email', 'إرسال بالبريد')}
          </button>
          <button onClick={openGithub} disabled={!msg.trim()}
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs disabled:opacity-40"
            style={{ background: 'rgba(var(--hair),0.06)', color: 'var(--text-muted)', border: '1px solid rgba(var(--hair),0.1)' }}>
            <Github size={15} /> {t('Open as a GitHub issue', 'فتح كـ Issue على GitHub')}
          </button>

          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed text-center" dir={t('ltr', 'rtl')}>
            {t('Your message goes straight to the developer. Jazak Allahu khayran 🤍', 'رسالتك بتوصل للمطوّر مباشرةً. جزاك الله خيرًا 🤍')}
          </p>
        </div>
      </div>
    </div>
  );
}
