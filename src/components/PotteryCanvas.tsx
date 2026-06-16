import { Component, Show, For } from 'solid-js';
import type { Point, ContourPoint, Vessel, DeviationSegment } from '@/types/pottery';
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
}

export const PotteryCanvas: Component<PotteryCanvasProps> = (props) => {
  const centerX = () => props.width / 2;

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

  const generatedPath = () => {
    if (!props.generatedContour) return '';
    return contourToSvgPath(props.generatedContour, props.width, props.height, centerX());
  };

  const deviationHighlightRects = () => {
    if (!props.generatedContour || props.deviationSegments.length === 0) return [];

    const padding = 20;
    const effectiveHeight = props.height - padding * 2;
    const center = centerX();
    const maxRadius = (props.width - padding * 2) / 2;

    return props.deviationSegments.map((segment, idx) => {
      const startY = props.height - padding - segment.startHeight * effectiveHeight;
      const endY = props.height - padding - segment.endHeight * effectiveHeight;
      const height = Math.abs(endY - startY);

      const startIdx = Math.floor(segment.startHeight * (props.generatedContour!.length - 1));
      const endIdx = Math.floor(segment.endHeight * (props.generatedContour!.length - 1));
      const segmentPoints = props.generatedContour!.slice(
        Math.min(startIdx, endIdx),
        Math.max(startIdx, endIdx) + 1
      );

      const maxSegRadius = segmentPoints.length > 0
        ? Math.max(...segmentPoints.map(p => p.radius)) * maxRadius
        : maxRadius * 0.5;

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

    const padding = 20;
    const effectiveHeight = props.height - padding * 2;
    const center = centerX();
    const maxRadius = (props.width - padding * 2) / 2;

    return props.deviationSegments.map((segment, idx) => {
      const startIdx = Math.floor(segment.startHeight * (props.generatedContour!.length - 1));
      const endIdx = Math.floor(segment.endHeight * (props.generatedContour!.length - 1));
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);

      const segmentPoints = props.generatedContour!.slice(minIdx, maxIdx + 1);
      if (segmentPoints.length < 2) return null;

      let d = '';
      segmentPoints.forEach((point, i) => {
        const x = center + point.radius * maxRadius;
        const y = props.height - padding - point.height * effectiveHeight;
        if (i === 0) {
          d += `M ${x} ${y}`;
        } else {
          d += ` L ${x} ${y}`;
        }
      });

      for (let i = segmentPoints.length - 1; i >= 0; i--) {
        const point = segmentPoints[i];
        const x = center - point.radius * maxRadius;
        const y = props.height - padding - point.height * effectiveHeight;
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

  return (
    <div class="relative">
      <div class="absolute top-2 left-2 z-10 flex items-center gap-2">
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
      </div>

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

        <Show when={props.targetVessel}>
          <path
            d={targetPath()}
            fill="url(#targetGradient)"
            stroke="#7CB342"
            stroke-width="2"
            stroke-dasharray="8,4"
            opacity="0.8"
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
        <Show when={props.enabled}>
          在画布上拖动鼠标或触摸绘制手势轨迹
        </Show>
        <Show when={!props.enabled}>
          请先从左侧选择目标器型
        </Show>
      </div>
    </div>
  );
};
