import type { ContourPoint, Point } from '@/types/pottery';

export const savitzkyGolaySmooth = (
  data: number[],
  windowSize: number = 5,
  polynomialOrder: number = 2
): number[] => {
  if (data.length < windowSize) return data;

  const halfWindow = Math.floor(windowSize / 2);
  const result: number[] = [];

  const coefficients = generateSavitzkyGolayCoefficients(windowSize, polynomialOrder);

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = Math.max(0, Math.min(data.length - 1, i + j));
      sum += data[idx] * coefficients[j + halfWindow];
    }
    result.push(sum);
  }

  return result;
};

const generateSavitzkyGolayCoefficients = (
  windowSize: number,
  polynomialOrder: number
): number[] => {
  const halfWindow = Math.floor(windowSize / 2);
  const matrix: number[][] = [];

  for (let i = -halfWindow; i <= halfWindow; i++) {
    const row: number[] = [];
    for (let j = 0; j <= polynomialOrder; j++) {
      row.push(Math.pow(i, j));
    }
    matrix.push(row);
  }

  const coefficients: number[] = [];
  for (let i = 0; i < windowSize; i++) {
    let sum = 0;
    for (let j = 0; j <= polynomialOrder; j++) {
      sum += matrix[i][j] * matrix[halfWindow][j];
    }
    coefficients.push(sum);
  }

  const norm = coefficients.reduce((a, b) => a + b, 0);
  return coefficients.map(c => c / norm);
};

export const gaussianSmooth = (data: number[], sigma: number = 1): number[] => {
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const halfKernel = Math.floor(kernelSize / 2);
  const kernel: number[] = [];

  for (let i = -halfKernel; i <= halfKernel; i++) {
    kernel.push(Math.exp(-(i * i) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI)));
  }

  const kernelSum = kernel.reduce((a, b) => a + b, 0);
  const normalizedKernel = kernel.map(k => k / kernelSum);

  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < kernelSize; j++) {
      const idx = Math.max(0, Math.min(data.length - 1, i - halfKernel + j));
      sum += data[idx] * normalizedKernel[j];
    }
    result.push(sum);
  }

  return result;
};

export const smoothContour = (
  contour: ContourPoint[],
  method: 'savitzky-golay' | 'gaussian' = 'savitzky-golay'
): ContourPoint[] => {
  const radii = contour.map(c => c.radius);
  const smoothedRadii = method === 'savitzky-golay'
    ? savitzkyGolaySmooth(radii, 5, 2)
    : gaussianSmooth(radii, 1.5);

  return contour.map((cp, i) => ({
    height: cp.height,
    radius: Math.max(0, smoothedRadii[i]),
  }));
};

export const smoothGesturePoints = (points: Point[], factor: number = 2): Point[] => {
  if (points.length < 3) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    result.push({
      x: (prev.x + factor * curr.x + next.x) / (factor + 2),
      y: (prev.y + factor * curr.y + next.y) / (factor + 2),
      timestamp: curr.timestamp,
      pressure: curr.pressure,
    });
  }

  result.push(points[points.length - 1]);
  return result;
};
