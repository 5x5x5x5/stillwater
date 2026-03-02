import { useRef, useCallback } from 'react';

interface ProgressBarProps {
  progress: number; // 0-1
  onSeek: (progress: number) => void;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

export function ProgressBar({
  progress,
  onSeek,
  className = '',
  trackClassName = '',
  fillClassName = '',
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const getProgressFromEvent = useCallback((clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      onSeek(getProgressFromEvent(e.clientX));

      const handleMouseMove = (ev: MouseEvent) => {
        if (isDraggingRef.current) {
          onSeek(getProgressFromEvent(ev.clientX));
        }
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onSeek, getProgressFromEvent]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDraggingRef.current = true;
      onSeek(getProgressFromEvent(e.touches[0].clientX));

      const handleTouchMove = (ev: TouchEvent) => {
        if (isDraggingRef.current) {
          onSeek(getProgressFromEvent(ev.touches[0].clientX));
        }
      };

      const handleTouchEnd = () => {
        isDraggingRef.current = false;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    },
    [onSeek, getProgressFromEvent]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        onSeek(Math.min(1, progress + 0.05));
      } else if (e.key === 'ArrowLeft') {
        onSeek(Math.max(0, progress - 0.05));
      }
    },
    [onSeek, progress]
  );

  return (
    <div
      ref={barRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label="Playback progress"
      tabIndex={0}
      className={`relative h-1.5 rounded-full cursor-pointer group focus:outline-none ${trackClassName} ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-100 ${fillClassName}`}
        style={{ width: `${progress * 100}%` }}
      />
      {/* Thumb indicator */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-offwhite shadow opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
        style={{ left: `calc(${progress * 100}% - 6px)` }}
      />
    </div>
  );
}
