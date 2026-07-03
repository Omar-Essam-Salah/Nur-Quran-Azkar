// Full-colour vector illustrations for the "Learn" section (prayer postures +
// wudū steps). Pure SVG → crisp at any size, tiny, 100% offline. Instead of the
// old abstract gold glyphs these are little illustrated scenes: a person in a
// teal thobe + white cap on a prayer mat for each posture, and a clear body
// part with running water for each wudū step.

interface Props { pose: string; className?: string }

// ── Palette ──────────────────────────────────────────────────────────────
const C = {
  robe: '#1f8fa3', robeD: '#14717f', robeL: '#48adbe',
  skin: '#e8b483', skinD: '#cf9660',
  cap: '#f6f3ea', capSh: '#ddd6c4',
  mat: '#d4af37', matD: '#a9821a',
  water: '#5bb8d6', waterD: '#2f9ac4',
  hair: '#3b2a1b', tap: '#9aa5ab',
};

// A little prayer mat / ground the figure sits on.
const Mat = () => (
  <g>
    <rect x="6" y="86" width="88" height="8" rx="4" fill={C.mat} />
    <rect x="6" y="86" width="88" height="3" rx="1.5" fill={C.matD} opacity="0.55" />
  </g>
);

// An upright head with a white taqiyah (cap) + a short beard.
const Head = ({ cx, cy, r = 8, beard = true }: { cx: number; cy: number; r?: number; beard?: boolean }) => (
  <g>
    {beard && <path d={`M${cx - r * 0.62} ${cy + r * 0.25} Q${cx} ${cy + r + 3} ${cx + r * 0.62} ${cy + r * 0.25} Z`} fill={C.hair} opacity="0.85" />}
    <circle cx={cx} cy={cy} r={r} fill={C.skin} />
    <path d={`M${cx - r + 1} ${cy - r * 0.5} Q${cx} ${cy - r - 4} ${cx + r - 1} ${cy - r * 0.5} Z`} fill={C.cap} />
    <path d={`M${cx - r + 1} ${cy - r * 0.5} Q${cx} ${cy - r * 0.5 - 2} ${cx + r - 1} ${cy - r * 0.5}`} stroke={C.capSh} strokeWidth="1.4" fill="none" opacity="0.7" />
  </g>
);

// A bare (washing) head with hair + ears, for the face-area wudū steps.
const WuduHead = ({ children }: { children?: React.ReactNode }) => (
  <g>
    <circle cx="30" cy="52" r="4.5" fill={C.skin} />
    <circle cx="70" cy="52" r="4.5" fill={C.skin} />
    <circle cx="50" cy="50" r="24" fill={C.skin} />
    <path d="M27 46 Q28 24 50 24 Q72 24 73 46 Q66 35 50 34 Q34 35 27 46 Z" fill={C.hair} />
    <circle cx="41" cy="49" r="2.1" fill={C.hair} />
    <circle cx="59" cy="49" r="2.1" fill={C.hair} />
    {children}
  </g>
);

// A water droplet.
const Drop = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x} ${y} c0 0 ${-5 * s} ${6 * s} ${-5 * s} ${10 * s} a${5 * s} ${5 * s} 0 1 0 ${10 * s} 0 c0 ${-4 * s} ${-5 * s} ${-10 * s} ${-5 * s} ${-10 * s} z`} fill={C.water} opacity="0.9" />
);

// A tap + a running stream of water from the top of the frame.
const Tap = ({ x = 50, to = 46 }: { x?: number; to?: number }) => (
  <g>
    <path d={`M${x - 12} 6 h16 v5 h-5 v3 h-4 v-3 h-3 z`} fill={C.tap} />
    <rect x={x - 2} y="11" width="4" height={to - 11} rx="2" fill={C.water} opacity="0.9" />
  </g>
);

export default function LearnFigure({ pose, className }: Props) {
  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={pose}>{children}</svg>
  );

  switch (pose) {
    // ── Prayer postures ──────────────────────────────────────────────────
    case 'qiyam': // standing, right hand over left on the chest
    case 'itidal':
      return svg(<>
        <Mat />
        <path d="M37 40 Q50 33 63 40 L69 86 Q50 90 31 86 Z" fill={C.robe} />
        <path d="M37 40 Q50 33 63 40 L62 48 Q50 43 38 48 Z" fill={C.robeD} opacity="0.55" />
        <path d="M50 42 L50 88" stroke={C.robeD} strokeWidth="1.3" opacity="0.35" />
        <path d="M39 53 Q50 58 61 53 L59 60 Q50 63 41 60 Z" fill={C.skin} />
        <path d="M50 54 L50 62" stroke={C.skinD} strokeWidth="1.3" opacity="0.5" />
        <Head cx={50} cy={23} />
      </>);

    case 'takbir': // standing, both hands raised beside the ears
      return svg(<>
        <Mat />
        <path d="M37 42 Q50 35 63 42 L69 86 Q50 90 31 86 Z" fill={C.robe} />
        <path d="M37 42 Q50 35 63 42 L62 50 Q50 45 38 50 Z" fill={C.robeD} opacity="0.55" />
        <path d="M41 44 Q31 42 31 31 Q31 26 35 24" stroke={C.robe} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M59 44 Q69 42 69 31 Q69 26 65 24" stroke={C.robe} strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="36" cy="23" r="4" fill={C.skin} />
        <circle cx="64" cy="23" r="4" fill={C.skin} />
        <Head cx={50} cy={23} />
      </>);

    case 'ruku': // bowing — back level, hands on the knees (faces right)
      return svg(<>
        <Mat />
        <rect x="39" y="60" width="9" height="27" rx="4" fill={C.robeD} />
        <rect x="50" y="60" width="9" height="27" rx="4" fill={C.robe} />
        <path d="M42 48 Q58 42 76 47 L77 58 Q60 54 46 61 Z" fill={C.robe} />
        <path d="M42 48 Q58 42 76 47 L75 52 Q59 48 45 55 Z" fill={C.robeD} opacity="0.5" />
        <path d="M72 54 L58 71" stroke={C.skin} strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="57" cy="72" r="3.6" fill={C.skin} />
        <Head cx={82} cy={53} r={7.5} beard={false} />
      </>);

    case 'sujud': // prostration — forehead to the ground, hips raised (faces right)
      return svg(<>
        <Mat />
        <path d="M20 85 Q21 60 43 57 Q62 55 73 80 L74 85 Z" fill={C.robe} />
        <path d="M20 85 Q21 60 43 57 L45 65 Q26 69 24 85 Z" fill={C.robeD} opacity="0.45" />
        <rect x="12" y="79" width="15" height="7" rx="3.5" fill={C.robeD} />
        <rect x="64" y="82" width="18" height="4" rx="2" fill={C.skin} />
        <circle cx="79" cy="77" r="7" fill={C.skin} />
        <path d="M72.5 74 Q79 69 85.5 74 Z" fill={C.cap} />
      </>);

    case 'julus': // sitting back on the heels
      return svg(<>
        <Mat />
        <path d="M31 86 Q27 58 50 53 Q73 58 69 86 Z" fill={C.robe} />
        <path d="M31 86 Q27 58 50 53 L50 86 Z" fill={C.robeD} opacity="0.3" />
        <circle cx="39" cy="74" r="4" fill={C.skin} />
        <circle cx="61" cy="74" r="4" fill={C.skin} />
        <Head cx={50} cy={41} />
      </>);

    case 'tasleem': // sitting, turning the head to give salām (to the right)
      return svg(<>
        <Mat />
        <path d="M31 86 Q27 58 50 53 Q73 58 69 86 Z" fill={C.robe} />
        <path d="M31 86 Q27 58 50 53 L50 86 Z" fill={C.robeD} opacity="0.3" />
        <circle cx="39" cy="74" r="4" fill={C.skin} />
        <circle cx="61" cy="74" r="4" fill={C.skin} />
        {/* head turned right */}
        <path d={`M42 41 Q42 32 51 32 Q60 32 60 41 Q60 47 55 49 Q60 49 60 41 Z`} fill={C.hair} opacity="0.85" />
        <circle cx="51" cy="41" r="8" fill={C.skin} />
        <path d="M59 41 L63 43 L59 45 Z" fill={C.skin} />
        <path d="M43 36.5 Q51 30 59.5 36.5 Z" fill={C.cap} />
      </>);

    case 'tashahhud': // sitting, right index finger raised
      return svg(<>
        <Mat />
        <path d="M31 86 Q27 58 50 53 Q73 58 69 86 Z" fill={C.robe} />
        <path d="M31 86 Q27 58 50 53 L50 86 Z" fill={C.robeD} opacity="0.3" />
        <circle cx="39" cy="74" r="4" fill={C.skin} />
        {/* raised hand: forearm + fist + pointing index finger */}
        <path d="M60 78 L63 62" stroke={C.skin} strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="63" cy="61" r="4.6" fill={C.skinD} />
        <rect x="61" y="47" width="4.6" height="14" rx="2.3" fill={C.skin} />
        <Head cx={50} cy={41} />
      </>);

    // ── Wudū steps ───────────────────────────────────────────────────────
    case 'niyyah': // intention — a heart
      return svg(<>
        <path d="M50 82 C18 60 22 30 41 30 c7 0 9 6 9 6 s2-6 9-6 c19 0 23 30 -9 52 z" fill={C.robe} />
        <path d="M50 82 C18 60 22 30 41 30 c7 0 9 6 9 6 l0 46 z" fill={C.robeD} opacity="0.25" />
        <circle cx="38" cy="44" r="4" fill="#fff" opacity="0.5" />
      </>);

    case 'hands': // wash the hands — two cupped hands under a tap
      return svg(<>
        <Tap x={50} to={44} />
        <path d="M24 60 Q24 47 35 47 L65 47 Q76 47 76 60 Q76 73 50 75 Q24 73 24 60 Z" fill={C.skin} />
        <ellipse cx="50" cy="54" rx="17" ry="4.5" fill={C.water} opacity="0.85" />
        <path d="M50 49 L50 74" stroke={C.skinD} strokeWidth="1.4" opacity="0.4" />
        <path d="M34 50 V58 M42 49 V59 M58 49 V59 M66 50 V58" stroke={C.skinD} strokeWidth="1.8" opacity="0.4" strokeLinecap="round" />
      </>);

    case 'mouth': // rinse the mouth
      return svg(<WuduHead>
        <path d="M42 62 Q50 70 58 62 Q50 66 42 62 Z" fill={C.waterD} />
        <Drop x={50} y={4} s={0.8} />
      </WuduHead>);

    case 'nose': // sniff water into the nose
      return svg(<WuduHead>
        <path d="M50 47 L45 60 Q50 63 55 60 Z" fill={C.skinD} />
        <Drop x={62} y={6} s={0.8} />
      </WuduHead>);

    case 'face': // wash the whole face
      return svg(<>
        <Drop x={28} y={8} s={0.7} /><Drop x={72} y={8} s={0.7} /><Drop x={50} y={4} s={0.7} />
        <WuduHead>
          <path d="M43 62 Q50 66 57 62" stroke={C.skinD} strokeWidth="2" fill="none" strokeLinecap="round" />
        </WuduHead>
        <circle cx="20" cy="60" r="6" fill={C.skin} />
        <circle cx="80" cy="60" r="6" fill={C.skin} />
      </>);

    case 'arms': // wash the forearms to the elbows
      return svg(<>
        <Tap x={64} to={22} />
        <path d="M28 82 L28 54 Q28 45 37 45 L60 45" stroke={C.skin} strokeWidth="12" fill="none" strokeLinecap="round" />
        <rect x="21" y="76" width="15" height="9" rx="4" fill={C.robe} />
        <circle cx="62" cy="45" r="6.5" fill={C.skin} />
        <path d="M64 24 Q60 40 58 45" stroke={C.water} strokeWidth="3" fill="none" opacity="0.8" strokeLinecap="round" />
      </>);

    case 'head': // wipe (masḥ) over the head with a wet hand
      return svg(<>
        <Drop x={50} y={6} s={0.8} />
        <path d="M26 66 A24 24 0 0 1 74 66 Z" fill={C.skin} />
        <path d="M24 46 Q30 26 50 26 Q70 26 76 46" stroke={C.hair} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M27 60 Q50 40 73 60" stroke={C.water} strokeWidth="4" fill="none" opacity="0.85" strokeLinecap="round" />
        {/* wiping hand */}
        <path d="M42 40 Q50 34 58 40 L57 52 Q50 55 43 52 Z" fill={C.skinD} />
      </>);

    case 'ears': // wipe the ears
      return svg(<WuduHead>
        <circle cx="70" cy="52" r="5.5" fill={C.water} opacity="0.9" />
        <path d="M70 49 a3 3 0 1 0 0.1 0" stroke={C.waterD} strokeWidth="1.6" fill="none" />
        <Drop x={72} y={8} s={0.75} />
      </WuduHead>);

    case 'feet': // wash the feet to the ankles
      return svg(<>
        <Tap x={30} to={20} />
        <rect x="40" y="40" width="18" height="9" rx="4" fill={C.robe} />
        <path d="M34 76 Q29 76 29 67 Q29 47 47 45 Q61 43 61 55 Q61 63 71 65 Q83 67 83 76 Z" fill={C.skin} />
        <path d="M66 70 h13" stroke={C.skinD} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
        <path d="M30 22 Q34 38 40 46" stroke={C.water} strokeWidth="3" fill="none" opacity="0.8" strokeLinecap="round" />
      </>);

    case 'shahada': // testimony — raise the index finger
      return svg(<>
        <path d="M50 20 l1.8 4.5 4.8 0.4 -3.6 3.2 1.1 4.7 -4.1 -2.5 -4.1 2.5 1.1 -4.7 -3.6 -3.2 4.8 -0.4 z" fill={C.mat} />
        <rect x="43" y="46" width="14" height="36" rx="7" fill={C.skin} />
        <circle cx="50" cy="56" r="9" fill={C.skinD} />
        <rect x="46" y="30" width="7.5" height="24" rx="3.7" fill={C.skin} />
      </>);

    default:
      return svg(<circle cx="50" cy="50" r="6" fill={C.robe} />);
  }
}
