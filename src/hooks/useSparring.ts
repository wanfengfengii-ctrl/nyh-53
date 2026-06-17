import { createSignal, createMemo } from 'solid-js';
import type {
  User,
  UserRole,
  StandardTrajectory,
  PhaseComment,
  TimelineComment,
  KeyDeviationPoint,
  PracticeReport,
  ContourPoint,
  Point,
  Vessel,
  TrainingPhase,
  PhaseEvaluation,
  PracticeRecord,
} from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { interpolateContour } from '@/utils/geometry';
import { calculatePointDeviations } from '@/utils/matching';

const DEFAULT_TEACHER: User = {
  id: 'teacher_default',
  name: '张老师',
  role: 'teacher',
};

const DEFAULT_STUDENT: User = {
  id: 'student_default',
  name: '李学员',
  role: 'student',
};

export const useSparring = () => {
  const [currentUser, setCurrentUser] = createSignal<User>(DEFAULT_STUDENT);
  const [activeMode, setActiveMode] = createSignal<'practice' | 'teacher' | 'student' | 'report'>('practice');

  const [standardTrajectories, setStandardTrajectories] = createSignal<StandardTrajectory[]>([]);
  const [selectedStandardTrajectory, setSelectedStandardTrajectory] = createSignal<StandardTrajectory | null>(null);

  const [editingPhaseComment, setEditingPhaseComment] = createSignal<TrainingPhase | null>(null);
  const [editingTimelineComment, setEditingTimelineComment] = createSignal<number | null>(null);

  const [practiceReports, setPracticeReports] = createSignal<PracticeReport[]>([]);
  const [selectedReport, setSelectedReport] = createSignal<PracticeReport | null>(null);

  const [isTeacherRecording, setIsTeacherRecording] = createSignal(false);
  const [teacherRecordName, setTeacherRecordName] = createSignal('');
  const [teacherRecordDescription, setTeacherRecordDescription] = createSignal('');

  const switchRole = (role: UserRole) => {
    if (role === 'teacher') {
      setCurrentUser(DEFAULT_TEACHER);
      setActiveMode('teacher');
    } else {
      setCurrentUser(DEFAULT_STUDENT);
      setActiveMode('student');
    }
  };

  const generateId = (): string => {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveStandardTrajectory = (
    name: string,
    description: string,
    vessel: Vessel,
    gesturePoints: Point[],
    contour: ContourPoint[]
  ): StandardTrajectory => {
    const trajectory: StandardTrajectory = {
      id: generateId(),
      name,
      description,
      vesselId: vessel.id,
      vesselName: vessel.name,
      teacherId: currentUser().id,
      teacherName: currentUser().name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      gesturePoints: [...gesturePoints],
      contour: [...contour],
      phaseComments: [],
      timelineComments: [],
      difficulty: vessel.difficulty,
    };
    setStandardTrajectories(prev => [trajectory, ...prev]);
    setSelectedStandardTrajectory(trajectory);
    return trajectory;
  };

  const addPhaseComment = (
    phaseId: TrainingPhase,
    content: string
  ): PhaseComment | null => {
    if (!selectedStandardTrajectory()) return null;

    const phase = TRAINING_PHASES.find(p => p.id === phaseId)!;
    const comment: PhaseComment = {
      id: generateId(),
      phaseId,
      phaseName: phase.name,
      teacherId: currentUser().id,
      teacherName: currentUser().name,
      content,
      createdAt: Date.now(),
    };

    const trajectory = selectedStandardTrajectory()!;
    const updated: StandardTrajectory = {
      ...trajectory,
      phaseComments: [...trajectory.phaseComments.filter(c => c.phaseId !== phaseId), comment],
      updatedAt: Date.now(),
    };
    setSelectedStandardTrajectory(updated);
    setStandardTrajectories(prev => prev.map(t => t.id === trajectory.id ? updated : t));
    setEditingPhaseComment(null);
    return comment;
  };

  const deletePhaseComment = (commentId: string) => {
    if (!selectedStandardTrajectory()) return;
    const trajectory = selectedStandardTrajectory()!;
    const updated: StandardTrajectory = {
      ...trajectory,
      phaseComments: trajectory.phaseComments.filter(c => c.id !== commentId),
      updatedAt: Date.now(),
    };
    setSelectedStandardTrajectory(updated);
    setStandardTrajectories(prev => prev.map(t => t.id === trajectory.id ? updated : t));
  };

  const addTimelineComment = (
    pointIndex: number,
    timestamp: number,
    content: string
  ): TimelineComment | null => {
    if (!selectedStandardTrajectory()) return null;

    const comment: TimelineComment = {
      id: generateId(),
      teacherId: currentUser().id,
      teacherName: currentUser().name,
      content,
      createdAt: Date.now(),
      timestamp,
      pointIndex,
    };

    const trajectory = selectedStandardTrajectory()!;
    const updated: StandardTrajectory = {
      ...trajectory,
      timelineComments: [...trajectory.timelineComments, comment],
      updatedAt: Date.now(),
    };
    setSelectedStandardTrajectory(updated);
    setStandardTrajectories(prev => prev.map(t => t.id === trajectory.id ? updated : t));
    setEditingTimelineComment(null);
    return comment;
  };

  const deleteTimelineComment = (commentId: string) => {
    if (!selectedStandardTrajectory()) return;
    const trajectory = selectedStandardTrajectory()!;
    const updated: StandardTrajectory = {
      ...trajectory,
      timelineComments: trajectory.timelineComments.filter(c => c.id !== commentId),
      updatedAt: Date.now(),
    };
    setSelectedStandardTrajectory(updated);
    setStandardTrajectories(prev => prev.map(t => t.id === trajectory.id ? updated : t));
  };

  const getTimelineCommentsForRange = (startIndex: number, endIndex: number): TimelineComment[] => {
    if (!selectedStandardTrajectory()) return [];
    return selectedStandardTrajectory()!.timelineComments.filter(
      c => c.pointIndex >= startIndex && c.pointIndex <= endIndex
    );
  };

  const findKeyDeviationPoints = (
    studentContour: ContourPoint[],
    standardContour: ContourPoint[],
    threshold: number = 0.05
  ): KeyDeviationPoint[] => {
    if (studentContour.length < 2 || standardContour.length < 2) return [];

    const normStudent = interpolateContour(studentContour, 101);
    const normStandard = interpolateContour(standardContour, 101);
    const deviations = calculatePointDeviations(normStudent, normStandard);

    const keyPoints: KeyDeviationPoint[] = [];
    const sortedDevs = [...deviations].sort((a, b) => b.deviation - a.deviation);

    for (const dev of sortedDevs.slice(0, 5)) {
      if (dev.deviation >= threshold) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (dev.deviation >= 0.1) severity = 'high';
        else if (dev.deviation >= 0.07) severity = 'medium';

        keyPoints.push({
          height: dev.height,
          radiusDiff: dev.deviationType === 'too_wide' ? dev.deviation : -dev.deviation,
          type: dev.deviationType === 'too_wide' ? 'wider' : 'narrower',
          severity,
        });
      }
    }

    return keyPoints.sort((a, b) => a.height - b.height);
  };

  const matchCommentsToDeviations = (
    keyPoints: KeyDeviationPoint[],
    phaseComments: PhaseComment[],
    _timelineComments: TimelineComment[]
  ): KeyDeviationPoint[] => {
    return keyPoints.map(point => {
      const phase = TRAINING_PHASES.find(
        p => point.height >= p.startHeight && point.height <= p.endHeight
      );
      if (phase) {
        const phaseComment = phaseComments.find(c => c.phaseId === phase.id);
        if (phaseComment) {
          return { ...point, relatedComment: phaseComment };
        }
      }
      return point;
    });
  };

  const generatePracticeReport = (
    student: User,
    practiceRecord: PracticeRecord,
    phaseEvaluations: PhaseEvaluation[],
    standardTrajectory?: StandardTrajectory
  ): PracticeReport => {
    const standardContour = standardTrajectory?.contour;
    let keyDeviationPoints: KeyDeviationPoint[] = [];
    let phaseComments: PhaseComment[] = [];
    let timelineComments: TimelineComment[] = [];

    if (standardContour) {
      keyDeviationPoints = findKeyDeviationPoints(practiceRecord.contour, standardContour);
      phaseComments = standardTrajectory?.phaseComments || [];
      timelineComments = standardTrajectory?.timelineComments || [];
      keyDeviationPoints = matchCommentsToDeviations(keyDeviationPoints, phaseComments, timelineComments);
    }

    const report: PracticeReport = {
      id: generateId(),
      studentId: student.id,
      studentName: student.name,
      teacherId: standardTrajectory?.teacherId,
      teacherName: standardTrajectory?.teacherName,
      vesselId: practiceRecord.vesselId,
      vesselName: practiceRecord.vesselName,
      standardTrajectoryId: standardTrajectory?.id,
      standardTrajectoryName: standardTrajectory?.name,
      createdAt: Date.now(),
      practiceRecord,
      standardContour,
      phaseEvaluations,
      totalScore: practiceRecord.totalScore,
      keyDeviationPoints,
      phaseComments,
      timelineComments,
      isShared: false,
    };

    setPracticeReports(prev => [report, ...prev]);
    setSelectedReport(report);
    return report;
  };

  const exportReportAsJSON = (report: PracticeReport): string => {
    return JSON.stringify(report, null, 2);
  };

  const exportReportAsText = (report: PracticeReport): string => {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('        陶艺拉坯练习报告');
    lines.push('========================================');
    lines.push('');
    lines.push(`学员: ${report.studentName}`);
    if (report.teacherName) lines.push(`老师: ${report.teacherName}`);
    lines.push(`器型: ${report.vesselName}`);
    if (report.standardTrajectoryName) lines.push(`标准轨迹: ${report.standardTrajectoryName}`);
    lines.push(`练习时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('              总评分');
    lines.push('----------------------------------------');
    lines.push(`总分: ${report.totalScore.toFixed(1)} / 100`);
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('           各阶段评分');
    lines.push('----------------------------------------');
    for (const phaseEval of report.phaseEvaluations) {
      lines.push(`${phaseEval.phaseName}: ${phaseEval.score.toFixed(1)} 分`);
      lines.push(`  对称性: ${phaseEval.symmetry.toFixed(1)}`);
      lines.push(`  平滑度: ${phaseEval.smoothness.toFixed(1)}`);
      lines.push(`  匹配度: ${phaseEval.matching.toFixed(1)}`);
      lines.push(`  诊断: ${phaseEval.diagnosis}`);
      lines.push('');
    }
    lines.push('----------------------------------------');
    lines.push('          关键偏差点');
    lines.push('----------------------------------------');
    if (report.keyDeviationPoints.length === 0) {
      lines.push('未发现显著偏差点，表现优秀！');
    } else {
      for (const point of report.keyDeviationPoints) {
        const heightPct = Math.round(point.height * 100);
        const typeText = point.type === 'wider' ? '过宽' : '过窄';
        const severityText = point.severity === 'high' ? '严重' : point.severity === 'medium' ? '中等' : '轻微';
        lines.push(`高度 ${heightPct}%: ${typeText} (${severityText})`);
        if (point.relatedComment) {
          lines.push(`  老师点评: ${(point.relatedComment as PhaseComment).content}`);
        }
      }
    }
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('          老师阶段点评');
    lines.push('----------------------------------------');
    if (report.phaseComments.length === 0) {
      lines.push('暂无阶段点评');
    } else {
      for (const comment of report.phaseComments) {
        lines.push(`[${comment.phaseName}] ${comment.teacherName}:`);
        lines.push(`  ${comment.content}`);
      }
    }
    lines.push('');
    if (report.teacherFeedback) {
      lines.push('----------------------------------------');
      lines.push('            老师总评');
      lines.push('----------------------------------------');
      lines.push(report.teacherFeedback);
    }
    lines.push('');
    lines.push('========================================');
    return lines.join('\n');
  };

  const downloadReport = (report: PracticeReport, format: 'json' | 'txt') => {
    const content = format === 'json' ? exportReportAsJSON(report) : exportReportAsText(report);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `练习报告_${report.studentName}_${new Date(report.createdAt).toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareReport = (report: PracticeReport): string => {
    const shareId = generateId();
    const updated = { ...report, shareUrl: `https://pottery.example.com/report/${shareId}`, isShared: true };
    setPracticeReports(prev => prev.map(r => r.id === report.id ? updated : r));
    if (selectedReport()?.id === report.id) {
      setSelectedReport(updated);
    }
    return updated.shareUrl!;
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const deleteStandardTrajectory = (id: string) => {
    setStandardTrajectories(prev => prev.filter(t => t.id !== id));
    if (selectedStandardTrajectory()?.id === id) {
      setSelectedStandardTrajectory(null);
    }
  };

  const deletePracticeReport = (id: string) => {
    setPracticeReports(prev => prev.filter(r => r.id !== id));
    if (selectedReport()?.id === id) {
      setSelectedReport(null);
    }
  };

  const addTeacherFeedback = (reportId: string, feedback: string) => {
    setPracticeReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, teacherFeedback: feedback };
      }
      return r;
    }));
    if (selectedReport()?.id === reportId) {
      setSelectedReport(prev => prev ? { ...prev, teacherFeedback: feedback } : null);
    }
  };

  const trajectoryListByVessel = createMemo(() => {
    const map: Record<string, StandardTrajectory[]> = {};
    for (const t of standardTrajectories()) {
      if (!map[t.vesselId]) map[t.vesselId] = [];
      map[t.vesselId].push(t);
    }
    return map;
  });

  return {
    currentUser,
    setCurrentUser,
    switchRole,
    activeMode,
    setActiveMode,

    standardTrajectories,
    selectedStandardTrajectory,
    setSelectedStandardTrajectory,
    saveStandardTrajectory,
    deleteStandardTrajectory,
    trajectoryListByVessel,

    isTeacherRecording,
    setIsTeacherRecording,
    teacherRecordName,
    setTeacherRecordName,
    teacherRecordDescription,
    setTeacherRecordDescription,

    editingPhaseComment,
    setEditingPhaseComment,
    editingTimelineComment,
    setEditingTimelineComment,
    addPhaseComment,
    deletePhaseComment,
    addTimelineComment,
    deleteTimelineComment,
    getTimelineCommentsForRange,

    practiceReports,
    selectedReport,
    setSelectedReport,
    generatePracticeReport,
    deletePracticeReport,
    addTeacherFeedback,

    findKeyDeviationPoints,
    matchCommentsToDeviations,

    exportReportAsJSON,
    exportReportAsText,
    downloadReport,
    shareReport,
    copyToClipboard,
  };
};
