import { Component, Show, For, createSignal } from 'solid-js';
import type { PracticeReport, TrainingPhase, KeyDeviationPoint } from '@/types/pottery';
import {
  FileText, Download, Share2, Trash2, Trophy, AlertTriangle,
  MessageSquare, Copy, Check, X, Edit3, Save, Calendar, User,
  ChevronDown, ChevronRight, Sparkles, Award
} from 'lucide-solid';

interface ReportPanelProps {
  reports: PracticeReport[];
  selectedReport: PracticeReport | null;
  onSelectReport: (r: PracticeReport | null) => void;
  onDeleteReport: (id: string) => void;
  onDownloadReport: (report: PracticeReport, format: 'json' | 'txt') => void;
  onShareReport: (report: PracticeReport) => void;
  onCopyToClipboard: (text: string) => Promise<boolean>;
  onAddFeedback: (reportId: string, feedback: string) => void;
  currentUserRole: 'teacher' | 'student';
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string; dot: string }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-500' },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500' },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500' },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const ReportPanel: Component<ReportPanelProps> = (props) => {
  const [copied, setCopied] = createSignal(false);
  const [expandedReports, setExpandedReports] = createSignal<Set<string>>(new Set());
  const [editingFeedback, setEditingFeedback] = createSignal(false);
  const [feedbackText, setFeedbackText] = createSignal('');

  const toggleExpand = (id: string) => {
    const next = new Set(expandedReports());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedReports(next);
  };

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

  const handleCopyShareUrl = async (url: string) => {
    const ok = await props.onCopyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveFeedback = (reportId: string) => {
    if (feedbackText().trim()) {
      props.onAddFeedback(reportId, feedbackText().trim());
      setEditingFeedback(false);
      setFeedbackText('');
    }
  };

  const handleShare = (report: PracticeReport) => {
    props.onShareReport(report);
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    if (severity === 'high') return 'bg-cinnabar-500';
    if (severity === 'medium') return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getSeverityLabel = (severity: 'low' | 'medium' | 'high') => {
    if (severity === 'high') return '严重';
    if (severity === 'medium') return '中等';
    return '轻微';
  };

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
        <FileText class="w-5 h-5" />
        练习报告
      </h3>

      <Show when={props.reports.length === 0}>
        <div class="card text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pottery-100 flex items-center justify-center">
            <FileText class="w-8 h-8 text-pottery-400" />
          </div>
          <p class="text-pottery-600 mb-2">暂无练习报告</p>
          <p class="text-sm text-pottery-500">
            完成练习并选择标准轨迹后生成报告
          </p>
        </div>
      </Show>

      <Show when={props.reports.length > 0}>
        <div class="text-xs text-pottery-500 mb-2">
          共 {props.reports.length} 份报告
        </div>
        <div class="space-y-3">
          <For each={props.reports}>
            {(report) => {
              const isExpanded = expandedReports().has(report.id);
              const isSelected = props.selectedReport?.id === report.id;
              return (
                <div class={`card transition-all duration-200 ${isSelected ? 'ring-2 ring-pottery-400' : ''}`}>
                  <div
                    class="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleExpand(report.id)}
                  >
                    <button
                      class="mt-0.5 p-1 rounded hover:bg-pottery-100 text-pottery-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isExpanded ? <ChevronDown class="w-4 h-4" /> : <ChevronRight class="w-4 h-4" />}
                    </button>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-medium text-pottery-800 text-sm">{report.vesselName}</span>
                        <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getScoreBg(report.totalScore)}`}>
                          <Trophy class="w-3 h-3" />
                          {report.totalScore.toFixed(1)} 分
                        </span>
                        {report.isShared && (
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                            <Share2 class="w-3 h-3" />
                            已分享
                          </span>
                        )}
                      </div>
                      <div class="flex items-center gap-3 text-[11px] text-pottery-500 flex-wrap">
                        <span class="flex items-center gap-1">
                          <User class="w-3 h-3" />
                          {report.studentName}
                        </span>
                        {report.teacherName && (
                          <span class="flex items-center gap-1">
                            <Award class="w-3 h-3" />
                            {report.teacherName}
                          </span>
                        )}
                        <span class="flex items-center gap-1">
                          <Calendar class="w-3 h-3" />
                          {new Date(report.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onDeleteReport(report.id);
                      }}
                      class="p-1.5 rounded-lg hover:bg-cinnabar-50 text-pottery-400 hover:text-cinnabar-600 transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>

                  <Show when={isExpanded}>
                    <div class="mt-4 pt-4 border-t border-pottery-200 space-y-4">
                      <div class="grid grid-cols-3 gap-3">
                        <For each={report.phaseEvaluations}>
                          {(evalItem) => {
                            const colors = phaseColors[evalItem.phaseId];
                            return (
                              <div class={`p-2 rounded-lg border ${colors.bg} ${colors.border} text-center`}>
                                <div class={`text-[10px] ${colors.text} font-medium mb-0.5`}>
                                  {evalItem.phaseName}
                                </div>
                                <div class={`text-lg font-bold ${getScoreColor(evalItem.score)}`}>
                                  {evalItem.score.toFixed(0)}
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>

                      <Show when={report.keyDeviationPoints.length > 0}>
                        <div>
                          <div class="text-xs font-medium text-pottery-600 mb-2 flex items-center gap-1">
                            <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                            关键偏差点
                          </div>
                          <div class="space-y-1.5">
                            <For each={report.keyDeviationPoints.slice(0, 3)}>
                              {(point: KeyDeviationPoint) => (
                                <div class="flex items-center gap-2 text-xs p-2 bg-pottery-50 rounded-lg">
                                  <div class={`w-2 h-2 rounded-full flex-shrink-0 ${getSeverityColor(point.severity)}`} />
                                  <span class="text-pottery-600">
                                    高度 {Math.round(point.height * 100)}%
                                  </span>
                                  <span class={point.type === 'wider' ? 'text-green-600' : 'text-blue-600'}>
                                    {point.type === 'wider' ? '过宽' : '过窄'}
                                  </span>
                                  <span class="text-pottery-400">({getSeverityLabel(point.severity)})</span>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>

                      <Show when={report.phaseComments.length > 0}>
                        <div>
                          <div class="text-xs font-medium text-pottery-600 mb-2 flex items-center gap-1">
                            <MessageSquare class="w-3.5 h-3.5 text-amber-500" />
                            老师阶段点评
                          </div>
                          <div class="space-y-1.5">
                            <For each={report.phaseComments.slice(0, 2)}>
                              {(comment) => {
                                const colors = phaseColors[comment.phaseId];
                                return (
                                  <div class={`p-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                                    <div class={`text-[10px] ${colors.text} font-medium mb-1`}>
                                      {comment.phaseName}
                                    </div>
                                    <div class="text-xs text-pottery-700">{comment.content}</div>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      </Show>

                      <Show when={props.currentUserRole === 'teacher'}>
                        <Show when={!editingFeedback()}>
                          <div class="p-3 bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg border border-amber-200">
                            <div class="flex items-center justify-between">
                              <div>
                                <div class="text-xs font-medium text-amber-800 flex items-center gap-1">
                                  <Sparkles class="w-3.5 h-3.5" />
                                  老师总评
                                </div>
                                {report.teacherFeedback ? (
                                  <div class="text-sm text-pottery-700 mt-1">{report.teacherFeedback}</div>
                                ) : (
                                  <div class="text-xs text-pottery-500 mt-1 italic">暂无总评</div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingFeedback(true);
                                  setFeedbackText(report.teacherFeedback || '');
                                }}
                                class="p-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-50"
                              >
                                <Edit3 class="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </Show>
                        <Show when={editingFeedback()}>
                          <div class="p-3 bg-amber-50 rounded-lg border border-amber-300">
                            <div class="text-xs font-medium text-amber-800 mb-2 flex items-center justify-between">
                              <span>编辑老师总评</span>
                              <button
                                onClick={() => setEditingFeedback(false)}
                                class="p-1 rounded hover:bg-amber-100 text-amber-700"
                              >
                                <X class="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={feedbackText()}
                              onInput={(e) => setFeedbackText(e.target.value)}
                              placeholder="输入您对学员这次练习的总体评价..."
                              rows={3}
                              class="w-full p-2 text-sm rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
                            />
                            <div class="flex justify-end mt-2">
                              <button
                                onClick={() => handleSaveFeedback(report.id)}
                                disabled={!feedbackText().trim()}
                                class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                              >
                                <Save class="w-3 h-3" />
                                保存总评
                              </button>
                            </div>
                          </div>
                        </Show>
                      </Show>

                      <Show when={report.teacherFeedback && props.currentUserRole !== 'teacher'}>
                        <div class="p-3 bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg border border-amber-200">
                          <div class="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                            <Sparkles class="w-3.5 h-3.5" />
                            老师总评
                          </div>
                          <div class="text-sm text-pottery-700">{report.teacherFeedback}</div>
                        </div>
                      </Show>

                      <div class="flex gap-2 pt-2">
                        <button
                          onClick={() => props.onDownloadReport(report, 'txt')}
                          class="flex-1 btn-secondary flex items-center justify-center gap-1.5 text-sm py-2"
                        >
                          <Download class="w-4 h-4" />
                          下载 TXT
                        </button>
                        <button
                          onClick={() => props.onDownloadReport(report, 'json')}
                          class="flex-1 btn-secondary flex items-center justify-center gap-1.5 text-sm py-2"
                        >
                          <Download class="w-4 h-4" />
                          下载 JSON
                        </button>
                        <button
                          onClick={() => handleShare(report)}
                          class="flex-1 btn-primary flex items-center justify-center gap-1.5 text-sm py-2"
                        >
                          <Share2 class="w-4 h-4" />
                          分享
                        </button>
                      </div>

                      <Show when={report.shareUrl}>
                        <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div class="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                            <Share2 class="w-3.5 h-3.5" />
                            分享链接
                          </div>
                          <div class="flex items-center gap-2">
                            <div class="flex-1 px-3 py-2 bg-white rounded-lg border border-blue-200 text-xs text-pottery-700 truncate font-mono">
                              {report.shareUrl}
                            </div>
                            <button
                              onClick={() => handleCopyShareUrl(report.shareUrl!)}
                              class={`p-2 rounded-lg transition-colors ${
                                copied()
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {copied() ? <Check class="w-4 h-4" /> : <Copy class="w-4 h-4" />}
                            </button>
                          </div>
                          {copied() && (
                            <div class="text-[10px] text-green-600 mt-1 text-center">已复制到剪贴板！</div>
                          )}
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
