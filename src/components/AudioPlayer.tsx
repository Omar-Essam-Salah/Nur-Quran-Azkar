import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Download, Loader2, Check, Trash2, X, Square,
  Repeat, Gauge, SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Reciter } from '@/data/reciters';
import { downloadSurahAudio, deleteSurahAudio, isSurahAudioDownloaded } from '@/lib/contentCache';
import type { SurahPlayer, PlayerVerse } from '@/hooks/useSurahAudio';
import { useI18n } from '@/i18n';

interface AudioPlayerProps {
  reciter: Reciter;
  chapter: number;
  surahEnglishName: string;
  surahName?: string; // Arabic surah name
  verses: PlayerVerse[];
  audio: SurahPlayer;
}

const SPEEDS = [0.5, 0.75, 1]; // slow-down only (no speed-up) — gentler for learning
const TIMES = [
  { label: '3×', value: 3 },
  { label: '5×', value: 5 },
  { label: '7×', value: 7 },
  { label: '∞', value: 0 },
];

export default function AudioPlayer({ reciter, chapter, surahEnglishName, surahName, verses, audio }: AudioPlayerProps) {
  const { t, lang } = useI18n();
  const reciterName = lang === 'ar' ? reciter.arabicName : reciter.name;
  const surahLabel = lang === 'ar' ? (surahName ?? surahEnglishName) : surahEnglishName;
  const [downloaded, setDownloaded] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState({ done: 0, total: 0 });
  const [showTools, setShowTools] = useState(false);
  const [fromVal, setFromVal] = useState(1);
  const [toVal, setToVal] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const maxAyah = verses.length;
  const ayahNumbers = verses.map((v) => v.ayah);
  const downloadable = verses.filter((v) => !!v.audioUrl).map((v) => ({ ayah: v.ayah, url: v.audioUrl as string }));

  useEffect(() => {
    let active = true;
    setDownloaded(null);
    isSurahAudioDownloaded(reciter.apiId, chapter)
      .then((v) => active && setDownloaded(v))
      .catch(() => active && setDownloaded(false));
    return () => {
      active = false;
    };
  }, [reciter.apiId, chapter]);

  useEffect(() => () => abortRef.current?.abort(), [reciter.apiId, chapter]);

  const openTools = () => {
    const a = audio.playingAyah ?? 1;
    setFromVal(a);
    setToVal(a);
    setShowTools((s) => !s);
  };

  const handleDownload = async () => {
    if (!downloadable.length) {
      // No per-ayah URLs yet (audio not loaded for this reciter) — tell the user
      // instead of silently doing nothing, and start playback to fetch the URLs.
      toast(t('Play the surah once, then download', 'شغّل السورة مرّة ثم حمّلها'), {
        description: t('Tap an ayah to load this reciter’s audio, then the download will work.', 'اضغط آية لتحميل صوت هذا القارئ، ثم سيعمل التحميل.'),
      });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setDownloading(true);
    setDlProgress({ done: 0, total: downloadable.length });
    toast(t('Downloading…', 'جارٍ التحميل…'), { description: `${surahLabel} — ${reciterName}` });
    try {
      const r = await downloadSurahAudio(reciter.apiId, chapter, downloadable, setDlProgress, controller.signal);
      if (r.quotaExceeded) {
        toast(t('Storage is full', 'مساحة التخزين ممتلئة'), { description: t('Free up space or remove some downloaded surahs, then try again.', 'فرّغ بعض المساحة أو احذف سورًا محمّلة ثم حاول مجددًا.') });
      } else if (r.saved === 0) {
        toast(t('Download failed', 'فشل التحميل'), { description: t('Couldn’t reach the audio server for this reciter. Try another reciter or check your connection.', 'تعذّر الوصول لخادم الصوت لهذا القارئ. جرّب قارئًا آخر أو تحقّق من اتصالك.') });
      } else if (r.failed > 0) {
        setDownloaded(false); // partial — let the user tap again to fill the gaps
        toast(t('Partly saved', 'تم حفظ جزء'), { description: t(`${r.saved}/${r.total} ayat saved. Tap download again to finish.`, `تم حفظ ${r.saved}/${r.total} آية. اضغط تحميل مرّة أخرى لإكمال الباقي.`) });
      } else {
        setDownloaded(true);
        toast(t('Saved for offline ✓', 'تم الحفظ للاستماع دون إنترنت ✓'), { description: `${surahLabel} — ${reciterName}` });
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') toast(t('Download failed', 'فشل التحميل'), { description: t('Check your connection and try again.', 'تحقّق من اتصالك وحاول مرّة أخرى.') });
    } finally {
      setDownloading(false);
      abortRef.current = null;
    }
  };

  const handleDelete = async () => {
    await deleteSurahAudio(reciter.apiId, chapter, ayahNumbers);
    setDownloaded(false);
    toast(t('Removed offline audio', 'تمّت إزالة الصوت المحمّل'), { description: surahLabel });
  };

  const applyRepeat = (times: number) => {
    const from = Math.min(Math.max(1, fromVal), maxAyah || 1);
    const to = Math.min(Math.max(from, toVal), maxAyah || 1);
    audio.setRepeat({ from, to, times });
    // Always jump to the start of the range so the repeat begins on the chosen
    // ayah immediately — otherwise picking an ayah while another is playing set
    // the range but never actually looped it.
    audio.play(from);
  };

  const pct = dlProgress.total > 0 ? Math.round((dlProgress.done / dlProgress.total) * 100) : 0;
  const rpt = audio.repeat;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-3 pointer-events-none" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <div
        className="mx-auto max-w-lg rounded-2xl overflow-hidden pointer-events-auto"
        style={{
          // Opaque (no backdrop-blur): this bar is visible all through recitation,
          // and blur re-rasterises every frame over the scrolling/snow behind it.
          background: 'linear-gradient(135deg, rgb(var(--glass-1)), rgb(var(--glass-2)))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="h-0.5 bg-white/5">
          <div className="h-full bg-[#14879c] transition-[width] duration-200" style={{ width: `${Math.round(audio.progress * 100)}%` }} />
        </div>

        {/* Tools panel */}
        {showTools && (
          <div className="px-4 py-3 space-y-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Gauge size={13} className="text-[color:var(--text-muted)]" />
              <span className="text-[10px] text-[color:var(--text-muted)] uppercase w-12 arabic-text">{t('Speed', 'السرعة')}</span>
              <div className="flex gap-1 flex-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => audio.setRate(s)}
                    className="flex-1 py-1 rounded-lg text-[11px] transition-all"
                    style={{ background: audio.rate === s ? 'rgba(20,135,156,0.25)' : 'rgba(255,255,255,0.04)', color: audio.rate === s ? '#14879c' : 'var(--text-muted)' }}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Repeat size={13} className="text-[color:var(--text-muted)]" />
              <span className="text-[10px] text-[color:var(--text-muted)] uppercase w-12 arabic-text">{t('Repeat', 'التكرار')}</span>
              <div className="flex items-center gap-1 text-[11px] text-white">
                <input type="number" min={1} max={maxAyah} value={fromVal}
                  onChange={(e) => setFromVal(Number(e.target.value))}
                  className="w-11 px-1 py-1 rounded-md bg-white/5 text-center outline-none" />
                <span className="text-[color:var(--text-muted)]">→</span>
                <input type="number" min={1} max={maxAyah} value={toVal}
                  onChange={(e) => setToVal(Number(e.target.value))}
                  className="w-11 px-1 py-1 rounded-md bg-white/5 text-center outline-none" />
              </div>
              <div className="flex gap-1 flex-1 justify-end">
                {TIMES.map((t) => {
                  const on = rpt && rpt.times === t.value && rpt.from === Math.min(fromVal, toVal);
                  return (
                    <button key={t.label} onClick={() => applyRepeat(t.value)}
                      className="px-2 py-1 rounded-lg text-[11px] transition-all"
                      style={{ background: on ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)', color: on ? '#d4af37' : 'var(--text-muted)' }}>
                      {t.label}
                    </button>
                  );
                })}
                <button onClick={() => audio.setRepeat(null)}
                  className="px-2 py-1 rounded-lg text-[11px] transition-all"
                  style={{ background: !rpt ? 'rgba(20,135,156,0.25)' : 'rgba(255,255,255,0.04)', color: !rpt ? '#14879c' : 'var(--text-muted)' }}>
                  {t('Off', 'إيقاف')}
                </button>
              </div>
            </div>
            {rpt && (
              <p className="text-[10px] text-[#d4af37]/80 arabic-text" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {t('Repeating ayah', 'تكرار الآية')} {rpt.from}{rpt.to !== rpt.from ? `–${rpt.to}` : ''} · {rpt.times === 0 ? '∞' : `${rpt.times}×`}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium text-white truncate ${lang === 'ar' ? 'arabic-text' : ''}`}>{reciterName}</p>
            <p className="text-[10px] text-[color:var(--text-muted)] truncate arabic-text" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {downloading
                ? `${t('Downloading…', 'جارٍ التحميل…')} ${dlProgress.done}/${dlProgress.total} (${pct}%)`
                : audio.playingAyah
                  ? `${surahLabel} · ${t('Ayah', 'آية')} ${audio.playingAyah}${rpt ? ' · 🔁' : ''}${audio.rate !== 1 ? ` · ${audio.rate}×` : ''}`
                  : `${surahLabel} · ${reciter.style ?? 'Murattal'}`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={openTools} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Speed & repeat"
              style={showTools ? { background: 'rgba(20,135,156,0.15)' } : undefined}>
              <SlidersHorizontal size={15} className={showTools || rpt || audio.rate !== 1 ? 'text-[#14879c]' : 'text-[color:var(--text-muted)]'} />
            </button>
            <button onClick={audio.prev} disabled={!audio.playingAyah || audio.playingAyah <= 1}
              className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-30" aria-label="Previous ayah">
              <SkipBack size={16} className="text-[color:var(--text-muted)]" />
            </button>
            <button onClick={() => audio.toggle()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#14879c] hover:bg-[#1697ae] transition-all shadow-lg shadow-[#14879c]/30"
              aria-label={audio.isPlaying ? 'Pause' : 'Play'}>
              {audio.loading ? <Loader2 size={18} className="text-white animate-spin" />
                : audio.isPlaying ? <Pause size={18} className="text-white" fill="currentColor" />
                : <Play size={18} className="text-white ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={audio.next} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Next ayah">
              <SkipForward size={16} className="text-[color:var(--text-muted)]" />
            </button>
            {audio.playingAyah && (
              <button onClick={audio.stop} className="p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Stop">
                <Square size={14} className="text-[color:var(--text-muted)]" fill="currentColor" />
              </button>
            )}
          </div>

          <div className="pl-1 border-l border-white/10">
            {downloading ? (
              <button onClick={() => abortRef.current?.abort()} className="relative p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Cancel download" title={`Downloading ${pct}% — tap to cancel`}>
                <Loader2 size={18} className="text-[#14879c] animate-spin" />
                <X size={10} className="text-white absolute inset-0 m-auto" />
              </button>
            ) : downloaded ? (
              <button onClick={handleDelete} className="group p-2 rounded-lg hover:bg-white/10 transition-all" aria-label="Remove offline audio" title="Saved offline — tap to remove">
                <Check size={18} className="text-emerald-400 group-hover:hidden" />
                <Trash2 size={18} className="text-red-400 hidden group-hover:block" />
              </button>
            ) : (
              <button onClick={handleDownload} disabled={!downloadable.length} className="p-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-30" aria-label="Download for offline" title="Download this surah for offline listening">
                <Download size={18} className="text-[color:var(--text-muted)]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
