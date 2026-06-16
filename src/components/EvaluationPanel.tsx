import { Component, createMemo, Show, For } from 'solid-js';
import { SolidApexCharts as Chart } from 'solid-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { EvaluationResult, ContourPoint, DeviationSegment } from '@/types/pottery';
import { useEvaluation } from '@/hooks/useEvaluation';
import { MetricCard } from './MetricCard';
import { TrendingUp, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-solid';

interface EvaluationPanelProps {
  evaluationResult: EvaluationResult | null;
  targetContour: ContourPoint[];
}

export const EvaluationPanel: Component<EvaluationPanelProps> = (props) => {
  const { getScoreColor, getScoreBgColor, getScoreLabel } = useEvaluation();

  const radarOptions = createMemo<ApexOptions>(() => ({
    chart: {
      type: 'radar',
      height: 280,
      toolbar: { show: false },
      fontFamily: 'Noto Sans SC, sans-serif',
    },
    series: props.evaluationResult ? [{
      name: '当前成绩',
      data: [
        props.evaluationResult.symmetry,
        props.evaluationResult.smoothness,
        props.evaluationResult.matching,
      ],
    }] : [],
    xaxis: {
      categories: ['对称性', '平滑度', '匹配度'],
      labels: {
        style: {
          colors: '#3E2723',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (val) => val.toString(),
        style: { colors: '#8B4513' },
      },
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#D4C4A8',
          strokeWidth: 1,
          fill: { colors: ['#FDF8F3', '#F5F0E6'] },
        },
      },
    },
    colors: ['#8B4513'],
    fill: {
      colors: ['#8B4513'],
      opacity: 0.3,
    },
    stroke: {
      width: 2,
      colors: ['#8B4513'],
    },
    markers: {
      size: 6,
      colors: ['#8B4513'],
      strokeColors: '#fff',
      strokeWidth: 2,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toFixed(1)} 分`,
      },
    },
  }));

  const comparisonOptions = createMemo<ApexOptions>(() => {
    const targetData = props.targetContour.map(c => ({
      x: (c.height * 100).toFixed(0),
      y: (c.radius * 100).toFixed(1),
    }));

    const generatedData = props.evaluationResult?.contour.map(c => ({
      x: (c.height * 100).toFixed(0),
      y: (c.radius * 100).toFixed(1),
    })) || [];

    return {
      chart: {
        type: 'line',
        height: 200,
        toolbar: { show: false },
        fontFamily: 'Noto Sans SC, sans-serif',
      },
      series: [
        {
          name: '目标轮廓',
          data: targetData,
          color: '#7CB342',
        },
        {
          name: '生成轮廓',
          data: generatedData,
          color: '#8B4513',
        },
      ],
      xaxis: {
        title: { text: '高度 (%)', style: { color: '#3E2723', fontSize: '11px' } },
        labels: { style: { colors: '#8B4513', fontSize: '10px' } },
      },
      yaxis: {
        title: { text: '半径 (%)', style: { color: '#3E2723', fontSize: '11px' } },
        labels: { style: { colors: '#8B4513', fontSize: '10px' } },
        min: 0,
        max: 100,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        dashArray: [5, 0],
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '11px',
        labels: { colors: '#3E2723' },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => `${val}%`,
        },
      },
      grid: {
        borderColor: '#E8DFD0',
        strokeDashArray: 4,
      },
    };
  });

  const deviationTypeLabels: Record<DeviationSegment['deviationType'], { text: string; icon: Component; color: string }> = {
    too_wide: { text: '过宽', icon: ArrowRight, color: 'text-cinnabar-600' },
    too_narrow: { text: '过窄', icon: ArrowLeft, color: 'text-amber-600' },
  };

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800">评估结果</h3>

      <Show when={props.evaluationResult}>
        <div class="grid grid-cols-3 gap-3">
          <MetricCard
            title="对称性"
            value={props.evaluationResult!.symmetry}
            colorClass={getScoreColor(props.evaluationResult!.symmetry)}
            bgColorClass={getScoreBgColor(props.evaluationResult!.symmetry)}
            label={getScoreLabel(props.evaluationResult!.symmetry)}
          />
          <MetricCard
            title="平滑度"
            value={props.evaluationResult!.smoothness}
            colorClass={getScoreColor(props.evaluationResult!.smoothness)}
            bgColorClass={getScoreBgColor(props.evaluationResult!.smoothness)}
            label={getScoreLabel(props.evaluationResult!.smoothness)}
          />
          <MetricCard
            title="匹配度"
            value={props.evaluationResult!.matching}
            colorClass={getScoreColor(props.evaluationResult!.matching)}
            bgColorClass={getScoreBgColor(props.evaluationResult!.matching)}
            label={getScoreLabel(props.evaluationResult!.matching)}
          />
        </div>

        <div class="card">
          <h4 class="text-sm font-medium text-pottery-700 mb-3 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-pottery-500" />
            综合能力雷达图
          </h4>
          <Chart
            options={radarOptions()}
            series={radarOptions().series as any}
            type="radar"
            height={280}
          />
        </div>

        <div class="card">
          <h4 class="text-sm font-medium text-pottery-700 mb-3 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-pottery-500" />
            轮廓对比曲线
          </h4>
          <Chart
            options={comparisonOptions()}
            series={comparisonOptions().series as any}
            type="line"
            height={200}
          />
        </div>

        <Show when={props.evaluationResult!.deviationSegments.length > 0}>
          <div class="card border-cinnabar-300 bg-cinnabar-50">
            <h4 class="text-sm font-medium text-cinnabar-700 mb-3 flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-cinnabar-500" />
              需要改进的区段
            </h4>
            <div class="space-y-2">
              <For each={props.evaluationResult!.deviationSegments}>
                {(segment, index) => {
                  const typeInfo = deviationTypeLabels[segment.deviationType];
                  return (
                    <div class="flex items-center justify-between bg-white rounded-lg p-3 border border-cinnabar-200">
                      <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-cinnabar-100 text-cinnabar-600 text-xs font-bold flex items-center justify-center">
                          {index() + 1}
                        </span>
                        <span class="text-sm text-pottery-700">
                          高度 {Math.round(segment.startHeight * 100)}% - {Math.round(segment.endHeight * 100)}%
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Show when={segment.deviationType === 'too_wide'}>
                          <ArrowRight class={`w-4 h-4 ${typeInfo.color}`} />
                        </Show>
                        <Show when={segment.deviationType === 'too_narrow'}>
                          <ArrowLeft class={`w-4 h-4 ${typeInfo.color}`} />
                        </Show>
                        <span class={`text-sm font-medium ${typeInfo.color}`}>
                          {typeInfo.text}
                        </span>
                        <span class="text-xs text-pottery-500 ml-2">
                          偏差 {(segment.maxDeviation * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>
      </Show>

      <Show when={!props.evaluationResult}>
        <div class="card text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pottery-100 flex items-center justify-center">
            <TrendingUp class="w-8 h-8 text-pottery-400" />
          </div>
          <p class="text-pottery-600 mb-2">暂无评估结果</p>
          <p class="text-sm text-pottery-500">
            完成手势绘制后点击「生成轮廓」查看评估
          </p>
        </div>
      </Show>
    </div>
  );
};
