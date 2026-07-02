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

  const fill = { fill: 'currentColor' };
  switch (pose) {
    // ── Prayer postures (dignified filled silhouettes of a person in a thobe) ──
    case 'takbir': // standing, hands raised beside the head
      return body(<>
        <circle cx="50" cy="17" r="8.5" {...fill} />
        <path {...fill} d="M42 30 Q50 26 58 30 L62 86 Q50 90 38 86 Z" />
        <path {...fill} d="M42 34 L31 21 Q29 18 32 17 Q34 16 36 19 L47 32 Z" />
        <path {...fill} d="M58 34 L69 21 Q71 18 68 17 Q66 16 64 19 L53 32 Z" />
      </>);
    case 'qiyam': // standing, right hand over left on the chest
    case 'itidal':
      return body(<>
        <circle cx="50" cy="17" r="8.5" {...fill} />
        <path {...fill} d="M42 30 Q50 26 58 30 L62 86 Q50 90 38 86 Z" />
        <path {...fill} d="M39 45 Q50 53 61 45 L58 54 Q50 59 42 54 Z" opacity="0.85" />
      </>);
    case 'ruku': // bowing, back level, hands toward the knees (faces left)
      return body(<>
        <circle cx="20" cy="42" r="8.5" {...fill} />
        <path {...fill} d="M27 37 Q44 33 60 40 Q64 42 62 47 L58 51 Q42 49 28 49 Z" />
        <path {...fill} d="M50 49 L47 86 L41 86 L45 50 Z" />
        <path {...fill} d="M60 47 L62 86 L55 86 L54 50 Z" />
        <path {...fill} d="M33 48 L31 70 L36 70 L38 49 Z" opacity="0.9" />
      </>);
    case 'sujud': // prostration — forehead to the ground, hips raised
      return body(<>
        <circle cx="24" cy="72" r="8.5" {...fill} />
        <path {...fill} d="M60 52 Q48 56 34 68 L30 73 Q28 76 33 77 L62 60 Q65 55 60 52 Z" />
        <path {...fill} d="M58 56 L64 84 L54 84 L52 60 Z" />
        <path {...fill} d="M62 80 L82 80 L82 86 L60 86 Z" />
        <path {...fill} d="M34 68 L25 82 L30 84 L40 71 Z" opacity="0.9" />
      </>);
    case 'julus': // sitting back on the heels
    case 'tasleem':
      return body(<>
        <circle cx="44" cy="23" r="8.5" {...fill} />
        <path {...fill} d="M36 33 Q44 29 52 33 L56 60 Q56 64 51 64 L52 69 L36 69 L37 64 Q33 64 33 60 Z" />
        <path {...fill} d="M34 65 Q52 61 74 70 L74 77 Q52 72 34 74 Z" />
      </>);
    case 'tashahhud': // sitting, right index finger raised
      return body(<>
        <circle cx="44" cy="23" r="8.5" {...fill} />
        <path {...fill} d="M36 33 Q44 29 52 33 L56 60 Q56 64 51 64 L52 69 L36 69 L37 64 Q33 64 33 60 Z" />
        <path {...fill} d="M34 65 Q52 61 74 70 L74 77 Q52 72 34 74 Z" />
        <path {...fill} d="M50 46 L66 42 L67 46 L52 51 Z" />
        <path {...fill} d="M64 44 L69 44 L69 33 L64 34 Z" />
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
