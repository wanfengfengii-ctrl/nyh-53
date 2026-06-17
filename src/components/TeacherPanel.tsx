import { Component, Show, For, createSignal } from 'solid-js';
import type { StandardTrajectory, TrainingPhase, Vessel } from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { BookOpen, Plus, Trash2, Edit3, MessageSquare, Save, X, Video, FileText } from 'lucide-solid';

interface TeacherPanelProps {
  selectedVessel: Vessel | null;
  standardTrajectories: StandardTrajectory[];
  selectedTrajectory: StandardTrajectory | null;
  onSelectTrajectory: (t: StandardTrajectory | null) => void;
  onSaveTrajectory: (name: string, description: string) => void;
  onDeleteTrajectory: (id: string) => void;
  canSave: boolean;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  recordName: string;
  setRecordName: (v: string) => void;
  recordDescription: string;
  setRecordDescription: (v: string) => void;
  editingPhaseComment: TrainingPhase | null;
  setEditingPhaseComment: (p: TrainingPhase | null) => void;
  onAddPhaseComment: (phaseId: TrainingPhase, content: string) => void;
  onDeletePhaseComment: (id: string) => void;
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700' },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
};

export const TeacherPanel: Component<TeacherPanelProps> = (props) => {
  const [phaseCommentText, setPhaseCommentText] = createSignal('');

  const vesselTrajectories = () =>
    props.standardTrajectories.filter(t => !props.selectedVessel || t.vesselId === props.selectedVessel!.id);

  const submitPhaseComment = (phaseId: TrainingPhase) => {
    if (phaseCommentText().trim()) {
      props.onAddPhaseComment(phaseId, phaseCommentText().trim());
      setPhaseCommentText('');
    }
  };

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
        <BookOpen class="w-5 h-5" />
        老师工作台
      </h3>

      <div class="card border-blue-200 bg-blue-50/50">
        <div class="flex items-center gap-2 mb-3">
          <Video class="w-4 h-4 text-blue-600" />
          <h4 class="font-medium text-blue-800">录制标准轨迹</h4>
        </div>
        <Show when={!props.selectedVessel}>
          <div class="text-sm text-pottery-500 p-3 bg-white rounded-lg">
            请先从左侧选择目标器型
          </div>
        </Show>
        <Show when={props.selectedVessel}>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-pottery-600 block mb-1">轨迹名称 *</label>
              <input
                type="text"
                value={props.recordName}
                onInput={(e) => props.setRecordName(e.target.value)}
                placeholder="如：标准茶碗拉坯示范"
                class="input-field text-sm"
                disabled={!props.canSave}
              />
            </div>
            <div>
              <label class="text-xs text-pottery-600 block mb-1">描述说明</label>
              <textarea
                value={props.recordDescription}
                onInput={(e) => props.setRecordDescription(e.target.value)}
                placeholder="描述此轨迹的要点和注意事项..."
                rows={2}
                class="input-field text-sm resize-none"
                disabled={!props.canSave}
              />
            </div>
            <div class="text-xs text-pottery-500 p-2 bg-white/60 rounded">
              <div>目标器型：<span class="font-medium text-pottery-700">{props.selectedVessel!.name}</span></div>
              <div>操作：在画布上绘制手势轨迹 → 生成轮廓 → 保存为标准轨迹</div>
            </div>
            <button
              onClick={() => props.onSaveTrajectory(props.recordName, props.recordDescription)}
              disabled={!props.canSave || !props.recordName.trim()}
              class="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Save class="w-4 h-4" />
              保存为标准轨迹
            </button>
          </div>
        </Show>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-pottery-500" />
            <h4 class="font-medium text-pottery-800">标准轨迹库</h4>
          </div>
          <span class="text-xs text-pottery-500">{vesselTrajectories().length} 条</span>
        </div>
        <Show when={vesselTrajectories().length === 0}>
          <div class="text-center py-8 text-pottery-500 text-sm">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-pottery-100 flex items-center justify-center">
              <Plus class="w-6 h-6" />
            </div>
            暂无标准轨迹
            <div class="text-xs mt-1">录制并保存您的第一条轨迹</div>
          </div>
        </Show>
        <Show when={vesselTrajectories().length > 0}>
          <div class="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            <For each={vesselTrajectories()}>
              {(trajectory) => {
                const isSelected = props.selectedTrajectory?.id === trajectory.id;
                return (
                  <div
                    class={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-pottery-200 bg-white hover:border-pottery-300'
                    }`}
                    onClick={() => props.onSelectTrajectory(isSelected ? null : trajectory)}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-pottery-800 text-sm truncate">{trajectory.name}</div>
                        <div class="text-xs text-pottery-500 mt-0.5">
                          {trajectory.vesselName} · {trajectory.teacherName}
                        </div>
                        <div class="text-xs text-pottery-400 mt-0.5">
                          {new Date(trajectory.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div class="flex gap-1 mt-1.5 flex-wrap">
                          <span class="text-[10px] px-1.5 py-0.5 bg-pottery-100 text-pottery-600 rounded">
                            {trajectory.gesturePoints.length} 点
                          </span>
                          <span class="text-[10px] px-1.5 py-0.5 bg-pottery-100 text-pottery-600 rounded">
                            {trajectory.phaseComments.length} 点评
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onDeleteTrajectory(trajectory.id);
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

      <Show when={props.selectedTrajectory}>
        <div class="card">
          <div class="flex items-center gap-2 mb-3">
            <MessageSquare class="w-4 h-4 text-pottery-500" />
            <h4 class="font-medium text-pottery-800">分阶段点评</h4>
          </div>
          <div class="text-xs text-pottery-500 mb-3 p-2 bg-pottery-50 rounded">
            当前轨迹：<span class="font-medium text-pottery-700">{props.selectedTrajectory!.name}</span>
          </div>
          <div class="space-y-2">
            <For each={TRAINING_PHASES}>
              {(phase) => {
                const colors = phaseColors[phase.id];
                const existingComment = props.selectedTrajectory!.phaseComments.find(c => c.phaseId === phase.id);
                const isEditing = props.editingPhaseComment === phase.id;
                return (
                  <div class={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div class="flex items-center justify-between mb-2">
                      <span class={`font-medium text-sm ${colors.text}`}>{phase.name}</span>
                      <Show when={!isEditing}>
                        <button
                          onClick={() => {
                            props.setEditingPhaseComment(phase.id);
                            setPhaseCommentText(existingComment?.content || '');
                          }}
                          class="p-1 rounded hover:bg-white/60 text-pottery-500"
                        >
                          {existingComment ? <Edit3 class="w-3.5 h-3.5" /> : <Plus class="w-3.5 h-3.5" />}
                        </button>
                      </Show>
                      <Show when={isEditing}>
                        <button
                          onClick={() => {
                            props.setEditingPhaseComment(null);
                            setPhaseCommentText('');
                          }}
                          class="p-1 rounded hover:bg-white/60 text-pottery-500"
                        >
                          <X class="w-3.5 h-3.5" />
                        </button>
                      </Show>
                    </div>
                    <Show when={!isEditing && !existingComment}>
                      <div class="text-xs text-pottery-400 italic">暂无点评</div>
                    </Show>
                    <Show when={!isEditing && existingComment}>
                      <div class="text-sm text-pottery-700 leading-relaxed">{existingComment!.content}</div>
                      <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/60">
                        <div class="text-[10px] text-pottery-500">
                          {existingComment!.teacherName} · {new Date(existingComment!.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                        <button
                          onClick={() => props.onDeletePhaseComment(existingComment!.id)}
                          class="text-[10px] text-cinnabar-500 hover:text-cinnabar-700"
                        >
                          删除
                        </button>
                      </div>
                    </Show>
                    <Show when={isEditing}>
                      <textarea
                        value={phaseCommentText()}
                        onInput={(e) => setPhaseCommentText(e.target.value)}
                        placeholder={`输入${phase.name}阶段的点评内容...`}
                        rows={3}
                        class="w-full p-2 text-sm rounded-lg border border-pottery-300 focus:outline-none focus:ring-2 focus:ring-pottery-400 bg-white resize-none"
                      />
                      <div class="flex justify-end mt-2">
                        <button
                          onClick={() => submitPhaseComment(phase.id)}
                          disabled={!phaseCommentText().trim()}
                          class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <Save class="w-3 h-3" />
                          保存点评
                        </button>
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
