import React, { useState, useEffect, useRef } from 'react';
import type { Track, Scenario, DiscoveredTrack } from './types';
import { DEFAULT_SCENARIOS } from './data/defaultScenarios';
import { parseAudioFile } from './services/audioScanner';
import { setupMediaSession, updateMediaPosition } from './services/mediaSession';
import { fetchLyricsLRCLIB, fetchCoverArt } from './services/metadata';
import { AudioVisualizer } from './components/AudioVisualizer';
import { LyricsModal } from './components/LyricsModal';
import { MenuDrawer } from './components/MenuDrawer';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Menu, AlignLeft, Music } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);

  // Modals / Drawers
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [activeLyrics, setActiveLyrics] = useState<string | null>(null);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTrack: Track | null = tracks[currentIndex] || null;

  // Add demo audio if empty so the user can test immediately
  useEffect(() => {
    if (tracks.length === 0) {
      const demoTracks: Track[] = [
        {
          id: 'demo_1',
          title: 'Midnight City Drive',
          artist: 'MoodPulse Lo-Fi',
          album: 'Autonomous Echoes',
          duration: 180,
          url: 'https://cdn.freesound.org/previews/708/708304_11861866-lq.mp3',
          coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
          scenario: 'Driving (Night)',
          valence: 0.45,
          energy: 0.62,
          tempo: 110,
          source: 'demo',
        },
        {
          id: 'demo_2',
          title: 'Neon Horizon',
          artist: 'Cyber Ambient',
          album: 'Deep Waves',
          duration: 210,
          url: 'https://cdn.freesound.org/previews/682/682121_11861866-lq.mp3',
          coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
          scenario: 'Deep Work',
          valence: 0.38,
          energy: 0.42,
          tempo: 90,
          source: 'demo',
        },
      ];
      setTracks(demoTracks);
    }
  }, []);

  // Sync with MediaSession API for lock-screen controls & background audio
  useEffect(() => {
    setupMediaSession(currentTrack, {
      play: handlePlay,
      pause: handlePause,
      next: handleNext,
      prev: handlePrev,
      seekTo: handleSeek,
    });
  }, [currentTrack]);

  // When track changes, auto fetch lyrics and cover art if missing
  useEffect(() => {
    if (!currentTrack) return;
    setCurrentTime(0);

    // Fetch synced lyrics in background
    if (!currentTrack.lyrics) {
      fetchLyricsLRCLIB(currentTrack.title, currentTrack.artist).then((lrc) => {
        if (lrc) {
          setActiveLyrics(lrc);
          setTracks((prev) =>
            prev.map((t) => (t.id === currentTrack.id ? { ...t, lyrics: lrc } : t))
          );
        }
      });
    } else {
      setActiveLyrics(currentTrack.lyrics);
    }

    // Fetch high-res cover art if missing
    if (!currentTrack.coverUrl) {
      fetchCoverArt(currentTrack.title, currentTrack.artist).then((art) => {
        if (art) {
          setTracks((prev) =>
            prev.map((t) => (t.id === currentTrack.id ? { ...t, coverUrl: art } : t))
          );
        }
      });
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentIndex, currentTrack?.id]);

  // Audio event handlers
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * tracks.length);
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
    }
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    if (currentTime > 3) {
      handleSeek(0);
    } else {
      setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      updateMediaPosition(time, duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      updateMediaPosition(cur, duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  // Local music file picker / scanner
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
        try {
          const track = await parseAudioFile(file);
          newTracks.push(track);
        } catch (err) {
          console.error('Error reading file:', file.name, err);
        }
      }
    }

    if (newTracks.length > 0) {
      setTracks((prev) => [...prev, ...newTracks]);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }
  };

  // Tagging Scenario & Centroid calculation
  const handleAssignScenario = (scenarioName: string) => {
    if (!currentTrack) return;

    // Update track scenario
    setTracks((prev) =>
      prev.map((t) => (t.id === currentTrack.id ? { ...t, scenario: scenarioName } : t))
    );

    // Recalculate Scenario mathematical centroid [valence, energy]
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.name === scenarioName) {
          const tValence = currentTrack.valence ?? s.centroid[0];
          const tEnergy = currentTrack.energy ?? s.centroid[1];
          const newCount = s.count + 1;
          const newV = (s.centroid[0] * s.count + tValence) / newCount;
          const newE = (s.centroid[1] * s.count + tEnergy) / newCount;
          return {
            ...s,
            count: newCount,
            centroid: [Number(newV.toFixed(2)), Number(newE.toFixed(2))],
          };
        }
        return s;
      })
    );

    confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine the 3 scenario suggestions for the main page
  const mainSuggestions = scenarios.slice(0, 3).map((s) => s.name);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#090a0f] text-neutral-100 select-none overflow-hidden relative font-sans">
      {/* Hidden audio element for continuous native & background playback */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Hidden file input for scanning music folders */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* MINIMAL TOP BAR: Only 2 icons for Lyrics and the Menu Drawer */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2 z-10">
        <button
          onClick={() => setIsLyricsOpen(true)}
          className="p-2 text-neutral-400 hover:text-white transition-colors active:scale-95"
          aria-label="Lyrics"
        >
          <AlignLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-neutral-400 hover:text-white transition-colors active:scale-95"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MAIN DISPLAY: Minimalist Focus */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-2">
        {/* Album Artwork with smooth touch-drag scroll feel */}
        <div className="w-64 h-64 sm:w-72 sm:h-72 aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 relative group bg-neutral-900 flex items-center justify-center transition-all duration-300">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-600 gap-2">
              <Music className="w-16 h-16 stroke-1 text-neutral-700" />
            </div>
          )}
        </div>

        {/* Track Title & Artist */}
        <div className="w-full text-center mt-6 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate px-4">
            {currentTrack?.title || 'No Track Selected'}
          </h1>
          <p className="text-sm font-medium text-neutral-400 truncate px-4">
            {currentTrack?.artist || 'Unknown Artist'}
          </p>
        </div>

        {/* Assigned Scenario Tag & Tempo Information */}
        <div className="flex items-center gap-2 mt-3">
          {currentTrack?.scenario && (
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium">
              {currentTrack.scenario}
            </span>
          )}
          {currentTrack?.tempo && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 font-mono">
              {currentTrack.tempo} BPM
            </span>
          )}
        </div>

        {/* Three Suggested Scenarios (One-tap badges, minimalist names only) */}
        <div className="flex items-center justify-center gap-2 mt-5 w-full px-2">
          {mainSuggestions.map((name) => {
            const isAssigned = currentTrack?.scenario === name;
            return (
              <button
                key={name}
                onClick={() => handleAssignScenario(name)}
                className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-medium transition-all active:scale-95 border truncate ${
                  isAssigned
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                    : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Real-Time Audio Frequency Visualizer */}
        <div className="mt-4 w-full">
          <AudioVisualizer isPlaying={isPlaying} audioElement={audioRef.current} />
        </div>
      </div>

      {/* BOTTOM CONTROLS & TIMELINE */}
      <div className="px-6 pb-8 pt-2 space-y-4">
        {/* Scrubber / Timeline Slider */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
          />
          <div className="flex justify-between text-[11px] font-mono text-neutral-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Bottom Playback Controls: Shuffle, Prev, Play/Pause, Next, Repeat */}
        <div className="flex items-center justify-between px-2">
          {/* Shuffle Button */}
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 transition-colors active:scale-90 ${
              isShuffle ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Prev Button */}
          <button
            onClick={handlePrev}
            className="p-3 text-neutral-200 hover:text-white transition-transform active:scale-90"
            aria-label="Previous"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="p-3 text-neutral-200 hover:text-white transition-transform active:scale-90"
            aria-label="Next"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={() => {
              if (repeatMode === 'off') setRepeatMode('all');
              else if (repeatMode === 'all') setRepeatMode('one');
              else setRepeatMode('off');
            }}
            className={`p-2 transition-colors active:scale-90 relative ${
              repeatMode !== 'off' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label="Repeat"
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-indigo-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Synced Lyrics Modal */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        title={currentTrack?.title || ''}
        artist={currentTrack?.artist || ''}
        lyrics={activeLyrics}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      {/* Separate Menu Drawer: Contains Full Library, Scenarios, AI Discovery, 2D Taste Map & Settings */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        tracks={tracks}
        scenarios={scenarios}
        currentTrack={currentTrack}
        onSelectTrack={(track) => {
          const idx = tracks.findIndex((t) => t.id === track.id);
          if (idx !== -1) setCurrentIndex(idx);
        }}
        onAddCustomScenario={(sc) => setScenarios((prev) => [...prev, sc])}
        onDiscoverAddTrack={(discTrack: DiscoveredTrack) => {
          const newTr: Track = {
            id: `disc_${Date.now()}`,
            title: discTrack.title,
            artist: discTrack.artist,
            duration: 180,
            url: '',
            scenario: discTrack.scenario,
            valence: discTrack.valence,
            energy: discTrack.energy,
            source: 'discovered',
          };
          setTracks((prev) => [...prev, newTr]);
          alert(`Added "${discTrack.title}" to library!`);
        }}
        onScanLocalMusic={() => fileInputRef.current?.click()}
      />
    </div>
  );
}

export default App;
