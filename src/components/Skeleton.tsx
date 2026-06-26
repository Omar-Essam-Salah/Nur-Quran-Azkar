import type { CSSProperties } from 'react';

/** A shimmering placeholder block — nicer than a spinner while content loads. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`nur-skeleton ${className}`} style={style} />;
}

/** A few stacked card skeletons for list/grid pages. */
export function SkeletonCards({ count = 6, grid = false }: { count?: number; grid?: boolean }) {
  const items = Array.from({ length: count });
  return (
    <div className={grid ? 'grid grid-cols-2 gap-3' : 'space-y-2.5'}>
      {items.map((_, i) => (
        <div key={i} className="glass-card-sm p-4 flex items-center gap-3">
          <Skeleton style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
          <div className="flex-1 space-y-2">
            <Skeleton style={{ height: 12, width: '70%' }} />
            <Skeleton style={{ height: 9, width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
