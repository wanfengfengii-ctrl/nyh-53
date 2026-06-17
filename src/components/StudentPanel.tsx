import { Component, Show, For, createMemo } from 'solid-js';
import type { StandardTrajectory, Vessel, KeyDeviationPoint, ContourPoint, PhaseEvaluation, TrainingPhase, PhaseComment } from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { Target, TrendingUp, AlertTriangle, MessageSquare, CheckCircle2, ArrowRight, User } from 'lucide-solid';

interface StudentPanelProps {
  selectedVessel: Vessel | null;
  standardTrajectories: StandardTrajectory[];
  selectedStandard: StandardTrajectory | null;
  onSelectStandard: (t: StandardTrajectory | null) => void;
  studentContour: ContourPoint[] | null;
  phaseEvaluations: PhaseEvaluation[] | null;
  totalScore: number | null;
  keyDeviationPoints: KeyDeviationPoint[];
  phaseComments: PhaseComment[];
  hasStudentData: boolean;
  onGenerateReport: () => void;
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string; dot: string }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-500' },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500' },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500' },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const StudentPanel: Component<StudentPanelProps> = (props) => {
  const vesselTrajectories = createMemo(() =>
    props.standardTrajectories.filter(t => !props.selectedVessel || t.vesselId === props.selectedVessel!.id)
  );

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-celadon-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-cinnabar-600';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    if (severity === 'high') return 'bg-cinnabar-500';
    if (severity === 'medium') return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getSeverityText = (severity: 'low' | 'medium' | 'high') => {
    if (severity === 'high') return '严重';
    if (severity === 'medium') return '中等';
    return '轻微';
  };

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
        <User class="w-5 h-5" />
        学员学习面板
      </h3>

      <div class="card border-green-200 bg-green-50/50">
        <div class="flex items-center gap-2 mb-3">
          <Target class="w-4 h-4 text-green-600" />
          <h4 class="font-medium text-green-800">选择标准轨迹</h4>
        </div>
        <Show when={!props.selectedVessel}>
          <div class="text-sm text-pottery-500 p-3 bg-white rounded-lg">
            请先从左侧选择目标器型
          </div>
        </Show>
        <Show when={props.selectedVessel && vesselTrajectories().length === 0}>
          <div class="text-center py-6 text-pottery-500 text-sm">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-pottery-100 flex items-center justify-center">
              <Target class="w-6 h-6" />
            </div>
            暂无该器型的标准轨迹
            <div class="text-xs mt-1">请让老师先录制标准轨迹</div>
          </div>
        </Show>
        <Show when={props.selectedVessel && vesselTrajectories().length > 0}>
          <div class="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
            <For each={vesselTrajectories()}>
              {(trajectory) => {
                const isSelected = props.selectedStandard?.id === trajectory.id;
                return (
                  <div
                    class={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-green-400 bg-green-50'
                        : 'border-pottery-200 bg-white hover:border-pottery-300'
                    }`}
                    onClick={() => props.onSelectStandard(isSelected ? null : trajectory)}
                  >
                    <div class="flex items-center gap-2">
                      <div class={`w-2 h-2 rounded-full ${isSelected ? 'bg-green-500' : 'bg-pottery-300'}`} />
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-pottery-800 text-sm truncate">{trajectory.name}</div>
                        <div class="text-xs text-pottery-500">
                          {trajectory.teacherName} · {trajectory.phaseComments.length} 条点评
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 class="w-4 h-4 text-green-500 flex-shrink-0" />}
                    </div>
                    {trajectory.description && (
                      <div class="text-xs text-pottery-500 mt-1 pl-4">{trajectory.description}</div>
                    )}
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>

      <Show when={props.selectedStandard}>
        <div class="card border-blue-200 bg-blue-50/50">
          <div class="flex items-center gap-2 mb-3">
            <TrendingUp class="w-4 h-4 text-blue-600" />
            <h4 class="font-medium text-blue-800">对比结果</h4>
          </div>
          <div class="text-xs text-blue-600 mb-3 p-2 bg-white rounded">
            已选择：<span class="font-medium">{props.selectedStandard!.name}</span>
            <ArrowRight class="w-3 h-3 inline mx-1" />
            画布上蓝色虚线即为老师标准轮廓
          </div>
          <Show when={!props.hasStudentData}>
            <div class="text-sm text-pottery-500 p-3 bg-white rounded-lg text-center">
              在画布上完成练习后查看对比分析
            </div>
          </Show>
          <Show when={props.hasStudentData}>
            <Show when={props.totalScore !== null}>
              <div class="mb-3 p-3 bg-white rounded-lg text-center">
                <div class="text-xs text-pottery-500 mb-1">综合匹配得分</div>
                <div class={`text-3xl font-bold ${getScoreColor(props.totalScore!)}`}>
                  {props.totalScore!.toFixed(1)}
                </div>
                <div class="text-xs text-pottery-500 mt-0.5">/ 100</div>
              </div>
            </Show>

            <Show when={props.phaseEvaluations && props.phaseEvaluations.length > 0}>
              <div class="space-y-2 mb-3">
                <div class="text-xs font-medium text-pottery-600">各阶段评分</div>
                <For each={props.phaseEvaluations}>
                  {(evalItem) => {
                    const colors = phaseColors[evalItem.phaseId];
                    return (
                      <div class={`p-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <div class="flex items-center justify-between mb-1">
                          <div class="flex items-center gap-1.5">
                            <div class={`w-2 h-2 rounded-full ${colors.dot}`} />
                            <span class={`font-medium text-sm ${colors.text}`}>{evalItem.phaseName}</span>
                          </div>
                          <span class={`text-sm font-bold ${getScoreColor(evalItem.score)}`}>
                            {evalItem.score.toFixed(1)}
                          </span>
                        </div>
                        <div class="grid grid-cols-3 gap-1 text-[10px] text-center">
                          <div>
                            <span class="text-pottery-400">对称 </span>
                            <span class={getScoreColor(evalItem.symmetry)}>{evalItem.symmetry.toFixed(0)}</span>
                          </div>
                          <div>
                            <span class="text-pottery-400">平滑 </span>
                            <span class={getScoreColor(evalItem.smoothness)}>{evalItem.smoothness.toFixed(0)}</span>
                          </div>
                          <div>
                            <span class="text-pottery-400">匹配 </span>
                            <span class={getScoreColor(evalItem.matching)}>{evalItem.matching.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>

            <Show when={props.keyDeviationPoints.length > 0}>
              <div class="space-y-2 mb-3">
                <div class="text-xs font-medium text-pottery-600 flex items-center gap-1">
                  <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                  关键偏差点 ({props.keyDeviationPoints.length})
                </div>
                <div class="space-y-1.5">
                  <For each={props.keyDeviationPoints}>
                    {(point) => {
                      const phase = TRAINING_PHASES.find(
                        p => point.height >= p.startHeight && point.height <= p.endHeight
                      );
                      const phaseComment = props.phaseComments.find(c => c.phaseId === phase?.id);
                      return (
                        <div class="p-2 bg-white rounded-lg border border-pottery-200">
                          <div class="flex items-center gap-2 mb-1">
                            <div class={`w-2 h-2 rounded-full ${getSeverityColor(point.severity)}`} />
                            <span class="text-xs font-medium text-pottery-700">
                              高度 {Math.round(point.height * 100)}%
                            </span>
                            <span class={`text-[10px] px-1.5 py-0.5 rounded ${
                              point.type === 'wider'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {point.type === 'wider' ? '过宽' : '过窄'}
                            </span>
                            <span class={`text-[10px] px-1.5 py-0.5 rounded ${
                              point.severity === 'high'
                                ? 'bg-cinnabar-100 text-cinnabar-700'
                                : point.severity === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                            }`}>
                              {getSeverityText(point.severity)}
                            </span>
                          </div>
                          {phaseComment && (
                            <div class="mt-1.5 pt-1.5 border-t border-pottery-100">
                              <div class="text-[10px] text-pottery-500 mb-0.5 flex items-center gap-1">
                                <MessageSquare class="w-3 h-3" />
                                老师点评
                              </div>
                              <div class="text-xs text-pottery-700">{phaseComment.content}</div>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>

            <button
              onClick={props.onGenerateReport}
              class="w-full btn-primary flex items-center justify-center gap-2"
            >
              <TrendingUp class="w-4 h-4" />
              生成练习报告
            </button>
          </Show>
        </div>
      </Show>

      <Show when={props.selectedStandard && props.phaseComments.length > 0}>
        <div class="card border-amber-200 bg-amber-50/50">
          <div class="flex items-center gap-2 mb-3">
            <MessageSquare class="w-4 h-4 text-amber-600" />
            <h4 class="font-medium text-amber-800">老师阶段点评</h4>
          </div>
          <div class="space-y-2">
            <For each={props.phaseComments}>
              {(comment) => {
                const colors = phaseColors[comment.phaseId];
                return (
                  <div class={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div class={`text-xs font-medium ${colors.text} mb-1.5 flex items-center gap-1`}>
                      <div class={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {comment.phaseName}
                    </div>
                    <div class="text-sm text-pottery-700 leading-relaxed">{comment.content}</div>
                    <div class="text-[10px] text-pottery-500 mt-2 text-right">
                      — {comment.teacherName}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};
