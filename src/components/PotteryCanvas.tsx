import { Component, Show, For, createMemo } from 'solid-js';
import type { Point, ContourPoint, Vessel, DeviationSegment, TrainingPhase, RealTimeFeedback } from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { contourToSvgPath } from '@/utils/geometry';
import { MIN_POINTS_FOR_CONTOUR } from '@/types/pottery';

interface PotteryCanvasProps {
  width: number;
  height: number;
  gesturePoints: Point[];
  targetVessel: Vessel | null;
  generatedContour: ContourPoint[] | null;
  deviationSegments: DeviationSegment[];
  isDrawing: boolean;
  enabled: boolean;
  canvasRef: (el: SVGSVGElement) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
  playbackPoints?: Point[];
  isPhasedMode?: boolean;
  currentPhase?: TrainingPhase;
  heatmapData?: { height: number; deviation: number; color: string }[];
  comparisonContour?: ContourPoint[] | null;
  realTimeFeedback?: RealTimeFeedback | null;
  comparisonDiffData?: { height: number; radiusDiff: number; type: 'wider' | 'narrower' }[];
}

export const PotteryCanvas: Component<PotteryCanvasProps> = (props) => {
  const centerX = () => props.width / 2;
  const padding = 20;
  const effectiveHeight = () => props.height - padding * 2;
  const maxRadius = () => (props.width - padding * 2) / 2;

  const currentPhaseDefinition = createMemo(() => {
    if (!props.currentPhase) return null;
    return TRAINING_PHASES.find(p => p.id === props.currentPhase)!;
  });

  const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string }> = {
    base_forming: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3B82F6', text: 'text-blue-600' },
    opening: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22C55E', text: 'text-green-600' },
    pulling_up: { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', text: 'text-amber-600' },
    necking: { bg: 'rgba(168, 85, 247, 0.1)', border: '#A855F7', text: 'text-purple-600' },
  };

  const phaseHighlightRect = createMemo(() => {
    if (!props.isPhasedMode || !currentPhaseDefinition()) return null;
    const phase = currentPhaseDefinition()!;
    const startY = props.height - padding - phase.endHeight * effectiveHeight();
    const endY = props.height - padding - phase.startHeight * effectiveHeight();
    const colors = phaseColors[phase.id];

    return {
      x: padding,
      y: Math.min(startY, endY),
      width: props.width - padding * 2,
      height: Math.abs(endY - startY),
      fill: colors.bg,
      stroke: colors.border,
      strokeWidth: 2,
      strokeDasharray: '8,4',
    };
  });

  const phaseBoundaryLines = createMemo(() => {
    if (!props.isPhasedMode) return [];
    const lines: { y: number; color: string; label: string }[] = [];

    TRAINING_PHASES.forEach((phase, index) => {
      const colors = phaseColors[phase.id];

      if (index > 0) {
        const y = props.height - padding - phase.startHeight * effectiveHeight();
        lines.push({
          y,
          color: colors.border,
          label: phase.name,
        });
      }

      if (phase.id === props.currentPhase) {
        const startY = props.height - padding - phase.endHeight * effectiveHeight();
        const endY = props.height - padding - phase.startHeight * effectiveHeight();
        lines.push(
          { y: startY, color: colors.border, label: '' },
          { y: endY, color: colors.border, label: '' }
        );
      }
    });

    return lines;
  });

  const heatmapRects = createMemo(() => {
    if (!props.heatmapData || !props.generatedContour) return [];

    return props.heatmapData.map((item, idx) => {
      const y = props.height - padding - item.height * effectiveHeight();
      const height = effectiveHeight() / props.heatmapData!.length;
      const genPoint = props.generatedContour![Math.min(idx, props.generatedContour!.length - 1)];
      const width = genPoint ? genPoint.radius * maxRadius() * 2 + 20 : props.width - padding * 2;

      return {
        x: centerX() - width / 2,
        y: y - height / 2,
        width,
        height: Math.max(height, 4),
        fill: item.color,
        idx,
      };
    });
  });

  const realtimeHotzoneRects = createMemo(() => {
    if (!props.realTimeFeedback || !props.realTimeFeedback.hotZones.length) return [];

    return props.realTimeFeedback.hotZones.map((zone, idx) => {
      const y = props.height - padding - zone.height * effectiveHeight();
      const height = Math.max(effectiveHeight() / 30, 6);
      const intensity = Math.min(zone.deviation * 8, 1);
      const color = zone.type === 'too_wide'
        ? `rgba(198, 40, 40, ${0.3 + intensity * 0.5})`
        : `rgba(255, 143, 0, ${0.3 + intensity * 0.5})`;
      const width = props.width - padding * 2;

      return {
        x: centerX() - width / 2,
        y: y - height / 2,
        width,
        height,
        fill: color,
        stroke: zone.type === 'too_wide' ? '#C62828' : '#FF8F00',
        strokeWidth: 2,
        idx,
      };
    });
  });

  const comparisonDiffRects = createMemo(() => {
    if (!props.comparisonDiffData || props.comparisonDiffData.length === 0) return [];

    return props.comparisonDiffData.map((diff, idx) => {
      const y = props.height - padding - diff.height * effectiveHeight();
      const height = Math.max(effectiveHeight() / 50, 3);
      const intensity = Math.min(Math.abs(diff.radiusDiff) * 10, 1);
      const color = diff.type === 'wider'
        ? `rgba(76, 175, 80, ${0.2 + intensity * 0.4})`
        : `rgba(33, 150, 243, ${0.2 + intensity * 0.4})`;

      return {
        x: centerX() - maxRadius() - 15,
        y: y - height / 2,
        width: (maxRadius() + 15) * 2,
        height,
        fill: color,
        stroke: diff.type === 'wider' ? '#4CAF50' : '#2196F3',
        strokeWidth: 1,
        strokeDasharray: '4,2',
        idx,
      };
    });
  });

  const comparisonPath = createMemo(() => {
    if (!props.comparisonContour) return '';
    return contourToSvgPath(props.comparisonContour, props.width, props.height, centerX());
  });

  const gesturePath = () => {
    const points = props.playbackPoints?.length ? props.playbackPoints : props.gesturePoints;
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  const targetPath = () => {
    if (!props.targetVessel) return '';
    return contourToSvgPath(props.targetVessel.targetContour, props.width, props.height, centerX());
  };

  const phaseTargetPath = createMemo(() => {
    if (!props.isPhasedMode || !props.targetVessel || !currentPhaseDefinition()) return '';
    const phase = currentPhaseDefinition()!;
    const phaseContour = props.targetVessel.targetContour.filter(
      p => p.height >= phase.startHeight && p.height <= phase.endHeight
    );
    if (phaseContour.length < 2) return '';
    return contourToSvgPath(phaseContour, props.width, props.height, centerX());
  });

  const generatedPath = () => {
    if (!props.generatedContour) return '';
    return contourToSvgPath(props.generatedContour, props.width, props.height, centerX());
  };

  const deviationHighlightRects = () => {
    if (!props.generatedContour || props.deviationSegments.length === 0) return [];

    const center = centerX();
    const maxR = maxRadius();
    const effHeight = effectiveHeight();

    return props.deviationSegments.map((segment, idx) => {
      const startY = props.height - padding - segment.startHeight * effHeight;
      const endY = props.height - padding - segment.endHeight * effHeight;
      const height = Math.abs(endY - startY);

      const startIdx = Math.floor(segment.startHeight * (props.generatedContour!.length - 1));
      const endIdx = Math.floor(segment.endHeight * (props.generatedContour!.length - 1));
      const segmentPoints = props.generatedContour!.slice(
        Math.min(startIdx, endIdx),
        Math.max(startIdx, endIdx) + 1
      );

      const maxSegRadius = segmentPoints.length > 0
        ? Math.max(...segmentPoints.map(p => p.radius)) * maxR
        : maxR * 0.5;

      return {
        x: center - maxSegRadius - 10,
        y: Math.min(startY, endY),
        width: (maxSegRadius + 10) * 2,
        height: height || 2,
        fill: segment.deviationType === 'too_wide' ? '#C62828' : '#FF8F00',
        fillOpacity: 0.12,
        stroke: segment.deviationType === 'too_wide' ? '#C62828' : '#FF8F00',
        strokeWidth: 2,
        strokeDasharray: '6,4',
        idx,
      };
    });
  };

  const deviationContourPaths = () => {
    if (!props.generatedContour || props.deviationSegments.length === 0) return [] as { d: string; color: string; idx: number }[];

    const center = centerX();
    const maxR = maxRadius();
    const effHeight = effectiveHeight();

    return props.deviationSegments.map((segment, idx) => {
      const startIdx = Math.floor(segment.startHeight * (props.generatedContour!.length - 1));
      const endIdx = Math.floor(segment.endHeight * (props.generatedContour!.length - 1));
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);

      const segmentPoints = props.generatedContour!.slice(minIdx, maxIdx + 1);
      if (segmentPoints.length < 2) return null;

      let d = '';
      segmentPoints.forEach((point, i) => {
        const x = center + point.radius * maxR;
        const y = props.height - padding - point.height * effHeight;
        if (i === 0) {
          d += `M ${x} ${y}`;
        } else {
          d += ` L ${x} ${y}`;
        }
      });

      for (let i = segmentPoints.length - 1; i >= 0; i--) {
        const point = segmentPoints[i];
        const x = center - point.radius * maxR;
        const y = props.height - padding - point.height * effHeight;
        d += ` L ${x} ${y}`;
      }
      d += ' Z';

      return {
        d,
        color: segment.deviationType === 'too_wide' ? '#C62828' : '#FF8F00',
        idx,
      } as { d: string; color: string; idx: number };
    }).filter(Boolean) as { d: string; color: string; idx: number }[];
  };

  const gridLines = () => {
    const lines = [];
    for (let i = 1; i < 5; i++) {
      lines.push(props.height * (i / 5));
    }
    return lines;
  };

  const phaseLabels = createMemo(() => {
    if (!props.isPhasedMode) return [];
    return TRAINING_PHASES.map((phase) => {
      const midHeight = (phase.startHeight + phase.endHeight) / 2;
      const y = props.height - padding - midHeight * effectiveHeight();
      const colors = phaseColors[phase.id];
      const isActive = phase.id === props.currentPhase;

      return {
        x: padding + 8,
        y,
        text: phase.name,
        color: colors.border,
        isActive,
        bg: isActive ? colors.bg : 'rgba(255,255,255,0.7)',
      };
    });
  });

  return (
    <div class="relative">
      <div class="absolute top-2 left-2 z-10 flex items-center gap-2 flex-wrap">
        <Show when={!props.enabled}>
          <span class="text-xs bg-cinnabar-500 text-white px-2 py-1 rounded-full">
            请先选择目标器型
          </span>
        </Show>
        <Show when={props.enabled && props.gesturePoints.length < MIN_POINTS_FOR_CONTOUR}>
          <span class="text-xs bg-pottery-500 text-white px-2 py-1 rounded-full">
            轨迹点: {props.gesturePoints.length} / {MIN_POINTS_FOR_CONTOUR}
          </span>
        </Show>
        <Show when={props.enabled && props.gesturePoints.length >= MIN_POINTS_FOR_CONTOUR}>
          <span class="text-xs bg-celadon-500 text-white px-2 py-1 rounded-full">
            轨迹点足够 ✓
          </span>
        </Show>
        <Show when={props.isPhasedMode && currentPhaseDefinition()}>
          <span class={`text-xs px-2 py-1 rounded-full font-medium ${
            phaseColors[props.currentPhase!].text.replace('text-', 'bg-').replace('600', '500')
          } text-white`}>
            阶段：{currentPhaseDefinition()!.name}
          </span>
        </Show>
      </div>

      <Show when={props.isPhasedMode && currentPhaseDefinition()}>
        <div class={`absolute top-2 right-2 z-10 text-xs px-3 py-2 rounded-lg ${phaseColors[props.currentPhase!].bg} border ${phaseColors[props.currentPhase!].border.replace('#', 'border-')} text-pottery-700 max-w-[200px]`}>
          <div class="font-medium mb-1">{currentPhaseDefinition()!.name}</div>
          <div class="text-xs opacity-80">{currentPhaseDefinition()!.tips[0]}</div>
        </div>
      </Show>

      <svg
        ref={props.canvasRef}
        width={props.width}
        height={props.height}
        class={`rounded-xl shadow-inner bg-pottery-900 border-2 border-pottery-700 ${
          props.enabled ? 'cursor-crosshair' : 'cursor-not-allowed opacity-60'
        }`}
        onMouseDown={props.onMouseDown}
        onMouseMove={props.onMouseMove}
        onMouseUp={props.onMouseUp}
        onMouseLeave={props.onMouseUp}
        onTouchStart={props.onTouchStart}
        onTouchMove={props.onTouchMove}
        onTouchEnd={props.onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <radialGradient id="clayGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#D4C4A8" />
            <stop offset="70%" stop-color="#8B4513" />
            <stop offset="100%" stop-color="#5D2E0D" />
          </radialGradient>
          <radialGradient id="targetGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#AED581" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#7CB342" stop-opacity="0.1" />
          </radialGradient>
          <radialGradient id="comparisonGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#64B5F6" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#1976D2" stop-opacity="0.05" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <For each={gridLines()}>
          {(y) => (
            <line
              x1="0"
              y1={y}
              x2={props.width}
              y2={y}
              stroke="#4A3728"
              stroke-width="1"
              stroke-dasharray="4,4"
              opacity="0.5"
            />
          )}
        </For>

        <line
          x1={centerX()}
          y1="0"
          x2={centerX()}
          y2={props.height}
          stroke="#4A3728"
          stroke-width="1"
          stroke-dasharray="4,4"
          opacity="0.5"
        />

        <Show when={props.isPhasedMode}>
          <For each={phaseBoundaryLines()}>
            {(line) => (
              <line
                x1={padding}
                y1={line.y}
                x2={props.width - padding}
                y2={line.y}
                stroke={line.color}
                stroke-width="1"
                stroke-dasharray="4,4"
                opacity="0.4"
              />
            )}
          </For>
        </Show>

        <Show when={phaseHighlightRect()}>
          <rect
            x={phaseHighlightRect()!.x}
            y={phaseHighlightRect()!.y}
            width={phaseHighlightRect()!.width}
            height={phaseHighlightRect()!.height}
            fill={phaseHighlightRect()!.fill}
            stroke={phaseHighlightRect()!.stroke}
            stroke-width={phaseHighlightRect()!.strokeWidth}
            stroke-dasharray={phaseHighlightRect()!.strokeDasharray}
            rx="8"
          />
        </Show>

        <For each={heatmapRects()}>
          {(rect) => (
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.fill}
              rx="2"
            />
          )}
        </For>

        <For each={realtimeHotzoneRects()}>
          {(rect) => (
            <g>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill={rect.fill}
                stroke={rect.stroke}
                stroke-width={rect.strokeWidth}
                rx="3"
                opacity="0.85"
              />
            </g>
          )}
        </For>

        <For each={comparisonDiffRects()}>
          {(rect) => (
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.fill}
              stroke={rect.stroke}
              stroke-width={rect.strokeWidth}
              stroke-dasharray={rect.strokeDasharray}
              rx="2"
            />
          )}
        </For>

        <Show when={props.targetVessel && !props.isPhasedMode}>
          <path
            d={targetPath()}
            fill="url(#targetGradient)"
            stroke="#7CB342"
            stroke-width="2"
            stroke-dasharray="8,4"
            opacity="0.8"
          />
        </Show>

        <Show when={phaseTargetPath()}>
          <path
            d={phaseTargetPath()!}
            fill="url(#targetGradient)"
            stroke="#7CB342"
            stroke-width="3"
            stroke-dasharray="6,3"
            opacity="0.9"
          />
        </Show>

        <Show when={props.comparisonContour}>
          <path
            d={comparisonPath()}
            fill="url(#comparisonGradient)"
            stroke="#1976D2"
            stroke-width="2"
            stroke-dasharray="5,5"
            opacity="0.7"
          />
        </Show>

        <Show when={props.generatedContour}>
          <path
            d={generatedPath()}
            fill="url(#clayGradient)"
            stroke="#8B4513"
            stroke-width="2"
            filter="url(#glow)"
          />
        </Show>

        <For each={deviationHighlightRects()}>
          {(rect) => (
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.fill}
              fill-opacity={rect.fillOpacity}
              stroke={rect.stroke}
              stroke-width={rect.strokeWidth}
              stroke-dasharray={rect.strokeDasharray}
              rx="4"
            />
          )}
        </For>

        <For each={deviationContourPaths()}>
          {(seg) => (
            <path
              d={seg.d}
              fill={seg.color}
              fill-opacity="0.25"
              stroke={seg.color}
              stroke-width="3"
              filter="url(#glow)"
            />
          )}
        </For>

        <Show when={gesturePath()}>
          <path
            d={gesturePath()}
            fill="none"
            stroke="#FFE082"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#glow)"
          />
        </Show>

        <For each={phaseLabels()}>
          {(label) => (
            <g>
              <rect
                x={label.x - 4}
                y={label.y - 10}
                width="72"
                height="20"
                fill={label.bg}
                stroke={label.color}
                stroke-width={label.isActive ? 2 : 1}
                rx="4"
                opacity={label.isActive ? 1 : 0.7}
              />
              <text
                x={label.x + 32}
                y={label.y + 4}
                text-anchor="middle"
                fill={label.color}
                font-size="10"
                font-weight={label.isActive ? "bold" : "normal"}
              >
                {label.text}
              </text>
            </g>
          )}
        </For>

        <Show when={props.isDrawing}>
          <circle
            cx={props.gesturePoints[props.gesturePoints.length - 1]?.x || 0}
            cy={props.gesturePoints[props.gesturePoints.length - 1]?.y || 0}
            r="8"
            fill="#FFE082"
            opacity="0.8"
            class="animate-pulse"
          />
        </Show>
      </svg>

      <div class="absolute bottom-2 left-2 text-xs text-pottery-400">
        <Show when={props.enabled && !props.isPhasedMode}>
          在画布上拖动鼠标或触摸绘制手势轨迹
        </Show>
        <Show when={props.enabled && props.isPhasedMode && currentPhaseDefinition()}>
          在{currentPhaseDefinition()!.name}区域（{Math.round(currentPhaseDefinition()!.startHeight * 100)}%-{Math.round(currentPhaseDefinition()!.endHeight * 100)}%高度）内绘制
        </Show>
        <Show when={!props.enabled}>
          请先从左侧选择目标器型
        </Show>
      </div>

      <Show when={props.realTimeFeedback}>
        <div class="absolute bottom-2 right-2 max-w-[220px] text-xs">
          <div class="bg-pottery-900/95 text-white rounded-lg p-2 border border-pottery-600">
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-bold text-pottery-200">实时评分</span>
              <span class={`text-sm font-bold ${
                props.realTimeFeedback!.currentScore >= 80 ? 'text-green-400' :
                props.realTimeFeedback!.currentScore >= 60 ? 'text-yellow-400' :
                props.realTimeFeedback!.currentScore > 0 ? 'text-red-400' : 'text-gray-500'
              }`}>
                {props.realTimeFeedback!.currentScore.toFixed(0)}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-1 text-center mb-1.5">
              <div>
                <div class="text-[10px] text-pottery-400">对称</div>
                <div class={`font-medium ${props.realTimeFeedback!.symmetry >= 65 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {props.realTimeFeedback!.symmetry.toFixed(0)}
                </div>
              </div>
              <div>
                <div class="text-[10px] text-pottery-400">平滑</div>
                <div class={`font-medium ${props.realTimeFeedback!.smoothness >= 65 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {props.realTimeFeedback!.smoothness.toFixed(0)}
                </div>
              </div>
              <div>
                <div class="text-[10px] text-pottery-400">匹配</div>
                <div class={`font-medium ${props.realTimeFeedback!.matching >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {props.realTimeFeedback!.matching.toFixed(0)}
                </div>
              </div>
            </div>
            <Show when={props.realTimeFeedback!.warnings.length > 0}>
              <div class="border-t border-pottery-700 pt-1.5 mt-1.5">
                <div class="text-[10px] text-amber-400 font-medium mb-1">⚠ 警告</div>
                <div class="text-[10px] text-pottery-300 space-y-0.5">
                  <For each={props.realTimeFeedback!.warnings.slice(0, 2)}>
                    {(warn) => <div>• {warn}</div>}
                  </For>
                </div>
              </div>
            </Show>
            <Show when={props.realTimeFeedback!.tips.length > 0 && props.realTimeFeedback!.warnings.length === 0}>
              <div class="border-t border-pottery-700 pt-1.5 mt-1.5">
                <div class="text-[10px] text-cyan-400 font-medium mb-1">💡 提示</div>
                <div class="text-[10px] text-pottery-300">
                  {props.realTimeFeedback!.tips[0]}
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={(props.heatmapData && props.heatmapData.length > 0) || props.comparisonDiffData}>
        <div class={`absolute ${props.realTimeFeedback ? 'top-12' : 'bottom-2'} right-2 text-xs text-pottery-400 bg-white/90 px-2 py-1 rounded shadow-sm`}>
          <Show when={props.heatmapData && props.heatmapData.length > 0}>
            <span class="inline-block w-3 h-3 mr-1 rounded" style="background: rgba(255, 143, 0, 0.5)"></span>
            过窄
            <span class="inline-block w-3 h-3 mx-1 ml-2 rounded" style="background: rgba(198, 40, 40, 0.5)"></span>
            过宽
          </Show>
          <Show when={props.comparisonDiffData && props.comparisonDiffData.length > 0}>
            <div class="mt-1 pt-1 border-t border-pottery-200">
              <span class="inline-block w-3 h-3 mr-1 rounded" style="background: rgba(76, 175, 80, 0.4)"></span>
              更宽
              <span class="inline-block w-3 h-3 mx-1 ml-2 rounded" style="background: rgba(33, 150, 243, 0.4)"></span>
              更窄
            </div>
          </Show>
        </div>
      </Show>

      <Show when={props.comparisonContour}>
        <div class="absolute top-12 right-2 text-xs bg-blue-500/90 text-white px-2 py-1 rounded">
          蓝色虚线：对比记录
        </div>
      </Show>
    </div>
  );
};
