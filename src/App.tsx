import { Component, createSignal, createMemo, createEffect, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Vessel, EvaluationResult, ContourPoint, Point, PhasedEvaluationResult, PracticeRecord } from '@/types/pottery';
import { MIN_POINTS_FOR_CONTOUR } from '@/types/pottery';
import { VesselSelector } from './components/VesselSelector';
import { PotteryCanvas } from './components/PotteryCanvas';
import { EvaluationPanel } from './components/EvaluationPanel';
import { PhasedEvaluationPanel } from './components/PhasedEvaluationPanel';
import { PhaseControlPanel } from './components/PhaseControlPanel';
import { PracticeHistoryPanel } from './components/PracticeHistoryPanel';
import { PlaybackControls } from './components/PlaybackControls';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useGestureTracking } from './hooks/useGestureTracking';
import { useContourGenerator } from './hooks/useContourGenerator';
import { useEvaluation } from './hooks/useEvaluation';
import { usePlayback } from './hooks/usePlayback';
import { usePhasedTraining } from './hooks/usePhasedTraining';
import { Layers, RotateCcw, Trash2, PlayCircle, Sparkles, Info, Target, BarChart3, History } from 'lucide-solid';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;

interface Store {
  selectedVessel: Vessel | null;
  generatedContour: ContourPoint[] | null;
  evaluationResult: EvaluationResult | null;
  phasedEvaluationResult: PhasedEvaluationResult | null;
  showClearConfirm: boolean;
  showVesselChangeConfirm: boolean;
  pendingVessel: Vessel | null;
  activeTab: 'evaluation' | 'phased' | 'history';
}

const App: Component = () => {
  let canvasElement: SVGSVGElement | null = null;
  const canvasRef = { get current() { return canvasElement; } };

  const [store, setStore] = createStore<Store>({
    selectedVessel: null,
    generatedContour: null,
    evaluationResult: null,
    phasedEvaluationResult: null,
    showClearConfirm: false,
    showVesselChangeConfirm: false,
    pendingVessel: null,
    activeTab: 'evaluation',
  });

  const [playbackPoints, setPlaybackPoints] = createSignal<Point[]>([]);
  const [playbackRecord, setPlaybackRecord] = createSignal<PracticeRecord | null>(null);

  const phasedTraining = usePhasedTraining();

  const canDraw = () => !!store.selectedVessel && !playbackPoints().length && !playbackRecord();

  const {
    points: gesturePoints,
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearPoints,
  } = useGestureTracking(canvasRef, CANVAS_WIDTH, CANVAS_HEIGHT, canDraw);

  const { canGenerate, generateContour } = useContourGenerator();
  const { evaluate } = useEvaluation();

  const handlePlaybackPoint = (_point: Point, index: number) => {
    const sourcePoints = playbackRecord()?.gesturePoints || gesturePoints();
    setPlaybackPoints(sourcePoints.slice(0, index + 1));
  };

  const playback = usePlayback(
    () => playbackRecord()?.gesturePoints || gesturePoints(),
    handlePlaybackPoint
  );

  const targetContour = createMemo(() => store.selectedVessel?.targetContour || []);

  const heatmapData = createMemo(() => {
    if (!store.generatedContour || !store.selectedVessel) return [];
    return phasedTraining.getHeatmapData(store.generatedContour, store.selectedVessel.targetContour);
  });

  const comparisonContour = createMemo(() => {
    if (!phasedTraining.showComparison() || !phasedTraining.selectedComparisonRecord()) return null;
    return phasedTraining.selectedComparisonRecord()!.contour;
  });

  createEffect(() => {
    if (!phasedTraining.phaseState.isPhasedMode || !store.selectedVessel) {
      phasedTraining.setRealTimeFeedback(null);
      return;
    }

    const currentPoints = playbackRecord() ? playbackRecord()!.gesturePoints : gesturePoints();
    if (currentPoints.length < 10) {
      phasedTraining.setRealTimeFeedback(null);
      return;
    }

    const { generateContour: quickGenerate } = useContourGenerator();
    const quickContour = quickGenerate(currentPoints, CANVAS_WIDTH, CANVAS_HEIGHT);

    const feedback = phasedTraining.calculateRealTimeFeedback(
      currentPoints,
      quickContour,
      store.selectedVessel.targetContour,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    phasedTraining.setRealTimeFeedback(feedback);
  });

  const comparisonDiffData = createMemo(() => {
    if (!phasedTraining.showComparison() || !phasedTraining.selectedComparisonRecord() || !store.generatedContour) {
      return undefined;
    }
    const detail = phasedTraining.calculateComparisonDetail(
      { ...phasedTraining.practiceHistory()[0], contour: store.generatedContour } as any,
      phasedTraining.selectedComparisonRecord()!
    );
    return detail.contourDiffs;
  });

  const canGenerateContour = () => {
    if (!store.selectedVessel || playback.isPlaying()) return false;
    const points = playbackRecord() ? playbackRecord()!.gesturePoints : gesturePoints();
    return canGenerate(points);
  };

  const handleSelectVessel = (vessel: Vessel) => {
    if (gesturePoints().length > 0 || store.generatedContour) {
      setStore({
        pendingVessel: vessel,
        showVesselChangeConfirm: true,
      });
    } else {
      setStore({ selectedVessel: vessel });
    }
  };

  const confirmVesselChange = () => {
    if (store.pendingVessel) {
      setStore({
        selectedVessel: store.pendingVessel,
        generatedContour: null,
        evaluationResult: null,
        phasedEvaluationResult: null,
        showVesselChangeConfirm: false,
        pendingVessel: null,
      });
      clearPoints();
      playback.stop();
      setPlaybackPoints([]);
      setPlaybackRecord(null);
      phasedTraining.resetPhaseProgress();
    }
  };

  const handleGenerateContour = () => {
    if (!store.selectedVessel || !canGenerateContour()) return;

    const currentPoints = playbackRecord() ? playbackRecord()!.gesturePoints : gesturePoints();
    const contour = generateContour(currentPoints, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (contour) {
      const result = evaluate(contour, store.selectedVessel.targetContour);
      const phasedResult = phasedTraining.evaluateAllPhases(
        contour,
        store.selectedVessel.targetContour,
        store.selectedVessel,
        currentPoints
      );

      setStore({
        generatedContour: contour,
        evaluationResult: result,
        phasedEvaluationResult: phasedResult,
      });

      if (!playbackRecord() && phasedResult) {
        phasedTraining.savePracticeRecord(phasedResult.practiceRecord);
        setStore('activeTab', 'phased');
      }

      if (phasedTraining.phaseState.isPhasedMode && !playbackRecord()) {
        const phaseOrder = ['base_forming', 'opening', 'pulling_up', 'necking'] as const;
        const currentIndex = phaseOrder.indexOf(phasedTraining.phaseState.currentPhase);
        if (currentIndex < phaseOrder.length - 1) {
          phasedTraining.nextPhase();
        }
      }
    }
  };

  const handleClear = () => {
    setStore({ showClearConfirm: true });
  };

  const confirmClear = () => {
    setStore({
      generatedContour: null,
      evaluationResult: null,
      phasedEvaluationResult: null,
      showClearConfirm: false,
    });
    clearPoints();
    playback.stop();
    setPlaybackPoints([]);
    setPlaybackRecord(null);
    if (phasedTraining.phaseState.isPhasedMode) {
      phasedTraining.resetPhaseProgress();
    }
  };

  const handlePlaybackStart = () => {
    playback.play();
  };

  const handlePlaybackStop = () => {
    playback.stop();
    setPlaybackPoints([]);
    setPlaybackRecord(null);
  };

  const handlePlaybackReset = () => {
    playback.reset();
    setPlaybackPoints([]);
    setPlaybackRecord(null);
  };

  const handleSeek = (index: number) => {
    playback.goToIndex(index);
  };

  const handlePlayRecord = (record: PracticeRecord) => {
    setPlaybackRecord(record);
    setStore('generatedContour', record.contour);

    if (store.selectedVessel) {
      const result = evaluate(record.contour, store.selectedVessel.targetContour);
      const phasedResult = phasedTraining.evaluateAllPhases(
        record.contour,
        store.selectedVessel.targetContour,
        store.selectedVessel,
        record.gesturePoints
      );
      setStore({
        evaluationResult: result,
        phasedEvaluationResult: phasedResult,
      });
    }

    playback.stop();
    setPlaybackPoints([]);
  };

  const handleTogglePhasedMode = (enabled?: boolean) => {
    phasedTraining.togglePhasedMode(enabled);
    if (enabled) {
      setStore('activeTab', 'phased');
    }
  };

  return (
    <div class="min-h-screen bg-pottery-100">
      <header class="bg-white border-b border-pottery-200 shadow-sm">
        <div class="max-w-[1600px] mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-pottery-400 to-pottery-600 flex items-center justify-center shadow-md">
                <Layers class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-display text-pottery-800">陶艺拉坯手势练习</h1>
                <p class="text-sm text-pottery-500">数字化陶艺学习，精准提升拉坯技艺</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm text-pottery-600">
              <Info class="w-4 h-4" />
              <span>选择器型 → 绘制手势 → 生成轮廓 → 查看评估</span>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-[1600px] mx-auto px-4 py-6">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-3">
            <div class="sticky top-6 space-y-4">
              <VesselSelector
                selectedVessel={store.selectedVessel}
                onSelect={handleSelectVessel}
              />
              <PhaseControlPanel
                phaseState={phasedTraining.phaseState}
                currentPhaseDefinition={phasedTraining.currentPhaseDefinition()}
                onPrevPhase={phasedTraining.prevPhase}
                onNextPhase={phasedTraining.nextPhase}
                onTogglePhasedMode={handleTogglePhasedMode}
                onReset={phasedTraining.resetPhaseProgress}
              />
            </div>
          </div>

          <div class="col-span-5 space-y-4">
            <div class="card">
              <PotteryCanvas
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                gesturePoints={playbackRecord() ? playbackRecord()!.gesturePoints : gesturePoints()}
                targetVessel={store.selectedVessel}
                generatedContour={store.generatedContour}
                deviationSegments={store.evaluationResult?.deviationSegments || []}
                isDrawing={isDrawing()}
                enabled={canDraw()}
                canvasRef={(el) => { canvasElement = el; }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                playbackPoints={playbackPoints()}
                isPhasedMode={phasedTraining.phaseState.isPhasedMode}
                currentPhase={phasedTraining.phaseState.currentPhase}
                heatmapData={heatmapData()}
                comparisonContour={comparisonContour()}
                realTimeFeedback={phasedTraining.realTimeFeedback()}
                comparisonDiffData={comparisonDiffData()}
              />
            </div>

            <div class="card">
              <div class="flex items-center gap-3 mb-4">
                <Sparkles class="w-5 h-5 text-pottery-500" />
                <h3 class="font-medium text-pottery-800">操作控制</h3>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <button
                  onClick={handleGenerateContour}
                  disabled={!canGenerateContour()}
                  class="btn-primary flex items-center justify-center gap-2"
                >
                  <PlayCircle class="w-5 h-5" />
                  生成轮廓
                </button>
                <button
                  onClick={() => (playback.isPlaying() ? playback.pause() : handlePlaybackStart())}
                  disabled={!playback.canPlayback()}
                  class="btn-secondary flex items-center justify-center gap-2"
                >
                  {playback.isPlaying() ? '暂停回放' : '开始回放'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={gesturePoints().length === 0 && !store.generatedContour && !playbackRecord()}
                  class="btn-danger flex items-center justify-center gap-2"
                >
                  <Trash2 class="w-5 h-5" />
                  清空轨迹
                </button>
              </div>
              <div class="mt-4">
                <PlaybackControls
                  isPlaying={playback.isPlaying()}
                  currentIndex={playback.currentIndex()}
                  totalPoints={(playbackRecord()?.gesturePoints.length || gesturePoints().length)}
                  playbackSpeed={playback.playbackSpeed()}
                  availableSpeeds={playback.getAvailableSpeeds()}
                  canPlayback={playback.canPlayback()}
                  onPlay={handlePlaybackStart}
                  onPause={playback.pause}
                  onStop={handlePlaybackStop}
                  onReset={handlePlaybackReset}
                  onSpeedChange={playback.setSpeed}
                  onSeek={handleSeek}
                />
              </div>
              <div class="mt-4 p-3 bg-pottery-50 rounded-lg border border-pottery-200">
                <div class="flex items-center gap-2 text-sm text-pottery-600">
                  <RotateCcw class="w-4 h-4" />
                  <span>轨迹点数量：</span>
                  <span class={`font-semibold ${
                    (playbackRecord()?.gesturePoints.length || gesturePoints().length) >= MIN_POINTS_FOR_CONTOUR
                      ? 'text-celadon-600'
                      : 'text-cinnabar-600'
                  }`}>
                    {playbackRecord()?.gesturePoints.length || gesturePoints().length}
                  </span>
                  <span> / {MIN_POINTS_FOR_CONTOUR}</span>
                  {(playbackRecord()?.gesturePoints.length || gesturePoints().length) < MIN_POINTS_FOR_CONTOUR && (
                    <span class="text-cinnabar-500 text-xs ml-2">
                      (还需 {MIN_POINTS_FOR_CONTOUR - (playbackRecord()?.gesturePoints.length || gesturePoints().length)} 个点)
                    </span>
                  )}
                </div>
                <Show when={playbackRecord()}>
                  <div class="mt-2 text-xs text-blue-600 flex items-center gap-1">
                    <History class="w-3 h-3" />
                    正在回放历史记录：{playbackRecord()!.vesselName}
                  </div>
                </Show>
              </div>
            </div>
          </div>

          <div class="col-span-4">
            <div class="sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
              <div class="flex gap-1 mb-4 p-1 bg-pottery-100 rounded-lg">
                <button
                  onClick={() => setStore('activeTab', 'evaluation')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    store.activeTab === 'evaluation'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <BarChart3 class="w-4 h-4" />
                  综合评估
                </button>
                <button
                  onClick={() => setStore('activeTab', 'phased')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    store.activeTab === 'phased'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <Target class="w-4 h-4" />
                  分阶段评估
                </button>
                <button
                  onClick={() => setStore('activeTab', 'history')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    store.activeTab === 'history'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <History class="w-4 h-4" />
                  练习历史
                </button>
              </div>

              <Show when={store.activeTab === 'evaluation'}>
                <EvaluationPanel
                  evaluationResult={store.evaluationResult}
                  targetContour={targetContour()}
                />
              </Show>

              <Show when={store.activeTab === 'phased'}>
                <PhasedEvaluationPanel
                  evaluationResult={store.phasedEvaluationResult}
                  targetContour={targetContour()}
                />
              </Show>

              <Show when={store.activeTab === 'history'}>
                <PracticeHistoryPanel
                  practiceHistory={phasedTraining.practiceHistory()}
                  selectedComparisonRecord={phasedTraining.selectedComparisonRecord()}
                  showComparison={phasedTraining.showComparison()}
                  onSelectComparison={phasedTraining.setSelectedComparisonRecord}
                  onToggleComparison={() => phasedTraining.setShowComparison(!phasedTraining.showComparison())}
                  onPlayRecord={handlePlayRecord}
                  onClearHistory={phasedTraining.clearPracticeHistory}
                />
              </Show>
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={store.showClearConfirm}
        onClose={() => setStore({ showClearConfirm: false })}
        onConfirm={confirmClear}
        title="确认清空轨迹"
        message="清空后将丢失当前绘制的轨迹和生成的轮廓，此操作不可撤销。确定要继续吗？"
        confirmText="确认清空"
        type="danger"
      />

      <ConfirmDialog
        isOpen={store.showVesselChangeConfirm}
        onClose={() => setStore({ showVesselChangeConfirm: false, pendingVessel: null })}
        onConfirm={confirmVesselChange}
        title="更换目标器型"
        message="更换器型将清空当前绘制的轨迹和评估结果，确定要继续吗？"
        confirmText="确认更换"
        type="warning"
      />
    </div>
  );
};

export default App;
