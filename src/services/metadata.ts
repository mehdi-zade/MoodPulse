import type { LRCLine } from '../types';

export function parseLRC(lrcText: string): LRCLine[] {
  const lines = lrcText.split('\n');
  const result: LRCLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length > 0) {
      const text = line.replace(timeRegex, '').trim();
      for (const match of matches) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
        const totalSeconds = min * 60 + sec + ms / 1000;
        result.push({ time: totalSeconds, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export async function fetchLyricsLRCLIB(title: string, artist: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ track_name: title, artist_name: artist });
    const res = await fetch(`https://lrclib.net/api/get?${q.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.syncedLyrics || data.plainLyrics || null;
  } catch {
    return null;
  }
}

export async function fetchCoverArt(title: string, artist: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results?.[0]?.artworkUrl100) {
      // Upscale 100x100 to 600x600 high res
      return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    }
  } catch {
    // fallback
  }
  return null;
}
