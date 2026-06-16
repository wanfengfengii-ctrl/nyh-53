import { createSignal, createEffect, onCleanup } from 'solid-js';
import type { Point } from '@/types/pottery';
import { PLAYBACK_SPEEDS } from '@/types/pottery';

export const usePlayback = (
  points: () => Point[],
  onPlaybackPoint: (point: Point, index: number) => void
) => {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [playbackSpeed, setPlaybackSpeed] = createSignal(1);
  let animationFrameId: number | null = null;
  let lastTimestamp: number = 0;

  const canPlayback = (): boolean => {
    return points().length >= 2;
  };

  const getAvailableSpeeds = (): number[] => {
    return [...PLAYBACK_SPEEDS];
  };

  const isValidSpeed = (speed: number): boolean => {
    return PLAYBACK_SPEEDS.includes(speed as typeof PLAYBACK_SPEEDS[number]);
  };

  const setSpeed = (speed: number) => {
    if (isValidSpeed(speed)) {
      setPlaybackSpeed(speed);
    }
  };

  const play = () => {
    if (!canPlayback()) return;
    if (currentIndex() >= points().length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
    lastTimestamp = 0;
  };

  const pause = () => {
    setIsPlaying(false);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const stop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  const reset = () => {
    setCurrentIndex(0);
  };

  const goToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(points().length - 1, index));
    setCurrentIndex(clampedIndex);
    const point = points()[clampedIndex];
    if (point) {
      onPlaybackPoint(point, clampedIndex);
    }
  };

  const animate = (timestamp: number) => {
    if (!isPlaying()) return;

    const pts = points();
    if (pts.length < 2) {
      pause();
      return;
    }

    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
    }

    const deltaTime = timestamp - lastTimestamp;
    const baseInterval = 30;
    const interval = baseInterval / playbackSpeed();

    if (deltaTime >= interval) {
      lastTimestamp = timestamp;
      const nextIndex = currentIndex() + 1;

      if (nextIndex >= pts.length) {
        pause();
        setCurrentIndex(pts.length - 1);
        const point = pts[pts.length - 1];
        if (point) {
          onPlaybackPoint(point, pts.length - 1);
        }
        return;
      }

      setCurrentIndex(nextIndex);
      const point = pts[nextIndex];
      if (point) {
        onPlaybackPoint(point, nextIndex);
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  createEffect(() => {
    if (isPlaying()) {
      animationFrameId = requestAnimationFrame(animate);
    } else if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  return {
    isPlaying,
    currentIndex,
    playbackSpeed,
    canPlayback,
    getAvailableSpeeds,
    setSpeed,
    play,
    pause,
    stop,
    reset,
    goToIndex,
  };
};
