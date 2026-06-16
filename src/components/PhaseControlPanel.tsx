import { Component, Show, For } from 'solid-js';
import type { TrainingPhase, PhaseDefinition, PhaseState } from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { ChevronLeft, ChevronRight, Lightbulb, AlertCircle, Target, CheckCircle2 } from 'lucide-solid';

interface PhaseControlPanelProps {
  phaseState: PhaseState;
  currentPhaseDefinition: PhaseDefinition;
  onPrevPhase: () => void;
  onNextPhase: () => void;
  onTogglePhasedMode: (enabled?: boolean) => void;
  onReset: () => void;
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string; icon: string }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', icon: '🔵' },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', icon: '🟢' },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', icon: '🟠' },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', icon: '🟣' },
};

export const PhaseControlPanel: Component<PhaseControlPanelProps> = (props) => {
  const phaseOrder: TrainingPhase[] = ['base_forming', 'opening', 'pulling_up', 'necking'];
  const currentIndex = phaseOrder.indexOf(props.phaseState.currentPhase);
  const colors = phaseColors[props.phaseState.currentPhase];

  const getPhaseStatusIcon = (phaseId: TrainingPhase) => {
    if (props.phaseState.phaseProgress[phaseId]) {
      return <CheckCircle2 class="w-4 h-4 text-celadon-500" />;
    }
    if (phaseId === props.phaseState.currentPhase) {
      return <span class="w-2 h-2 rounded-full bg-current animate-pulse" />;
    }
    return <span class="w-2 h-2 rounded-full bg-pottery-300" />;
  };

  return (
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Target class="w-5 h-5 text-pottery-500" />
          <h3 class="font-medium text-pottery-800">分阶段训练模式</h3>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={props.phaseState.isPhasedMode}
            onChange={(e) => props.onTogglePhasedMode(e.target.checked)}
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-pottery-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pottery-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pottery-600"></div>
        </label>
      </div>

      <Show when={props.phaseState.isPhasedMode}>
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <For each={phaseOrder}>
              {(phaseId, index) => {
                const phase = TRAINING_PHASES.find(p => p.id === phaseId)!;
                const isActive = phaseId === props.phaseState.currentPhase;
                const isCompleted = props.phaseState.phaseProgress[phaseId];
                return (
                  <>
                    <div
                      class={`flex-1 flex items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? `${phaseColors[phaseId].bg} ${phaseColors[phaseId].border} border-2 ${phaseColors[phaseId].text}`
                          : isCompleted
                          ? 'bg-celadon-50 border border-celadon-300 text-celadon-700'
                          : 'bg-pottery-50 border border-pottery-200 text-pottery-400'
                      }`}
                    >
                      <div class="flex items-center gap-1">
                        {getPhaseStatusIcon(phaseId)}
                        <span>{phase.name}</span>
                      </div>
                    </div>
                    <Show when={index() < phaseOrder.length - 1}>
                      <div class={`w-3 h-0.5 ${
                        props.phaseState.phaseProgress[phaseId]
                          ? 'bg-celadon-400'
                          : 'bg-pottery-200'
                      }`} />
                    </Show>
                  </>
                );
              }}
            </For>
          </div>

          <div class={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{colors.icon}</span>
                <div>
                  <h4 class={`font-bold text-lg ${colors.text}`}>
                    阶段 {currentIndex + 1}/4：{props.currentPhaseDefinition.name}
                  </h4>
                  <p class={`text-sm ${colors.text} opacity-80`}>
                    {props.currentPhaseDefinition.description}
                  </p>
                </div>
              </div>
              <div class="flex gap-1">
                <button
                  onClick={props.onPrevPhase}
                  disabled={currentIndex === 0}
                  class="p-2 rounded-lg bg-white/60 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="上一阶段"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                  onClick={props.onNextPhase}
                  disabled={currentIndex === phaseOrder.length - 1}
                  class="p-2 rounded-lg bg-white/60 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="下一阶段"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div class="flex items-center gap-1 mb-2">
                  <Lightbulb class="w-4 h-4 text-amber-500" />
                  <span class="text-sm font-medium text-pottery-700">技巧提示</span>
                </div>
                <ul class="space-y-1">
                  <For each={props.currentPhaseDefinition.tips}>
                    {(tip) => (
                      <li class="text-sm text-pottery-600 flex items-start gap-2">
                        <span class="text-amber-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    )}
                  </For>
                </ul>
              </div>

              <div>
                <div class="flex items-center gap-1 mb-2">
                  <AlertCircle class="w-4 h-4 text-cinnabar-500" />
                  <span class="text-sm font-medium text-pottery-700">常见错误</span>
                </div>
                <ul class="space-y-1">
                  <For each={props.currentPhaseDefinition.commonMistakes}>
                    {(mistake) => (
                      <li class="text-sm text-pottery-600 flex items-start gap-2">
                        <span class="text-cinnabar-500 mt-0.5">⚠</span>
                        <span>{mistake}</span>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-white/50">
              <div class="flex items-center justify-between text-sm">
                <span class="text-pottery-600">
                  高度范围：{Math.round(props.currentPhaseDefinition.startHeight * 100)}% - {Math.round(props.currentPhaseDefinition.endHeight * 100)}%
                </span>
                <span class={`font-medium ${colors.text}`}>
                  请在此范围内绘制手势
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              onClick={props.onReset}
              class="flex-1 btn-secondary text-sm"
            >
              重置阶段进度
            </button>
          </div>
        </div>
      </Show>

      <Show when={!props.phaseState.isPhasedMode}>
        <div class="text-center py-6 text-pottery-500">
          <Target class="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p class="text-sm">开启分阶段训练模式</p>
          <p class="text-xs mt-1">系统将引导您按四个阶段逐步练习</p>
        </div>
      </Show>
    </div>
  );
};
