import { ArrowLeft, Moon, Sun, Monitor, Type, Languages, BookOpen, Trash2, AlertTriangle, AudioLines, Globe, Search, Check, X, Play, Square, Loader2, DatabaseBackup, Copy, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { RECITERS, everyayahUrl, type Reciter } from '@/data/reciters';
import { useTranslationsList } from '@/hooks/useTranslationsList';
import { POPULAR_TRANSLATIONS, DEFAULT_TRANSLATION_IDS, translationLabel } from '@/data/translations';
import { absoluteAudioUrl } from '@/lib/quranApi';
import { SILENT_AUDIO } from '@/hooks/useSurahAudio';
import { exportData, importData } from '@/lib/backup';
import { isPrayerDnd, setPrayerDnd } from '@/lib/reminders';
import { useI18n } from '@/i18n';
import type { AppSettings } from '@/types';

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  onBack: () => void;
}

export default function SettingsPage({ settings, setSettings, onBack }: SettingsPageProps) {
  const { t: tr, lang, setLang } = useI18n();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [trQuery, setTrQuery] = useState('');
  const { list: trCatalogue } = useTranslationsList();

  // ── Reciter sample preview (does NOT change the active reciter) ──
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewTimer = useRef<number | undefined>(undefined);
  const previewToken = useRef(0); // guards against rapid switching between reciters
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const stopPreview = () => {
    previewToken.current++; // invalidate any in-flight preview
    window.clearTimeout(previewTimer.current);
    if (previewRef.current) { try { previewRef.current.pause(); previewRef.current.removeAttribute('src'); } catch { /* ignore */ } }
    setPreviewing(null);
    setPreviewLoading(false);
  };

  const previewReciter = async (r: Reciter) => {
    if (previewing === r.id) { stopPreview(); return; }
    stopPreview();
    const token = ++previewToken.current;
    if (!previewRef.current) {
      previewRef.current = new Audio();
      previewRef.current.onended = () => setPreviewing(null);
      previewRef.current.onerror = () => { if (token === previewToken.current) { setPreviewing(null); setPreviewLoading(false); } };
    }
    const a = previewRef.current;
    // Warm up audio on a SEPARATE throwaway element so the later play() isn't
    // blocked by the autoplay policy.
    try { const s = new Audio(SILENT_AUDIO); s.volume = 0; const up = s.play(); if (up) up.then(() => s.pause()).catch(() => {}); } catch { /* ignore */ }
    try {
      setPreviewing(r.id);
      setPreviewLoading(true);
      // Al-Fatihah ayah 1 for this reciter — short and recognizable.
      let url: string | null;
      if (r.everyayah) {
        url = everyayahUrl(r.everyayah, 1, 1);
      } else {
        const res = await fetch(`https://api.quran.com/api/v4/recitations/${r.apiId}/by_ayah/1:1`);
        const data = await res.json();
        url = absoluteAudioUrl(data?.audio_files?.[0]?.url ?? null);
      }
      if (token !== previewToken.current) return; // a newer preview took over
      if (!url) { if (token === previewToken.current) stopPreview(); return; }
      a.src = url;
      await a.play();
      if (token !== previewToken.current) { try { a.pause(); } catch { /* ignore */ } return; }
      setPreviewLoading(false);
      previewTimer.current = window.setTimeout(stopPreview, 8000); // ~8s snippet
    } catch {
      if (token === previewToken.current) stopPreview();
    }
  };

  const selectedTr = settings.translationIds ?? DEFAULT_TRANSLATION_IDS;
  const allTr = [
    ...POPULAR_TRANSLATIONS,
    ...trCatalogue.filter((t) => !POPULAR_TRANSLATIONS.some((p) => p.id === t.id)),
  ];
  const q = trQuery.trim().toLowerCase();
  const filteredTr = (q
    ? allTr.filter((t) => t.name.toLowerCase().includes(q) || t.language.toLowerCase().includes(q))
    : allTr
  ).slice(0, 40);

  const toggleTr = (id: number) => {
    setSettings((prev) => {
      const cur = prev.translationIds ?? DEFAULT_TRANSLATION_IDS;
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, translationIds: next };
    });
  };

  const [dnd, setDnd] = useState(isPrayerDnd());

  // ── Backup & restore (move data to a new phone) ──
  const [exportCode, setExportCode] = useState('');
  const [importText, setImportText] = useState('');

  const doExport = () => setExportCode(exportData());
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(exportCode); toast(tr('Copied', 'تم النسخ'), { description: tr('Send this code to your other phone and paste it there.', 'أرسل الكود لهاتفك الآخر والصقه هناك.') }); }
    catch { toast(tr('Select & copy the code manually', 'حدّد الكود وانسخه يدويًا')); }
  };
  const doImport = () => {
    const n = importData(importText);
    if (n < 0) { toast(tr('Invalid code', 'كود غير صالح'), { description: tr('Please paste a valid backup code.', 'الصق كود نسخٍ احتياطيٍّ صحيح.') }); return; }
    toast(tr('Restored', 'تم الاسترجاع'), { description: tr('Your data was restored. Restarting…', 'تمّ استرجاع بياناتك. إعادة التشغيل…') });
    setTimeout(() => window.location.reload(), 900);
  };

  const handleClearData = () => {
    localStorage.removeItem('nur-bookmarks');
    localStorage.removeItem('nur-last-read');
    localStorage.removeItem('nur-tasbih-counts');
    localStorage.removeItem('nur-tasbih-active');
    // Don't clear settings
    setShowClearConfirm(false);
    window.location.reload();
  };

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3">
        <div 
          className="mx-auto max-w-lg flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.6), rgba(var(--glass-2), 0.7))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
          </button>
          <h1 className="text-lg font-semibold text-white">{tr('Settings', 'الإعدادات')}</h1>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {/* Language */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={12} />
            {tr('Language', 'اللغة')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'ar' as const, label: 'العربية' },
              { value: 'en' as const, label: 'English' },
            ]).map((o) => {
              const on = lang === o.value;
              return (
                <button key={o.value} onClick={() => setLang(o.value)}
                  className="py-2.5 rounded-xl text-sm transition-all"
                  style={{ background: on ? 'rgba(20,135,156,0.15)' : 'rgba(var(--hair),0.03)', color: on ? '#14879c' : 'var(--text-muted)', border: on ? '1px solid rgba(20,135,156,0.3)' : '1px solid transparent' }}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Monitor size={12} />
            {tr('Theme', 'المظهر')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'dark', label: 'Dark', ar: 'داكن', icon: Moon },
              { value: 'light', label: 'Light', ar: 'فاتح', icon: Sun },
              { value: 'auto', label: 'Auto', ar: 'تلقائي', icon: Monitor },
            ] as const).map((option) => {
              const Icon = option.icon;
              const isActive = settings.theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSettings(prev => ({ ...prev, theme: option.value }))}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                  style={{
                    background: isActive ? 'rgba(20, 135, 156, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '1px solid rgba(20, 135, 156, 0.3)' : '1px solid transparent',
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? '#14879c' : 'var(--text-muted)' }} />
                  <span className="text-[10px]" style={{ color: isActive ? '#14879c' : 'var(--text-muted)' }}>
                    {tr(option.label, option.ar)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display */}
        <div className="glass-card-sm p-4 space-y-4">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Type size={12} />
            {tr('Display', 'العرض')}
          </h3>
          
          {/* Arabic Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/80">{tr('Arabic Font Size', 'حجم الخط العربي')}</label>
              <span className="text-xs text-[#14879c]">{settings.arabicFontSize}px</span>
            </div>
            <input
              type="range"
              min={16}
              max={48}
              value={settings.arabicFontSize}
              onChange={(e) => setSettings(prev => ({ ...prev, arabicFontSize: Number(e.target.value) }))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#14879c]"
            />
            <div className="text-center pt-1">
              <span className="arabic-text text-[#d4af37]" style={{ fontSize: `${settings.arabicFontSize}px`, lineHeight: 1.8 }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
            </div>
          </div>

          {/* Translation Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/80">{tr('Translation Font Size', 'حجم خط الترجمة')}</label>
              <span className="text-xs text-[#14879c]">{settings.translationFontSize}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={24}
              value={settings.translationFontSize}
              onChange={(e) => setSettings(prev => ({ ...prev, translationFontSize: Number(e.target.value) }))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#14879c]"
            />
          </div>

          {/* Show Translation Toggle */}
          <div className="flex items-center justify-between pt-2">
            <label className="text-xs text-white/80 flex items-center gap-1.5">
              <Languages size={12} className="text-[color:var(--text-muted)]" />
              {tr('Show Translation', 'إظهار الترجمة')}
            </label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, showTranslation: !prev.showTranslation }))}
              className="w-10 h-6 rounded-full transition-all relative"
              style={{
                background: settings.showTranslation ? 'rgba(20, 135, 156, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{
                  left: settings.showTranslation ? '22px' : '4px',
                }}
              />
            </button>
          </div>

          {/* Show Transliteration Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/80 flex items-center gap-1.5">
              <BookOpen size={12} className="text-[color:var(--text-muted)]" />
              {tr('Show Transliteration', 'إظهار النطق')}
            </label>
            <button
              onClick={() => setSettings(prev => ({ ...prev, showTransliteration: !prev.showTransliteration }))}
              className="w-10 h-6 rounded-full transition-all relative"
              style={{
                background: settings.showTransliteration ? 'rgba(20, 135, 156, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{
                  left: settings.showTransliteration ? '22px' : '4px',
                }}
              />
            </button>
          </div>
        </div>

        {/* Recitation */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <AudioLines size={12} />
            {tr('Recitation', 'التلاوة')}
          </h3>
          <div className="space-y-2">
            {RECITERS.map((r) => {
              const isActive = settings.reciter === r.id;
              const isPrev = previewing === r.id;
              return (
                <div
                  key={r.id}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl transition-all"
                  style={{
                    background: isActive ? 'rgba(20, 135, 156, 0.15)' : 'rgba(var(--hair), 0.03)',
                    border: isActive ? '1px solid rgba(20, 135, 156, 0.3)' : '1px solid transparent',
                  }}
                >
                  {/* Listen sample */}
                  <button
                    onClick={() => previewReciter(r)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: isPrev ? 'rgba(212,175,55,0.2)' : 'rgba(20,135,156,0.12)' }}
                    title={tr('Listen to a sample', 'استماع لعيّنة')}
                    aria-label="Listen sample"
                  >
                    {isPrev && previewLoading
                      ? <Loader2 size={15} className="text-[#d4af37] animate-spin" />
                      : isPrev
                        ? <Square size={13} className="text-[#d4af37]" fill="currentColor" />
                        : <Play size={14} className="text-[#14879c] ml-0.5" fill="currentColor" />}
                  </button>

                  {/* Select reciter */}
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, reciter: r.id }))}
                    className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm arabic-text truncate" style={{ color: isActive ? '#14879c' : 'rgb(var(--text-strong-rgb))' }}>
                        {r.arabicName}
                      </p>
                      <p className="text-[10px] text-[color:var(--text-muted)] truncate">{r.name}</p>
                    </div>
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 border"
                      style={{
                        borderColor: isActive ? '#14879c' : 'rgba(var(--hair),0.25)',
                        background: isActive ? '#14879c' : 'transparent',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[color:var(--text-muted)]/60 leading-relaxed">
            {tr('Tap any ayah in the reader to listen. Use the download button to save a surah for offline listening.', 'اضغط على أي آية في القارئ للاستماع، واستخدم زر التحميل لحفظ السورة للاستماع بدون إنترنت.')}
          </p>
        </div>

        {/* Translations */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={12} />
            {tr('Translations', 'الترجمات')}
            <span className="text-[#14879c] normal-case">· {selectedTr.length} {tr('selected', 'مختارة')}</span>
          </h3>

          {/* Selected chips */}
          <div className="flex flex-wrap gap-1.5">
            {selectedTr.length === 0 && <span className="text-[10px] text-[color:var(--text-muted)]">{tr('None — Arabic only', 'بدون — عربي فقط')}</span>}
            {selectedTr.map((id) => (
              <button
                key={id}
                onClick={() => toggleTr(id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] max-w-full"
                style={{ background: 'rgba(20, 135, 156, 0.15)', color: '#14879c' }}
                title="Remove"
              >
                <span className="truncate">{translationLabel(id, trCatalogue)}</span>
                <X size={10} className="flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <input
              value={trQuery}
              onChange={(e) => setTrQuery(e.target.value)}
              placeholder={tr('Search translations (English, Urdu, French…)', 'ابحث في الترجمات (إنجليزي، أردو، فرنسي…)')}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 text-xs text-white placeholder:text-[color:var(--text-muted)] outline-none border border-transparent focus:border-[#14879c]/40"
            />
          </div>

          {/* Results */}
          <div className="max-h-56 overflow-y-auto space-y-1 -mx-1 px-1">
            {filteredTr.map((t) => {
              const on = selectedTr.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTr(t.id)}
                  className="w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left hover:bg-white/5 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate">{t.name}</p>
                    <p className="text-[9px] text-[color:var(--text-muted)] capitalize">{t.language}</p>
                  </div>
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: on ? '#14879c' : 'transparent', border: on ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
                  >
                    {on && <Check size={10} className="text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* About */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">{tr('About Nur', 'عن نور')}</h3>
          <div className="space-y-2 text-xs text-white/70 arabic-text" dir={tr('ltr', 'rtl')}>
            <p>
              {tr('Nur is a free, ad-free Quran and Azkar app for Muslims everywhere — a serene, distraction-free space for daily devotion.',
                  'نُور تطبيق قرآن وأذكار مجاني بلا إعلانات لكل المسلمين — مساحة هادئة خالية من المشتّتات للعبادة اليومية.')}
            </p>
            <p className="text-[color:var(--text-muted)]">
              {tr('Adhkar are compiled from Sahih al-Bukhari, Sahih Muslim and other authentic sources.',
                  'الأذكار مجموعة من صحيح البخاري وصحيح مسلم وغيرها من المصادر الموثوقة.')}
            </p>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-[color:var(--text-muted)]">{tr('Version', 'الإصدار')} 1.0.0</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{tr('Made with love for the Ummah', 'صُنع بحبٍّ للأمّة')}</p>
            </div>
          </div>
        </div>

        {/* Prayer Focus — in-app Do Not Disturb */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Moon size={12} />
            {tr('Prayer Focus', 'سكون وقت الصلاة')}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-3">
              <label className="text-xs text-white/80 arabic-text block" dir={tr('ltr', 'rtl')}>{tr('Silence reminders around prayer times', 'إيقاف التذكيرات حول مواعيد الصلاة')}</label>
              <p className="text-[10px] text-[color:var(--text-muted)] arabic-text mt-0.5" dir={tr('ltr', 'rtl')}>{tr('In-app — pauses the gentle nudges ±25 min around each prayer.', 'داخل التطبيق — يوقف التنبيهات ٢٥ دقيقة حول كل صلاة.')}</p>
            </div>
            <button onClick={() => { const v = !dnd; setDnd(v); setPrayerDnd(v); }}
              className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: dnd ? 'rgba(20,135,156,0.4)' : 'rgba(255,255,255,0.1)' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: dnd ? '22px' : '4px' }} />
            </button>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <DatabaseBackup size={12} />
            {tr('Backup & Restore', 'النسخ الاحتياطي')}
          </h3>
          <p className="text-[11px] text-[color:var(--text-muted)] leading-relaxed arabic-text" dir={tr('ltr', 'rtl')}>
            {tr('Move your bookmarks, reading progress, tasbih and Soul Ledger to another phone. (Downloaded audio simply re-downloads there.)', 'انقل علاماتك وتقدّمك في القراءة وتسبيحك وسجل خيراتك إلى هاتفٍ آخر. (الأصوات المحمّلة تُنزَّل من جديد هناك.)')}
          </p>

          <button onClick={doExport} className="glass-btn w-full py-2.5 text-xs flex items-center justify-center gap-2">
            <DatabaseBackup size={14} /> {tr('Create backup code', 'إنشاء كود نسخة احتياطية')}
          </button>
          {exportCode && (
            <div className="space-y-2">
              <textarea readOnly value={exportCode} onFocus={(e) => e.currentTarget.select()}
                className="w-full h-20 p-2 rounded-lg bg-white/5 text-[10px] text-[color:var(--text-muted)] font-mono outline-none resize-none custom-scrollbar" />
              <button onClick={doCopy} className="w-full py-2 rounded-lg text-xs bg-[#14879c]/20 text-[#14879c] flex items-center justify-center gap-2">
                <Copy size={13} /> {tr('Copy code', 'نسخ الكود')}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 space-y-2">
            <p className="text-[11px] text-white/70 arabic-text" dir={tr('ltr', 'rtl')}>{tr('Restore on this phone', 'الاسترجاع على هذا الهاتف')}</p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder={tr('Paste your backup code…', 'الصق كود النسخة الاحتياطية…')}
              className="w-full h-20 p-2 rounded-lg bg-white/5 text-[10px] text-white font-mono outline-none resize-none custom-scrollbar placeholder:text-[color:var(--text-muted)]/50" />
            <button onClick={doImport} disabled={!importText.trim()}
              className="w-full py-2 rounded-lg text-xs bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center gap-2 disabled:opacity-30">
              <Upload size={13} /> {tr('Restore data', 'استرجاع البيانات')}
            </button>
          </div>
        </div>

        {/* Clear Data */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-red-400/80 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={12} />
            {tr('Data Management', 'إدارة البيانات')}
          </h3>
          
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              {tr('Clear All App Data', 'مسح كل بيانات التطبيق')}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[color:var(--text-muted)]">
                This will delete all bookmarks, reading progress, and tasbih counts. 
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-xl text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  {tr('Yes, Clear Everything', 'نعم، امسح الكل')}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[color:var(--text-muted)] hover:bg-white/5 transition-all"
                >
                  {tr('Cancel', 'إلغاء')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
