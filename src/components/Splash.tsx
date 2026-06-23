import { useEffect, useState } from 'react';

// Brief intro shown on launch: logo + name + a short du'a, then fades out.
export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2100);
    const t2 = setTimeout(onDone, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: 'radial-gradient(ellipse at center, #0c2f44 0%, #07151d 75%)',
        opacity: leaving ? 0 : 1,
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}icon-512.png`}
        alt="Nur"
        className="w-28 h-28 rounded-3xl"
        style={{ boxShadow: '0 16px 50px rgba(0,0,0,0.5)', animation: 'splash-pop 0.7s ease-out both' }}
      />
      <h1 className="mt-5 text-3xl font-semibold text-white arabic-text" style={{ animation: 'splash-fade 0.9s 0.2s ease-out both' }}>
        نور
      </h1>
      <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[#d4af37]" style={{ animation: 'splash-fade 0.9s 0.35s ease-out both' }}>
        Quran &amp; Azkar
      </p>
      <p className="mt-6 text-[12px] text-[#94a3b8] arabic-text px-8 text-center max-w-xs" style={{ animation: 'splash-fade 0.9s 0.5s ease-out both' }}>
        ﴿رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ﴾
      </p>

      <style>{`
        @keyframes splash-pop { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes splash-fade { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
