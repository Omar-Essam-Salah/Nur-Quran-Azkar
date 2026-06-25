import type { BottomNavPage } from '@/types';
import { Home, BookOpen, Sparkles, Clock, Menu } from 'lucide-react';
import { useI18n } from '@/i18n';

interface BottomNavProps {
  activePage: BottomNavPage;
  onNavigate: (page: BottomNavPage) => void;
}

const navItems: { page: BottomNavPage; en: string; ar: string; icon: typeof Home }[] = [
  { page: 'home', en: 'Home', ar: 'الرئيسية', icon: Home },
  { page: 'quran', en: 'Quran', ar: 'القرآن', icon: BookOpen },
  { page: 'azkar', en: 'Azkar', ar: 'الأذكار', icon: Sparkles },
  { page: 'prayer', en: 'Prayer', ar: 'الصلاة', icon: Clock },
  { page: 'more', en: 'More', ar: 'المزيد', icon: Menu },
];

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-2" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div 
        className="mx-auto max-w-md flex items-center justify-around rounded-2xl py-2 px-2"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--glass-1), 0.7), rgba(var(--glass-2), 0.8))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px) saturate(140%)',
          WebkitBackdropFilter: 'blur(8px) saturate(140%)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activePage === item.page;
          const Icon = item.icon;
          
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 relative"
              style={{
                background: isActive ? 'rgba(20, 135, 156, 0.15)' : 'transparent',
              }}
            >
              <Icon
                size={20}
                className="transition-all duration-300"
                style={{
                  color: isActive ? '#14879c' : 'rgba(var(--text-strong-rgb), 0.45)',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(20, 135, 156, 0.5))' : 'none',
                }}
              />
              <span
                className="text-[10px] font-medium transition-all duration-300"
                style={{
                  color: isActive ? '#14879c' : 'rgba(var(--text-strong-rgb), 0.4)',
                }}
              >
                {t(item.en, item.ar)}
              </span>
              {isActive && (
                <div 
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #14879c, transparent)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
