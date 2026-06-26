import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Trophy, TrendingUp } from 'lucide-react';
import { useI18n } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { Celebration, CountUp } from '@/components/Celebration';

interface TasbihPageProps {
  onBack: () => void;
  counts: Record<string, number>;
  activeDhikr: string;
  setActiveDhikr: (dhikr: string) => void;
  increment: (key: string) => void;
  reset: (key: string) => void;
  getCount: (key: string) => number;
}

const dhikrOptions = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', translation: 'Glory be to Allah', color: '#14879c', target: 33 },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', translation: 'Praise be to Allah', color: '#10b981', target: 33 },
  { id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', translation: 'Allah is the Greatest', color: '#f59e0b', target: 33 },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهِ', translation: 'I seek forgiveness from Allah', color: '#8b5cf6', target: 100 },
  { id: 'lailahaillallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', translation: 'There is no god but Allah', color: '#ec4899', target: 100 },
  { id: 'salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ', translation: 'O Allah, bless Muhammad and the family of Muhammad', color: '#f97316', target: 100 },
  // إضافة الذكر المفتوح (اللانهائي)
  { id: 'open_dhikr', arabic: 'ذِكْرٌ مُطْلَق', translation: 'Open Dhikr', color: '#3b82f6', target: 0 },
];

export default function TasbihPage({ 
  onBack, 
  activeDhikr, 
  setActiveDhikr, 
  increment, 
  reset, 
  getCount 
}: TasbihPageProps) {
  const { t } = useI18n();
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [showRipple, setShowRipple] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const currentDhikr = dhikrOptions.find(d => d.id === activeDhikr) || dhikrOptions[0];
  const currentCount = getCount(activeDhikr);
  
  // حساب النسبة المئوية: لو ذكر مطلق (0) الدايرة بتلف كل 100 عدة وتتعاد، لو محدد بتحسب النسبة العادية
  const isInfinite = currentDhikr.target === 0;
  const progress = isInfinite 
    ? (currentCount === 0 ? 0 : (currentCount % 100 === 0 ? 100 : currentCount % 100))
    : Math.min((currentCount / currentDhikr.target) * 100, 100);
    
  const isComplete = !isInfinite && currentCount >= currentDhikr.target;

  // Track session count
  useEffect(() => {
    const total = dhikrOptions.reduce((sum, d) => sum + getCount(d.id), 0);
    setSessionCount(total);
  }, [getCount]);

  // Single pointer event (fires once for mouse OR touch) — avoids the
  // double-count that happened with onClick + onTouchStart together.
  const handleCount = useCallback((e: React.PointerEvent) => {
    setRipplePosition({ x: e.clientX, y: e.clientY });
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
    increment(activeDhikr);
    if (!isInfinite && currentCount + 1 === currentDhikr.target) { haptic.success(); setCelebrate(true); }
    else haptic.tick();
  }, [activeDhikr, increment, isInfinite, currentCount, currentDhikr.target]);

  const handleReset = useCallback(() => {
    reset(activeDhikr);
  }, [activeDhikr, reset]);

  return (
    <div className="page-enter min-h-screen">
      {celebrate && <Celebration onDone={() => setCelebrate(false)} />}
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
          <h1 className="text-lg font-semibold text-white">{t('Tasbih', 'السبحة')}</h1>
          <div className="flex items-center gap-1 ml-auto">
            <TrendingUp size={14} className="text-[#14879c]" />
            <span className="text-xs text-[color:var(--text-muted)]">{sessionCount}</span>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto space-y-6">
        {/* Dhikr Selection */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dhikrOptions.map((dhikr) => (
            <button
              key={dhikr.id}
              onClick={() => setActiveDhikr(dhikr.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: activeDhikr === dhikr.id ? `${dhikr.color}20` : 'rgba(255, 255, 255, 0.02)',
                color: activeDhikr === dhikr.id ? dhikr.color : 'var(--text-muted)',
                border: activeDhikr === dhikr.id ? `1px solid ${dhikr.color}40` : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span className="block arabic-text text-sm">{dhikr.arabic}</span>
              <span className="text-[9px] opacity-70">{dhikr.translation}</span>
            </button>
          ))}
        </div>

        {/* Main Counter Area */}
        <div className="relative">
          {/* Progress Ring Background */}
          <div className="glass-card p-8 text-center space-y-6">
            {/* Progress Circle */}
            <div className="relative w-56 h-56 mx-auto">
              {/* Background Circle */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="4"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={currentDhikr.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Current Dhikr */}
                <p className="arabic-text text-xl mb-1" style={{ color: currentDhikr.color }}>
                  {currentDhikr.arabic}
                </p>
                
                {/* Count */}
                <CountUp value={currentCount} className="block text-5xl font-light text-white tabular-nums" />
                
                {/* Target */}
                <p className="text-xs text-[color:var(--text-muted)] mt-1">
                  {isInfinite ? '∞' : `/ ${currentDhikr.target}`}
                </p>
                
                {/* Completion Badge */}
                {isComplete && (
                  <div className="mt-2 flex items-center gap-1">
                    <Trophy size={14} className="text-[#d4af37]" />
                    <span className="text-[10px] text-[#d4af37]">{t('Completed!', 'اكتمل!')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${currentDhikr.color}80, ${currentDhikr.color})`,
                }}
              />
            </div>
          </div>

          {/* Large Count Button */}
          <button
            onPointerDown={handleCount}
            className="mt-4 w-full glass-btn py-6 text-lg font-medium select-none touch-manipulation"
            style={{
              background: `linear-gradient(135deg, ${currentDhikr.color}30, ${currentDhikr.color}10)`,
              border: `1px solid ${currentDhikr.color}30`,
            }}
          >
            {t('Tap to Count', 'اضغط للعدّ')}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="mt-2 w-full py-3 text-xs text-[color:var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw size={12} />
            {t('Reset Counter', 'تصفير العدّاد')}
          </button>

          {/* Ripple Effect */}
          {showRipple && ripplePosition && (
            <div
              className="fixed pointer-events-none z-50"
              style={{
                left: ripplePosition.x - 20,
                top: ripplePosition.y - 20,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${currentDhikr.color}40, transparent)`,
                animation: 'ripple-expand 0.6s ease-out forwards',
              }}
            />
          )}
        </div>

        {/* All Counters Summary */}
        <div className="glass-card-sm p-4 space-y-3">
          <h3 className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider">{t('All Counters', 'كل العدّادات')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {dhikrOptions.map((dhikr) => {
              const count = getCount(dhikr.id);
              const isInf = dhikr.target === 0;
              const dhikrProgress = isInf 
                ? (count === 0 ? 0 : (count % 100 === 0 ? 100 : count % 100))
                : Math.min((count / dhikr.target) * 100, 100);
              
              return (
                <button
                  key={dhikr.id}
                  onClick={() => setActiveDhikr(dhikr.id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: activeDhikr === dhikr.id ? `${dhikr.color}10` : 'rgba(255, 255, 255, 0.02)',
                    border: activeDhikr === dhikr.id ? `1px solid ${dhikr.color}20` : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] arabic-text" style={{ color: dhikr.color }}>{dhikr.arabic}</span>
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{
                        width: `${dhikrProgress}%`,
                        background: dhikr.color,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* Ripple Animation Keyframe */}
      <style>{`
        @keyframes ripple-expand {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}