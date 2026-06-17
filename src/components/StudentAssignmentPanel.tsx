import { Component, Show, For, createSignal } from 'solid-js';
import type {
  Assignment,
  AssignmentSubmission,
  Vessel,
  TrainingPhase,
  PracticeRecord,
  PhaseEvaluation,
  KeyDeviationPoint,
} from '@/types/pottery';
import {
  ClipboardList, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, ChevronDown, ChevronRight, Send, User,
  Sparkles,
} from 'lucide-solid';

interface StudentAssignmentPanelProps {
  classHook: ReturnType<typeof import('@/hooks/useClassAssignment').useClassAssignment>;
  currentStudent: { id: string; name: string };
  selectedVessel: Vessel | null;
  onSubmitAssignment: (
    assignmentId: string,
    practiceRecord: PracticeRecord,
    phaseEvaluations: PhaseEvaluation[],
    keyDeviationPoints: KeyDeviationPoint[],
    totalScore: number
  ) => void;
  practiceRecord: PracticeRecord | null;
  phaseEvaluations: PhaseEvaluation[] | null;
  keyDeviationPoints: KeyDeviationPoint[];
  totalScore: number | null;
  hasData: boolean;
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string; dot: string }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-500' },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500' },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500' },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const StudentAssignmentPanel: Component<StudentAssignmentPanelProps> = (props) => {
  const h = props.classHook;

  const [expandedAssignment, setExpandedAssignment] = createSignal<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-celadon-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-cinnabar-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-celadon-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-cinnabar-500';
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const myAssignments = () => h.getStudentAssignments(props.currentStudent.id);
  const mySubmissions = () => h.getStudentSubmissions(props.currentStudent.id);

  const getMySubmission = (assignmentId: string): AssignmentSubmission | undefined => {
    return mySubmissions().find(s => s.assignmentId === assignmentId);
  };

  const canSubmit = (assignment: Assignment): boolean => {
    if (Date.now() > assignment.deadline) return false;
    if (getMySubmission(assignment.id)) return false;
    if (!props.hasData) return false;
    if (!props.practiceRecord) return false;
    return props.selectedVessel?.id === assignment.vesselId;
  };

  const handleSubmit = (assignment: Assignment) => {
    if (!canSubmit(assignment) || !props.practiceRecord || !props.phaseEvaluations) return;
    props.onSubmitAssignment(
      assignment.id,
      props.practiceRecord,
      props.phaseEvaluations,
      props.keyDeviationPoints,
      props.totalScore ?? 0
    );
  };

  const isOverdue = (deadline: number) => Date.now() > deadline;

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
        <User class="w-5 h-5" />
        我的作业
      </h3>

      <Show when={myAssignments().length === 0}>
        <div class="card text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pottery-100 flex items-center justify-center">
            <ClipboardList class="w-8 h-8 text-pottery-400" />
          </div>
          <p class="text-pottery-600 mb-2">暂无作业</p>
          <p class="text-sm text-pottery-500">
            老师布置作业后将在此显示
          </p>
        </div>
      </Show>

      <Show when={myAssignments().length > 0}>
        <div class="space-y-3">
          <For each={myAssignments()}>
            {(assignment) => {
              const isExpanded = expandedAssignment() === assignment.id;
              const submission = getMySubmission(assignment.id);
              const overdue = isOverdue(assignment.deadline);
              const feedback = h.getFeedbackForStudent(props.currentStudent.id, assignment.id);

              return (
                <div class={`card transition-all duration-200 ${
                  submission ? 'border-green-200' : overdue ? 'border-cinnabar-200' : 'border-blue-200'
                }`}>
                  <div
                    class="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedAssignment(isExpanded ? null : assignment.id)}
                  >
                    <button class="mt-0.5 p-1 rounded hover:bg-pottery-100 text-pottery-500">
                      {isExpanded ? <ChevronDown class="w-4 h-4" /> : <ChevronRight class="w-4 h-4" />}
                    </button>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-medium text-pottery-800 text-sm">{assignment.title}</span>
                        {submission ? (
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                            已提交
                          </span>
                        ) : overdue ? (
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-cinnabar-100 text-cinnabar-700">
                            已截止
                          </span>
                        ) : (
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            进行中
                          </span>
                        )}
                        <span class="text-[10px] px-1.5 py-0.5 bg-pottery-100 text-pottery-600 rounded">
                          {assignment.vesselName}
                        </span>
                      </div>
                      <div class="flex items-center gap-3 text-[11px] text-pottery-500">
                        <span class="flex items-center gap-1">
                          <Clock class="w-3 h-3" />
                          截止: {formatDate(assignment.deadline)}
                        </span>
                        <span>{assignment.className}</span>
                      </div>
                    </div>
                    <Show when={submission}>
                      <div class={`px-2 py-1 rounded-full text-xs font-bold text-white ${getScoreBg(submission!.totalScore)}`}>
                        {submission!.totalScore.toFixed(0)}
                      </div>
                    </Show>
                  </div>

                  <Show when={isExpanded}>
                    <div class="mt-3 pt-3 border-t border-pottery-200 space-y-3">
                      <Show when={assignment.description}>
                        <div class="text-xs text-pottery-600 p-2 bg-pottery-50 rounded">
                          {assignment.description}
                        </div>
                      </Show>

                      <Show when={!submission && !overdue}>
                        <div class="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                          <div class="flex items-center gap-2 text-xs text-blue-700">
                            <Sparkles class="w-3.5 h-3.5" />
                            <span class="font-medium">提交作业</span>
                          </div>
                          <div class="text-xs text-pottery-600">
                            请先在左侧选择 <span class="font-medium text-pottery-800">{assignment.vesselName}</span> 器型，
                            完成练习后点击下方按钮提交。
                          </div>
                          <Show when={props.selectedVessel?.id !== assignment.vesselId}>
                            <div class="text-[10px] text-amber-600 flex items-center gap-1">
                              <AlertTriangle class="w-3 h-3" />
                              请先切换到指定器型再进行练习
                            </div>
                          </Show>
                          <Show when={!props.hasData}>
                            <div class="text-[10px] text-pottery-500">
                              完成绘制并生成轮廓后即可提交
                            </div>
                          </Show>
                          <button
                            onClick={() => handleSubmit(assignment)}
                            disabled={!canSubmit(assignment)}
                            class="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                          >
                            <Send class="w-4 h-4" />
                            提交作业
                          </button>
                        </div>
                      </Show>

                      <Show when={!submission && overdue}>
                        <div class="p-3 bg-cinnabar-50 rounded-lg border border-cinnabar-200 text-center">
                          <div class="text-sm text-cinnabar-700 font-medium">作业已截止</div>
                          <div class="text-xs text-cinnabar-500 mt-1">未能在截止时间前提交</div>
                        </div>
                      </Show>

                      <Show when={submission}>
                        <div class="p-3 bg-green-50 rounded-lg border border-green-200 space-y-3">
                          <div class="flex items-center gap-2 text-xs text-green-700">
                            <CheckCircle2 class="w-3.5 h-3.5" />
                            <span class="font-medium">已提交</span>
                            <span class="text-green-500">{formatDate(submission!.submittedAt)}</span>
                          </div>

                          <div class="p-3 bg-white rounded-lg text-center">
                            <div class="text-xs text-pottery-500 mb-1">综合得分</div>
                            <div class={`text-3xl font-bold ${getScoreColor(submission!.totalScore)}`}>
                              {submission!.totalScore.toFixed(1)}
                            </div>
                            <div class="text-xs text-pottery-500 mt-0.5">/ 100</div>
                          </div>

                          <Show when={submission!.phaseEvaluations.length > 0}>
                            <div class="space-y-1.5">
                              <For each={submission!.phaseEvaluations}>
                                {(pe) => {
                                  const colors = phaseColors[pe.phaseId];
                                  return (
                                    <div class={`p-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                                      <div class="flex items-center justify-between mb-1">
                                        <div class="flex items-center gap-1.5">
                                          <div class={`w-2 h-2 rounded-full ${colors.dot}`} />
                                          <span class={`font-medium text-sm ${colors.text}`}>{pe.phaseName}</span>
                                        </div>
                                        <span class={`text-sm font-bold ${getScoreColor(pe.score)}`}>
                                          {pe.score.toFixed(1)}
                                        </span>
                                      </div>
                                      <div class="grid grid-cols-3 gap-1 text-[10px] text-center">
                                        <div>
                                          <span class="text-pottery-400">对称 </span>
                                          <span class={getScoreColor(pe.symmetry)}>{pe.symmetry.toFixed(0)}</span>
                                        </div>
                                        <div>
                                          <span class="text-pottery-400">平滑 </span>
                                          <span class={getScoreColor(pe.smoothness)}>{pe.smoothness.toFixed(0)}</span>
                                        </div>
                                        <div>
                                          <span class="text-pottery-400">匹配 </span>
                                          <span class={getScoreColor(pe.matching)}>{pe.matching.toFixed(0)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </Show>

                          <Show when={submission!.keyDeviationPoints.length > 0}>
                            <div>
                              <div class="text-xs font-medium text-pottery-600 mb-1.5 flex items-center gap-1">
                                <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                                关键偏差点
                              </div>
                              <div class="flex gap-1 flex-wrap">
                                <For each={submission!.keyDeviationPoints.slice(0, 5)}>
                                  {(dp) => (
                                    <span class={`text-[10px] px-1.5 py-0.5 rounded ${
                                      dp.type === 'wider'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {Math.round(dp.height * 100)}% {dp.type === 'wider' ? '偏宽' : '偏窄'}
                                    </span>
                                  )}
                                </For>
                              </div>
                            </div>
                          </Show>

                          <Show when={submission!.teacherFeedback || feedback}>
                            <div class="p-3 bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg border border-amber-200">
                              <div class="text-xs font-medium text-amber-800 mb-1.5 flex items-center gap-1">
                                <MessageSquare class="w-3.5 h-3.5" />
                                老师评语
                              </div>
                              <div class="text-sm text-pottery-700 leading-relaxed">
                                {submission!.teacherFeedback || feedback?.content}
                              </div>
                              <Show when={feedback}>
                                <div class="text-[10px] text-pottery-400 mt-2">
                                  — {feedback!.teacherName} · {formatDate(feedback!.createdAt)}
                                </div>
                              </Show>
                            </div>
                          </Show>

                          <Show when={!submission!.teacherFeedback && !feedback && submission!.status === 'submitted'}>
                            <div class="text-xs text-pottery-400 italic text-center py-2">
                              等待老师点评...
                            </div>
                          </Show>
                        </div>
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
