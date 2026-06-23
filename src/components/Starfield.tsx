import { useMemo } from 'react';

interface Flake {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  accent: boolean;
}

// Permanent, continuously-looping snow. Particles are seeded once with random
// parameters and animate forever via CSS (animation-iteration-count: infinite),
// so the motion never stops. Negative delays mean the screen is already full of
// snow on first paint.
function makeFlakes(count: number): Flake[] {
  const flakes: Flake[] = [];
  for (let i = 0; i < count; i++) {
    const duration = 7 + Math.random() * 12; // 7s–19s fall
    flakes.push({
      left: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration,
      delay: -Math.random() * duration, // start mid-fall
      drift: (Math.random() - 0.5) * 80, // px horizontal sway
      accent: Math.random() > 0.9, // a few teal flakes
    });
  }
  return flakes;
}

export default function Starfield() {
  const flakes = useMemo(() => makeFlakes(30), []);

  return (
    <div className="starfield">
      <div className="snow-layer">
        {flakes.map((f, i) => (
          <span
            key={i}
            className="snowflake"
            style={{
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              ...(f.accent ? { background: 'var(--snow-accent)' } : null),
              // @ts-expect-error CSS custom property
              '--drift': `${f.drift}px`,
            }}
          />
        ))}
      </div>
      <div className="moon-element" />
    </div>
  );
}
