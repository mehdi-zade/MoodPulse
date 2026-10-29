import type { Track } from '../types';

export function setupMediaSession(
  track: Track | null,
  handlers: {
    play: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
    seekTo?: (time: number) => void;
  }
) {
  if (!('mediaSession' in navigator)) return;

  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }

  const artwork = track.coverUrl
    ? [
        { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
      ]
    : [];

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album || (track.scenario ? `Scenario: ${track.scenario}` : 'MoodPulse Library'),
    artwork,
  });

  navigator.mediaSession.setActionHandler('play', handlers.play);
  navigator.mediaSession.setActionHandler('pause', handlers.pause);
  navigator.mediaSession.setActionHandler('nexttrack', handlers.next);
  navigator.mediaSession.setActionHandler('previoustrack', handlers.prev);

  if (handlers.seekTo) {
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        handlers.seekTo!(details.seekTime);
      }
    });
  }
}

export function updateMediaPosition(currentTime: number, duration: number) {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  if (duration > 0 && !isNaN(currentTime)) {
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1.0,
        position: Math.min(currentTime, duration),
      });
    } catch {
      // Ignore if state update fails
    }
  }
}
