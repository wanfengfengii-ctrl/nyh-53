import { createSignal } from 'solid-js';
import type { Point } from '@/types/pottery';

export const useGestureTracking = (
  canvasRef: { current: SVGSVGElement | null },
  canvasWidth: number,
  canvasHeight: number,
  enabled: () => boolean
) => {
  const [points, setPoints] = createSignal<Point[]>([]);
  const [isDrawing, setIsDrawing] = createSignal(false);

  const getCanvasCoordinates = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvasWidth;
    const y = ((clientY - rect.top) / rect.height) * canvasHeight;

    return {
      x: Math.max(0, Math.min(canvasWidth, x)),
      y: Math.max(0, Math.min(canvasHeight, y)),
      timestamp: Date.now(),
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!enabled()) return;
    e.preventDefault();
    const point = getCanvasCoordinates(e.clientX, e.clientY);
    if (point) {
      setIsDrawing(true);
      setPoints([point]);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing() || !enabled()) return;
    e.preventDefault();
    const point = getCanvasCoordinates(e.clientX, e.clientY);
    if (point) {
      setPoints(prev => [...prev, point]);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled()) return;
    e.preventDefault();
    const touch = e.touches[0];
    const point = getCanvasCoordinates(touch.clientX, touch.clientY);
    if (point) {
      setIsDrawing(true);
      setPoints(prev => [...prev, point]);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDrawing() || !enabled()) return;
    e.preventDefault();
    const touch = e.touches[0];
    const point = getCanvasCoordinates(touch.clientX, touch.clientY);
    if (point) {
      setPoints(prev => [...prev, point]);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const clearPoints = () => {
    setPoints([]);
    setIsDrawing(false);
  };

  const setPointsDirect = (newPoints: Point[]) => {
    setPoints(newPoints);
  };

  return {
    points,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearPoints,
    setPointsDirect,
  };
};
