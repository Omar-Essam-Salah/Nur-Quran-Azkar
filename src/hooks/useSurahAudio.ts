import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioBlob } from '@/lib/contentCache';
import { recordDeed } from '@/lib/ledger';
import { audioEl, claimAudio, isOwner, unlockAudio } from '@/lib/audioBus';
import { surahList } from '@/data/surahList';
import { RECITERS } from '@/data/reciters';

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
  const playTimerRef = useRef<number | undefined>(undefined); // coalesces rapid taps
  const lastStartRef = useRef(0); // ms timestamp of the last real load+play
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

  // Warm the NEXT ayah into the (CORS) cache while the current one plays, so it
  // starts instantly with no mid-recitation "buffering" pause. fetch() defaults
  // to CORS mode, so the service worker stores a real, replayable response.
  const prefetchNext = (ayah: number) => {
    const url = verseFor(ayah + 1)?.audioUrl;
    if (url) { try { void fetch(url, { mode: 'cors' }).catch(() => {}); } catch { /* ignore */ } }
  };

  // Tell the OS we're an active media session: keeps recitation alive when the
  // screen locks and shows play/pause/next on the lock screen & notification.
  const updateMediaSession = (ayah: number) => {
    if (!('mediaSession' in navigator)) return;
    try {
      const { chapter, reciterApiId } = latest.current;
      const surah = surahList.find((s) => s.number === chapter);
      const reciter = RECITERS.find((r) => r.apiId === reciterApiId);
      // eslint-disable-next-line no-undef
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${surah?.name ?? 'القرآن الكريم'} • آية ${ayah}`,
        artist: reciter?.arabicName ?? 'نور',
        album: 'نور — القرآن الكريم',
        artwork: [{ src: `${import.meta.env.BASE_URL}icon-512.png`, sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.playbackState = 'playing';
    } catch { /* ignore */ }
  };

  // The ACTUAL load+play for one ayah. Never call this directly from the UI —
  // go through playAyah(), which coalesces rapid taps so this runs once.
  const doPlayAyah = useCallback(async (ayah: number, token: number) => {
    const audio = audioRef.current;
    if (!audio || token !== loadTokenRef.current) return;
    const { reciterApiId, chapter, rate } = latest.current;
    lastStartRef.current = Date.now();
    // Take the shared element (stops adhan/preview/mushaf, marks us owner) and
    // reset it cleanly so the new src loads on Android WebView.
    ownerRef.current = claimAudio();
    recordDeed('ayah'); // Soul Ledger: count each ayah actually played

    const start = (src: string, isBlob: boolean) => {
      if (token !== loadTokenRef.current) return;
      revokeUrl();
      if (isBlob) objectUrlRef.current = src;
      audio.src = src;
      audio.playbackRate = rate;
      audio.play()
        .then(() => {
          audio.playbackRate = rate;
          if (token === loadTokenRef.current) { setLoading(false); updateMediaSession(ayah); prefetchNext(ayah); }
        })
        .catch(() => {
          // play() can be rejected before the element is "warm" — retry a few
          // times while it buffers, bailing if a newer tap took over.
          const retry = (n: number) => {
            if (token !== loadTokenRef.current) return;
            audio.play()
              .then(() => {
                audio.playbackRate = rate;
                if (token === loadTokenRef.current) { setLoading(false); updateMediaSession(ayah); prefetchNext(ayah); }
              })
              .catch(() => {
                if (token !== loadTokenRef.current) return;
                if (n >= 3) { setIsPlaying(false); setLoading(false); return; }
                window.setTimeout(() => retry(n + 1), 160);
              });
          };
          window.setTimeout(() => retry(1), 150);
        });
    };

    // FAST PATH: a network URL is ready → start it NOW, synchronously. (When
    // called inside the tap, this also keeps us within the user gesture.)
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

  // Public entry. Updates the UI instantly, but COALESCES rapid taps: a single,
  // deliberate tap plays immediately; while you're quickly flipping between
  // ayat we wait for you to settle and then load+play only the final one. This
  // is the fix for "the audio stops when I flip between several ayat" — Android
  // WebView can't survive a burst of load() calls, so we only ever issue one.
  const playAyah = useCallback((ayah: number) => {
    const token = ++loadTokenRef.current;
    setLoading(true);
    setPlayingAyah(ayah);
    setCurrentWord(0);
    setProgress(0);
    window.clearTimeout(playTimerRef.current);
    const idle = Date.now() - lastStartRef.current > 350;
    if (idle) {
      void doPlayAyah(ayah, token); // instant for a deliberate tap (and in-gesture)
    } else {
      playTimerRef.current = window.setTimeout(() => { void doPlayAyah(ayah, token); }, 200);
    }
  }, [doPlayAyah]);

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
    window.clearTimeout(playTimerRef.current);
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
    const onPlay = () => { if (!isOwner(ownerRef.current)) return; setIsPlaying(true); document.body.classList.add('reciting'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; };
    const onPause = () => { if (!isOwner(ownerRef.current)) return; setIsPlaying(false); document.body.classList.remove('reciting'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; };
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

  // Lock-screen / notification media controls (and they help the OS keep the
  // recitation alive while the screen is off).
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (a: MediaSessionAction, h: (() => void) | null) => { try { ms.setActionHandler(a, h); } catch { /* unsupported action */ } };
    set('play', () => play());
    set('pause', () => pause());
    set('nexttrack', () => next());
    set('previoustrack', () => prev());
    set('stop', () => stop());
    return () => {
      (['play', 'pause', 'nexttrack', 'previoustrack', 'stop'] as MediaSessionAction[]).forEach((a) => set(a, null));
    };
  }, [play, pause, next, prev, stop]);

  useEffect(() => {
    return () => {
      window.clearTimeout(playTimerRef.current);
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
