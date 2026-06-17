import { createSignal, createMemo } from 'solid-js';
import type {
  PotteryClass,
  Assignment,
  AssignmentSubmission,
  StudentGroup,
  BatchFeedback,
  ClassStatistics,
  GroupingStrategy,
  TrainingPhase,
  PhaseEvaluation,
  KeyDeviationPoint,
  PracticeRecord,
  Vessel,
} from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';

const GROUP_COLORS = [
  'bg-blue-100 border-blue-400 text-blue-700',
  'bg-green-100 border-green-400 text-green-700',
  'bg-amber-100 border-amber-400 text-amber-700',
  'bg-purple-100 border-purple-400 text-purple-700',
  'bg-rose-100 border-rose-400 text-rose-700',
  'bg-cyan-100 border-cyan-400 text-cyan-700',
];

const GROUP_DOT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export const useClassAssignment = () => {
  const [classes, setClasses] = createSignal<PotteryClass[]>([]);
  const [assignments, setAssignments] = createSignal<Assignment[]>([]);
  const [submissions, setSubmissions] = createSignal<AssignmentSubmission[]>([]);
  const [studentGroups, setStudentGroups] = createSignal<StudentGroup[]>([]);
  const [batchFeedbacks, setBatchFeedbacks] = createSignal<BatchFeedback[]>([]);
  const [classStatistics, setClassStatistics] = createSignal<ClassStatistics[]>([]);

  const [selectedClass, setSelectedClass] = createSignal<PotteryClass | null>(null);
  const [selectedAssignment, setSelectedAssignment] = createSignal<Assignment | null>(null);
  const [selectedGroup, setSelectedGroup] = createSignal<StudentGroup | null>(null);

  const [showCreateClass, setShowCreateClass] = createSignal(false);
  const [showCreateAssignment, setShowCreateAssignment] = createSignal(false);
  const [newClassName, setNewClassName] = createSignal('');
  const [newClassDescription, setNewClassDescription] = createSignal('');
  const [newClassStudentNames, setNewClassStudentNames] = createSignal('');
  const [newAssignmentTitle, setNewAssignmentTitle] = createSignal('');
  const [newAssignmentDescription, setNewAssignmentDescription] = createSignal('');
  const [newAssignmentDeadline, setNewAssignmentDeadline] = createSignal('');
  const [newAssignmentVesselId, setNewAssignmentVesselId] = createSignal('');
  const [newAssignmentVesselName, setNewAssignmentVesselName] = createSignal('');
  const [batchCommentText, setBatchCommentText] = createSignal('');
  const [submissionFilter, setSubmissionFilter] = createSignal<'all' | 'pending' | 'low_score' | 'submitted'>('all');
  const [groupingStrategy, setGroupingStrategy] = createSignal<GroupingStrategy>('total_score');

  const generateId = (): string => {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createClass = (teacherId: string, teacherName: string): PotteryClass => {
    const studentNameList = newClassStudentNames()
      .split(/[,，\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const studentIds = studentNameList.map(() => generateId());
    const studentNames: Record<string, string> = {};
    studentIds.forEach((id, i) => {
      studentNames[id] = studentNameList[i];
    });

    const cls: PotteryClass = {
      id: generateId(),
      name: newClassName().trim(),
      teacherId,
      teacherName,
      studentIds,
      studentNames,
      createdAt: Date.now(),
      description: newClassDescription().trim() || undefined,
    };

    setClasses(prev => [cls, ...prev]);
    setSelectedClass(cls);
    setShowCreateClass(false);
    setNewClassName('');
    setNewClassDescription('');
    setNewClassStudentNames('');
    return cls;
  };

  const deleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    setAssignments(prev => prev.filter(a => a.classId !== classId));
    if (selectedClass()?.id === classId) {
      setSelectedClass(null);
      setSelectedAssignment(null);
    }
  };

  const createAssignment = (
    classObj: PotteryClass,
    vessel: Vessel,
    standardTrajectoryId?: string,
    standardTrajectoryName?: string
  ): Assignment => {
    const deadlineDate = newAssignmentDeadline()
      ? new Date(newAssignmentDeadline()).getTime()
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    const assignment: Assignment = {
      id: generateId(),
      classId: classObj.id,
      className: classObj.name,
      teacherId: classObj.teacherId,
      teacherName: classObj.teacherName,
      vesselId: vessel.id,
      vesselName: vessel.name,
      title: newAssignmentTitle().trim(),
      description: newAssignmentDescription().trim(),
      createdAt: Date.now(),
      deadline: deadlineDate,
      standardTrajectoryId,
      standardTrajectoryName,
      isActive: true,
    };

    setAssignments(prev => [assignment, ...prev]);
    setSelectedAssignment(assignment);
    setShowCreateAssignment(false);
    setNewAssignmentTitle('');
    setNewAssignmentDescription('');
    setNewAssignmentDeadline('');
    setNewAssignmentVesselId('');
    setNewAssignmentVesselName('');
    return assignment;
  };

  const deleteAssignment = (assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setSubmissions(prev => prev.filter(s => s.assignmentId !== assignmentId));
    if (selectedAssignment()?.id === assignmentId) {
      setSelectedAssignment(null);
    }
  };

  const submitAssignment = (
    assignmentId: string,
    studentId: string,
    studentName: string,
    practiceRecord: PracticeRecord,
    phaseEvaluations: PhaseEvaluation[],
    keyDeviationPoints: KeyDeviationPoint[],
    totalScore: number
  ): AssignmentSubmission => {
    const submission: AssignmentSubmission = {
      id: generateId(),
      assignmentId,
      studentId,
      studentName,
      practiceRecord,
      totalScore,
      phaseEvaluations,
      keyDeviationPoints,
      submittedAt: Date.now(),
      status: 'submitted',
    };

    setSubmissions(prev => {
      const existing = prev.findIndex(
        s => s.assignmentId === assignmentId && s.studentId === studentId
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = submission;
        return updated;
      }
      return [submission, ...prev];
    });
    return submission;
  };

  const getSubmissionsForAssignment = (assignmentId: string): AssignmentSubmission[] => {
    return submissions().filter(s => s.assignmentId === assignmentId);
  };

  const getPendingStudents = (assignment: Assignment): string[] => {
    const cls = classes().find(c => c.id === assignment.classId);
    if (!cls) return [];
    const submittedIds = submissions()
      .filter(s => s.assignmentId === assignment.id)
      .map(s => s.studentId);
    return cls.studentIds.filter(id => !submittedIds.includes(id));
  };

  const groupStudents = (assignmentId: string, strategy: GroupingStrategy): StudentGroup[] => {
    const assignmentSubmissions = getSubmissionsForAssignment(assignmentId);
    const assignment = assignments().find(a => a.id === assignmentId);
    if (!assignment || assignmentSubmissions.length === 0) return [];

    const groups: StudentGroup[] = [];

    if (strategy === 'total_score') {
      const ranges = [
        { name: '优秀 (≥85)', min: 85, max: 101 },
        { name: '良好 (70-84)', min: 70, max: 85 },
        { name: '及格 (60-69)', min: 60, max: 70 },
        { name: '不及格 (<60)', min: 0, max: 60 },
      ];

      ranges.forEach((range, i) => {
        const filtered = assignmentSubmissions.filter(
          s => s.totalScore >= range.min && s.totalScore < range.max
        );
        if (filtered.length > 0) {
          groups.push({
            id: `group_${assignmentId}_score_${i}`,
            name: range.name,
            strategy,
            studentIds: filtered.map(s => s.studentId),
            commonTrait: `总分 ${range.name}`,
            color: GROUP_COLORS[i % GROUP_COLORS.length],
          });
        }
      });
    } else if (strategy === 'phase_weakness') {
      const phaseGroups: Record<string, string[]> = {};
      assignmentSubmissions.forEach(sub => {
        if (sub.phaseEvaluations.length === 0) return;
        const weakest = sub.phaseEvaluations.reduce(
          (min, p) => p.score < min.score ? p : min,
          sub.phaseEvaluations[0]
        );
        if (!phaseGroups[weakest.phaseId]) {
          phaseGroups[weakest.phaseId] = [];
        }
        phaseGroups[weakest.phaseId].push(sub.studentId);
      });

      Object.entries(phaseGroups).forEach(([phaseId, studentIds], i) => {
        const phase = TRAINING_PHASES.find(p => p.id === phaseId as TrainingPhase);
        groups.push({
          id: `group_${assignmentId}_phase_${phaseId}`,
          name: `${phase?.name || phaseId}短板组`,
          strategy,
          studentIds,
          commonTrait: `${phase?.name || phaseId}阶段最弱`,
          color: GROUP_COLORS[i % GROUP_COLORS.length],
        });
      });
    } else if (strategy === 'deviation_type') {
      const devGroups: Record<string, string[]> = { wider: [], narrower: [], mixed: [] };
      assignmentSubmissions.forEach(sub => {
        if (sub.keyDeviationPoints.length === 0) {
          devGroups.mixed.push(sub.studentId);
          return;
        }
        const widerCount = sub.keyDeviationPoints.filter(d => d.type === 'wider').length;
        const narrowerCount = sub.keyDeviationPoints.filter(d => d.type === 'narrower').length;
        if (widerCount > narrowerCount) {
          devGroups.wider.push(sub.studentId);
        } else if (narrowerCount > widerCount) {
          devGroups.narrower.push(sub.studentId);
        } else {
          devGroups.mixed.push(sub.studentId);
        }
      });

      const labels: Record<string, string> = {
        wider: '偏宽型 (轮廓偏大)',
        narrower: '偏窄型 (轮廓偏小)',
        mixed: '混合偏差型',
      };

      Object.entries(devGroups).forEach(([type, studentIds], i) => {
        if (studentIds.length > 0) {
          groups.push({
            id: `group_${assignmentId}_dev_${type}`,
            name: labels[type],
            strategy,
            studentIds,
            commonTrait: labels[type],
            color: GROUP_COLORS[i % GROUP_COLORS.length],
          });
        }
      });
    }

    setStudentGroups(groups);
    return groups;
  };

  const addBatchFeedback = (
    groupId: string,
    assignmentId: string,
    teacherId: string,
    teacherName: string,
    content: string,
    targetStudentIds: string[]
  ): BatchFeedback => {
    const feedback: BatchFeedback = {
      id: generateId(),
      groupId,
      assignmentId,
      teacherId,
      teacherName,
      content,
      createdAt: Date.now(),
      targetStudentIds,
    };

    setBatchFeedbacks(prev => [feedback, ...prev]);

    setSubmissions(prev => prev.map(s => {
      if (s.assignmentId === assignmentId && targetStudentIds.includes(s.studentId)) {
        return { ...s, teacherFeedback: content, batchFeedbackId: feedback.id, status: 'graded' as const };
      }
      return s;
    }));

    return feedback;
  };

  const addIndividualFeedback = (submissionId: string, feedback: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === submissionId) {
        return { ...s, teacherFeedback: feedback, status: 'graded' as const };
      }
      return s;
    }));
  };

  const getFilteredSubmissions = (assignmentId: string): AssignmentSubmission[] => {
    const all = getSubmissionsForAssignment(assignmentId);
    const filter = submissionFilter();
    switch (filter) {
      case 'pending':
        return all.filter(s => s.status === 'pending');
      case 'submitted':
        return all.filter(s => s.status === 'submitted');
      case 'low_score':
        return all.filter(s => s.totalScore < 60);
      default:
        return all;
    }
  };

  const generateClassStatistics = (classId: string, assignmentId: string): ClassStatistics | null => {
    const cls = classes().find(c => c.id === classId);
    const assignment = assignments().find(a => a.id === assignmentId);
    if (!cls || !assignment) return null;

    const assignmentSubmissions = getSubmissionsForAssignment(assignmentId);
    const totalStudents = cls.studentIds.length;
    const submittedCount = assignmentSubmissions.length;
    const pendingCount = totalStudents - submittedCount;

    const scores = assignmentSubmissions.map(s => s.totalScore);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    const scoreDistribution = [
      { range: '90-100', count: scores.filter(s => s >= 90).length },
      { range: '80-89', count: scores.filter(s => s >= 80 && s < 90).length },
      { range: '70-79', count: scores.filter(s => s >= 70 && s < 80).length },
      { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length },
      { range: '<60', count: scores.filter(s => s < 60).length },
    ];

    const phaseAverages = TRAINING_PHASES.map(phase => {
      const phaseScores = assignmentSubmissions
        .map(s => s.phaseEvaluations.find(pe => pe.phaseId === phase.id))
        .filter(Boolean)
        .map(pe => pe!.score);
      return {
        phaseId: phase.id,
        phaseName: phase.name,
        avgScore: phaseScores.length > 0
          ? phaseScores.reduce((a, b) => a + b, 0) / phaseScores.length
          : 0,
      };
    });

    const weaknessCounts: Record<string, number> = {};
    assignmentSubmissions.forEach(sub => {
      if (sub.phaseEvaluations.length === 0) return;
      const weakest = sub.phaseEvaluations.reduce(
        (min, p) => p.score < min.score ? p : min,
        sub.phaseEvaluations[0]
      );
      weaknessCounts[weakest.phaseId] = (weaknessCounts[weakest.phaseId] || 0) + 1;
    });
    const commonWeaknesses = Object.entries(weaknessCounts)
      .map(([phaseId, count]) => {
        const phase = TRAINING_PHASES.find(p => p.id === phaseId as TrainingPhase);
        return { phaseId: phaseId as TrainingPhase, phaseName: phase?.name || phaseId, count };
      })
      .sort((a, b) => b.count - a.count);

    const deviationCounts: Record<string, number> = { wider: 0, narrower: 0 };
    assignmentSubmissions.forEach(sub => {
      sub.keyDeviationPoints.forEach(dp => {
        deviationCounts[dp.type] = (deviationCounts[dp.type] || 0) + 1;
      });
    });
    const commonDeviationTypes = Object.entries(deviationCounts)
      .map(([type, count]) => ({
        type: type === 'wider' ? '偏宽' : '偏窄',
        count,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);

    const stats: ClassStatistics = {
      classId,
      className: cls.name,
      assignmentId,
      assignmentTitle: assignment.title,
      totalStudents,
      submittedCount,
      pendingCount,
      averageScore: Math.round(averageScore * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
      minScore: Math.round(minScore * 10) / 10,
      scoreDistribution,
      phaseAverages,
      commonWeaknesses,
      commonDeviationTypes,
      generatedAt: Date.now(),
    };

    setClassStatistics(prev => {
      const existing = prev.findIndex(
        s => s.classId === classId && s.assignmentId === assignmentId
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = stats;
        return updated;
      }
      return [stats, ...prev];
    });

    return stats;
  };

  const exportStatisticsAsText = (stats: ClassStatistics): string => {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('      班级训练统计报告');
    lines.push('========================================');
    lines.push('');
    lines.push(`班级: ${stats.className}`);
    lines.push(`作业: ${stats.assignmentTitle}`);
    lines.push(`生成时间: ${new Date(stats.generatedAt).toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('            总体概览');
    lines.push('----------------------------------------');
    lines.push(`总人数: ${stats.totalStudents}`);
    lines.push(`已提交: ${stats.submittedCount}`);
    lines.push(`未提交: ${stats.pendingCount}`);
    lines.push(`平均分: ${stats.averageScore.toFixed(1)}`);
    lines.push(`最高分: ${stats.maxScore.toFixed(1)}`);
    lines.push(`最低分: ${stats.minScore.toFixed(1)}`);
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('          分数段分布');
    lines.push('----------------------------------------');
    stats.scoreDistribution.forEach(d => {
      lines.push(`${d.range}: ${d.count} 人`);
    });
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('        各阶段平均分');
    lines.push('----------------------------------------');
    stats.phaseAverages.forEach(p => {
      lines.push(`${p.phaseName}: ${p.avgScore.toFixed(1)} 分`);
    });
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('        常见薄弱阶段');
    lines.push('----------------------------------------');
    if (stats.commonWeaknesses.length === 0) {
      lines.push('暂无数据');
    } else {
      stats.commonWeaknesses.forEach(w => {
        lines.push(`${w.phaseName}: ${w.count} 人此阶段最弱`);
      });
    }
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('        常见偏差类型');
    lines.push('----------------------------------------');
    if (stats.commonDeviationTypes.length === 0) {
      lines.push('暂无数据');
    } else {
      stats.commonDeviationTypes.forEach(d => {
        lines.push(`${d.type}: ${d.count} 次`);
      });
    }
    lines.push('');
    lines.push('========================================');
    return lines.join('\n');
  };

  const exportStatisticsAsJSON = (stats: ClassStatistics): string => {
    return JSON.stringify(stats, null, 2);
  };

  const downloadStatistics = (stats: ClassStatistics, format: 'json' | 'txt') => {
    const content = format === 'json'
      ? exportStatisticsAsJSON(stats)
      : exportStatisticsAsText(stats);
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `班级统计_${stats.className}_${stats.assignmentTitle}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStudentAssignments = (studentId: string): Assignment[] => {
    const studentClassIds = classes()
      .filter(c => c.studentIds.includes(studentId))
      .map(c => c.id);
    return assignments().filter(a => studentClassIds.includes(a.classId) && a.isActive);
  };

  const getStudentSubmissions = (studentId: string): AssignmentSubmission[] => {
    return submissions().filter(s => s.studentId === studentId);
  };

  const getFeedbackForStudent = (studentId: string, assignmentId: string): BatchFeedback | undefined => {
    return batchFeedbacks().find(
      f => f.assignmentId === assignmentId && f.targetStudentIds.includes(studentId)
    );
  };

  const classAssignments = createMemo(() => {
    const clsId = selectedClass()?.id;
    if (!clsId) return [];
    return assignments().filter(a => a.classId === clsId);
  });

  const currentGroupSubmissions = createMemo(() => {
    const group = selectedGroup();
    const asgnId = selectedAssignment()?.id;
    if (!group || !asgnId) return [];
    return getSubmissionsForAssignment(asgnId).filter(
      s => group.studentIds.includes(s.studentId)
    );
  });

  return {
    classes,
    assignments,
    submissions,
    studentGroups,
    batchFeedbacks,
    classStatistics,

    selectedClass,
    setSelectedClass,
    selectedAssignment,
    setSelectedAssignment,
    selectedGroup,
    setSelectedGroup,

    showCreateClass,
    setShowCreateClass,
    showCreateAssignment,
    setShowCreateAssignment,
    newClassName,
    setNewClassName,
    newClassDescription,
    setNewClassDescription,
    newClassStudentNames,
    setNewClassStudentNames,
    newAssignmentTitle,
    setNewAssignmentTitle,
    newAssignmentDescription,
    setNewAssignmentDescription,
    newAssignmentDeadline,
    setNewAssignmentDeadline,
    newAssignmentVesselId,
    setNewAssignmentVesselId,
    newAssignmentVesselName,
    setNewAssignmentVesselName,
    batchCommentText,
    setBatchCommentText,
    submissionFilter,
    setSubmissionFilter,
    groupingStrategy,
    setGroupingStrategy,

    createClass,
    deleteClass,
    createAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissionsForAssignment,
    getPendingStudents,
    groupStudents,
    addBatchFeedback,
    addIndividualFeedback,
    getFilteredSubmissions,
    generateClassStatistics,
    downloadStatistics,
    exportStatisticsAsText,
    exportStatisticsAsJSON,

    getStudentAssignments,
    getStudentSubmissions,
    getFeedbackForStudent,

    classAssignments,
    currentGroupSubmissions,

    GROUP_DOT_COLORS,
  };
};
