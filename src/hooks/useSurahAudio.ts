import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioBlob } from '@/lib/contentCache';
import { recordDeed } from '@/lib/ledger';

// A zero-length silent clip used to "unlock" the <audio> element inside the
// first user gesture, so that a later programmatic play() (which runs AFTER an
// IndexedDB await and is therefore outside the gesture) isn't blocked by the
// browser's autoplay policy. This was why the very first ayah / the default
// reciter often produced no sound.
export const SILENT_AUDIO =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export interface PlayerVerse {
  ayah: number;
  audioUrl: string | null;
  /** Word-timing segments: each entry is [wordIndex, …, startMs, endMs]. */
  segments: number[][];
}

export interface RepeatConfig {
  from: number;
  to: number;
  /** Total plays of the range; 0 = infinite. */
  times: number;
}

interface Args {
  reciterApiId: number;
  chapter: number;
  verses: PlayerVerse[];
}

export interface SurahPlayer {
  isPlaying: boolean;
  loading: boolean;
  playingAyah: number | null;
  currentWord: number;
  progress: number;
  rate: number;
  repeat: RepeatConfig | null;
  play: (ayah?: number) => void;
  toggle: (ayah?: number) => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  setRate: (rate: number) => void;
  setRepeat: (cfg: RepeatConfig | null) => void;
}

function wordPositionAt(segments: number[][], ms: number): number {
  for (const seg of segments) {
    if (seg.length < 2) continue;
    const start = seg[seg.length - 2];
    const end = seg[seg.length - 1];
    if (ms >= start && ms < end) return seg[0] + 1;
  }
  return 0;
}

export function useSurahAudio({ reciterApiId, chapter, verses }: Args): SurahPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const loadTokenRef = useRef(0);
  const playsDoneRef = useRef(0); // completed plays of the repeat range

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [currentWord, setCurrentWord] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rate, setRateState] = useState(1);
  const [repeat, setRepeatState] = useState<RepeatConfig | null>(null);

  const latest = useRef({ reciterApiId, chapter, verses, playingAyah, rate, repeat });
  latest.current = { reciterApiId, chapter, verses, playingAyah, rate, repeat };

  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }

  const revokeUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const verseFor = (ayah: number): PlayerVerse | undefined =>
    latest.current.verses.find((v) => v.ayah === ayah);

  const playAyah = useCallback(async (ayah: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const { reciterApiId, chapter, rate } = latest.current;
    const token = ++loadTokenRef.current;

    setLoading(true);
    setPlayingAyah(ayah);
    setCurrentWord(0);
    setProgress(0);
    recordDeed('ayah'); // Soul Ledger: count each ayah recited

    const blob = await getAudioBlob(reciterApiId, chapter, ayah);
    if (token !== loadTokenRef.current) return;
    revokeUrl();

    let src: string | null;
    if (blob) {
      src = URL.createObjectURL(blob);
      objectUrlRef.current = src;
    } else {
      src = verseFor(ayah)?.audioUrl ?? null;
      // Offline-first text loads before the network enriches audio URLs. If the
      // URL isn't ready yet (common on the very first ayah right after opening a
      // surah), wait briefly instead of silently skipping the ayah.
      for (let tries = 0; !src && tries < 20; tries++) {
        await new Promise((r) => setTimeout(r, 150));
        if (token !== loadTokenRef.current) return;
        src = verseFor(ayah)?.audioUrl ?? null;
      }
    }
    if (!src) {
      setLoading(false);
      setIsPlaying(false);
      return;
    }

    audio.src = src;
    audio.playbackRate = rate;
    try {
      await audio.play();
      audio.playbackRate = rate;
    } catch {
      // The first programmatic play() can be rejected (autoplay policy / not yet
      // buffered). Retry once shortly before giving up.
      try {
        await new Promise((r) => setTimeout(r, 140));
        if (token === loadTokenRef.current) { await audio.play(); audio.playbackRate = rate; }
      } catch {
        if (token === loadTokenRef.current) setIsPlaying(false);
      }
    } finally {
      if (token === loadTokenRef.current) setLoading(false);
    }
  }, []);

  const play = useCallback((ayah?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    playsDoneRef.current = 0;
    const target = ayah ?? latest.current.playingAyah;
    if (target == null) {
      void playAyah(latest.current.verses[0]?.ayah ?? 1);
    } else if (ayah == null && audio.src && audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      void playAyah(target);
    }
  }, [playAyah]);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const toggle = useCallback((ayah?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const { playingAyah } = latest.current;
    if (ayah != null && ayah !== playingAyah) {
      playsDoneRef.current = 0;
      void playAyah(ayah);
      return;
    }
    if (audio.paused) play(ayah);
    else audio.pause();
  }, [play, playAyah]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    revokeUrl();
    loadTokenRef.current++;
    playsDoneRef.current = 0;
    setIsPlaying(false);
    setPlayingAyah(null);
    setCurrentWord(0);
    setProgress(0);
    setLoading(false);
  }, []);

  const next = useCallback(() => {
    const { playingAyah, verses } = latest.current;
    const n = (playingAyah ?? 0) + 1;
    playsDoneRef.current = 0;
    if (verses.some((v) => v.ayah === n)) void playAyah(n);
  }, [playAyah]);

  const prev = useCallback(() => {
    const { playingAyah } = latest.current;
    const p = (playingAyah ?? 2) - 1;
    playsDoneRef.current = 0;
    if (p >= 1) void playAyah(p);
  }, [playAyah]);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  const setRepeat = useCallback((cfg: RepeatConfig | null) => {
    playsDoneRef.current = 0;
    setRepeatState(cfg);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => { setIsPlaying(true); document.body.classList.add('reciting'); };
    const onPause = () => { setIsPlaying(false); document.body.classList.remove('reciting'); };
    const onTime = () => {
      if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
      const ayah = latest.current.playingAyah;
      const verse = ayah != null ? verseFor(ayah) : undefined;
      if (verse && verse.segments.length) {
        setCurrentWord(wordPositionAt(verse.segments, audio.currentTime * 1000));
      }
    };
    const onEnded = () => {
      const { playingAyah, verses, repeat } = latest.current;
      const cur = playingAyah ?? 0;

      if (repeat && cur >= repeat.from && cur <= repeat.to) {
        if (cur < repeat.to) {
          void playAyah(cur + 1);
          return;
        }
        // reached end of the repeat range
        playsDoneRef.current += 1;
        if (repeat.times === 0 || playsDoneRef.current < repeat.times) {
          void playAyah(repeat.from);
          return;
        }
        // range finished the requested number of times → stop
        setIsPlaying(false);
        setPlayingAyah(null);
        setCurrentWord(0);
        setProgress(0);
        return;
      }

      const n = cur + 1;
      if (verses.some((v) => v.ayah === n)) {
        void playAyah(n);
      } else {
        setIsPlaying(false);
        setPlayingAyah(null);
        setCurrentWord(0);
        setProgress(0);
      }
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playAyah]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    revokeUrl();
    loadTokenRef.current++;
    playsDoneRef.current = 0;
    setIsPlaying(false);
    setPlayingAyah(null);
    setCurrentWord(0);
    setProgress(0);
    setLoading(false);
    setRepeatState(null);
  }, [chapter, reciterApiId]);

  // Warm up audio playback on the first user interaction using a SEPARATE,
  // throwaway element — NEVER the player's own element. Playing a 0-length clip
  // on the real element fired its `ended`/`play` events and made it jump across
  // ayat with a snow flicker. A gesture-initiated play on any element grants the
  // document the audio permission that the real player then inherits.
  useEffect(() => {
    let done = false;
    const unlock = () => {
      if (done) return;
      done = true;
      try {
        const silent = new Audio(SILENT_AUDIO);
        silent.volume = 0;
        const p = silent.play();
        if (p) p.then(() => silent.pause()).catch(() => {});
      } catch { /* ignore */ }
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
      }
      revokeUrl();
      document.body.classList.remove('reciting');
    };
  }, []);

  return {
    isPlaying, loading, playingAyah, currentWord, progress, rate, repeat,
    play, toggle, pause, stop, next, prev, setRate, setRepeat,
  };
}
