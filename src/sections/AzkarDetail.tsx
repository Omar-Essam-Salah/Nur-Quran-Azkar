import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, RotateCcw, ChevronRight, Volume2, Info, Plus, Trash2 } from 'lucide-react';
import { getAzkarCategoryById } from '@/data/azkarData';
import { getCustomAdhkar, addCustomDhikr, removeCustomDhikr, MY_ADHKAR_ID } from '@/lib/customAdhkar';
import type { AzkarItem } from '@/types';
import { useI18n } from '@/i18n';

interface AzkarDetailProps {
  categoryId: string;
  onBack: () => void;
  onBookmark: (bookmark: { type: 'azkar'; azkarId: string; azkarItemId: string; text: string; translation: string }) => void;
  isBookmarked: (type: string, surahNumber?: number, ayahNumber?: number) => boolean;
}

export default function AzkarDetail({ categoryId, onBack, onBookmark, isBookmarked }: AzkarDetailProps) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const isCustom = categoryId === MY_ADHKAR_ID;
  const [customItems, setCustomItems] = useState<AzkarItem[]>(() => (isCustom ? getCustomAdhkar() : []));
  const category = isCustom
    ? { id: MY_ADHKAR_ID, name: 'My Adhkar', arabicName: 'أذكاري', icon: 'heart', items: customItems }
    : getAzkarCategoryById(categoryId);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // ── My-Adhkar add form ──
  const [newArabic, setNewArabic] = useState('');
  const [newCount, setNewCount] = useState(33);
  const addDhikr = useCallback(() => {
    if (!newArabic.trim()) return;
    addCustomDhikr(newArabic, newCount);
    setCustomItems(getCustomAdhkar());
    setNewArabic('');
    setNewCount(33);
  }, [newArabic, newCount]);
  const deleteDhikr = useCallback((id: string) => {
    removeCustomDhikr(id);
    setCustomItems(getCustomAdhkar());
    setItemCounts((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // Load saved counts — but RESET them if they're from a previous day, so the
  // morning/evening adhkar always start fresh each new day.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem(`azkar-counts-${categoryId}`);
    if (!saved) { setItemCounts({}); return; }
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.date === today && parsed.counts) setItemCounts(parsed.counts);
      else { setItemCounts({}); localStorage.removeItem(`azkar-counts-${categoryId}`); }
    } catch { setItemCounts({}); }
  }, [categoryId]);

  // Save counts (stamped with today's date) to localStorage.
  useEffect(() => {
    if (Object.keys(itemCounts).length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`azkar-counts-${categoryId}`, JSON.stringify({ date: today, counts: itemCounts }));
    }
  }, [itemCounts, categoryId]);

  const incrementCount = useCallback((itemId: string, targetCount: number) => {
    setItemCounts(prev => {
      const current = (prev[itemId] || 0) + 1;
      return { ...prev, [itemId]: current > targetCount ? targetCount : current };
    });
  }, []);

  const resetCount = useCallback((itemId: string) => {
    setItemCounts(prev => ({ ...prev, [itemId]: 0 }));
  }, []);

  const resetAll = useCallback(() => {
    setItemCounts({});
    localStorage.removeItem(`azkar-counts-${categoryId}`);
  }, [categoryId]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[color:var(--text-muted)] arabic-text">{t('Category not found', 'الفئة غير موجودة')}</p>
      </div>
    );
  }

  // Check if all items are completed
  const allCompleted = category.items.every(item => (itemCounts[item.id] || 0) >= item.count);
  const totalTarget = category.items.reduce((sum, item) => sum + item.count, 0);
  const totalCurrent = category.items.reduce((sum, item) => sum + Math.min(itemCounts[item.id] || 0, item.count), 0);
  const progressPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3">
        <div 
          className="mx-auto max-w-lg rounded-2xl px-4 py-3 space-y-3"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.8), rgba(var(--glass-2), 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/10 transition-all">
              <ArrowLeft size={18} className="text-[color:var(--text-muted)]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className={`text-base font-semibold text-white ${isAr ? 'arabic-text' : ''}`}>{isAr ? category.arabicName : category.name}</h1>
              <p className={`text-[10px] text-[color:var(--text-muted)] ${isAr ? '' : 'arabic-text'}`}>{isAr ? category.name : category.arabicName}</p>
            </div>
            <button
              onClick={resetAll}
              className="p-2 rounded-xl hover:bg-white/10 transition-all"
              title={t('Reset all counters', 'تصفير كل العدّادات')}
            >
              <RotateCcw size={16} className="text-[color:var(--text-muted)]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[color:var(--text-muted)] arabic-text">{t('Progress', 'التقدّم')}</span>
              <span className="text-[10px] text-[#14879c]">{totalCurrent}/{totalTarget} ({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: allCompleted 
                    ? 'linear-gradient(90deg, #10b981, #34d399)' 
                    : 'linear-gradient(90deg, #14879c, #14b8a6)',
                }}
              />
            </div>
          </div>

          {/* Toggle Transliteration — only useful for non-Arabic readers */}
          {!isAr && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowTransliteration(!showTransliteration)}
                className="text-[10px] text-[#14879c] hover:text-[#14879c]/80 transition-colors flex items-center gap-1"
              >
                <Volume2 size={10} />
                {showTransliteration ? 'Hide' : 'Show'} Transliteration
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-4">
        {/* My-Adhkar: add form */}
        {isCustom && (
          <div className="glass-card-sm p-4 space-y-3">
            <p className="text-xs text-[#d4af37] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>{t('Add a dhikr', 'أضِف ذِكرًا')}</p>
            <textarea
              value={newArabic}
              onChange={(e) => setNewArabic(e.target.value)}
              placeholder={t('Type the dhikr…', 'اكتب الذِّكر…')}
              dir="rtl"
              rows={2}
              className="w-full p-3 rounded-xl bg-white/5 text-base text-white arabic-text outline-none border border-transparent focus:border-[#d4af37]/40 resize-none placeholder:text-[color:var(--text-muted)]/50"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[color:var(--text-muted)] arabic-text">{t('Count', 'العدد')}</span>
                <input
                  type="number" min={1} max={1000} value={newCount}
                  onChange={(e) => setNewCount(Number(e.target.value))}
                  className="w-16 p-2 rounded-lg bg-white/5 text-sm text-white text-center outline-none border border-transparent focus:border-[#d4af37]/40"
                />
              </div>
              <button
                onClick={addDhikr}
                disabled={!newArabic.trim()}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37' }}
              >
                <Plus size={14} /> {t('Add', 'إضافة')}
              </button>
            </div>
          </div>
        )}

        {isCustom && customItems.length === 0 && (
          <p className="text-center text-xs text-[color:var(--text-muted)] arabic-text py-6" dir={isAr ? 'rtl' : 'ltr'}>
            {t('No personal adhkar yet — add your first above.', 'لا أذكار خاصة بعد — أضِف أوّل ذِكر بالأعلى.')}
          </p>
        )}

        {/* Completion Message */}
        {allCompleted && totalTarget > 0 && (
          <div 
            className="p-4 rounded-2xl text-center space-y-2"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <p className="text-sm font-semibold text-[#10b981] arabic-text">{t('All Adhkar Completed!', 'تمّت جميع الأذكار!')}</p>
            <p className="text-xs text-[color:var(--text-muted)] arabic-text">{t('May Allah accept your remembrance.', 'تقبّل الله ذكرك.')}</p>
          </div>
        )}

        {/* Azkar Items */}
        <div className="space-y-3">
          {category.items.map((item, index) => {
            const currentCount = itemCounts[item.id] || 0;
            const isComplete = currentCount >= item.count;
            const isExpanded = expandedItem === item.id;
            const bookmarked = isBookmarked('azkar');

            return (
              <div 
                key={item.id}
                className="glass-card-sm overflow-hidden"
                style={{
                  borderLeft: isComplete ? '3px solid #10b981' : '3px solid transparent',
                  opacity: isComplete ? 0.85 : 1,
                }}
              >
                {/* Main Content */}
                <div className="p-4 space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: isComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(20, 135, 156, 0.1)',
                        color: isComplete ? '#10b981' : '#14879c',
                      }}
                    >
                      {index + 1} {t('of', 'من')} {category.items.length}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCustom ? (
                        <button
                          onClick={() => deleteDhikr(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 transition-all"
                          title={t('Delete', 'حذف')}
                        >
                          <Trash2 size={14} className="text-red-400/80" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onBookmark({
                              type: 'azkar',
                              azkarId: categoryId,
                              azkarItemId: item.id,
                              text: item.arabic,
                              translation: item.translation,
                            })}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                          >
                            {bookmarked ?
                              <BookmarkCheck size={14} className="text-[#d4af37]" /> :
                              <Bookmark size={14} className="text-[color:var(--text-muted)]" />
                            }
                          </button>
                          <button
                            onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                          >
                            <Info size={14} className="text-[color:var(--text-muted)]" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <p className="arabic-text text-lg text-white leading-relaxed text-right">
                    {item.arabic}
                  </p>

                  {/* Translation — hidden in Arabic mode (it's the English meaning) */}
                  {!isAr && (
                    <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">
                      {item.translation}
                    </p>
                  )}

                  {/* Transliteration */}
                  {!isAr && showTransliteration && item.transliteration && (
                    <p className="text-[11px] text-[#14879c]/70 italic leading-relaxed border-t border-white/5 pt-2">
                      {item.transliteration}
                    </p>
                  )}

                  {/* Expanded Info */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      {item.reference && (
                        <p className="text-[10px] text-[#d4af37] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>
                          <span className="text-[color:var(--text-muted)]">{t('Reference: ', 'المصدر: ')}</span>{item.reference}
                        </p>
                      )}
                      {item.virtue && (
                        <p className="text-[10px] text-[#10b981] arabic-text" dir={isAr ? 'rtl' : 'ltr'}>
                          <span className="text-[color:var(--text-muted)]">{t('Virtue: ', 'الفضل: ')}</span>{item.virtue}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Counter & Action Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {/* Counter Display */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(item.count, 5))].map((_, i) => (
                          <div 
                            key={i}
                            className="w-2 h-2 rounded-full transition-all"
                            style={{
                              background: i < currentCount ? '#10b981' : 'rgba(255,255,255,0.1)',
                            }}
                          />
                        ))}
                        {item.count > 5 && (
                          <span className="text-[8px] text-[color:var(--text-muted)] ml-0.5">+{item.count - 5}</span>
                        )}
                      </div>
                      <span 
                        className="text-xs font-medium"
                        style={{ color: isComplete ? '#10b981' : 'var(--text-muted)' }}
                      >
                        {currentCount}/{item.count}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {currentCount > 0 && (
                        <button
                          onClick={() => resetCount(item.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                        >
                          <RotateCcw size={12} className="text-[color:var(--text-muted)]" />
                        </button>
                      )}
                      <button
                        onClick={() => incrementCount(item.id, item.count)}
                        disabled={isComplete}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: isComplete 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : 'linear-gradient(135deg, rgba(20, 135, 156, 0.3), rgba(20, 135, 156, 0.1))',
                          color: isComplete ? '#10b981' : '#fff',
                          border: isComplete 
                            ? '1px solid rgba(16, 185, 129, 0.2)' 
                            : '1px solid rgba(20, 135, 156, 0.2)',
                        }}
                      >
                        {isComplete ? <span className="arabic-text">{t('Completed', 'اكتمل')}</span> : (
                          <>
                            <span className="arabic-text">{t('Count', 'عُدّ')}</span> <ChevronRight size={12} className={isAr ? 'rotate-180' : ''} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
