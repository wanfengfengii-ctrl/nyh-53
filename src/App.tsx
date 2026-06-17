import { Component, createSignal, createMemo, createEffect, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Vessel, EvaluationResult, ContourPoint, Point, PhasedEvaluationResult, PracticeRecord, PhaseEvaluation, KeyDeviationPoint, ClassStatistics } from '@/types/pottery';
import { MIN_POINTS_FOR_CONTOUR } from '@/types/pottery';
import { VesselSelector } from './components/VesselSelector';
import { PotteryCanvas } from './components/PotteryCanvas';
import { EvaluationPanel } from './components/EvaluationPanel';
import { PhasedEvaluationPanel } from './components/PhasedEvaluationPanel';
import { PhaseControlPanel } from './components/PhaseControlPanel';
import { PracticeHistoryPanel } from './components/PracticeHistoryPanel';
import { PlaybackControls } from './components/PlaybackControls';
import { ConfirmDialog } from './components/ConfirmDialog';
import { RoleSwitcher } from './components/RoleSwitcher';
import { TeacherPanel } from './components/TeacherPanel';
import { StudentPanel } from './components/StudentPanel';
import { ReportPanel } from './components/ReportPanel';
import { DualComparisonCanvas } from './components/DualComparisonCanvas';
import { TimelineCommentPlayback } from './components/TimelineCommentPlayback';
import { ClassAssignmentPanel } from './components/ClassAssignmentPanel';
import { StudentAssignmentPanel } from './components/StudentAssignmentPanel';
import { useGestureTracking } from './hooks/useGestureTracking';
import { useContourGenerator } from './hooks/useContourGenerator';
import { useEvaluation } from './hooks/useEvaluation';
import { usePlayback } from './hooks/usePlayback';
import { usePhasedTraining } from './hooks/usePhasedTraining';
import { useSparring } from './hooks/useSparring';
import { useClassAssignment } from './hooks/useClassAssignment';
import { vessels } from './data/vessels';
import { Layers, RotateCcw, Trash2, PlayCircle, Sparkles, Info, Target, BarChart3, History, FileText, Users, GitCompare, ClipboardList } from 'lucide-solid';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const DUAL_CANVAS_WIDTH = 700;

interface Store {
  selectedVessel: Vessel | null;
  generatedContour: ContourPoint[] | null;
  evaluationResult: EvaluationResult | null;
  phasedEvaluationResult: PhasedEvaluationResult | null;
  showClearConfirm: boolean;
  showVesselChangeConfirm: boolean;
  pendingVessel: Vessel | null;
  activeTab: 'evaluation' | 'phased' | 'history' | 'sparring' | 'reports' | 'homework';
  showDualComparison: boolean;
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
    showDualComparison: false,
  });

  const [playbackPoints, setPlaybackPoints] = createSignal<Point[]>([]);
  const [playbackRecord, setPlaybackRecord] = createSignal<PracticeRecord | null>(null);

  const phasedTraining = usePhasedTraining();
  const sparring = useSparring();
  const classAssignment = useClassAssignment();

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

  const [standardPlaybackPoints, setStandardPlaybackPoints] = createSignal<Point[]>([]);

  const handleStandardPlaybackPoint = (_point: Point, index: number) => {
    const std = sparring.selectedStandardTrajectory();
    if (std) {
      setStandardPlaybackPoints(std.gesturePoints.slice(0, index + 1));
    }
  };

  const standardPlayback = usePlayback(
    () => sparring.selectedStandardTrajectory()?.gesturePoints || [],
    handleStandardPlaybackPoint
  );

  createEffect(() => {
    if (sparring.selectedStandardTrajectory()) {
      standardPlayback.reset();
      setStandardPlaybackPoints([]);
    }
  });

  const targetContour = createMemo(() => store.selectedVessel?.targetContour || []);

  const heatmapData = createMemo(() => {
    if (!store.generatedContour || !store.selectedVessel) return [];
    return phasedTraining.getHeatmapData(store.generatedContour, store.selectedVessel.targetContour);
  });

  const comparisonContour = createMemo(() => {
    if (sparring.selectedStandardTrajectory()) {
      return sparring.selectedStandardTrajectory()!.contour;
    }
    if (!phasedTraining.showComparison() || !phasedTraining.selectedComparisonRecord()) return null;
    return phasedTraining.selectedComparisonRecord()!.contour;
  });

  const studentKeyDeviationPoints = createMemo(() => {
    if (!store.generatedContour || !sparring.selectedStandardTrajectory()) return [];
    return sparring.findKeyDeviationPoints(
      store.generatedContour,
      sparring.selectedStandardTrajectory()!.contour
    );
  });

  const studentDiffData = createMemo(() => {
    if (!sparring.selectedStandardTrajectory() || !store.generatedContour) {
      return undefined;
    }
    const detail = sparring.matchCommentsToDeviations(
      studentKeyDeviationPoints(),
      sparring.selectedStandardTrajectory()!.phaseComments,
      sparring.selectedStandardTrajectory()!.timelineComments
    );
    return detail.map(d => ({
      height: d.height,
      radiusDiff: d.radiusDiff,
      type: d.type,
    }));
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

  const canGenerateContour = () => {
    if (!store.selectedVessel || playback.isPlaying()) return false;
    const points = playbackRecord() ? playbackRecord()!.gesturePoints : gesturePoints();
    return canGenerate(points);
  };

  const canSaveStandard = (): boolean => {
    return sparring.currentUser().role === 'teacher'
      && !!store.selectedVessel
      && !!store.generatedContour
      && gesturePoints().length >= MIN_POINTS_FOR_CONTOUR;
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
      sparring.setSelectedStandardTrajectory(null);
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

      if (!playbackRecord() && phasedResult && sparring.currentUser().role === 'student') {
        phasedTraining.savePracticeRecord(phasedResult.practiceRecord);
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

  const handleSaveStandardTrajectory = (name: string, description: string) => {
    if (!store.selectedVessel || !store.generatedContour) return;
    sparring.saveStandardTrajectory(
      name,
      description,
      store.selectedVessel,
      gesturePoints(),
      store.generatedContour
    );
    sparring.setTeacherRecordName('');
    sparring.setTeacherRecordDescription('');
  };

  const handleGenerateReport = () => {
    if (!store.phasedEvaluationResult || !store.selectedVessel) return;
    sparring.generatePracticeReport(
      sparring.currentUser(),
      store.phasedEvaluationResult.practiceRecord,
      store.phasedEvaluationResult.phaseEvaluations,
      sparring.selectedStandardTrajectory() || undefined
    );
    setStore('activeTab', 'reports');
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

  const handleSwitchRole = (role: 'teacher' | 'student') => {
    sparring.switchRole(role);
    setStore('activeTab', role === 'teacher' ? 'sparring' : 'sparring');
  };

  const handleSubmitAssignment = (
    assignmentId: string,
    practiceRecord: PracticeRecord,
    phaseEvaluations: PhaseEvaluation[],
    keyDeviationPoints: KeyDeviationPoint[],
    totalScore: number
  ) => {
    classAssignment.submitAssignment(
      assignmentId,
      sparring.currentUser().id,
      sparring.currentUser().name,
      practiceRecord,
      phaseEvaluations,
      keyDeviationPoints,
      totalScore
    );
  };

  const handleExportStatistics = (stats: ClassStatistics, format: 'json' | 'txt') => {
    classAssignment.downloadStatistics(stats, format);
  };

  const showTimelineComments = () => sparring.currentUser().role === 'teacher' && sparring.selectedStandardTrajectory();

  return (
    <div class="min-h-screen bg-pottery-100">
      <header class="bg-white border-b border-pottery-200 shadow-sm">
        <div class="max-w-[1800px] mx-auto px-4 py-4">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-pottery-400 to-pottery-600 flex items-center justify-center shadow-md">
                <Layers class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-2xl font-display text-pottery-800">陶艺拉坯对练点评系统</h1>
                <p class="text-sm text-pottery-500">多用户对练 · 标准轨迹 · 精准点评 · 练习报告 · 班级作业</p>
              </div>
            </div>
            <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-2 text-sm text-pottery-600">
                <Info class="w-4 h-4" />
                <span>选择器型 → 绘制手势 → 生成轮廓 → 查看评估</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-[1800px] mx-auto px-4 py-6">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-2">
            <div class="sticky top-6 space-y-4">
              <RoleSwitcher
                currentRole={sparring.currentUser().role}
                currentName={sparring.currentUser().name}
                onSwitch={handleSwitchRole}
              />
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

          <div class="col-span-6 space-y-4">
            <Show when={!store.showDualComparison}>
              <div class="card">
                <PotteryCanvas
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  gesturePoints={
                    showTimelineComments()
                      ? sparring.selectedStandardTrajectory()!.gesturePoints
                      : playbackRecord()
                        ? playbackRecord()!.gesturePoints
                        : gesturePoints()
                  }
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
                  playbackPoints={showTimelineComments() ? standardPlaybackPoints() : playbackPoints()}
                  isPhasedMode={phasedTraining.phaseState.isPhasedMode}
                  currentPhase={phasedTraining.phaseState.currentPhase}
                  heatmapData={heatmapData()}
                  comparisonContour={comparisonContour()}
                  realTimeFeedback={phasedTraining.realTimeFeedback()}
                  comparisonDiffData={studentDiffData()}
                />
              </div>
            </Show>

            <Show when={store.showDualComparison && sparring.selectedStandardTrajectory()}>
              <div class="card">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-medium text-pottery-800 flex items-center gap-2">
                    <GitCompare class="w-5 h-5 text-pottery-500" />
                    轨迹同屏对比
                  </h3>
                  <button
                    onClick={() => setStore('showDualComparison', false)}
                    class="btn-secondary text-sm py-1.5 px-3"
                  >
                    返回单画布
                  </button>
                </div>
                <DualComparisonCanvas
                  width={DUAL_CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  studentPoints={playbackRecord() ? playbackRecord()!.gesturePoints : gesturePoints()}
                  studentContour={store.generatedContour}
                  standardTrajectory={sparring.selectedStandardTrajectory()}
                  targetVessel={store.selectedVessel}
                  playbackPoints={playbackPoints()}
                  comparisonDiffData={studentDiffData()}
                  showStandard={true}
                />
              </div>
            </Show>

            <div class="card">
              <div class="flex items-center gap-3 mb-4">
                <Sparkles class="w-5 h-5 text-pottery-500" />
                <h3 class="font-medium text-pottery-800">操作控制</h3>
              </div>
              <div class="grid grid-cols-4 gap-3">
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
                <Show when={sparring.selectedStandardTrajectory() && store.generatedContour && sparring.currentUser().role === 'student'}>
                  <button
                    onClick={() => setStore('showDualComparison', !store.showDualComparison)}
                    class="btn-secondary flex items-center justify-center gap-2"
                  >
                    <GitCompare class="w-4 h-4" />
                    {store.showDualComparison ? '单画布' : '对比视图'}
                  </button>
                </Show>
                <Show when={!sparring.selectedStandardTrajectory() || !store.generatedContour || sparring.currentUser().role !== 'student'}>
                  <div />
                </Show>
                <button
                  onClick={handleClear}
                  disabled={gesturePoints().length === 0 && !store.generatedContour && !playbackRecord()}
                  class="btn-danger flex items-center justify-center gap-2"
                >
                  <Trash2 class="w-5 h-5" />
                  清空轨迹
                </button>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-4">
                <Show when={!showTimelineComments()}>
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
                </Show>
                <Show when={showTimelineComments()}>
                  <TimelineCommentPlayback
                    points={sparring.selectedStandardTrajectory()!.gesturePoints}
                    isPlaying={standardPlayback.isPlaying()}
                    currentIndex={standardPlayback.currentIndex()}
                    playbackSpeed={standardPlayback.playbackSpeed()}
                    canPlayback={standardPlayback.canPlayback()}
                    onPlay={() => standardPlayback.play()}
                    onPause={() => standardPlayback.pause()}
                    onStop={() => {
                      standardPlayback.stop();
                      setStandardPlaybackPoints([]);
                    }}
                    onReset={() => {
                      standardPlayback.reset();
                      setStandardPlaybackPoints([]);
                    }}
                    onSpeedChange={(s) => standardPlayback.setSpeed(s)}
                    onSeek={(i) => standardPlayback.goToIndex(i)}
                    selectedTrajectory={sparring.selectedStandardTrajectory()}
                    editingTimelineComment={sparring.editingTimelineComment()}
                    setEditingTimelineComment={sparring.setEditingTimelineComment}
                    onAddTimelineComment={sparring.addTimelineComment}
                    onDeleteTimelineComment={sparring.deleteTimelineComment}
                  />
                </Show>
                <div class="p-4 bg-pottery-50 rounded-xl border border-pottery-200">
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
                  <Show when={sparring.selectedStandardTrajectory()}>
                    <div class="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <Target class="w-3 h-3" />
                      已选标准轨迹：{sparring.selectedStandardTrajectory()!.name}
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-4">
            <div class="sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
              <div class="flex gap-1 mb-4 p-1 bg-pottery-100 rounded-lg flex-wrap">
                <button
                  onClick={() => setStore('activeTab', 'evaluation')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                    store.activeTab === 'evaluation'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <BarChart3 class="w-3.5 h-3.5" />
                  综合评估
                </button>
                <button
                  onClick={() => setStore('activeTab', 'phased')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                    store.activeTab === 'phased'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <Target class="w-3.5 h-3.5" />
                  分阶段
                </button>
                <button
                  onClick={() => setStore('activeTab', 'sparring')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                    store.activeTab === 'sparring'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <Users class="w-3.5 h-3.5" />
                  对练点评
                </button>
                <button
                  onClick={() => setStore('activeTab', 'reports')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                    store.activeTab === 'reports'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <FileText class="w-3.5 h-3.5" />
                  练习报告
                </button>
                <button
                  onClick={() => setStore('activeTab', 'history')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                    store.activeTab === 'history'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <History class="w-3.5 h-3.5" />
                  历史
                </button>
                <button
                  onClick={() => setStore('activeTab', 'homework')}
                  class={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                    store.activeTab === 'homework'
                      ? 'bg-white text-pottery-800 shadow-sm'
                      : 'text-pottery-500 hover:text-pottery-700'
                  }`}
                >
                  <ClipboardList class="w-3.5 h-3.5" />
                  作业
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

              <Show when={store.activeTab === 'sparring'}>
                <Show when={sparring.currentUser().role === 'teacher'}>
                  <TeacherPanel
                    selectedVessel={store.selectedVessel}
                    standardTrajectories={sparring.standardTrajectories()}
                    selectedTrajectory={sparring.selectedStandardTrajectory()}
                    onSelectTrajectory={sparring.setSelectedStandardTrajectory}
                    onSaveTrajectory={handleSaveStandardTrajectory}
                    onDeleteTrajectory={sparring.deleteStandardTrajectory}
                    canSave={canSaveStandard()}
                    isRecording={sparring.isTeacherRecording()}
                    setIsRecording={sparring.setIsTeacherRecording}
                    recordName={sparring.teacherRecordName()}
                    setRecordName={sparring.setTeacherRecordName}
                    recordDescription={sparring.teacherRecordDescription()}
                    setRecordDescription={sparring.setTeacherRecordDescription}
                    editingPhaseComment={sparring.editingPhaseComment()}
                    setEditingPhaseComment={sparring.setEditingPhaseComment}
                    onAddPhaseComment={sparring.addPhaseComment}
                    onDeletePhaseComment={sparring.deletePhaseComment}
                  />
                </Show>
                <Show when={sparring.currentUser().role === 'student'}>
                  <StudentPanel
                    selectedVessel={store.selectedVessel}
                    standardTrajectories={sparring.standardTrajectories()}
                    selectedStandard={sparring.selectedStandardTrajectory()}
                    onSelectStandard={sparring.setSelectedStandardTrajectory}
                    studentContour={store.generatedContour}
                    phaseEvaluations={store.phasedEvaluationResult?.phaseEvaluations || null}
                    totalScore={store.phasedEvaluationResult?.totalScore ?? null}
                    keyDeviationPoints={studentKeyDeviationPoints()}
                    phaseComments={sparring.selectedStandardTrajectory()?.phaseComments || []}
                    hasStudentData={!!store.generatedContour}
                    onGenerateReport={handleGenerateReport}
                  />
                </Show>
              </Show>

              <Show when={store.activeTab === 'reports'}>
                <ReportPanel
                  reports={sparring.practiceReports()}
                  selectedReport={sparring.selectedReport()}
                  onSelectReport={sparring.setSelectedReport}
                  onDeleteReport={sparring.deletePracticeReport}
                  onDownloadReport={sparring.downloadReport}
                  onShareReport={sparring.shareReport}
                  onCopyToClipboard={sparring.copyToClipboard}
                  onAddFeedback={sparring.addTeacherFeedback}
                  currentUserRole={sparring.currentUser().role}
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

              <Show when={store.activeTab === 'homework'}>
                <Show when={sparring.currentUser().role === 'teacher'}>
                  <ClassAssignmentPanel
                    classHook={classAssignment}
                    vessels={vessels}
                    currentUser={sparring.currentUser()}
                    onExportStatistics={handleExportStatistics}
                  />
                </Show>
                <Show when={sparring.currentUser().role === 'student'}>
                  <StudentAssignmentPanel
                    classHook={classAssignment}
                    currentStudent={sparring.currentUser()}
                    selectedVessel={store.selectedVessel}
                    onSubmitAssignment={handleSubmitAssignment}
                    practiceRecord={store.phasedEvaluationResult?.practiceRecord || null}
                    phaseEvaluations={store.phasedEvaluationResult?.phaseEvaluations || null}
                    keyDeviationPoints={studentKeyDeviationPoints()}
                    totalScore={store.phasedEvaluationResult?.totalScore ?? null}
                    hasData={!!store.generatedContour}
                  />
                </Show>
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
