import { Component, Show, For, createSignal } from 'solid-js';
import type {
  StudentGroup,
  ClassStatistics,
  GroupingStrategy,
  Vessel,
  TrainingPhase,
} from '@/types/pottery';
import {
  Users, Plus, Trash2, ClipboardList, Save, X, Calendar,
  BarChart3, Download, Filter, Group, MessageSquare, Clock,
  ChevronDown, ChevronRight, GraduationCap, AlertTriangle,
  CheckCircle2,
} from 'lucide-solid';

interface ClassAssignmentPanelProps {
  classHook: ReturnType<typeof import('@/hooks/useClassAssignment').useClassAssignment>;
  vessels: Vessel[];
  currentUser: { id: string; name: string };
  onExportStatistics: (stats: ClassStatistics, format: 'json' | 'txt') => void;
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string; dot: string }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-500' },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500' },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500' },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-500' },
};

export const ClassAssignmentPanel: Component<ClassAssignmentPanelProps> = (props) => {
  const h = props.classHook;

  const [expandedAssignment, setExpandedAssignment] = createSignal<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = createSignal<string | null>(null);
  const [showGroupingPanel, setShowGroupingPanel] = createSignal(false);
  const [showStatsPanel, setShowStatsPanel] = createSignal(false);

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

  const isOverdue = (deadline: number) => Date.now() > deadline;

  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCreateClass = () => {
    if (!h.newClassName().trim()) return;
    h.createClass(props.currentUser.id, props.currentUser.name);
  };

  const handleCreateAssignment = () => {
    const cls = h.selectedClass();
    if (!cls || !h.newAssignmentTitle().trim() || !h.newAssignmentVesselId()) return;
    const vessel = props.vessels.find(v => v.id === h.newAssignmentVesselId());
    if (!vessel) return;
    h.createAssignment(cls, vessel);
  };

  const handleGroupStudents = () => {
    const asgnId = h.selectedAssignment()?.id;
    if (!asgnId) return;
    h.groupStudents(asgnId, h.groupingStrategy());
    setShowGroupingPanel(true);
  };

  const handleBatchFeedback = (group: StudentGroup) => {
    const asgnId = h.selectedAssignment()?.id;
    if (!asgnId || !h.batchCommentText().trim()) return;
    h.addBatchFeedback(
      group.id,
      asgnId,
      props.currentUser.id,
      props.currentUser.name,
      h.batchCommentText().trim(),
      group.studentIds
    );
    h.setBatchCommentText('');
  };

  const handleGenerateStats = () => {
    const clsId = h.selectedClass()?.id;
    const asgnId = h.selectedAssignment()?.id;
    if (!clsId || !asgnId) return;
    h.generateClassStatistics(clsId, asgnId);
    setShowStatsPanel(true);
  };

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
        <GraduationCap class="w-5 h-5" />
        班级作业管理
      </h3>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Users class="w-4 h-4 text-pottery-500" />
            <h4 class="font-medium text-pottery-800">班级列表</h4>
          </div>
          <button
            onClick={() => h.setShowCreateClass(!h.showCreateClass())}
            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            新建班级
          </button>
        </div>

        <Show when={h.showCreateClass()}>
          <div class="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3 space-y-3">
            <div>
              <label class="text-xs text-pottery-600 block mb-1">班级名称 *</label>
              <input
                type="text"
                value={h.newClassName()}
                onInput={(e) => h.setNewClassName(e.target.value)}
                placeholder="如：2024春季陶艺初级班"
                class="input-field text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-pottery-600 block mb-1">班级描述</label>
              <input
                type="text"
                value={h.newClassDescription()}
                onInput={(e) => h.setNewClassDescription(e.target.value)}
                placeholder="简要描述班级信息..."
                class="input-field text-sm"
              />
            </div>
            <div>
              <label class="text-xs text-pottery-600 block mb-1">学员名单 (逗号或换行分隔) *</label>
              <textarea
                value={h.newClassStudentNames()}
                onInput={(e) => h.setNewClassStudentNames(e.target.value)}
                placeholder="张三，李四，王五"
                rows={2}
                class="input-field text-sm resize-none"
              />
            </div>
            <div class="flex justify-end gap-2">
              <button
                onClick={() => h.setShowCreateClass(false)}
                class="btn-secondary text-xs py-1.5 px-3"
              >
                取消
              </button>
              <button
                onClick={handleCreateClass}
                disabled={!h.newClassName().trim() || !h.newClassStudentNames().trim()}
                class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Save class="w-3.5 h-3.5" />
                创建班级
              </button>
            </div>
          </div>
        </Show>

        <Show when={h.classes().length === 0}>
          <div class="text-center py-8 text-pottery-500 text-sm">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-pottery-100 flex items-center justify-center">
              <Users class="w-6 h-6" />
            </div>
            暂无班级
            <div class="text-xs mt-1">创建您的第一个班级开始布置作业</div>
          </div>
        </Show>

        <Show when={h.classes().length > 0}>
          <div class="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            <For each={h.classes()}>
              {(cls) => {
                const isSelected = h.selectedClass()?.id === cls.id;
                const assignmentCount = h.assignments().filter(a => a.classId === cls.id).length;
                return (
                  <div
                    class={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-pottery-200 bg-white hover:border-pottery-300'
                    }`}
                    onClick={() => h.setSelectedClass(isSelected ? null : cls)}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-pottery-800 text-sm truncate">{cls.name}</div>
                        <div class="text-xs text-pottery-500 mt-0.5">
                          {cls.studentIds.length} 名学员 · {assignmentCount} 份作业
                        </div>
                        <div class="text-xs text-pottery-400 mt-0.5">
                          {new Date(cls.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          h.deleteClass(cls.id);
                        }}
                        class="p-1.5 rounded-lg hover:bg-cinnabar-50 text-pottery-400 hover:text-cinnabar-600 transition-colors"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>

      <Show when={h.selectedClass()}>
        <div class="card border-blue-200 bg-blue-50/50">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <ClipboardList class="w-4 h-4 text-blue-600" />
              <h4 class="font-medium text-blue-800">作业列表 - {h.selectedClass()!.name}</h4>
            </div>
            <button
              onClick={() => h.setShowCreateAssignment(!h.showCreateAssignment())}
              class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              布置作业
            </button>
          </div>

          <Show when={h.showCreateAssignment()}>
            <div class="p-3 bg-white rounded-lg border border-blue-200 mb-3 space-y-3">
              <div>
                <label class="text-xs text-pottery-600 block mb-1">作业标题 *</label>
                <input
                  type="text"
                  value={h.newAssignmentTitle()}
                  onInput={(e) => h.setNewAssignmentTitle(e.target.value)}
                  placeholder="如：碗型基础练习"
                  class="input-field text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-pottery-600 block mb-1">作业说明</label>
                <textarea
                  value={h.newAssignmentDescription()}
                  onInput={(e) => h.setNewAssignmentDescription(e.target.value)}
                  placeholder="描述作业要求与注意事项..."
                  rows={2}
                  class="input-field text-sm resize-none"
                />
              </div>
              <div>
                <label class="text-xs text-pottery-600 block mb-1">指定器型 *</label>
                <select
                  value={h.newAssignmentVesselId()}
                  onChange={(e) => {
                    const vid = (e.target as HTMLSelectElement).value;
                    h.setNewAssignmentVesselId(vid);
                    const v = props.vessels.find(vv => vv.id === vid);
                    h.setNewAssignmentVesselName(v?.name || '');
                  }}
                  class="input-field text-sm"
                >
                  <option value="">请选择器型</option>
                  <For each={props.vessels}>
                    {(vessel) => (
                      <option value={vessel.id}>
                        {vessel.name} ({vessel.difficulty === 'easy' ? '初级' : vessel.difficulty === 'medium' ? '中级' : '高级'})
                      </option>
                    )}
                  </For>
                </select>
              </div>
              <div>
                <label class="text-xs text-pottery-600 block mb-1">截止时间</label>
                <input
                  type="datetime-local"
                  value={h.newAssignmentDeadline()}
                  onInput={(e) => h.setNewAssignmentDeadline(e.target.value)}
                  class="input-field text-sm"
                />
              </div>
              <div class="flex justify-end gap-2">
                <button
                  onClick={() => h.setShowCreateAssignment(false)}
                  class="btn-secondary text-xs py-1.5 px-3"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateAssignment}
                  disabled={!h.newAssignmentTitle().trim() || !h.newAssignmentVesselId()}
                  class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Save class="w-3.5 h-3.5" />
                  发布作业
                </button>
              </div>
            </div>
          </Show>

          <Show when={h.classAssignments().length === 0}>
            <div class="text-center py-6 text-pottery-500 text-sm">
              暂无作业，点击上方按钮布置
            </div>
          </Show>

          <div class="space-y-2">
            <For each={h.classAssignments()}>
              {(assignment) => {
                const isExpanded = expandedAssignment() === assignment.id;
                const isSelected = h.selectedAssignment()?.id === assignment.id;
                const subs = h.getSubmissionsForAssignment(assignment.id);
                const pending = h.getPendingStudents(assignment);
                const overdue = isOverdue(assignment.deadline);

                return (
                  <div class={`rounded-lg border-2 transition-all duration-200 ${
                    isSelected ? 'border-blue-400 bg-white' : 'border-pottery-200 bg-white'
                  }`}>
                    <div
                      class="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => {
                        setExpandedAssignment(isExpanded ? null : assignment.id);
                        h.setSelectedAssignment(isSelected ? null : assignment);
                      }}
                    >
                      <button class="mt-0.5 p-1 rounded hover:bg-pottery-100 text-pottery-500">
                        {isExpanded ? <ChevronDown class="w-4 h-4" /> : <ChevronRight class="w-4 h-4" />}
                      </button>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                          <span class="font-medium text-pottery-800 text-sm">{assignment.title}</span>
                          <span class={`text-[10px] px-1.5 py-0.5 rounded ${
                            assignment.isActive
                              ? overdue
                                ? 'bg-cinnabar-100 text-cinnabar-700'
                                : 'bg-green-100 text-green-700'
                              : 'bg-pottery-100 text-pottery-500'
                          }`}>
                            {assignment.isActive
                              ? overdue ? '已截止' : '进行中'
                              : '已结束'}
                          </span>
                          <span class="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {assignment.vesselName}
                          </span>
                        </div>
                        <div class="flex items-center gap-3 text-[11px] text-pottery-500">
                          <span class="flex items-center gap-1">
                            <Calendar class="w-3 h-3" />
                            截止: {formatDate(assignment.deadline)}
                          </span>
                          <span class="flex items-center gap-1">
                            <CheckCircle2 class="w-3 h-3 text-green-500" />
                            {subs.length}/{subs.length + pending.length} 已提交
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          h.deleteAssignment(assignment.id);
                        }}
                        class="p-1.5 rounded-lg hover:bg-cinnabar-50 text-pottery-400 hover:text-cinnabar-600"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Show when={isExpanded}>
                      <div class="px-3 pb-3 pt-1 border-t border-pottery-100 space-y-3">
                        <Show when={assignment.description}>
                          <div class="text-xs text-pottery-600 p-2 bg-pottery-50 rounded">
                            {assignment.description}
                          </div>
                        </Show>

                        <div class="flex items-center gap-2 flex-wrap">
                          <div class="flex items-center gap-1.5">
                            <Filter class="w-3.5 h-3.5 text-pottery-500" />
                            <select
                              value={h.submissionFilter()}
                              onChange={(e) => h.setSubmissionFilter(
                                (e.target as HTMLSelectElement).value as 'all' | 'pending' | 'low_score' | 'submitted'
                              )}
                              class="text-xs border border-pottery-300 rounded-lg px-2 py-1.5 bg-white"
                            >
                              <option value="all">全部</option>
                              <option value="submitted">已提交</option>
                              <option value="low_score">低分 (&lt;60)</option>
                            </select>
                          </div>
                          <button
                            onClick={handleGroupStudents}
                            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Group class="w-3.5 h-3.5" />
                            自动分组
                          </button>
                          <button
                            onClick={handleGenerateStats}
                            class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <BarChart3 class="w-3.5 h-3.5" />
                            统计报告
                          </button>
                        </div>

                        <Show when={pending.length > 0}>
                          <div class="p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <div class="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                              <Clock class="w-3.5 h-3.5" />
                              未提交学员 ({pending.length})
                            </div>
                            <div class="flex gap-1 flex-wrap">
                              <For each={pending}>
                                {(studentId) => {
                                  const cls = h.selectedClass();
                                  const name = cls?.studentNames[studentId] || studentId;
                                  return (
                                    <span class="text-[10px] px-2 py-1 bg-white rounded border border-amber-200 text-amber-700">
                                      {name}
                                    </span>
                                  );
                                }}
                              </For>
                            </div>
                          </div>
                        </Show>

                        <Show when={h.getFilteredSubmissions(assignment.id).length > 0}>
                          <div>
                            <div class="text-xs font-medium text-pottery-600 mb-2">
                              提交记录 ({h.getFilteredSubmissions(assignment.id).length})
                            </div>
                            <div class="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                              <For each={h.getFilteredSubmissions(assignment.id)}>
                                {(sub) => {
                                  const isSubExpanded = expandedSubmission() === sub.id;
                                  return (
                                    <div class="p-2 bg-white rounded-lg border border-pottery-200">
                                      <div
                                        class="flex items-center gap-2 cursor-pointer"
                                        onClick={() => setExpandedSubmission(isSubExpanded ? null : sub.id)}
                                      >
                                        <button class="p-0.5 rounded hover:bg-pottery-100 text-pottery-500">
                                          {isSubExpanded ? <ChevronDown class="w-3.5 h-3.5" /> : <ChevronRight class="w-3.5 h-3.5" />}
                                        </button>
                                        <div class={`w-2 h-2 rounded-full ${getScoreBg(sub.totalScore)}`} />
                                        <span class="text-sm font-medium text-pottery-800">{sub.studentName}</span>
                                        <span class={`text-sm font-bold ${getScoreColor(sub.totalScore)}`}>
                                          {sub.totalScore.toFixed(1)}
                                        </span>
                                        <span class={`text-[10px] px-1.5 py-0.5 rounded ${
                                          sub.status === 'graded'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {sub.status === 'graded' ? '已评' : '待评'}
                                        </span>
                                        <span class="text-[10px] text-pottery-400 ml-auto">
                                          {formatDate(sub.submittedAt)}
                                        </span>
                                      </div>
                                      <Show when={isSubExpanded}>
                                        <div class="mt-2 pt-2 border-t border-pottery-100 space-y-2">
                                          <div class="grid grid-cols-4 gap-1.5">
                                            <For each={sub.phaseEvaluations}>
                                              {(pe) => {
                                                const colors = phaseColors[pe.phaseId];
                                                return (
                                                  <div class={`p-1.5 rounded border ${colors.bg} ${colors.border} text-center`}>
                                                    <div class={`text-[9px] ${colors.text} font-medium`}>{pe.phaseName}</div>
                                                    <div class={`text-sm font-bold ${getScoreColor(pe.score)}`}>
                                                      {pe.score.toFixed(0)}
                                                    </div>
                                                  </div>
                                                );
                                              }}
                                            </For>
                                          </div>
                                          <Show when={sub.keyDeviationPoints.length > 0}>
                                            <div class="flex gap-1 flex-wrap">
                                              <For each={sub.keyDeviationPoints.slice(0, 3)}>
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
                                          </Show>
                                          <Show when={sub.teacherFeedback}>
                                            <div class="p-2 bg-amber-50 rounded border border-amber-200">
                                              <div class="text-[10px] text-amber-600 mb-0.5">老师评语</div>
                                              <div class="text-xs text-pottery-700">{sub.teacherFeedback}</div>
                                            </div>
                                          </Show>
                                        </div>
                                      </Show>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </div>
                        </Show>

                        <Show when={h.getFilteredSubmissions(assignment.id).length === 0 && subs.length === 0}>
                          <div class="text-center py-6 text-pottery-500 text-sm">
                            暂无学员提交
                          </div>
                        </Show>

                        <Show when={showGroupingPanel() && h.studentGroups().length > 0}>
                          <div class="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 space-y-3">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <Group class="w-4 h-4 text-blue-600" />
                                <span class="font-medium text-sm text-blue-800">自动分组结果</span>
                              </div>
                              <div class="flex items-center gap-2">
                                <select
                                  value={h.groupingStrategy()}
                                  onChange={(e) => {
                                    h.setGroupingStrategy(
                                      (e.target as HTMLSelectElement).value as GroupingStrategy
                                    );
                                  }}
                                  class="text-xs border border-blue-300 rounded-lg px-2 py-1 bg-white"
                                >
                                  <option value="total_score">按总分分组</option>
                                  <option value="phase_weakness">按阶段短板分组</option>
                                  <option value="deviation_type">按偏差类型分组</option>
                                </select>
                                <button
                                  onClick={handleGroupStudents}
                                  class="text-xs btn-secondary py-1 px-2"
                                >
                                  重新分组
                                </button>
                                <button
                                  onClick={() => setShowGroupingPanel(false)}
                                  class="p-1 rounded hover:bg-white/60 text-blue-500"
                                >
                                  <X class="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div class="space-y-2">
                              <For each={h.studentGroups()}>
                                {(group, idx) => {
                                  const isSelected = h.selectedGroup()?.id === group.id;
                                  return (
                                    <div
                                      class={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        isSelected ? 'ring-2 ring-blue-300' : ''
                                      } ${group.color}`}
                                      onClick={() => h.setSelectedGroup(isSelected ? null : group)}
                                    >
                                      <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                          <div class={`w-3 h-3 rounded-full ${props.classHook.GROUP_DOT_COLORS[idx() % props.classHook.GROUP_DOT_COLORS.length]}`} />
                                          <span class="font-medium text-sm">{group.name}</span>
                                        </div>
                                        <span class="text-xs">{group.studentIds.length} 人</span>
                                      </div>
                                      <div class="flex gap-1 flex-wrap mb-2">
                                        <For each={group.studentIds}>
                                          {(sid) => {
                                            const cls = h.selectedClass();
                                            const name = cls?.studentNames[sid] || sid;
                                            return (
                                              <span class="text-[10px] px-1.5 py-0.5 bg-white/60 rounded">
                                                {name}
                                              </span>
                                            );
                                          }}
                                        </For>
                                      </div>
                                      <Show when={isSelected}>
                                        <div class="mt-2 pt-2 border-t border-white/40">
                                          <textarea
                                            value={h.batchCommentText()}
                                            onInput={(e) => h.setBatchCommentText(e.target.value)}
                                            placeholder="输入批量评语，将应用于本组所有学员..."
                                            rows={2}
                                            class="w-full p-2 text-sm rounded-lg border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
                                          />
                                          <div class="flex justify-end mt-2">
                                            <button
                                              onClick={() => handleBatchFeedback(group)}
                                              disabled={!h.batchCommentText().trim()}
                                              class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                                            >
                                              <MessageSquare class="w-3.5 h-3.5" />
                                              批量添加评语
                                            </button>
                                          </div>
                                        </div>
                                      </Show>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </div>
                        </Show>

                        <Show when={showStatsPanel() && h.classStatistics().length > 0}>
                          <div class="p-3 bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg border border-amber-200 space-y-3">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <BarChart3 class="w-4 h-4 text-amber-600" />
                                <span class="font-medium text-sm text-amber-800">班级训练统计</span>
                              </div>
                              <button
                                onClick={() => setShowStatsPanel(false)}
                                class="p-1 rounded hover:bg-white/60 text-amber-500"
                              >
                                <X class="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <For each={h.classStatistics().filter(
                              s => s.classId === h.selectedClass()?.id
                            ).slice(0, 1)}>
                              {(stats) => (
                                <div class="space-y-3">
                                  <div class="grid grid-cols-3 gap-2">
                                    <div class="p-2 bg-white rounded-lg text-center">
                                      <div class="text-[10px] text-pottery-500">提交率</div>
                                      <div class="text-lg font-bold text-blue-600">
                                        {stats.totalStudents > 0
                                          ? Math.round(stats.submittedCount / stats.totalStudents * 100)
                                          : 0}%
                                      </div>
                                    </div>
                                    <div class="p-2 bg-white rounded-lg text-center">
                                      <div class="text-[10px] text-pottery-500">平均分</div>
                                      <div class={`text-lg font-bold ${getScoreColor(stats.averageScore)}`}>
                                        {stats.averageScore.toFixed(1)}
                                      </div>
                                    </div>
                                    <div class="p-2 bg-white rounded-lg text-center">
                                      <div class="text-[10px] text-pottery-500">最高/最低</div>
                                      <div class="text-sm font-bold text-pottery-700">
                                        {stats.maxScore.toFixed(0)}/{stats.minScore.toFixed(0)}
                                      </div>
                                    </div>
                                  </div>

                                  <div class="p-2 bg-white rounded-lg">
                                    <div class="text-xs font-medium text-pottery-600 mb-1.5">分数段分布</div>
                                    <div class="space-y-1">
                                      <For each={stats.scoreDistribution}>
                                        {(d) => {
                                          const maxCount = Math.max(...stats.scoreDistribution.map(x => x.count), 1);
                                          const pct = (d.count / maxCount) * 100;
                                          return (
                                            <div class="flex items-center gap-2">
                                              <span class="text-[10px] text-pottery-500 w-12 text-right">{d.range}</span>
                                              <div class="flex-1 bg-pottery-100 rounded-full h-3 overflow-hidden">
                                                <div
                                                  class="h-full bg-blue-500 rounded-full transition-all"
                                                  style={{ width: `${pct}%` }}
                                                />
                                              </div>
                                              <span class="text-[10px] text-pottery-600 w-6">{d.count}</span>
                                            </div>
                                          );
                                        }}
                                      </For>
                                    </div>
                                  </div>

                                  <div class="p-2 bg-white rounded-lg">
                                    <div class="text-xs font-medium text-pottery-600 mb-1.5">各阶段平均分</div>
                                    <div class="grid grid-cols-2 gap-1.5">
                                      <For each={stats.phaseAverages}>
                                        {(pa) => {
                                          const colors = phaseColors[pa.phaseId];
                                          return (
                                            <div class={`p-1.5 rounded border ${colors.bg} ${colors.border} flex items-center justify-between`}>
                                              <span class={`text-[10px] ${colors.text} font-medium`}>{pa.phaseName}</span>
                                              <span class={`text-xs font-bold ${getScoreColor(pa.avgScore)}`}>
                                                {pa.avgScore.toFixed(1)}
                                              </span>
                                            </div>
                                          );
                                        }}
                                      </For>
                                    </div>
                                  </div>

                                  <Show when={stats.commonWeaknesses.length > 0}>
                                    <div class="p-2 bg-white rounded-lg">
                                      <div class="text-xs font-medium text-pottery-600 mb-1.5 flex items-center gap-1">
                                        <AlertTriangle class="w-3 h-3 text-amber-500" />
                                        常见薄弱阶段
                                      </div>
                                      <For each={stats.commonWeaknesses.slice(0, 3)}>
                                        {(w) => {
                                          const colors = phaseColors[w.phaseId];
                                          return (
                                            <div class="flex items-center gap-2 text-xs">
                                              <span class={`px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                                {w.phaseName}
                                              </span>
                                              <span class="text-pottery-500">{w.count} 人</span>
                                            </div>
                                          );
                                        }}
                                      </For>
                                    </div>
                                  </Show>

                                  <Show when={stats.commonDeviationTypes.length > 0}>
                                    <div class="p-2 bg-white rounded-lg">
                                      <div class="text-xs font-medium text-pottery-600 mb-1.5">常见偏差类型</div>
                                      <For each={stats.commonDeviationTypes}>
                                        {(d) => (
                                          <div class="flex items-center gap-2 text-xs">
                                            <span class={`px-1.5 py-0.5 rounded ${
                                              d.type === '偏宽'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                              {d.type}
                                            </span>
                                            <span class="text-pottery-500">{d.count} 次</span>
                                          </div>
                                        )}
                                      </For>
                                    </div>
                                  </Show>

                                  <div class="flex gap-2">
                                    <button
                                      onClick={() => props.onExportStatistics(stats, 'txt')}
                                      class="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
                                    >
                                      <Download class="w-3.5 h-3.5" />
                                      导出 TXT
                                    </button>
                                    <button
                                      onClick={() => props.onExportStatistics(stats, 'json')}
                                      class="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
                                    >
                                      <Download class="w-3.5 h-3.5" />
                                      导出 JSON
                                    </button>
                                  </div>
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    </Show>
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
