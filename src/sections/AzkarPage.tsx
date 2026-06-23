import { ArrowLeft, Sunrise, Moon, Hand, Bed, Sun, Heart, Shield, Sparkles } from 'lucide-react';
import { azkarCategories } from '@/data/azkarData';
import { useI18n } from '@/i18n';

interface AzkarPageProps {
  onOpenAzkar: (azkarId: string) => void;
  onBack: () => void;
}

const iconMap: Record<string, typeof Sunrise> = {
  sunrise: Sunrise,
  moon: Moon,
  pray: Hand,
  bed: Bed,
  sun: Sun,
  heart: Heart,
  shield: Shield,
  sparkles: Sparkles,
};

const colorMap: Record<string, string> = {
  morning: '#f59e0b',
  evening: '#6366f1',
  'after-prayer': '#10b981',
  sleep: '#8b5cf6',
  waking: '#f97316',
  general: '#ec4899',
  ruqya: '#14b8a6',
};

export default function AzkarPage({ onOpenAzkar, onBack }: AzkarPageProps) {
  const { t } = useI18n();
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
          <h1 className="text-lg font-semibold text-white">{t('Adhkar', 'الأذكار')}</h1>
        </div>
      </header>

      <div className="px-4 pt-2 pb-8 max-w-lg mx-auto space-y-4">
        {/* Introduction */}
        <div className="glass-card p-5 text-center space-y-2">
          <Sparkles size={24} className="text-[#d4af37] mx-auto" />
          <h2 className="text-base font-semibold text-white">{t('Remembrances of Allah', 'ذِكر الله')}</h2>
          <p className="text-xs text-[color:var(--text-muted)] leading-relaxed arabic-text">
            {t('"And remember Allah much, that you may be successful."', '«وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ»')}
            <span className="text-[#14879c] block mt-1">{t('- Surah Al-Anfal 8:45', '﴿الأنفال: ٤٥﴾')}</span>
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-3">
          {azkarCategories.map((category, index) => {
            const Icon = iconMap[category.icon] || Sparkles;
            const color = colorMap[category.id] || '#14879c';
            
            return (
              <button
                key={category.id}
                onClick={() => onOpenAzkar(category.id)}
                className="glass-card-sm w-full p-4 flex items-center gap-4 text-left group"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={26} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{category.name}</p>
                      <p className="text-xs arabic-text text-white/50 mt-0.5">{category.arabicName}</p>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `${color}10` }}
                    >
                      <span className="text-xs font-medium" style={{ color }}>
                        {category.items.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[color:var(--text-muted)] mt-1">
                    {category.items.slice(0, 3).map(item => item.arabic.substring(0, 30) + '...').join(' - ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Virtue of Dhikr */}
        <div className="glass-card-sm p-5 space-y-3">
          <h3 className="text-xs text-[#d4af37] uppercase tracking-wider">{t('Virtue of Remembrance', 'فضل الذكر')}</h3>
          <p className="text-sm text-white/80 arabic-text leading-relaxed text-right">
            "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ"
          </p>
          <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">
            {t(
              'The Prophet (ﷺ) said: "The example of the one who remembers his Lord and the one who does not is like the living and the dead."',
              'قال النبي ﷺ: «مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لَا يَذْكُرُ رَبَّهُ مَثَلُ الْحَيِّ وَالْمَيِّتِ»'
            )}
            <span className="text-[#14879c]"> {t('- Sahih al-Bukhari', '﴿رواه البخاري﴾')}</span>
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
