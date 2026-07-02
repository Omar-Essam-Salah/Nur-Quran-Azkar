import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speakAs, stopSpeaking, subscribeTTS, speakingOwner, newSpeakerId, ttsSupported } from '@/lib/tts';

// A small "listen" button that reads its `text` aloud with the device TTS engine.
// Renders nothing if the platform has no speech synthesis.
export function SpeakButton({ text, lang = 'ar-SA', size = 16, className }: {
  text: string; lang?: string; size?: number; className?: string;
}) {
  const [id] = useState(() => newSpeakerId());
  const [, force] = useState(0);
  useEffect(() => subscribeTTS(() => force((n) => n + 1)), []);
  useEffect(() => () => { if (speakingOwner() === id) stopSpeaking(); }, [id]);

  if (!ttsSupported()) return null;
  const speaking = speakingOwner() === id;
  const toggle = () => { if (speaking) stopSpeaking(); else speakAs(id, text, { lang }); };

  return (
    <button
      onClick={toggle}
      className={className ?? 'p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0'}
      title={speaking ? 'Stop' : 'Listen · استمع'}
      aria-label="Listen"
    >
      {speaking
        ? <Square size={size} className="text-[#d4af37]" fill="currentColor" />
        : <Volume2 size={size} className="text-[color:var(--text-muted)]" />}
    </button>
  );
}
