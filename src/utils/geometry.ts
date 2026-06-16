import type { Point, ContourPoint } from '@/types/pottery';

export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const normalizePoints = (
  points: Point[],
  width: number,
  height: number
): { x: number; y: number }[] => {
  if (points.length === 0) return [];

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return points.map(p => ({
    x: ((p.x - minX) / rangeX) * width,
    y: ((p.y - minY) / rangeY) * height,
  }));
};

export const contourToSvgPath = (
  contour: ContourPoint[],
  canvasWidth: number,
  canvasHeight: number,
  centerX: number
): string => {
  if (contour.length === 0) return '';

  const padding = 20;
  const effectiveHeight = canvasHeight - padding * 2;
  const maxRadius = (canvasWidth - padding * 2) / 2;

  const rightPoints = contour.map(cp => ({
    x: centerX + cp.radius * maxRadius,
    y: canvasHeight - padding - cp.height * effectiveHeight,
  }));

  const leftPoints = [...contour]
    .reverse()
    .map(cp => ({
      x: centerX - cp.radius * maxRadius,
      y: canvasHeight - padding - cp.height * effectiveHeight,
    }));

  let path = `M ${rightPoints[0].x} ${rightPoints[0].y}`;

  for (let i = 1; i < rightPoints.length; i++) {
    path += ` L ${rightPoints[i].x} ${rightPoints[i].y}`;
  }

  for (let i = 0; i < leftPoints.length; i++) {
    path += ` L ${leftPoints[i].x} ${leftPoints[i].y}`;
  }

  path += ' Z';
  return path;
};

export const generateVesselPreviewPath = (
  contour: ContourPoint[],
  size: number = 100
): string => {
  const centerX = size / 2;
  return contourToSvgPath(contour, size, size, centerX);
};

export const simplifyPoints = (points: Point[], tolerance: number = 2): Point[] => {
  if (points.length < 3) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    if (distance(prev, curr) >= tolerance) {
      result.push(curr);
    }
  }

  result.push(points[points.length - 1]);
  return result;
};

export const interpolateContour = (
  contour: ContourPoint[],
  targetLength: number = 100
): ContourPoint[] => {
  if (contour.length < 2) return contour;

  const result: ContourPoint[] = [];
  const heights = contour.map(c => c.height);
  const radii = contour.map(c => c.radius);

  for (let i = 0; i < targetLength; i++) {
    const t = i / (targetLength - 1);
    let idx = 0;
    while (idx < heights.length - 1 && heights[idx + 1] < t) {
      idx++;
    }

    if (idx === heights.length - 1) {
      result.push({ height: t, radius: radii[idx] });
    } else {
      const segmentT = (t - heights[idx]) / (heights[idx + 1] - heights[idx]);
      const radius = radii[idx] + segmentT * (radii[idx + 1] - radii[idx]);
      result.push({ height: t, radius: Math.max(0, radius) });
    }
  }

  return result;
};
