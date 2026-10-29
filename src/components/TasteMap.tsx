import React from 'react';
import type { Scenario, Track } from '../types';

interface TasteMapProps {
  scenarios: Scenario[];
  tracks: Track[];
  currentTrack: Track | null;
}

export const TasteMap: React.FC<TasteMapProps> = ({ scenarios, currentTrack }) => {
  return (
    <div className="bg-neutral-900/60 p-4 rounded-2xl border border-white/5 space-y-3">
      <div className="flex justify-between items-center text-xs text-neutral-400">
        <span className="font-semibold uppercase tracking-wider text-neutral-300">2D Taste Coordinate Plane</span>
        <span>Valence vs Energy</span>
      </div>

      <div className="relative w-full aspect-square max-h-[300px] mx-auto bg-black/40 rounded-xl border border-white/10 overflow-hidden">
        {/* Axes */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

        {/* Labels */}
        <span className="absolute top-2 left-2 text-[10px] text-neutral-500 font-mono">Calm / Melancholic</span>
        <span className="absolute top-2 right-2 text-[10px] text-neutral-500 font-mono">Euphoric / Intense</span>
        <span className="absolute bottom-2 left-2 text-[10px] text-neutral-500 font-mono">Chill / Sad</span>
        <span className="absolute bottom-2 right-2 text-[10px] text-neutral-500 font-mono">Upbeat / Low Intensity</span>

        {/* Scenarios Centroids */}
        {scenarios.map((sc) => {
          const left = `${sc.centroid[0] * 80 + 10}%`;
          const bottom = `${sc.centroid[1] * 80 + 10}%`;
          return (
            <div
              key={sc.id}
              style={{ left, bottom }}
              className="absolute -translate-x-1/2 translate-y-1/2 flex flex-col items-center group cursor-pointer"
            >
              <div
                style={{ backgroundColor: sc.color || '#6366f1' }}
                className="w-3 h-3 rounded-full ring-2 ring-white/20 shadow-lg group-hover:scale-150 transition-transform"
              />
              <span className="text-[9px] text-neutral-300 bg-black/70 px-1 py-0.5 rounded mt-1 whitespace-nowrap opacity-80 group-hover:opacity-100">
                {sc.name}
              </span>
            </div>
          );
        })}

        {/* Active Track Location */}
        {currentTrack && currentTrack.valence !== undefined && currentTrack.energy !== undefined && (
          <div
            style={{
              left: `${currentTrack.valence * 80 + 10}%`,
              bottom: `${currentTrack.energy * 80 + 10}%`,
            }}
            className="absolute -translate-x-1/2 translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
          >
            <div className="w-4 h-4 rounded-full bg-white ring-4 ring-indigo-500 animate-ping absolute" />
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xl relative" />
            <span className="text-[9px] font-bold text-white bg-indigo-600/90 px-1.5 py-0.5 rounded shadow mt-1">
              Playing
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
        Every tag dynamically recalculates each scenario's mathematical centroid <code className="text-indigo-400">[valence, energy]</code>.
      </p>
    </div>
  );
};
