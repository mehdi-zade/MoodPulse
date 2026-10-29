import { openDB } from 'idb';
import type { Track, Scenario } from '../types';

const DB_NAME = 'moodpulse_db';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tracks')) {
        db.createObjectStore('tracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('scenarios')) {
        db.createObjectStore('scenarios', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
}

export async function saveTrack(track: Track) {
  const db = await initDB();
  // Don't store huge raw files or blob URLs that expire; store metadata
  const storable = { ...track, url: track.source === 'demo' ? track.url : '' };
  await db.put('tracks', storable);
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await initDB();
  return db.getAll('tracks');
}

export async function saveScenarios(scenarios: Scenario[]) {
  const db = await initDB();
  const tx = db.transaction('scenarios', 'readwrite');
  for (const s of scenarios) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function getScenarios(): Promise<Scenario[]> {
  const db = await initDB();
  return db.getAll('scenarios');
}
