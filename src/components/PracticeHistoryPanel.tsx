import { Component, Show, For, createMemo } from 'solid-js';
import type { PracticeRecord, TrainingPhase } from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { History, TrendingUp, TrendingDown, Minus, Play, X, GitCompare, Clock, Award, Trash2, Activity, Layers } from 'lucide-solid';

interface PracticeHistoryPanelProps {
  practiceHistory: PracticeRecord[];
  selectedComparisonRecord: PracticeRecord | null;
  showComparison: boolean;
  onSelectComparison: (record: PracticeRecord | null) => void;
  onToggleComparison: () => void;
  onPlayRecord: (record: PracticeRecord) => void;
  onClearHistory: () => void;
}

const phaseColors: Record<TrainingPhase, string> = {
  base_forming: 'bg-blue-500',
  opening: 'bg-green-500',
  pulling_up: 'bg-amber-500',
  necking: 'bg-purple-500',
};

export const PracticeHistoryPanel: Component<PracticeHistoryPanelProps> = (props) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-celadon-600';
    if (score >= 70) return 'text-pottery-600';
    return 'text-cinnabar-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-celadon-50 border-celadon-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-cinnabar-50 border-cinnabar-200';
  };

  const comparisonResult = createMemo(() => {
    if (!props.showComparison || !props.selectedComparisonRecord || props.practiceHistory.length < 2) {
      return null;
    }

    const latestRecord = props.practiceHistory[0];
    if (!latestRecord) return null;

    const record1 = latestRecord;
    const record2 = props.selectedComparisonRecord;

    const overallDiff = record1.totalScore - record2.totalScore;

    const phaseDiffs = record1.evaluation.phaseEvaluations.map(eval1 => {
      const eval2 = record2.evaluation.phaseEvaluations.find(e => e.phaseId === eval1.phaseId);
      const diff = eval2 ? eval1.score - eval2.score : 0;
      return {
        phaseId: eval1.phaseId,
        phaseName: eval1.phaseName,
        diff: Math.round(diff * 10) / 10,
        improved: diff > 0,
        score1: eval1.score,
        score2: eval2?.score || 0,
      };
    });

    const improvedPhases = phaseDiffs.filter(p => p.diff > 0).map(p => p.phaseId);
    const regressedPhases = phaseDiffs.filter(p => p.diff < 0).map(p => p.phaseId);

    const contourDiffs: { height: number; radiusDiff: number; type: 'wider' | 'narrower' }[] = [];
    const maxLen = Math.min(record1.contour.length, record2.contour.length);
    for (let i = 0; i < maxLen; i++) {
      const radiusDiff = record1.contour[i].radius - record2.contour[i].radius;
      if (Math.abs(radiusDiff) > 0.02) {
        contourDiffs.push({
          height: record1.contour[i].height,
          radiusDiff,
          type: radiusDiff > 0 ? 'wider' : 'narrower',
        });
      }
    }

    const widerCount = contourDiffs.filter(d => d.type === 'wider').length;
    const narrowerCount = contourDiffs.filter(d => d.type === 'narrower').length;
    const avgDiff = contourDiffs.length > 0
      ? Math.round(contourDiffs.reduce((s, d) => s + Math.abs(d.radiusDiff), 0) / contourDiffs.length * 1000) / 1000
      : 0;
    const maxDiff = contourDiffs.length > 0
      ? Math.round(Math.max(...contourDiffs.map(d => Math.abs(d.radiusDiff))) * 1000) / 1000
      : 0;

    const calcAvgSpeed = (points: { x: number; y: number; timestamp: number }[]): number => {
      if (points.length < 2) return 0;
      let totalDist = 0;
      let totalTime = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
        totalTime += Math.max(1, points[i].timestamp - points[i - 1].timestamp);
      }
      return totalTime > 0 ? Math.round(totalDist / totalTime * 100) / 100 : 0;
    };

    const speed1 = calcAvgSpeed(record1.gesturePoints);
    const speed2 = calcAvgSpeed(record2.gesturePoints);
    const speedDiff = speed1 - speed2;

    const duration1 = record1.gesturePoints.length >= 2
      ? record1.gesturePoints[record1.gesturePoints.length - 1].timestamp - record1.gesturePoints[0].timestamp
      : 0;
    const duration2 = record2.gesturePoints.length >= 2
      ? record2.gesturePoints[record2.gesturePoints.length - 1].timestamp - record2.gesturePoints[0].timestamp
      : 0;

    return {
      record1,
      record2,
      overallDiff: Math.round(overallDiff * 10) / 10,
      phaseDiffs,
      improvedPhases,
      regressedPhases,
      contourStats: { widerCount, narrowerCount, avgDiff, maxDiff },
      gestureStats: { speed1, speed2, speedDiff, duration1, duration2 },
    };
  });

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
          <History class="w-5 h-5" />
          练习历史
        </h3>
        <div class="flex items-center gap-2">
          <Show when={props.practiceHistory.length >= 2}>
            <button
              onClick={props.onToggleComparison}
              class={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                props.showComparison
                  ? 'bg-blue-500 text-white'
                  : 'bg-pottery-100 text-pottery-700 hover:bg-pottery-200'
              }`}
            >
              <GitCompare class="w-4 h-4" />
              {props.showComparison ? '退出对比' : '对比模式'}
            </button>
          </Show>
          <Show when={props.practiceHistory.length > 0}>
            <button
              onClick={props.onClearHistory}
              class="p-1.5 rounded-lg text-pottery-400 hover:text-cinnabar-500 hover:bg-cinnabar-50 transition-colors"
              title="清空历史"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </Show>
        </div>
      </div>

      <Show when={props.showComparison && comparisonResult()}>
        <div class="card border-blue-300 bg-blue-50">
          <h4 class="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
            <GitCompare class="w-4 h-4" />
            练习对比分析
          </h4>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class={`p-3 rounded-lg border ${getScoreBg(comparisonResult()!.record1.totalScore)}`}>
              <div class="text-xs text-pottery-500 mb-1">当前练习</div>
              <div class={`text-2xl font-bold ${getScoreColor(comparisonResult()!.record1.totalScore)}`}>
                {comparisonResult()!.record1.totalScore.toFixed(1)}
              </div>
              <div class="text-xs text-pottery-500 mt-1">
                {formatDate(comparisonResult()!.record1.timestamp)}
              </div>
            </div>
            <div class={`p-3 rounded-lg border ${getScoreBg(comparisonResult()!.record2.totalScore)}`}>
              <div class="text-xs text-pottery-500 mb-1">对比练习</div>
              <div class={`text-2xl font-bold ${getScoreColor(comparisonResult()!.record2.totalScore)}`}>
                {comparisonResult()!.record2.totalScore.toFixed(1)}
              </div>
              <div class="text-xs text-pottery-500 mt-1">
                {formatDate(comparisonResult()!.record2.timestamp)}
              </div>
            </div>
          </div>

          <div class={`text-center py-2 mb-4 rounded-lg ${
            comparisonResult()!.overallDiff > 0
              ? 'bg-celadon-100 text-celadon-700'
              : comparisonResult()!.overallDiff < 0
              ? 'bg-cinnabar-100 text-cinnabar-700'
              : 'bg-pottery-100 text-pottery-700'
          }`}>
            <div class="flex items-center justify-center gap-2 text-lg font-bold">
              <Show when={comparisonResult()!.overallDiff > 0}>
                <TrendingUp class="w-5 h-5" />
                <span>进步 +{comparisonResult()!.overallDiff.toFixed(1)} 分</span>
              </Show>
              <Show when={comparisonResult()!.overallDiff < 0}>
                <TrendingDown class="w-5 h-5" />
                <span>退步 {comparisonResult()!.overallDiff.toFixed(1)} 分</span>
              </Show>
              <Show when={comparisonResult()!.overallDiff === 0}>
                <Minus class="w-5 h-5" />
                <span>持平 ±0.0 分</span>
              </Show>
            </div>
          </div>

          <div class="space-y-2">
            <For each={comparisonResult()!.phaseDiffs}>
              {(phaseDiff) => {
                const phase = TRAINING_PHASES.find(p => p.id === phaseDiff.phaseId)!;
                return (
                  <div class="flex items-center justify-between bg-white rounded-lg p-2 border border-blue-200">
                    <div class="flex items-center gap-2">
                      <div class={`w-2 h-2 rounded-full ${phaseColors[phase.id]}`} />
                      <span class="text-sm text-pottery-700">{phase.name}</span>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                      <span class="text-pottery-500">{phaseDiff.score2.toFixed(0)}</span>
                      <span class="text-pottery-400">→</span>
                      <span class="font-medium text-pottery-800">{phaseDiff.score1.toFixed(0)}</span>
                      <span class={`flex items-center gap-0.5 font-medium ${
                        phaseDiff.diff > 0
                          ? 'text-celadon-600'
                          : phaseDiff.diff < 0
                          ? 'text-cinnabar-600'
                          : 'text-pottery-500'
                      }`}>
                        <Show when={phaseDiff.diff > 0}>
                          <TrendingUp class="w-3 h-3" />
                          +{phaseDiff.diff.toFixed(1)}
                        </Show>
                        <Show when={phaseDiff.diff < 0}>
                          <TrendingDown class="w-3 h-3" />
                          {phaseDiff.diff.toFixed(1)}
                        </Show>
                        <Show when={phaseDiff.diff === 0}>
                          ±0.0
                        </Show>
                      </span>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          <Show when={comparisonResult()!.improvedPhases.length > 0 || comparisonResult()!.regressedPhases.length > 0}>
            <div class="mt-4 pt-4 border-t border-blue-200">
              <Show when={comparisonResult()!.improvedPhases.length > 0}>
                <div class="mb-2">
                  <span class="text-xs text-celadon-600 font-medium">✓ 进步阶段：</span>
                  <span class="text-xs text-pottery-600 ml-1">
                    {comparisonResult()!.improvedPhases.map(id => TRAINING_PHASES.find(p => p.id === id)!.name).join('、')}
                  </span>
                </div>
              </Show>
              <Show when={comparisonResult()!.regressedPhases.length > 0}>
                <div>
                  <span class="text-xs text-cinnabar-600 font-medium">⚠ 需加强：</span>
                  <span class="text-xs text-pottery-600 ml-1">
                    {comparisonResult()!.regressedPhases.map(id => TRAINING_PHASES.find(p => p.id === id)!.name).join('、')}
                  </span>
                </div>
              </Show>
            </div>
          </Show>

          <div class="mt-4 pt-4 border-t border-blue-200">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-white rounded-lg border border-blue-200">
                <div class="flex items-center gap-1.5 mb-2">
                  <Layers class="w-4 h-4 text-blue-500" />
                  <span class="text-xs font-medium text-blue-700">轮廓差异分析</span>
                </div>
                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-pottery-500">更宽的区域</span>
                    <span class={`font-medium ${comparisonResult()!.contourStats.widerCount > comparisonResult()!.contourStats.narrowerCount ? 'text-green-600' : 'text-pottery-700'}`}>
                      {comparisonResult()!.contourStats.widerCount} 处
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-pottery-500">更窄的区域</span>
                    <span class={`font-medium ${comparisonResult()!.contourStats.narrowerCount > comparisonResult()!.contourStats.widerCount ? 'text-blue-600' : 'text-pottery-700'}`}>
                      {comparisonResult()!.contourStats.narrowerCount} 处
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-pottery-500">平均偏差</span>
                    <span class="font-medium text-pottery-700">
                      {(comparisonResult()!.contourStats.avgDiff * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-pottery-500">最大偏差</span>
                    <span class="font-medium text-cinnabar-600">
                      {(comparisonResult()!.contourStats.maxDiff * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div class="p-3 bg-white rounded-lg border border-blue-200">
                <div class="flex items-center gap-1.5 mb-2">
                  <Activity class="w-4 h-4 text-blue-500" />
                  <span class="text-xs font-medium text-blue-700">手势差异分析</span>
                </div>
                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-pottery-500">绘制速度</span>
                    <span class={`font-medium flex items-center gap-1 ${
                      comparisonResult()!.gestureStats.speedDiff > 0 ? 'text-amber-600' :
                      comparisonResult()!.gestureStats.speedDiff < 0 ? 'text-blue-600' : 'text-pottery-700'
                    }`}>
                      {comparisonResult()!.gestureStats.speed1.toFixed(2)}
                      <span class="text-[10px]">
                        ({comparisonResult()!.gestureStats.speedDiff > 0 ? '+' : ''}{(comparisonResult()!.gestureStats.speedDiff).toFixed(2)})
                      </span>
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-pottery-500">对比速度</span>
                    <span class="font-medium text-pottery-700">
                      {comparisonResult()!.gestureStats.speed2.toFixed(2)}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-pottery-500">当前用时</span>
                    <span class="font-medium text-pottery-700">
                      {(comparisonResult()!.gestureStats.duration1 / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-pottery-500">对比用时</span>
                    <span class="font-medium text-pottery-700">
                      {(comparisonResult()!.gestureStats.duration2 / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-3 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
              💡 在画布中开启对比模式可直观查看两次轮廓的差异（绿色=当前更宽，蓝色=当前更窄）
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.showComparison && !comparisonResult()}>
        <div class="card text-center py-6 bg-blue-50 border-blue-200">
          <GitCompare class="w-10 h-10 mx-auto mb-2 text-blue-400" />
          <p class="text-sm text-blue-700 mb-1">请选择要对比的历史记录</p>
          <p class="text-xs text-blue-500">点击下方记录中的对比按钮进行选择</p>
        </div>
      </Show>

      <Show when={props.practiceHistory.length > 0}>
        <div class="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
          <For each={props.practiceHistory}>
            {(record, index) => {
              const isSelected = props.selectedComparisonRecord?.id === record.id;
              const isLatest = index() === 0;
              return (
                <div class={`card p-3 transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''
                }`}>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <Award class={`w-4 h-4 ${getScoreColor(record.totalScore)}`} />
                      <span class="font-medium text-pottery-800">{record.vesselName}</span>
                      <Show when={isLatest}>
                        <span class="text-xs bg-celadon-100 text-celadon-700 px-1.5 py-0.5 rounded">最新</span>
                      </Show>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class={`text-lg font-bold ${getScoreColor(record.totalScore)}`}>
                        {record.totalScore.toFixed(1)}
                      </span>
                      <span class="text-xs text-pottery-400">分</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1 mb-2">
                    <For each={record.evaluation.phaseEvaluations}>
                      {(phaseEval) => (
                        <div class="flex-1 text-center">
                          <div class={`h-1.5 rounded-full ${phaseColors[phaseEval.phaseId]} mb-1`}
                            style={`width: ${phaseEval.score}%`}
                          />
                          <div class="text-[10px] text-pottery-500">{phaseEval.phaseName}</div>
                        </div>
                      )}
                    </For>
                  </div>

                  <div class="flex items-center justify-between text-xs text-pottery-500">
                    <div class="flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {formatDate(record.timestamp)}
                    </div>
                    <div class="flex items-center gap-1">
                      <Show when={props.showComparison && !isLatest}>
                        <button
                          onClick={() => props.onSelectComparison(isSelected ? null : record)}
                          class={`p-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-blue-100 text-blue-600'
                          }`}
                          title={isSelected ? '取消选择' : '选择对比'}
                        >
                          {isSelected ? <X class="w-3 h-3" /> : <GitCompare class="w-3 h-3" />}
                        </button>
                      </Show>
                      <button
                        onClick={() => props.onPlayRecord(record)}
                        class="p-1 rounded hover:bg-pottery-100 text-pottery-600 transition-colors"
                        title="回放轨迹"
                      >
                        <Play class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={props.practiceHistory.length === 0}>
        <div class="card text-center py-8">
          <History class="w-12 h-12 mx-auto mb-2 text-pottery-300" />
          <p class="text-pottery-500 text-sm">暂无练习记录</p>
          <p class="text-pottery-400 text-xs mt-1">完成练习后记录将保存在这里</p>
        </div>
      </Show>
    </div>
  );
};
