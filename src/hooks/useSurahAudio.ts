import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioBlob } from '@/lib/contentCache';
import { recordDeed } from '@/lib/ledger';
import { audioEl, claimAudio, isOwner, unlockAudio } from '@/lib/audioBus';

// Re-exported for older importers. The reciter, the Settings preview, the
// adhan and the Mushaf all share ONE audio element now (see lib/audioBus.ts) so
// a stuck sound can never freeze the next one.
export { SILENT_AUDIO } from '@/lib/audioBus';

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
  const ownerRef = useRef(0); // our claim on the shared audio element
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

  if (audioRef.current === null) {
    audioRef.current = audioEl(); // the one app-wide shared element
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
    // Only take the shared element when another player (adhan/preview/mushaf)
    // currently holds it. While we're already the owner — i.e. fast tapping
    // between ayat in the same reader — we do NOT re-claim, so playback stays as
    // light as a plain `src = …` swap and the element never thrashes.
    if (!isOwner(ownerRef.current)) ownerRef.current = claimAudio();

    setLoading(true);
    setPlayingAyah(ayah);
    setCurrentWord(0);
    setProgress(0);
    recordDeed('ayah'); // Soul Ledger: count each ayah recited

    const start = (src: string, isBlob: boolean) => {
      if (token !== loadTokenRef.current) return;
      revokeUrl();
      if (isBlob) objectUrlRef.current = src;
      audio.src = src;
      audio.playbackRate = rate;
      // Try to play, retrying while the element buffers. Each attempt bails the
      // moment a newer tap takes over (token change), so only the ayah the user
      // finally landed on keeps trying — this is what fixes "jump to 4, come
      // back, and 1/2/3 won't play": the final src just needs a few ms to be
      // ready, and we keep nudging it until it is.
      let settled = false;
      const attempt = (n: number) => {
        if (settled || token !== loadTokenRef.current) return;
        audio.play()
          .then(() => { settled = true; audio.playbackRate = rate; if (token === loadTokenRef.current) setLoading(false); })
          .catch(() => {
            if (settled || token !== loadTokenRef.current) return;
            if (n >= 5) { setIsPlaying(false); setLoading(false); return; }
            window.setTimeout(() => attempt(n + 1), 160);
          });
      };
      attempt(0);
    };

    // FAST PATH: a network URL is ready → start it NOW, synchronously, still
    // inside the user's tap. This is the fix for the first ayah / default reciter
    // not playing: an `await` before play() leaves the user-gesture context and
    // the browser blocks autoplay. (Offline-downloaded audio is recovered by the
    // 'error' handler, which swaps in the saved blob.)
    const netUrl = verseFor(ayah)?.audioUrl ?? null;
    if (netUrl) {
      start(netUrl, false);
      return;
    }

    // No URL yet (offline-first text loaded before audio was enriched, or a
    // download-only surah): use a saved blob, or wait briefly for the URL.
    const blob = await getAudioBlob(reciterApiId, chapter, ayah);
    if (token !== loadTokenRef.current) return;
    if (blob) { start(URL.createObjectURL(blob), true); return; }
    let src: string | null = null;
    for (let tries = 0; !src && tries < 20; tries++) {
      await new Promise((r) => setTimeout(r, 150));
      if (token !== loadTokenRef.current) return;
      src = verseFor(ayah)?.audioUrl ?? null;
    }
    if (!src) { setLoading(false); setIsPlaying(false); return; }
    start(src, false);
  }, []);

  const play = useCallback((ayah?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    playsDoneRef.current = 0;
    const target = ayah ?? latest.current.playingAyah;
    if (target == null) {
      void playAyah(latest.current.verses[0]?.ayah ?? 1);
    } else if (ayah == null && isOwner(ownerRef.current) && audio.src && audio.paused) {
      // Resume only if we still hold the shared element; otherwise restart so we
      // reclaim it from whatever played in between (adhan, preview…).
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
    // All handlers no-op unless we currently own the shared element, so audio
    // played by the adhan / preview / mushaf never drives the reciter's state.
    const onPlay = () => { if (!isOwner(ownerRef.current)) return; setIsPlaying(true); document.body.classList.add('reciting'); };
    const onPause = () => { if (!isOwner(ownerRef.current)) return; setIsPlaying(false); document.body.classList.remove('reciting'); };
    const onTime = () => {
      if (!isOwner(ownerRef.current)) return;
      if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
      const ayah = latest.current.playingAyah;
      const verse = ayah != null ? verseFor(ayah) : undefined;
      if (verse && verse.segments.length) {
        setCurrentWord(wordPositionAt(verse.segments, audio.currentTime * 1000));
      }
    };
    const onEnded = () => {
      if (!isOwner(ownerRef.current)) return;
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
    const onError = () => {
      if (!isOwner(ownerRef.current)) return;
      // An empty src (set by claimAudio's reset) is not a real failure.
      if (!audio.currentSrc || audio.currentSrc.startsWith('data:')) return;
      // Rapidly changing src (fast next/prev/back) aborts the in-flight load and
      // fires an 'error' with code ABORTED. That's not a real failure — ignore it,
      // otherwise the reset below kills the playback the newest tap just started.
      if (audio.error && audio.error.code === audio.error.MEDIA_ERR_ABORTED) return;
      // The network file failed (offline / bad URL). If this ayah was downloaded,
      // recover by playing the saved blob; otherwise reset cleanly so the UI
      // isn't stuck on "loading" and the snow layer reappears.
      const { reciterApiId, chapter, playingAyah } = latest.current;
      const reset = () => { setLoading(false); setIsPlaying(false); document.body.classList.remove('reciting'); };
      if (playingAyah != null) {
        getAudioBlob(reciterApiId, chapter, playingAyah).then((blob) => {
          if (blob && latest.current.playingAyah === playingAyah) {
            revokeUrl();
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            audio.src = url;
            void audio.play().catch(reset);
          } else reset();
        }).catch(reset);
        return;
      }
      reset();
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
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
    const unlock = () => unlockAudio();
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
