import jsmediatags from 'jsmediatags';
import type { Track } from '../types';

export async function parseAudioFile(file: File): Promise<Track> {
  const url = URL.createObjectURL(file);
  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let album = '';
  let coverUrl = '';

  try {
    const tags = await new Promise<any>((resolve, reject) => {
      new jsmediatags.Reader(file).read({
        onSuccess: (tag) => resolve(tag.tags),
        onError: (err) => reject(err),
      });
    });

    if (tags.title) title = tags.title;
    if (tags.artist) artist = tags.artist;
    if (tags.album) album = tags.album;

    if (tags.picture) {
      const { data, format } = tags.picture;
      let base64String = '';
      for (let i = 0; i < data.length; i++) {
        base64String += String.fromCharCode(data[i]);
      }
      coverUrl = `data:${format};base64,${btoa(base64String)}`;
    }
  } catch {
    // If ID3 read fails, fallback to filename parsing e.g. "Artist - Song.mp3"
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  // Get duration
  const duration = await getAudioDuration(url);

  return {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    artist,
    album,
    duration,
    url,
    coverUrl,
    file,
    source: 'local',
  };
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration || 0);
    });
    audio.addEventListener('error', () => {
      resolve(0);
    });
  });
}
