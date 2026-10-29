import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
}

export const AudioVisualizer: React.FC<VisualizerProps> = ({ isPlaying, audioElement }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Initialize Web Audio API on user play gesture
    const initAudio = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64; // smooth mobile bars

          // Only create MediaElementSource if not already created on this element
          if (!sourceRef.current) {
            try {
              const src = ctx.createMediaElementSource(audioElement);
              src.connect(analyser);
              analyser.connect(ctx.destination);
              sourceRef.current = src;
            } catch {
              // already connected in some browsers
            }
          }

          audioCtxRef.current = ctx;
          analyserRef.current = analyser;
        }

        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch {
        // Fallback or permission blocked
      }
    };

    if (isPlaying) {
      initAudio();
    }
  }, [audioElement, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barCount = 24;
        const barWidth = width / barCount - 2;
        let x = 0;

        for (let i = 0; i < barCount; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;
          
          // Subtle elegant gradient
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0.75)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, Math.max(2, barWidth), barHeight, [2, 2, 0, 0]);
          ctx.fill();

          x += barWidth + 2;
        }
      } else {
        // Draw subtle resting line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 1);
        ctx.lineTo(width, height - 1);
        ctx.stroke();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={32}
      className="w-full max-w-[280px] h-8 mx-auto opacity-70 pointer-events-none"
    />
  );
};
