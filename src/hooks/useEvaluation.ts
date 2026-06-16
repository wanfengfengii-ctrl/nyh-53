import type { ContourPoint, EvaluationResult } from '@/types/pottery';
import { calculateSymmetry, calculateSmoothness } from '@/utils/symmetry';
import { calculateMatchingScore, calculatePointDeviations, findDeviationSegments, needsDeviationMarkers } from '@/utils/matching';
import { interpolateContour } from '@/utils/geometry';

export const useEvaluation = () => {
  const evaluate = (
    generated: ContourPoint[],
    target: ContourPoint[]
  ): EvaluationResult | null => {
    if (generated.length < 2 || target.length < 2) {
      return null;
    }

    const normalizedGenerated = interpolateContour(generated, 101);
    const normalizedTarget = interpolateContour(target, 101);

    const symmetry = calculateSymmetry(normalizedGenerated);
    const smoothness = calculateSmoothness(normalizedGenerated);
    const matching = calculateMatchingScore(normalizedGenerated, normalizedTarget);

    const deviations = calculatePointDeviations(normalizedGenerated, normalizedTarget);
    const deviationSegments = needsDeviationMarkers(matching)
      ? findDeviationSegments(deviations, 0.08)
      : [];

    return {
      symmetry,
      smoothness,
      matching,
      deviationSegments,
      contour: normalizedGenerated,
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-celadon-600';
    if (score >= 70) return 'text-pottery-600';
    return 'text-cinnabar-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 85) return 'bg-celadon-500';
    if (score >= 70) return 'bg-pottery-500';
    return 'bg-cinnabar-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    if (score >= 60) return '及格';
    return '需要练习';
  };

  return {
    evaluate,
    getScoreColor,
    getScoreBgColor,
    getScoreLabel,
  };
};
