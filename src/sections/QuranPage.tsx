import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Grid3X3, List, X } from 'lucide-react';
import { surahList } from '@/data/surahList';
import { getJuzInfo } from '@/data/surahList';
import { useI18n } from '@/i18n';

interface QuranPageProps {
  onOpenSurah: (surahNumber: number) => void;
  onBack: () => void;
  onToggleSearch: () => void;
}

type ViewMode = 'list' | 'grid';
type FilterType = 'all' | 'meccan' | 'medinan';

export default function QuranPage({ onOpenSurah, onBack, onToggleSearch }: QuranPageProps) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');

  const juzInfo = useMemo(() => getJuzInfo(), []);

  const filteredSurahs = useMemo(() => {
    let filtered = surahList;
    
    if (filter !== 'all') {
      filtered = filtered.filter(s => s.type.toLowerCase() === filter);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.number.toString().includes(q)
      );
    }
    
    return filtered;
  }, [filter, searchQuery]);

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
          <h1 className="text-lg font-semibold text-white flex-1 arabic-text">{t('Learn the Quran', 'تعلّم القرآن')}</h1>
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded-xl hover:bg-white/10 transition-all"
          >
            {viewMode === 'list' ? <Grid3X3 size={18} className="text-[color:var(--text-muted)]" /> : <List size={18} className="text-[color:var(--text-muted)]" />}
          </button>
          <button 
            onClick={onToggleSearch}
            className="p-2 rounded-xl hover:bg-white/10 transition-all"
          >
            <Search size={18} className="text-[color:var(--text-muted)]" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {/* Local Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('Search surahs...', 'ابحث عن سورة...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-card-sm pl-10 pr-10 py-3 text-sm text-white placeholder-[color:var(--text-muted)]/50 focus:outline-none focus:border-[#14879c]/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={16} className="text-[color:var(--text-muted)]" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('surah')}
            className="flex-1 py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-all"
            style={{
              background: activeTab === 'surah' ? 'rgba(20, 135, 156, 0.2)' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === 'surah' ? '#14879c' : 'var(--text-muted)',
              border: activeTab === 'surah' ? '1px solid rgba(20, 135, 156, 0.3)' : '1px solid transparent',
            }}
          >
            {t('By Surah', 'بالسور')}
          </button>
          <button
            onClick={() => setActiveTab('juz')}
            className="flex-1 py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-all"
            style={{
              background: activeTab === 'juz' ? 'rgba(20, 135, 156, 0.2)' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === 'juz' ? '#14879c' : 'var(--text-muted)',
              border: activeTab === 'juz' ? '1px solid rgba(20, 135, 156, 0.3)' : '1px solid transparent',
            }}
          >
            {t('By Juz', 'بالأجزاء')}
          </button>
        </div>

        {activeTab === 'surah' && (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'meccan', 'medinan'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all"
                  style={{
                    background: filter === type ? 'rgba(20, 135, 156, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    color: filter === type ? '#14879c' : 'var(--text-muted)',
                    border: filter === type ? '1px solid rgba(20, 135, 156, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {type === 'all' ? t('All', 'الكل') : type === 'meccan' ? t('Meccan', 'مكية') : t('Medinan', 'مدنية')}
                </button>
              ))}
            </div>

            {/* Surah List */}
            {viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredSurahs.map((surah, index) => (
                  <button
                    key={surah.number}
                    onClick={() => onOpenSurah(surah.number)}
                    className="glass-card-sm cv-row w-full p-4 flex items-center gap-4 text-left group"
                    style={{
                      animationDelay: `${index * 20}ms`,
                    }}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <svg viewBox="0 0 40 40" className="w-full h-full">
                        <polygon 
                          points="20,2 38,11 38,29 20,38 2,29 2,11" 
                          fill="none" 
                          stroke={surah.type === 'Meccan' ? '#14879c' : '#d4af37'}
                          strokeWidth="1"
                          opacity="0.4"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[color:var(--text-muted)]">
                        {surah.number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium text-white ${isAr ? 'arabic-text' : ''}`}>{isAr ? surah.name : surah.englishName}</p>
                        <p className={`text-sm text-white/80 ${isAr ? '' : 'arabic-text'}`}>{isAr ? surah.englishName : surah.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: surah.type === 'Meccan' ? 'rgba(20, 135, 156, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                            color: surah.type === 'Meccan' ? '#14879c' : '#d4af37',
                          }}
                        >
                          {t(surah.type, surah.type === 'Meccan' ? 'مكية' : 'مدنية')}
                        </span>
                        <span className="text-[10px] text-[color:var(--text-muted)]">{surah.verses} {t('verses', 'آية')}</span>
                        <span className="text-[10px] text-[color:var(--text-muted)]/60">{surah.englishNameTranslation}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredSurahs.map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => onOpenSurah(surah.number)}
                    className="glass-card-sm p-3 flex flex-col items-center text-center gap-1.5"
                  >
                    <div className="relative w-8 h-8">
                      <svg viewBox="0 0 40 40" className="w-full h-full">
                        <polygon 
                          points="20,2 38,11 38,29 20,38 2,29 2,11" 
                          fill="none" 
                          stroke={surah.type === 'Meccan' ? '#14879c' : '#d4af37'}
                          strokeWidth="1"
                          opacity="0.4"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[color:var(--text-muted)]">
                        {surah.number}
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium text-white leading-tight ${isAr ? 'arabic-text' : ''}`}>{isAr ? surah.name : surah.englishName}</p>
                    <p className={`text-[10px] text-white/50 ${isAr ? '' : 'arabic-text'}`}>{isAr ? surah.englishName : surah.name}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'juz' && (
          <div className="space-y-2">
            {juzInfo.map((juz) => (
              <div key={juz.juz} className="glass-card-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{t('Juz', 'الجزء')} {juz.juz}</p>
                  <p className="text-[10px] text-[#14879c]">{juz.endSurah - juz.startSurah + 1} {t('Surahs', 'سورة')}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {surahList
                    .filter(s => s.number >= juz.startSurah && s.number <= juz.endSurah)
                    .map(s => (
                      <button
                        key={s.number}
                        onClick={() => onOpenSurah(s.number)}
                        className={`text-[10px] px-2 py-1 rounded-full bg-white/5 hover:bg-[#14879c]/20 text-[color:var(--text-muted)] hover:text-[#14879c] transition-all ${isAr ? 'arabic-text' : ''}`}
                      >
                        {isAr ? s.name : s.englishName}
                      </button>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
