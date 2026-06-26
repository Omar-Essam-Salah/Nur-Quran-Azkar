import { useEffect, useMemo, useRef, useState } from 'react';

const COLORS = ['#d4af37', '#14879c', '#10b981', '#f472b6', '#f59e0b', '#fbbf24'];

/** A one-shot confetti burst from the centre — plays then calls onDone. */
export function Celebration({ onDone }: { onDone?: () => void }) {
  const bits = useMemo(
    () => Array.from({ length: 30 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 150;
      return {
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 30,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 7,
        delay: Math.random() * 0.12,
        rot: Math.random() * 360,
      };
    }),
    [],
  );
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1300);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="celebration-layer">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            background: b.color,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            // @ts-expect-error CSS custom properties
            '--tx': `${b.tx}px`,
            '--ty': `${b.ty}px`,
            '--rot': `${b.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** Smoothly counts the displayed number up/down to `value`. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    fromRef.current = value;
    if (from === to) { setDisplay(to); return; }
    const dur = 480;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{display}</span>;
}
