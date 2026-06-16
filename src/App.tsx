import { Component, createSignal, createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Vessel, EvaluationResult, ContourPoint, Point } from '@/types/pottery';
import { MIN_POINTS_FOR_CONTOUR } from '@/types/pottery';
import { VesselSelector } from './components/VesselSelector';
import { PotteryCanvas } from './components/PotteryCanvas';
import { EvaluationPanel } from './components/EvaluationPanel';
import { PlaybackControls } from './components/PlaybackControls';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useGestureTracking } from './hooks/useGestureTracking';
import { useContourGenerator } from './hooks/useContourGenerator';
import { useEvaluation } from './hooks/useEvaluation';
import { usePlayback } from './hooks/usePlayback';
import { Layers, RotateCcw, Trash2, PlayCircle, Sparkles, Info } from 'lucide-solid';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;

interface Store {
  selectedVessel: Vessel | null;
  generatedContour: ContourPoint[] | null;
  evaluationResult: EvaluationResult | null;
  showClearConfirm: boolean;
  showVesselChangeConfirm: boolean;
  pendingVessel: Vessel | null;
}

const App: Component = () => {
  let canvasElement: SVGSVGElement | null = null;
  const canvasRef = { get current() { return canvasElement; } };

  const [store, setStore] = createStore<Store>({
    selectedVessel: null,
    generatedContour: null,
    evaluationResult: null,
    showClearConfirm: false,
    showVesselChangeConfirm: false,
    pendingVessel: null,
  });

  const [playbackPoints, setPlaybackPoints] = createSignal<Point[]>([]);

  const canDraw = () => !!store.selectedVessel && !playbackPoints().length;

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
    setPlaybackPoints(gesturePoints().slice(0, index + 1));
  };

  const playback = usePlayback(gesturePoints, handlePlaybackPoint);

  const targetContour = createMemo(() => store.selectedVessel?.targetContour || []);

  const canGenerateContour = () => {
    return store.selectedVessel && canGenerate(gesturePoints()) && !playback.isPlaying();
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
        showVesselChangeConfirm: false,
        pendingVessel: null,
      });
      clearPoints();
      playback.stop();
      setPlaybackPoints([]);
    }
  };

  const handleGenerateContour = () => {
    if (!store.selectedVessel || !canGenerateContour()) return;

    const contour = generateContour(gesturePoints(), CANVAS_WIDTH, CANVAS_HEIGHT);
    if (contour) {
      const result = evaluate(contour, store.selectedVessel.targetContour);
      setStore({
        generatedContour: contour,
        evaluationResult: result,
      });
    }
  };

  const handleClear = () => {
    setStore({ showClearConfirm: true });
  };

  const confirmClear = () => {
    setStore({
      generatedContour: null,
      evaluationResult: null,
      showClearConfirm: false,
    });
    clearPoints();
    playback.stop();
    setPlaybackPoints([]);
  };

  const handlePlaybackStart = () => {
    playback.play();
  };

  const handlePlaybackStop = () => {
    playback.stop();
    setPlaybackPoints([]);
  };

  const handlePlaybackReset = () => {
    playback.reset();
    setPlaybackPoints([]);
  };

  const handleSeek = (index: number) => {
    playback.goToIndex(index);
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
            <div class="sticky top-6">
              <VesselSelector
                selectedVessel={store.selectedVessel}
                onSelect={handleSelectVessel}
              />
            </div>
          </div>

          <div class="col-span-5 space-y-4">
            <div class="card">
              <PotteryCanvas
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                gesturePoints={gesturePoints()}
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
                  disabled={gesturePoints().length === 0 && !store.generatedContour}
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
                  totalPoints={gesturePoints().length}
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
                    gesturePoints().length >= MIN_POINTS_FOR_CONTOUR
                      ? 'text-celadon-600'
                      : 'text-cinnabar-600'
                  }`}>
                    {gesturePoints().length}
                  </span>
                  <span> / {MIN_POINTS_FOR_CONTOUR}</span>
                  {gesturePoints().length < MIN_POINTS_FOR_CONTOUR && (
                    <span class="text-cinnabar-500 text-xs ml-2">
                      (还需 {MIN_POINTS_FOR_CONTOUR - gesturePoints().length} 个点)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-4">
            <div class="sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
              <EvaluationPanel
                evaluationResult={store.evaluationResult}
                targetContour={targetContour()}
              />
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
