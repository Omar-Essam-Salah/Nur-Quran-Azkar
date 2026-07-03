import { useEffect, useState } from 'react';
import { Volume2, Mic2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { listVoices, getPreferredVoice, setPreferredVoice, speakAs, newSpeakerId, ttsSupported, type TtsVoice } from '@/lib/tts';

function VoiceRow({ lang, label, sample }: { lang: string; label: string; sample: string }) {
  const { t } = useI18n();
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [sel, setSel] = useState<string>(() => getPreferredVoice(lang) || '');
  useEffect(() => { let a = true; listVoices(lang).then((v) => { if (a) setVoices(v); }); return () => { a = false; }; }, [lang]);
  const change = (key: string) => { setSel(key); setPreferredVoice(lang, key || null); };

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/80 arabic-text">{label}</label>
      <div className="flex items-center gap-2">
        <select value={sel} onChange={(e) => change(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/5 text-xs text-white outline-none border border-transparent focus:border-[#14879c]/40">
          <option value="" className="bg-[#0c2f44]">{t('Auto (male preferred)', 'تلقائي (يُفضّل صوت رجل)')}</option>
          {voices.map((v) => <option key={v.key} value={v.key} className="bg-[#0c2f44]">{v.name} · {v.lang}</option>)}
        </select>
        <button onClick={() => speakAs(newSpeakerId(), sample, { lang })} className="p-2 rounded-lg bg-[#14879c]/15 hover:bg-[#14879c]/25 flex-shrink-0" title={t('Test', 'استماع')} aria-label="Test">
          <Volume2 size={16} className="text-[#14879c]" />
        </button>
      </div>
      {voices.length === 0 && (
        <p className="text-[10px] text-[#f59e0b] arabic-text leading-snug">
          {t('No voice for this language is installed — add one from the system Text-to-Speech settings.', 'لا يوجد صوت مثبّت لهذه اللغة — أضِفه من إعدادات «تحويل النص إلى كلام» بالنظام.')}
        </p>
      )}
    </div>
  );
}

export function VoiceSettings() {
  const { t } = useI18n();
  if (!ttsSupported()) return null;
  return (
    <div className="glass-card-sm p-4 space-y-3">
      <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider arabic-text flex items-center gap-1.5">
        <Mic2 size={13} className="text-[#d4af37]" /> {t('Read-aloud voice (TTS)', 'صوت القراءة (نطق النصوص)')}
      </h3>
      <VoiceRow lang="ar-SA" label={t('Arabic voice', 'الصوت العربي')} sample="بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ" />
      <VoiceRow lang="en-US" label={t('English voice', 'الصوت الإنجليزي')} sample="In the name of Allah, the Most Gracious, the Most Merciful." />
      <p className="text-[10px] text-[color:var(--text-muted)] arabic-text leading-relaxed">
        {t('Voices come from your device. For the best mature male voice, install the Google Text-to-Speech voices in your phone settings.', 'الأصوات تأتي من جهازك. لأفضل صوت رجّالي واضح، ثبّت أصوات Google TTS من إعدادات هاتفك.')}
      </p>
    </div>
  );
}
