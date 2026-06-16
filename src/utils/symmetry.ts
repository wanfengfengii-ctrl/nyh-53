import type { ContourPoint } from '@/types/pottery';

export const calculateSymmetry = (
  contour: ContourPoint[]
): number => {
  if (contour.length < 2) return 0;

  let totalDeviation = 0;
  const midIndex = Math.floor(contour.length / 2);

  for (let i = 0; i < midIndex; i++) {
    const leftIdx = i;
    const rightIdx = contour.length - 1 - i;

    const leftRadius = contour[leftIdx].radius;
    const rightRadius = contour[rightIdx].radius;

    const maxRadius = Math.max(leftRadius, rightRadius, 0.01);
    const deviation = Math.abs(leftRadius - rightRadius) / maxRadius;

    totalDeviation += deviation;
  }

  const avgDeviation = totalDeviation / midIndex;
  const symmetry = Math.max(0, 100 * (1 - avgDeviation * 2));

  return Math.round(symmetry * 10) / 10;
};

export const calculateSmoothness = (
  contour: ContourPoint[]
): number => {
  if (contour.length < 4) return 0;

  const radii = contour.map(c => c.radius);

  const firstDerivative: number[] = [];
  for (let i = 1; i < radii.length; i++) {
    firstDerivative.push(radii[i] - radii[i - 1]);
  }

  const secondDerivative: number[] = [];
  for (let i = 1; i < firstDerivative.length; i++) {
    secondDerivative.push(Math.abs(firstDerivative[i] - firstDerivative[i - 1]));
  }

  const avgSecondDerivative = secondDerivative.reduce((a, b) => a + b, 0) / secondDerivative.length;

  const baselineSmoothness = 0.02;
  const smoothness = Math.max(0, 100 * (1 - avgSecondDerivative / baselineSmoothness));

  return Math.round(Math.min(100, smoothness) * 10) / 10;
};

export const calculateCurvature = (
  contour: ContourPoint[]
): number[] => {
  const curvature: number[] = [];

  for (let i = 0; i < contour.length; i++) {
    if (i === 0 || i === contour.length - 1) {
      curvature.push(0);
    } else {
      const prev = contour[i - 1];
      const curr = contour[i];
      const next = contour[i + 1];

      const dx1 = curr.height - prev.height;
      const dy1 = curr.radius - prev.radius;
      const dx2 = next.height - curr.height;
      const dy2 = next.radius - curr.radius;

      const crossProduct = dx1 * dy2 - dy1 * dx2;
      const magnitude = Math.sqrt(dx1 * dx1 + dy1 * dy1) * Math.sqrt(dx2 * dx2 + dy2 * dy2);

      curvature.push(magnitude > 0 ? crossProduct / magnitude : 0);
    }
  }

  return curvature;
};

export const findInflectionPoints = (
  contour: ContourPoint[]
): number[] => {
  const curvature = calculateCurvature(contour);
  const inflectionPoints: number[] = [];

  for (let i = 1; i < curvature.length; i++) {
    if (curvature[i - 1] * curvature[i] < 0) {
      inflectionPoints.push(i);
    }
  }

  return inflectionPoints;
};
