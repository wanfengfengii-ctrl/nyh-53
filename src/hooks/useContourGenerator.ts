import type { Point, ContourPoint } from '@/types/pottery';
import { MIN_POINTS_FOR_CONTOUR } from '@/types/pottery';
import { smoothContour } from '@/utils/smoothing';
import { interpolateContour } from '@/utils/geometry';

export const useContourGenerator = () => {
  const canGenerate = (points: Point[]): boolean => {
    return points.length >= MIN_POINTS_FOR_CONTOUR;
  };

  const validateContour = (contour: ContourPoint[]): boolean => {
    for (const point of contour) {
      if (point.height < 0 || point.radius < 0) {
        return false;
      }
    }
    return true;
  };

  const generateContour = (
    points: Point[],
    canvasWidth: number,
    canvasHeight: number
  ): ContourPoint[] | null => {
    if (!canGenerate(points)) {
      return null;
    }

    const centerX = canvasWidth / 2;
    const padding = 20;
    const effectiveHeight = canvasHeight - padding * 2;
    const maxRadius = (canvasWidth - padding * 2) / 2;

    const heightBins = 50;
    const radiusSums: number[] = new Array(heightBins).fill(0);
    const radiusCounts: number[] = new Array(heightBins).fill(0);

    for (const point of points) {
      const normalizedHeight = Math.max(0, Math.min(1, (canvasHeight - padding - point.y) / effectiveHeight));
      const binIndex = Math.min(heightBins - 1, Math.floor(normalizedHeight * heightBins));
      const radius = Math.abs(point.x - centerX) / maxRadius;

      if (radius >= 0 && radius <= 1.5) {
        radiusSums[binIndex] += radius;
        radiusCounts[binIndex]++;
      }
    }

    const rawContour: ContourPoint[] = [];
    for (let i = 0; i < heightBins; i++) {
      const height = i / (heightBins - 1);
      if (radiusCounts[i] > 0) {
        const avgRadius = radiusSums[i] / radiusCounts[i];
        rawContour.push({
          height,
          radius: Math.max(0, Math.min(1, avgRadius)),
        });
      } else {
        const prevIdx = i - 1;
        const nextIdx = i + 1;
        let interpolatedRadius = 0;
        let count = 0;

        if (prevIdx >= 0 && radiusCounts[prevIdx] > 0) {
          interpolatedRadius += radiusSums[prevIdx] / radiusCounts[prevIdx];
          count++;
        }
        if (nextIdx < heightBins && radiusCounts[nextIdx] > 0) {
          interpolatedRadius += radiusSums[nextIdx] / radiusCounts[nextIdx];
          count++;
        }

        rawContour.push({
          height,
          radius: count > 0 ? Math.max(0, interpolatedRadius / count) : 0,
        });
      }
    }

    let smoothed = smoothContour(rawContour, 'savitzky-golay');
    smoothed = interpolateContour(smoothed, 101);

    for (const point of smoothed) {
      point.height = Math.max(0, point.height);
      point.radius = Math.max(0, point.radius);
    }

    if (!validateContour(smoothed)) {
      return null;
    }

    return smoothed;
  };

  return {
    canGenerate,
    generateContour,
    validateContour,
  };
};
