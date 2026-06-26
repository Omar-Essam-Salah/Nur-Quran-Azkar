import { useState } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert, Github, BadgeCheck, BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { useI18n } from '@/i18n';
import { verifyQuranData } from '@/lib/integrity';

interface AuthenticityPageProps { onBack: () => void }

const REPO = 'https://github.com/Omar-Essam-Salah/Nur-Quran-Azkar';
const RELEASES = `${REPO}/releases`;
const CERT_SHA256 = '46:34:0A:2C:8C:CE:9C:A5:DC:22:E2:12:7E:81:8C:C8:97:ED:3E:0F:D1:46:0E:FF:8A:FA:EB:FD:40:A6:D5:F4';

export default function AuthenticityPage({ onBack }: AuthenticityPageProps) {
  const { t, lang } = useI18n();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
  const [progress, setProgress] = useState(0);

  const runVerify = async () => {
    setState('checking');
    setProgress(0);
    const ok = await verifyQuranData((done, total) => setProgress(Math.round((done / total) * 100)));
    setState(ok ? 'ok' : 'bad');
  };

  return (
    <div className="page-enter min-h-screen">
      <header className="sticky top-0 z-40 px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))', border: '1px solid rgba(var(--hair), 0.08)', borderTop: '1px solid rgba(var(--hair), 0.15)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-white arabic-text">{t('Authenticity', 'التوثيق والأصالة')}</h1>
            <p className="text-[10px] text-[color:var(--text-muted)]">{t('Make sure your copy is genuine & unaltered', 'تأكّد أن نسختك أصلية وغير محرّفة')}</p>
          </div>
          <ShieldCheck size={18} className="text-[#10b981]" />
        </div>
      </header>

      <div className="px-4 pt-2 pb-10 max-w-lg mx-auto space-y-4">
        {/* Verify content */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-[#10b981]" />
            <h3 className="text-sm font-semibold text-white arabic-text">{t('Verify the Quran text', 'التحقّق من سلامة نص القرآن')}</h3>
          </div>
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed" dir={dir}>
            {t('This checks the bundled Quran text against the original fingerprint. A match proves it is byte-for-byte authentic and has not been tampered with.',
               'يفحص هذا نص القرآن المدمج ويطابقه ببصمة النسخة الأصلية. التطابق يثبت أنه أصليٌّ حرفًا بحرف ولم يتعرّض لأي تحريف.')}
          </p>

          {state === 'ok' && (
            <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' }}>
              <ShieldCheck size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#10b981] arabic-text leading-relaxed" dir={dir}>
                {t('Verified ✓ — the Quran text is authentic and unaltered.', 'موثّق ✓ — نص القرآن أصليٌّ وغير محرّف.')}
              </p>
            </div>
          )}
          {state === 'bad' && (
            <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
              <ShieldAlert size={18} className="text-[#f87171] flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#f87171] arabic-text leading-relaxed" dir={dir}>
                {t('Warning: the text does NOT match the original. This copy may be altered — do not trust it; reinstall from the official source below.',
                   'تحذير: النص لا يطابق الأصل. قد تكون هذه النسخة محرّفة — لا تثق بها، وأعد التثبيت من المصدر الرسمي بالأسفل.')}
              </p>
            </div>
          )}

          <button onClick={runVerify} disabled={state === 'checking'}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60"
            style={{ background: 'rgba(16,185,129,0.16)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            {state === 'checking'
              ? <><Loader2 size={16} className="animate-spin" /> {t('Verifying…', 'جارٍ التحقّق…')} {progress}%</>
              : <><ShieldCheck size={16} /> {t('Verify content integrity', 'تحقّق من سلامة المحتوى')}</>}
          </button>
        </div>

        {/* Official sources */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">{t('Official sources only', 'المصادر الرسمية فقط')}</h3>
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed" dir={dir}>
            {t('Only download Nur from these official links. Copies from anywhere else are not endorsed and may be altered.',
               'حمّل «نُور» فقط من الروابط الرسمية دي. أي نسخة من مكان تاني غير معتمدة وقد تكون محرّفة.')}
          </p>
          <button onClick={() => window.open(RELEASES, '_blank')} className="w-full glass-btn py-2.5 flex items-center justify-center gap-2 text-sm">
            <Github size={15} /> {t('Official releases (GitHub)', 'النسخ الرسمية (GitHub)')} <ExternalLink size={13} />
          </button>
        </div>

        {/* Signing certificate */}
        <div className="glass-card-sm p-4 space-y-2">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text">{t('Official signing certificate', 'شهادة التوقيع الرسمية')}</h3>
          <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed" dir={dir}>
            {t('Genuine builds are signed with this certificate (SHA-256). A copy with a different signature is not from us.',
               'النسخ الأصلية موقَّعة بهذه الشهادة (SHA-256). أي نسخة بتوقيع مختلف ليست منّا.')}
          </p>
          <p className="text-[10px] text-[#d4af37] font-mono break-all leading-relaxed bg-black/20 rounded-lg p-2" dir="ltr">{CERT_SHA256}</p>
        </div>

        {/* Quran source */}
        <div className="glass-card-sm p-4 flex items-start gap-2.5">
          <BookOpen size={15} className="text-[#14879c] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[color:var(--text-muted)] arabic-text leading-relaxed" dir={dir}>
            {t('The Quran text is the authentic Hafs ‘an ‘Asim narration of the Madani mushaf (Uthmani script). Translations, recitations and tafsir are from their published sources, used unaltered.',
               'نص القرآن هو رواية حفص عن عاصم من المصحف المدني (الرسم العثماني). والترجمات والتلاوات والتفاسير من مصادرها المنشورة، مستخدَمة دون أي تغيير.')}
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
