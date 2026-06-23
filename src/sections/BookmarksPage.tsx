import { ArrowLeft, Trash2, BookOpen, Sparkles, Heart, Clock, Compass } from 'lucide-react';
import type { Page } from '@/types';
import { useI18n } from '@/i18n';
import { surahList } from '@/data/surahList';
import { getAzkarCategoryById } from '@/data/azkarData';

interface BookmarksPageProps {
  bookmarks: Array<{
    id: string;
    type: 'ayah' | 'azkar';
    surahNumber?: number;
    ayahNumber?: number;
    azkarId?: string;
    azkarItemId?: string;
    text?: string;
    translation?: string;
    timestamp: number;
  }>;
  onRemoveBookmark: (id: string) => void;
  onOpenSurah: (surahNumber: number, ayahNumber?: number) => void;
  onBack: () => void;
  onNavigate: (page: Page) => void;
}

export default function BookmarksPage({ 
  bookmarks, 
  onRemoveBookmark, 
  onOpenSurah, 
  onBack, 
  onNavigate
}: BookmarksPageProps) {
  const { t } = useI18n();
  const ayahBookmarks = bookmarks.filter(b => b.type === 'ayah');
  const azkarBookmarks = bookmarks.filter(b => b.type === 'azkar');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-lg font-semibold text-white">{t('Bookmarks', 'المفضّلة')}</h1>
          <span className="text-xs text-[color:var(--text-muted)]">({bookmarks.length})</span>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {bookmarks.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f472b6]/10 flex items-center justify-center mx-auto">
              <Heart size={28} className="text-[#f472b6]/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{t('No Bookmarks Yet', 'لا توجد مفضّلة بعد')}</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-1">
                {t('Bookmark your favorite verses and adhkar while reading.', 'احفظ آياتك وأذكارك المفضّلة أثناء القراءة.')}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button 
                onClick={() => onNavigate('quran')}
                className="glass-btn px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <BookOpen size={14} />
                {t('Browse Quran', 'تصفّح القرآن')}
              </button>
              <button 
                onClick={() => onNavigate('azkar')}
                className="glass-btn px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                {t('Browse Azkar', 'تصفّح الأذكار')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Ayah Bookmarks */}
            {ayahBookmarks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-[#14879c]" />
                  Quranic Verses ({ayahBookmarks.length})
                </h3>
                {ayahBookmarks.map((bookmark) => {
                  const surah = bookmark.surahNumber ? surahList.find(s => s.number === bookmark.surahNumber) : null;
                  
                  return (
                    <div key={bookmark.id} className="glass-card-sm p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => bookmark.surahNumber && onOpenSurah(bookmark.surahNumber, bookmark.ayahNumber)}
                          className="flex-1 text-left space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#14879c]/15 text-[#14879c]">
                              {surah?.englishName || 'Quran'}
                            </span>
                            <span className="text-[10px] text-[color:var(--text-muted)]">
                              Verse {bookmark.ayahNumber}
                            </span>
                          </div>
                          {bookmark.text && (
                            <p className="text-sm arabic-text text-white/90 leading-relaxed text-right">
                              {bookmark.text.substring(0, 100)}{bookmark.text.length > 100 ? '...' : ''}
                            </p>
                          )}
                          {bookmark.translation && (
                            <p className="text-xs text-[color:var(--text-muted)]">
                              {bookmark.translation.substring(0, 80)}{bookmark.translation.length > 80 ? '...' : ''}
                            </p>
                          )}
                        </button>
                        <button
                          onClick={() => onRemoveBookmark(bookmark.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0 mt-1"
                        >
                          <Trash2 size={14} className="text-[color:var(--text-muted)] hover:text-red-400" />
                        </button>
                      </div>
                      <p className="text-[10px] text-[color:var(--text-muted)]/50">{formatDate(bookmark.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Azkar Bookmarks */}
            {azkarBookmarks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#d4af37]" />
                  Adhkar ({azkarBookmarks.length})
                </h3>
                {azkarBookmarks.map((bookmark) => {
                  const category = bookmark.azkarId ? getAzkarCategoryById(bookmark.azkarId) : null;
                  
                  return (
                    <div key={bookmark.id} className="glass-card-sm p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37]">
                              {category?.name || 'Azkar'}
                            </span>
                          </div>
                          {bookmark.text && (
                            <p className="text-sm arabic-text text-white/90 leading-relaxed text-right">
                              {bookmark.text.substring(0, 100)}{bookmark.text.length > 100 ? '...' : ''}
                            </p>
                          )}
                          {bookmark.translation && (
                            <p className="text-xs text-[color:var(--text-muted)]">
                              {bookmark.translation.substring(0, 80)}{bookmark.translation.length > 80 ? '...' : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onRemoveBookmark(bookmark.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0 mt-1"
                        >
                          <Trash2 size={14} className="text-[color:var(--text-muted)] hover:text-red-400" />
                        </button>
                      </div>
                      <p className="text-[10px] text-[color:var(--text-muted)]/50">{formatDate(bookmark.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Quick Navigation */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">Quick Access</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { page: 'quran' as Page, label: 'Quran', icon: BookOpen },
              { page: 'azkar' as Page, label: 'Azkar', icon: Sparkles },
              { page: 'prayer' as Page, label: 'Prayer', icon: Clock },
              { page: 'qibla' as Page, label: 'Qibla', icon: Compass },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  <Icon size={18} className="text-[color:var(--text-muted)]" />
                  <span className="text-[9px] text-[color:var(--text-muted)]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
