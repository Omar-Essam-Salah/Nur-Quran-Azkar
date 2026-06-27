// Clean, lightweight vector illustrations for the "Learn" section (prayer
// postures + wudū steps). Pure SVG → crisp at any size, tiny, 100% offline.
// Colour comes from the parent via `currentColor` (the app's gold).

interface Props { pose: string; className?: string }

// A small reusable water droplet (for the wudū steps).
const Drop = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path
    d={`M${x} ${y} c0 0 ${-6 * s} ${7 * s} ${-6 * s} ${12 * s} a${6 * s} ${6 * s} 0 1 0 ${12 * s} 0 c0 ${-5 * s} ${-6 * s} ${-12 * s} ${-6 * s} ${-12 * s} z`}
    fill="currentColor" opacity="0.55"
  />
);

export default function LearnFigure({ pose, className }: Props) {
  const stroke = {
    fill: 'none', stroke: 'currentColor', strokeWidth: 6,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const body = (children: React.ReactNode) => (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={pose}>{children}</svg>
  );

  switch (pose) {
    // ── Prayer postures (stick figures, rounded) ──
    case 'takbir': // standing, hands raised by the ears
      return body(<>
        <circle cx="50" cy="20" r="8" fill="currentColor" />
        <path {...stroke} d="M50 29 V66" />
        <path {...stroke} d="M50 66 L41 90 M50 66 L59 90" />
        <path {...stroke} d="M50 40 L35 41 L37 25 M50 40 L65 41 L63 25" />
      </>);
    case 'qiyam': // standing, right hand over left on the chest
    case 'itidal':
      return body(<>
        <circle cx="50" cy="20" r="8" fill="currentColor" />
        <path {...stroke} d="M50 29 V66" />
        <path {...stroke} d="M50 66 L41 90 M50 66 L59 90" />
        <path {...stroke} d="M40 40 L50 55 L60 40" />
      </>);
    case 'ruku': // bowing, back level, hands on knees (faces left)
      return body(<>
        <circle cx="20" cy="52" r="8" fill="currentColor" />
        <path {...stroke} d="M28 52 H58" />
        <path {...stroke} d="M58 52 L55 78 L51 90 M58 52 L62 78 L66 90" />
        <path {...stroke} d="M40 54 L40 76" />
      </>);
    case 'sujud': // prostration
      return body(<>
        <circle cx="24" cy="74" r="8" fill="currentColor" />
        <path {...stroke} d="M60 56 L34 74" />
        <path {...stroke} d="M60 58 L60 86 H78" />
        <path {...stroke} d="M40 70 L30 84" />
      </>);
    case 'julus': // sitting on the heels
    case 'tasleem':
      return body(<>
        <circle cx="46" cy="26" r="8" fill="currentColor" />
        <path {...stroke} d="M46 34 V58" />
        <path {...stroke} d="M46 58 L46 70 L72 74" />
        <path {...stroke} d="M46 44 L62 60" />
      </>);
    case 'tashahhud': // sitting, index finger raised
      return body(<>
        <circle cx="46" cy="26" r="8" fill="currentColor" />
        <path {...stroke} d="M46 34 V58" />
        <path {...stroke} d="M46 58 L46 70 L72 74" />
        <path {...stroke} d="M46 44 L64 52" />
        <path {...stroke} d="M64 52 V40" />
      </>);

    // ── Wudū steps (a body part + a droplet) ──
    case 'niyyah': // intention — a heart
      return body(<path d="M50 80 C20 58 22 30 40 30 c7 0 10 5 10 5 s3-5 10-5 c18 0 20 28-10 50 z" fill="currentColor" />);
    case 'hands': // wash the hands — cupped hands + drop
      return body(<>
        <Drop x={50} y={16} />
        <path {...stroke} d="M26 56 q24 28 48 0" />
        <path {...stroke} d="M30 52 V60 M40 50 V62 M50 49 V64 M60 50 V62 M70 52 V60" />
      </>);
    case 'mouth': // rinse the mouth — lips + drop
      return body(<>
        <Drop x={50} y={18} />
        <path {...stroke} d="M28 56 q22 -18 44 0 q-22 22 -44 0 z" />
        <path {...stroke} d="M28 56 H72" />
      </>);
    case 'nose': // sniff water — nose profile + drop
      return body(<>
        <Drop x={64} y={20} />
        <path {...stroke} d="M44 30 V58 q0 10 12 10 q8 0 8 -6" />
        <path {...stroke} d="M44 58 q-6 4 0 8" />
      </>);
    case 'face': // wash the face — face + drops
      return body(<>
        <Drop x={26} y={12} s={0.8} /><Drop x={74} y={12} s={0.8} />
        <ellipse {...stroke} cx="50" cy="56" rx="22" ry="26" />
        <circle cx="42" cy="52" r="2.6" fill="currentColor" /><circle cx="58" cy="52" r="2.6" fill="currentColor" />
        <path {...stroke} d="M42 66 q8 8 16 0" strokeWidth={4} />
      </>);
    case 'arms': // wash the forearms — a bent arm + drop
      return body(<>
        <Drop x={70} y={16} />
        <path {...stroke} d="M24 78 L24 50 q0 -8 8 -8 L60 42" strokeWidth={9} />
      </>);
    case 'head': // wipe the head — head dome + wiping hand arc
      return body(<>
        <Drop x={50} y={14} s={0.85} />
        <path {...stroke} d="M28 64 a22 22 0 0 1 44 0" />
        <path {...stroke} d="M24 60 q26 -22 52 0" strokeWidth={4} opacity={0.7} />
        <path {...stroke} d="M28 64 H72" />
      </>);
    case 'ears': // wipe the ears — ear shape + drop
      return body(<>
        <Drop x={70} y={20} s={0.8} />
        <path {...stroke} d="M58 30 a18 22 0 1 0 0 44 q-10 0 -10 -10" />
        <path {...stroke} d="M52 44 a7 8 0 1 0 0.1 0" strokeWidth={4} />
      </>);
    case 'feet': // wash the feet — a foot + drop
      return body(<>
        <Drop x={28} y={16} s={0.85} />
        <path d="M36 78 q-6 -2 -6 -12 q0 -22 14 -24 q12 -2 12 10 q0 8 8 10 q14 4 14 14 q0 6 -8 6 z" fill="currentColor" />
      </>);
    case 'shahada': // testimony after wudū — a star / sky
      return body(<>
        <path d="M50 22 l7 16 17 2 -13 12 4 17 -15 -9 -15 9 4 -17 -13 -12 17 -2 z" fill="currentColor" />
      </>);
    default:
      return body(<circle cx="50" cy="50" r="6" fill="currentColor" />);
  }
}
