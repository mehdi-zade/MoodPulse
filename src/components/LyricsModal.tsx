import React, { useEffect, useRef } from 'react';
import { parseLRC } from '../services/metadata';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  artist: string;
  lyrics: string | null;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  title,
  artist,
  lyrics,
  currentTime,
  onSeek,
}) => {
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  if (!isOpen) return null;

  const parsed = lyrics ? parseLRC(lyrics) : [];
  const hasTimestamps = parsed.length > 0;

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  // Find active line index
  let activeIndex = -1;
  if (hasTimestamps) {
    for (let i = 0; i < parsed.length; i++) {
      if (currentTime >= parsed[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white truncate max-w-[240px]">{title}</h2>
          <p className="text-xs text-neutral-400 truncate">{artist}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-8 text-center space-y-6">
        {!lyrics ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <p>No lyrics found for this track.</p>
          </div>
        ) : !hasTimestamps ? (
          <div className="whitespace-pre-line text-neutral-300 font-medium leading-loose text-base px-4">
            {lyrics}
          </div>
        ) : (
          parsed.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                className={`cursor-pointer transition-all duration-300 px-4 text-base md:text-lg font-semibold ${
                  isActive
                    ? 'text-indigo-400 scale-105 text-xl font-bold drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                    : 'text-neutral-500 hover:text-neutral-300 opacity-60'
                }`}
              >
                {line.text}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
};
