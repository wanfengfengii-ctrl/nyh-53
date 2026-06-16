import type { ContourPoint, DeviationSegment } from '@/types/pottery';
import { MATCHING_THRESHOLD, MAX_DEVIATION_SEGMENTS } from '@/types/pottery';

export const calculateDTWDistance = (
  series1: number[],
  series2: number[]
): number => {
  const n = series1.length;
  const m = series2.length;

  const dtw: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(Infinity));

  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(series1[i - 1] - series2[j - 1]);
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }

  return dtw[n][m];
};

export const calculateMatchingScore = (
  generated: ContourPoint[],
  target: ContourPoint[]
): number => {
  if (generated.length < 2 || target.length < 2) return 0;

  const genRadii = generated.map(c => c.radius);
  const tgtRadii = target.map(c => c.radius);

  const dtwDistance = calculateDTWDistance(genRadii, tgtRadii);
  const maxPossibleDistance = genRadii.length * 2;
  const normalizedDistance = dtwDistance / maxPossibleDistance;

  const matching = Math.max(0, 100 * (1 - normalizedDistance * 1.5));

  return Math.round(Math.min(100, matching) * 10) / 10;
};

export const calculatePointDeviations = (
  generated: ContourPoint[],
  target: ContourPoint[]
): { height: number; deviation: number; deviationType: 'too_wide' | 'too_narrow' }[] => {
  const deviations: { height: number; deviation: number; deviationType: 'too_wide' | 'too_narrow' }[] = [];

  const maxLen = Math.min(generated.length, target.length);
  for (let i = 0; i < maxLen; i++) {
    const genRadius = generated[i].radius;
    const tgtRadius = target[i].radius;
    const deviation = genRadius - tgtRadius;
    deviations.push({
      height: generated[i].height,
      deviation: Math.abs(deviation),
      deviationType: deviation > 0 ? 'too_wide' : 'too_narrow',
    });
  }

  return deviations;
};

export const findDeviationSegments = (
  deviations: { height: number; deviation: number; deviationType: 'too_wide' | 'too_narrow' }[],
  threshold: number = 0.1
): DeviationSegment[] => {
  const segments: DeviationSegment[] = [];
  let currentSegment: DeviationSegment | null = null;

  for (let i = 0; i < deviations.length; i++) {
    const d = deviations[i];

    if (d.deviation > threshold) {
      if (!currentSegment) {
        currentSegment = {
          startHeight: d.height,
          endHeight: d.height,
          maxDeviation: d.deviation,
          deviationType: d.deviationType,
        };
      } else {
        currentSegment.endHeight = d.height;
        if (d.deviation > currentSegment.maxDeviation) {
          currentSegment.maxDeviation = d.deviation;
          currentSegment.deviationType = d.deviationType;
        }
      }
    } else if (currentSegment) {
      segments.push(currentSegment);
      currentSegment = null;
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments
    .sort((a, b) => b.maxDeviation - a.maxDeviation)
    .slice(0, MAX_DEVIATION_SEGMENTS);
};

export const needsDeviationMarkers = (matchingScore: number): boolean => {
  return matchingScore < MATCHING_THRESHOLD;
};
