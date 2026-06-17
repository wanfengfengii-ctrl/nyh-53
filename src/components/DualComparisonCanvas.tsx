import { Component, Show, For, createMemo } from 'solid-js';
import type { Point, ContourPoint, Vessel, StandardTrajectory } from '@/types/pottery';

interface DualComparisonCanvasProps {
  width: number;
  height: number;
  studentPoints: Point[];
  studentContour: ContourPoint[] | null;
  standardTrajectory: StandardTrajectory | null;
  targetVessel: Vessel | null;
  deviationSegments?: { startHeight: number; endHeight: number; maxDeviation: number; deviationType: 'too_wide' | 'too_narrow' }[];
  playbackPoints?: Point[];
  comparisonDiffData?: { height: number; radiusDiff: number; type: 'wider' | 'narrower' }[];
  showStandard: boolean;
}

export const DualComparisonCanvas: Component<DualComparisonCanvasProps> = (props) => {
  const padding = 20;
  const effectiveHeight = () => props.height - padding * 2;
  const maxRadius = () => (props.width - padding * 2) / 2;

  const halfWidth = () => props.width / 2 - padding / 2;
  const leftCenterX = () => padding + halfWidth() / 2;
  const rightCenterX = () => props.width - padding - halfWidth() / 2;

  const gridLines = () => {
    const lines = [];
    for (let i = 1; i < 5; i++) {
      lines.push(props.height * (i / 5));
    }
    return lines;
  };

  const studentPath = createMemo(() => {
    const points = props.playbackPoints?.length ? props.playbackPoints : props.studentPoints;
    if (points.length < 2) return '';
    const scaleX = halfWidth() / props.width;
    let d = `M ${points[0].x * scaleX + padding} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x * scaleX + padding} ${points[i].y}`;
    }
    return d;
  });

  const standardGesturePath = createMemo(() => {
    if (!props.standardTrajectory) return '';
    const points = props.standardTrajectory.gesturePoints;
    if (points.length < 2) return '';
    const scaleX = halfWidth() / props.width;
    const offsetX = props.width / 2;
    let d = `M ${points[0].x * scaleX + offsetX} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x * scaleX + offsetX} ${points[i].y}`;
    }
    return d;
  });

  const studentContourPath = createMemo(() => {
    if (!props.studentContour) return '';
    const halfMax = maxRadius() / 2;
    const center = leftCenterX();
    return contourToSvgPathWithOffset(props.studentContour, halfWidth(), props.height, center, halfMax);
  });

  const standardContourPath = createMemo(() => {
    if (!props.standardTrajectory) return '';
    const halfMax = maxRadius() / 2;
    const center = rightCenterX();
    return contourToSvgPathWithOffset(props.standardTrajectory.contour, halfWidth(), props.height, center, halfMax);
  });

  const targetContourPath = createMemo(() => {
    if (!props.targetVessel) return '';
    const halfMax = maxRadius() / 2;
    return contourToSvgPathWithOffset(
      props.targetVessel.targetContour,
      halfWidth(),
      props.height,
      leftCenterX(),
      halfMax
    );
  });

  const standardTargetPath = createMemo(() => {
    if (!props.targetVessel || !props.showStandard) return '';
    const halfMax = maxRadius() / 2;
    return contourToSvgPathWithOffset(
      props.targetVessel.targetContour,
      halfWidth(),
      props.height,
      rightCenterX(),
      halfMax
    );
  });

  const diffRects = createMemo(() => {
    if (!props.comparisonDiffData || props.comparisonDiffData.length === 0) return [];
    return props.comparisonDiffData.map((diff, idx) => {
      const y = props.height - padding - diff.height * effectiveHeight();
      const height = Math.max(effectiveHeight() / 50, 3);
      const intensity = Math.min(Math.abs(diff.radiusDiff) * 10, 1);
      const color = diff.type === 'wider'
        ? `rgba(76, 175, 80, ${0.2 + intensity * 0.4})`
        : `rgba(33, 150, 243, ${0.2 + intensity * 0.4})`;
      return {
        x: props.width / 2 + padding,
        y: y - height / 2,
        width: halfWidth() - padding,
        height,
        fill: color,
        stroke: diff.type === 'wider' ? '#4CAF50' : '#2196F3',
        strokeWidth: 1,
        strokeDasharray: '4,2',
        idx,
      };
    });
  });

  return (
    <div class="relative">
      <svg
        width={props.width}
        height={props.height}
        class="rounded-xl shadow-inner bg-pottery-900 border-2 border-pottery-700"
      >
        <defs>
          <radialGradient id="studentGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#D4C4A8" />
            <stop offset="70%" stop-color="#8B4513" />
            <stop offset="100%" stop-color="#5D2E0D" />
          </radialGradient>
          <radialGradient id="standardGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#B3E5FC" />
            <stop offset="70%" stop-color="#1976D2" />
            <stop offset="100%" stop-color="#0D47A1" />
          </radialGradient>
          <radialGradient id="targetGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#AED581" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#7CB342" stop-opacity="0.1" />
          </radialGradient>
        </defs>

        <line
          x1={props.width / 2}
          y1="0"
          x2={props.width / 2}
          y2={props.height}
          stroke="#FFE082"
          stroke-width="2"
          stroke-dasharray="8,4"
          opacity="0.6"
        />

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
              opacity="0.3"
            />
          )}
        </For>

        <line
          x1={leftCenterX()}
          y1="0"
          x2={leftCenterX()}
          y2={props.height}
          stroke="#4A3728"
          stroke-width="1"
          stroke-dasharray="4,4"
          opacity="0.3"
        />
        <line
          x1={rightCenterX()}
          y1="0"
          x2={rightCenterX()}
          y2={props.height}
          stroke="#4A3728"
          stroke-width="1"
          stroke-dasharray="4,4"
          opacity="0.3"
        />

        <Show when={targetContourPath()}>
          <path
            d={targetContourPath()}
            fill="url(#targetGradient)"
            stroke="#7CB342"
            stroke-width="1.5"
            stroke-dasharray="6,3"
            opacity="0.5"
          />
        </Show>

        <Show when={props.showStandard && standardTargetPath()}>
          <path
            d={standardTargetPath()}
            fill="url(#targetGradient)"
            stroke="#7CB342"
            stroke-width="1.5"
            stroke-dasharray="6,3"
            opacity="0.5"
          />
        </Show>

        <Show when={props.showStandard && standardContourPath()}>
          <path
            d={standardContourPath()}
            fill="url(#standardGradient)"
            stroke="#1976D2"
            stroke-width="2"
            opacity="0.9"
          />
        </Show>

        <Show when={studentContourPath()}>
          <path
            d={studentContourPath()}
            fill="url(#studentGradient)"
            stroke="#8B4513"
            stroke-width="2"
          />
        </Show>

        <For each={diffRects()}>
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

        <Show when={studentPath()}>
          <path
            d={studentPath()}
            fill="none"
            stroke="#FFE082"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Show>

        <Show when={props.showStandard && standardGesturePath()}>
          <path
            d={standardGesturePath()}
            fill="none"
            stroke="#64B5F6"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.8"
          />
        </Show>

        <text
          x={leftCenterX()}
          y="30"
          text-anchor="middle"
          fill="#FFE082"
          font-size="14"
          font-weight="bold"
        >
          你的练习
        </text>
        <text
          x={rightCenterX()}
          y="30"
          text-anchor="middle"
          fill="#64B5F6"
          font-size="14"
          font-weight="bold"
        >
          老师标准
        </text>

        <Show when={props.studentContour && props.studentPoints.length > 0}>
          <text
            x={padding + 8}
            y={props.height - 12}
            fill="#8B7355"
            font-size="11"
          >
            {props.studentPoints.length} 点
          </text>
        </Show>
        <Show when={props.standardTrajectory}>
          {(std) => (
            <text
              x={props.width / 2 + padding + 8}
              y={props.height - 12}
              fill="#8B7355"
              font-size="11"
            >
              {std().gesturePoints.length} 点
            </text>
          )}
        </Show>
      </svg>

      <div class="absolute top-2 right-2 flex gap-2">
        <span class="text-[10px] px-2 py-1 rounded-full bg-amber-500/90 text-white flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-amber-200"></span>
          你的轨迹
        </span>
        <span class="text-[10px] px-2 py-1 rounded-full bg-blue-500/90 text-white flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-blue-200"></span>
          标准轨迹
        </span>
      </div>
    </div>
  );
};

function contourToSvgPathWithOffset(
  contour: ContourPoint[],
  _width: number,
  height: number,
  centerX: number,
  maxR: number
): string {
  if (contour.length < 2) return '';
  const padding = 20;
  const effectiveHeight = height - padding * 2;

  let d = '';
  for (let i = 0; i < contour.length; i++) {
    const point = contour[i];
    const x = centerX + point.radius * maxR;
    const y = height - padding - point.height * effectiveHeight;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  for (let i = contour.length - 1; i >= 0; i--) {
    const point = contour[i];
    const x = centerX - point.radius * maxR;
    const y = height - padding - point.height * effectiveHeight;
    d += ` L ${x} ${y}`;
  }
  d += ' Z';
  return d;
}
