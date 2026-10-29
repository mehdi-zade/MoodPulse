export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  url: string; // ObjectURL or remote preview URL
  coverUrl?: string;
  file?: File;
  scenario?: string; // Tagged scenario name if any
  valence?: number; // 0.0 - 1.0 (mood: sad -> happy)
  energy?: number;  // 0.0 - 1.0 (intensity: chill -> high energy)
  tempo?: number;   // estimated BPM
  source: 'local' | 'discovered' | 'demo';
  lyrics?: string;  // raw LRC or text
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  centroid: [number, number]; // [valence, energy]
  count: number;
}

export interface LRCLine {
  time: number; // in seconds
  text: string;
}

export interface DiscoveredTrack {
  title: string;
  artist: string;
  scenario: string;
  reason: string;
  valence: number;
  energy: number;
  spotifyQuery?: string;
  youtubeQuery?: string;
}
