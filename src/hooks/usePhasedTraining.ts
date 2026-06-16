import { createSignal, createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import type {
  TrainingPhase,
  PhaseState,
  ContourPoint,
  Vessel,
  PhaseEvaluation,
  PhasedEvaluationResult,
  PracticeRecord,
  Point,
  RealTimeFeedback,
  ComparisonDetail,
} from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { calculateSymmetry, calculateSmoothness } from '@/utils/symmetry';
import { calculateMatchingScore, calculatePointDeviations, findDeviationSegments } from '@/utils/matching';
import { interpolateContour } from '@/utils/geometry';
import { useEvaluation } from './useEvaluation';

export const usePhasedTraining = () => {
  const { evaluate } = useEvaluation();

  const [phaseState, setPhaseState] = createStore<PhaseState>({
    currentPhase: 'base_forming',
    phaseProgress: {
      base_forming: false,
      opening: false,
      pulling_up: false,
      necking: false,
    },
    isPhasedMode: false,
    phaseContours: {
      base_forming: [],
      opening: [],
      pulling_up: [],
      necking: [],
    },
  });

  const [practiceHistory, setPracticeHistory] = createSignal<PracticeRecord[]>([]);
  const [selectedComparisonRecord, setSelectedComparisonRecord] = createSignal<PracticeRecord | null>(null);
  const [showComparison, setShowComparison] = createSignal(false);
  const [realTimeFeedback, setRealTimeFeedback] = createSignal<RealTimeFeedback | null>(null);

  const currentPhaseDefinition = createMemo(() => {
    return TRAINING_PHASES.find(p => p.id === phaseState.currentPhase)!;
  });

  const getPhasePoints = (gesturePoints: Point[], canvasHeight: number): Point[] => {
    const phase = currentPhaseDefinition();
    const padding = 20;
    const effectiveHeight = canvasHeight - padding * 2;
    const phaseStartY = canvasHeight - padding - phase.endHeight * effectiveHeight;
    const phaseEndY = canvasHeight - padding - phase.startHeight * effectiveHeight;

    return gesturePoints.filter(p => p.y >= phaseStartY && p.y <= phaseEndY);
  };

  const getPhaseContour = (fullContour: ContourPoint[]): ContourPoint[] => {
    const phase = currentPhaseDefinition();
    return fullContour.filter(
      p => p.height >= phase.startHeight && p.height <= phase.endHeight
    );
  };

  const getWeakestMetric = (symmetry: number, smoothness: number, matching: number): 'symmetry' | 'smoothness' | 'matching' => {
    const min = Math.min(symmetry, smoothness, matching);
    if (min === symmetry) return 'symmetry';
    if (min === smoothness) return 'smoothness';
    return 'matching';
  };

  const generatePhaseDiagnosis = (
    phaseId: TrainingPhase,
    weakestMetric: 'symmetry' | 'smoothness' | 'matching',
    scores: { symmetry: number; smoothness: number; matching: number }
  ): string => {
    const phase = TRAINING_PHASES.find(p => p.id === phaseId)!;
    const diagnoses: string[] = [];

    if (weakestMetric === 'symmetry') {
      diagnoses.push(`对称性较差(${scores.symmetry.toFixed(0)}分)，可能存在${phase.commonMistakes[1]}`);
    } else if (weakestMetric === 'smoothness') {
      diagnoses.push(`轮廓平滑度不足(${scores.smoothness.toFixed(0)}分)，手部移动速度可能过快或不稳`);
    } else {
      diagnoses.push(`与目标轮廓匹配度低(${scores.matching.toFixed(0)}分)，${phase.commonMistakes[0]}`);
    }

    if (scores.symmetry < 60 && weakestMetric !== 'symmetry') {
      diagnoses.push(`同时注意对称性问题`);
    }
    if (scores.smoothness < 60 && weakestMetric !== 'smoothness') {
      diagnoses.push(`轮廓流畅度也需要改善`);
    }

    return diagnoses.join('；');
  };

  const evaluatePhase = (
    phaseContour: ContourPoint[],
    targetContour: ContourPoint[],
    phaseId: TrainingPhase
  ): PhaseEvaluation | null => {
    if (phaseContour.length < 2 || targetContour.length < 2) {
      return null;
    }

    const phase = TRAINING_PHASES.find(p => p.id === phaseId)!;
    const normalizedGenerated = interpolateContour(phaseContour, 26);
    const targetPhaseContour = targetContour.filter(
      p => p.height >= phase.startHeight && p.height <= phase.endHeight
    );
    const normalizedTarget = interpolateContour(targetPhaseContour, 26);

    const symmetry = calculateSymmetry(normalizedGenerated);
    const smoothness = calculateSmoothness(normalizedGenerated);
    const matching = calculateMatchingScore(normalizedGenerated, normalizedTarget);

    const deviations = calculatePointDeviations(normalizedGenerated, normalizedTarget);
    const deviationSegments = findDeviationSegments(deviations, 0.08);
    const maxDeviation = deviations.length > 0
      ? Math.max(...deviations.map(d => d.deviation))
      : 0;

    const score = Math.round((symmetry * 0.3 + smoothness * 0.2 + matching * 0.5) * 10) / 10;
    const weakestMetric = getWeakestMetric(symmetry, smoothness, matching);
    const diagnosis = generatePhaseDiagnosis(phaseId, weakestMetric, { symmetry, smoothness, matching });

    return {
      phaseId,
      phaseName: phase.name,
      score,
      symmetry,
      smoothness,
      matching,
      maxDeviation,
      deviationSegments,
      contour: normalizedGenerated,
      weakestMetric,
      diagnosis,
    };
  };

  const calculateRealTimeFeedback = (
    _gesturePoints: Point[],
    generatedContour: ContourPoint[] | null,
    targetContour: ContourPoint[],
    _canvasWidth: number,
    _canvasHeight: number
  ): RealTimeFeedback | null => {
    if (!phaseState.isPhasedMode) return null;

    const phase = currentPhaseDefinition();
    const phaseTarget = targetContour.filter(
      p => p.height >= phase.startHeight && p.height <= phase.endHeight
    );

    if (phaseTarget.length < 2) return null;

    let symmetry = 0, smoothness = 0, matching = 0, score = 0;
    const hotZones: RealTimeFeedback['hotZones'] = [];
    const tips: string[] = [];
    const warnings: string[] = [];

    if (generatedContour && generatedContour.length > 2) {
      const phaseGen = generatedContour.filter(
        p => p.height >= phase.startHeight && p.height <= phase.endHeight
      );

      if (phaseGen.length >= 2) {
        const normGen = interpolateContour(phaseGen, 26);
        const normTarget = interpolateContour(phaseTarget, 26);

        symmetry = calculateSymmetry(normGen);
        smoothness = calculateSmoothness(normGen);
        matching = calculateMatchingScore(normGen, normTarget);
        score = Math.round((symmetry * 0.3 + smoothness * 0.2 + matching * 0.5) * 10) / 10;

        const deviations = calculatePointDeviations(normGen, normTarget);
        deviations.forEach(d => {
          if (d.deviation > 0.06) {
            hotZones.push({
              height: d.height,
              deviation: d.deviation,
              type: d.deviationType,
            });
          }
        });

        if (symmetry < 65) {
          warnings.push(`对称性不足，注意${phase.commonMistakes[1]}`);
        }
        if (smoothness < 65) {
          warnings.push(`轮廓不够流畅，放慢手部移动速度`);
        }
        if (matching < 60) {
          warnings.push(`与目标轮廓偏差较大，参考${phase.tips[0]}`);
        }

        if (hotZones.length > 0) {
          const maxZone = hotZones.reduce((a, b) => a.deviation > b.deviation ? a : b);
          tips.push(`${maxZone.type === 'too_wide' ? '注意收紧' : '适当扩大'} ${Math.round(maxZone.height * 100)}%高度附近`);
        }
      }
    }

    if (tips.length === 0) {
      tips.push(phase.tips[0]);
    }
    tips.push(phase.tips[1]);

    return {
      currentPhaseId: phase.id,
      phaseName: phase.name,
      currentScore: score,
      symmetry,
      smoothness,
      matching,
      hotZones,
      tips,
      warnings,
    };
  };

  const generateImprovementSuggestions = (
    phaseEvaluations: PhaseEvaluation[],
    worstPhaseId: TrainingPhase
  ): string[] => {
    const suggestions: string[] = [];
    const worstPhase = TRAINING_PHASES.find(p => p.id === worstPhaseId)!;
    const worstEval = phaseEvaluations.find(p => p.phaseId === worstPhaseId)!;

    suggestions.push(`【首要改进】重点攻克「${worstPhase.name}」阶段，当前得分 ${worstEval.score.toFixed(1)} 分`);
    suggestions.push(`  • 诊断：${worstEval.diagnosis}`);

    const metricLabels: Record<string, string> = {
      symmetry: '对称性',
      smoothness: '平滑度',
      matching: '轮廓匹配度',
    };
    suggestions.push(`  • 最薄弱指标：${metricLabels[worstEval.weakestMetric]}，建议：`);

    if (worstEval.weakestMetric === 'symmetry') {
      suggestions.push(`    - ${worstPhase.tips[0]}`);
      suggestions.push(`    - 练习时将注意力集中在双手压力的均匀性上`);
    } else if (worstEval.weakestMetric === 'smoothness') {
      suggestions.push(`    - ${worstPhase.tips[1]}`);
      suggestions.push(`    - 尝试放慢动作，保持手势连贯不中断`);
    } else {
      suggestions.push(`    - ${worstPhase.tips[0]}`);
      suggestions.push(`    - 多观察目标轮廓，在脑中形成清晰印象后再动手`);
    }

    const sortedPhases = [...phaseEvaluations].sort((a, b) => a.score - b.score);
    if (sortedPhases.length > 1) {
      const secondWorst = sortedPhases[1];
      if (secondWorst.score < 75) {
        suggestions.push(`【次要改进】「${secondWorst.phaseName}」阶段也需加强，得分 ${secondWorst.score.toFixed(1)} 分`);
        suggestions.push(`  • ${secondWorst.diagnosis}`);
      }
    }

    const strengthPhases = phaseEvaluations.filter(p => p.score >= 80);
    if (strengthPhases.length > 0) {
      suggestions.push(`【值得肯定】${strengthPhases.map(p => '「' + p.phaseName + '」').join('、')} 表现良好，请继续保持`);
    }

    suggestions.push(`【训练计划】建议专项重复练习「${worstPhase.name}」阶段 5-10 次，巩固肌肉记忆`);
    suggestions.push(`【进阶建议】完成专项练习后，进行完整流程练习 2-3 次，确保各阶段衔接流畅`);

    return suggestions;
  };

  const generateDiagnosisSummary = (phaseEvaluations: PhaseEvaluation[]): string => {
    const avgScore = phaseEvaluations.reduce((sum, p) => sum + p.score, 0) / phaseEvaluations.length;
    const sorted = [...phaseEvaluations].sort((a, b) => a.score - b.score);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];

    let level = '入门';
    if (avgScore >= 85) level = '精通';
    else if (avgScore >= 75) level = '熟练';
    else if (avgScore >= 65) level = '进阶';

    const summaryParts: string[] = [];
    summaryParts.push(`综合水平：${level}（平均分 ${avgScore.toFixed(1)}）`);
    summaryParts.push(`最强阶段：${best.phaseName}（${best.score.toFixed(1)}分）`);
    summaryParts.push(`最弱阶段：${worst.phaseName}（${worst.score.toFixed(1)}分）`);

    if (best.score - worst.score >= 20) {
      summaryParts.push('各阶段能力差异较大，建议重点补强薄弱环节');
    } else if (best.score - worst.score <= 10) {
      summaryParts.push('各阶段发展均衡，继续全面提升');
    }

    return summaryParts.join('；');
  };

  const evaluateAllPhases = (
    fullContour: ContourPoint[],
    targetContour: ContourPoint[],
    vessel: Vessel,
    gesturePoints: Point[]
  ): PhasedEvaluationResult | null => {
    const normalizedGenerated = interpolateContour(fullContour, 101);
    const normalizedTarget = interpolateContour(targetContour, 101);

    const baseEvaluation = evaluate(normalizedGenerated, normalizedTarget);
    if (!baseEvaluation) return null;

    const phaseEvaluations: PhaseEvaluation[] = [];
    for (const phase of TRAINING_PHASES) {
      const phaseContour = normalizedGenerated.filter(
        p => p.height >= phase.startHeight && p.height <= phase.endHeight
      );
      const phaseEval = evaluatePhase(phaseContour, normalizedTarget, phase.id);
      if (phaseEval) {
        phaseEvaluations.push(phaseEval);
      }
    }

    if (phaseEvaluations.length === 0) return null;

    const totalScore = Math.round(
      phaseEvaluations.reduce((sum, p) => sum + p.score, 0) / phaseEvaluations.length * 10
    ) / 10;

    const worstPhase = phaseEvaluations.reduce((worst, current) =>
      current.score < worst.score ? current : worst
    );

    const strengthPhases = phaseEvaluations
      .filter(p => p.score >= 80)
      .map(p => p.phaseId);

    const improvementSuggestions = generateImprovementSuggestions(phaseEvaluations, worstPhase.phaseId);
    const diagnosisSummary = generateDiagnosisSummary(phaseEvaluations);

    const recordId = `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const practiceRecord: PracticeRecord = {
      id: recordId,
      vesselId: vessel.id,
      vesselName: vessel.name,
      timestamp: Date.now(),
      gesturePoints: [...gesturePoints],
      contour: [...normalizedGenerated],
      evaluation: {} as PhasedEvaluationResult,
      totalScore,
    };

    const result: PhasedEvaluationResult = {
      ...baseEvaluation,
      phaseEvaluations,
      totalScore,
      worstPhase: worstPhase.phaseId,
      worstPhaseScore: worstPhase.score,
      improvementSuggestions,
      practiceRecord,
      diagnosisSummary,
      strengthPhases,
    };

    practiceRecord.evaluation = result;

    return result;
  };

  const nextPhase = () => {
    const phaseOrder: TrainingPhase[] = ['base_forming', 'opening', 'pulling_up', 'necking'];
    const currentIndex = phaseOrder.indexOf(phaseState.currentPhase);
    if (currentIndex < phaseOrder.length - 1) {
      setPhaseState('phaseProgress', phaseState.currentPhase, true);
      setPhaseState('currentPhase', phaseOrder[currentIndex + 1]);
    }
  };

  const prevPhase = () => {
    const phaseOrder: TrainingPhase[] = ['base_forming', 'opening', 'pulling_up', 'necking'];
    const currentIndex = phaseOrder.indexOf(phaseState.currentPhase);
    if (currentIndex > 0) {
      setPhaseState('currentPhase', phaseOrder[currentIndex - 1]);
    }
  };

  const resetPhaseProgress = () => {
    setPhaseState({
      currentPhase: 'base_forming',
      phaseProgress: {
        base_forming: false,
        opening: false,
        pulling_up: false,
        necking: false,
      },
      phaseContours: {
        base_forming: [],
        opening: [],
        pulling_up: [],
        necking: [],
      },
    });
    setRealTimeFeedback(null);
  };

  const togglePhasedMode = (enabled?: boolean) => {
    const newMode = enabled !== undefined ? enabled : !phaseState.isPhasedMode;
    setPhaseState('isPhasedMode', newMode);
    if (newMode) {
      resetPhaseProgress();
    } else {
      setRealTimeFeedback(null);
    }
  };

  const setPhaseContour = (phaseId: TrainingPhase, contour: ContourPoint[]) => {
    setPhaseState('phaseContours', phaseId, contour);
  };

  const savePracticeRecord = (record: PracticeRecord) => {
    setPracticeHistory(prev => [record, ...prev].slice(0, 20));
  };

  const clearPracticeHistory = () => {
    setPracticeHistory([]);
    setSelectedComparisonRecord(null);
    setShowComparison(false);
  };

  const getPhaseTargetContour = (targetContour: ContourPoint[], phaseId: TrainingPhase): ContourPoint[] => {
    const phase = TRAINING_PHASES.find(p => p.id === phaseId)!;
    return targetContour.filter(
      p => p.height >= phase.startHeight && p.height <= phase.endHeight
    );
  };

  const getHeatmapData = (
    generatedContour: ContourPoint[],
    targetContour: ContourPoint[]
  ): { height: number; deviation: number; color: string }[] => {
    if (generatedContour.length < 2 || targetContour.length < 2) return [];

    const deviations = calculatePointDeviations(generatedContour, targetContour);
    return deviations.map(d => {
      const intensity = Math.min(d.deviation * 5, 1);
      let color: string;
      if (d.deviationType === 'too_wide') {
        color = `rgba(198, 40, 40, ${0.2 + intensity * 0.6})`;
      } else {
        color = `rgba(255, 143, 0, ${0.2 + intensity * 0.6})`;
      }
      return {
        height: d.height,
        deviation: d.deviation,
        color,
      };
    });
  };

  const calculateComparisonDetail = (
    record1: PracticeRecord,
    record2: PracticeRecord
  ): ComparisonDetail => {
    const contour1 = record1.contour;
    const contour2 = record2.contour;

    const contourDiffs: ComparisonDetail['contourDiffs'] = [];
    const maxLen = Math.min(contour1.length, contour2.length);

    for (let i = 0; i < maxLen; i++) {
      const radiusDiff = contour1[i].radius - contour2[i].radius;
      if (Math.abs(radiusDiff) > 0.02) {
        contourDiffs.push({
          height: contour1[i].height,
          radiusDiff,
          type: radiusDiff > 0 ? 'wider' : 'narrower',
        });
      }
    }

    const calcAvgSpeed = (points: Point[]): number => {
      if (points.length < 2) return 0;
      let totalDist = 0;
      let totalTime = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
        totalTime += Math.max(1, points[i].timestamp - points[i - 1].timestamp);
      }
      return totalTime > 0 ? totalDist / totalTime : 0;
    };

    const speed1 = calcAvgSpeed(record1.gesturePoints);
    const speed2 = calcAvgSpeed(record2.gesturePoints);

    const calcAvgPressure = (points: Point[]): number => {
      const withPressure = points.filter(p => p.pressure !== undefined);
      if (withPressure.length === 0) return 0;
      return withPressure.reduce((sum, p) => sum + (p.pressure || 0), 0) / withPressure.length;
    };

    const pressure1 = calcAvgPressure(record1.gesturePoints);
    const pressure2 = calcAvgPressure(record2.gesturePoints);

    return {
      contourDiffs,
      gestureDiff: {
        avgSpeedDiff: speed1 - speed2,
        pressureDiff: pressure1 - pressure2,
      },
    };
  };

  const compareRecords = (
    record1: PracticeRecord,
    record2: PracticeRecord
  ): {
    overallDiff: number;
    phaseDiffs: { phaseId: TrainingPhase; phaseName: string; diff: number; improved: boolean }[];
    improvedPhases: TrainingPhase[];
    regressedPhases: TrainingPhase[];
    comparisonDetail: ComparisonDetail;
  } => {
    const overallDiff = record1.totalScore - record2.totalScore;

    const phaseDiffs = record1.evaluation.phaseEvaluations.map(eval1 => {
      const eval2 = record2.evaluation.phaseEvaluations.find(e => e.phaseId === eval1.phaseId);
      const diff = eval2 ? eval1.score - eval2.score : 0;
      return {
        phaseId: eval1.phaseId,
        phaseName: eval1.phaseName,
        diff: Math.round(diff * 10) / 10,
        improved: diff > 0,
      };
    });

    const improvedPhases = phaseDiffs.filter(p => p.diff > 0).map(p => p.phaseId);
    const regressedPhases = phaseDiffs.filter(p => p.diff < 0).map(p => p.phaseId);

    const comparisonDetail = calculateComparisonDetail(record1, record2);

    return {
      overallDiff: Math.round(overallDiff * 10) / 10,
      phaseDiffs,
      improvedPhases,
      regressedPhases,
      comparisonDetail,
    };
  };

  return {
    phaseState,
    setPhaseState,
    currentPhaseDefinition,
    practiceHistory,
    selectedComparisonRecord,
    showComparison,
    realTimeFeedback,
    setRealTimeFeedback,
    togglePhasedMode,
    nextPhase,
    prevPhase,
    resetPhaseProgress,
    setPhaseContour,
    evaluatePhase,
    evaluateAllPhases,
    getPhasePoints,
    getPhaseContour,
    getPhaseTargetContour,
    getHeatmapData,
    savePracticeRecord,
    clearPracticeHistory,
    setSelectedComparisonRecord,
    setShowComparison,
    compareRecords,
    calculateRealTimeFeedback,
    calculateComparisonDetail,
  };
};
