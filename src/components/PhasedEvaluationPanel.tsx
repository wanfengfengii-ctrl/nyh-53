import { Component, createMemo, Show, For } from 'solid-js';
import { SolidApexCharts as Chart } from 'solid-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { PhasedEvaluationResult, TrainingPhase } from '@/types/pottery';
import { TRAINING_PHASES } from '@/types/pottery';
import { useEvaluation } from '@/hooks/useEvaluation';
import { Trophy, AlertTriangle, TrendingUp, Target, Award, Lightbulb, Sparkles } from 'lucide-solid';

interface PhasedEvaluationPanelProps {
  evaluationResult: PhasedEvaluationResult | null;
  targetContour: any[];
}

const phaseColors: Record<TrainingPhase, { bg: string; border: string; text: string; gradient: string[] }> = {
  base_forming: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', gradient: ['#3B82F6', '#60A5FA'] },
  opening: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', gradient: ['#22C55E', '#4ADE80'] },
  pulling_up: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', gradient: ['#F59E0B', '#FBBF24'] },
  necking: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', gradient: ['#A855F7', '#C084FC'] },
};

export const PhasedEvaluationPanel: Component<PhasedEvaluationPanelProps> = (props) => {
  const { getScoreColor, getScoreLabel } = useEvaluation();

  const worstPhaseDefinition = createMemo(() => {
    if (!props.evaluationResult) return null;
    return TRAINING_PHASES.find(p => p.id === props.evaluationResult!.worstPhase)!;
  });

  const worstPhaseBgClass = createMemo(() => {
    if (!props.evaluationResult) return '';
    const colors = phaseColors[props.evaluationResult!.worstPhase];
    return colors.bg;
  });

  const worstPhaseEval = createMemo(() => {
    if (!props.evaluationResult) return null;
    return props.evaluationResult!.phaseEvaluations.find(
      p => p.phaseId === props.evaluationResult!.worstPhase
    ) || null;
  });

  const phaseRadarOptions = createMemo<ApexOptions>(() => {
    if (!props.evaluationResult) return {} as ApexOptions;

    const phaseEvals = props.evaluationResult.phaseEvaluations;
    return {
      chart: {
        type: 'radar',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'Noto Sans SC, sans-serif',
      },
      series: [{
        name: '各阶段得分',
        data: phaseEvals.map(p => p.score),
      }],
      xaxis: {
        categories: phaseEvals.map(p => p.phaseName),
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
        colors: phaseEvals.map(p => {
          const colors = phaseColors[p.phaseId];
          return colors.gradient[0];
        }),
        strokeColors: '#fff',
        strokeWidth: 2,
      },
      tooltip: {
        y: {
          formatter: (val) => `${val.toFixed(1)} 分`,
        },
      },
    };
  });

  const phaseBarOptions = createMemo<ApexOptions>(() => {
    if (!props.evaluationResult) return {} as ApexOptions;

    const phaseEvals = props.evaluationResult.phaseEvaluations;
    return {
      chart: {
        type: 'bar',
        height: 200,
        toolbar: { show: false },
        fontFamily: 'Noto Sans SC, sans-serif',
      },
      series: [
        { name: '对称性', data: phaseEvals.map(p => p.symmetry) },
        { name: '平滑度', data: phaseEvals.map(p => p.smoothness) },
        { name: '匹配度', data: phaseEvals.map(p => p.matching) },
      ],
      xaxis: {
        categories: phaseEvals.map(p => p.phaseName),
        labels: {
          style: {
            colors: '#3E2723',
            fontSize: '11px',
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
      colors: ['#8B4513', '#D4A574', '#7CB342'],
      plotOptions: {
        bar: {
          columnWidth: '70%',
          borderRadius: 4,
        },
      },
      stroke: {
        width: 0,
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '11px',
        labels: { colors: '#3E2723' },
      },
      tooltip: {
        y: {
          formatter: (val) => `${val.toFixed(1)} 分`,
        },
      },
      grid: {
        borderColor: '#E8DFD0',
        strokeDashArray: 4,
      },
    };
  });

  const totalScoreOptions = createMemo<ApexOptions>(() => {
    if (!props.evaluationResult) return {} as ApexOptions;

    const score = props.evaluationResult.totalScore;
    return {
      chart: {
        type: 'radialBar',
        height: 180,
        toolbar: { show: false },
        fontFamily: 'Noto Sans SC, sans-serif',
      },
      series: [score],
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          track: {
            background: '#E8DFD0',
            strokeWidth: '100%',
            margin: 0,
          },
          dataLabels: {
            name: {
              offsetY: -10,
              fontSize: '14px',
              color: '#8B4513',
            },
            value: {
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#3E2723',
              formatter: (val: number) => `${val.toFixed(1)}`,
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#D4A574'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      stroke: {
        lineCap: 'round',
      },
      labels: ['总评分'],
    };
  });

  const getPhaseScoreStatus = (score: number) => {
    if (score >= 85) return { icon: <Trophy class="w-4 h-4" />, color: 'text-celadon-500', bg: 'bg-celadon-100' };
    if (score >= 70) return { icon: <Award class="w-4 h-4" />, color: 'text-amber-500', bg: 'bg-amber-100' };
    return { icon: <AlertTriangle class="w-4 h-4" />, color: 'text-cinnabar-500', bg: 'bg-cinnabar-100' };
  };

  const getSuggestionStyle = (suggestion: string) => {
    let isHeader = false;
    let headerType = '';
    let indentClass = 'pl-2';
    let bgClass = 'bg-white';
    let borderClass = 'border-celadon-200';
    let textClass = 'text-pottery-700';

    if (suggestion.startsWith('【首要改进】')) {
      isHeader = true;
      headerType = 'primary';
      bgClass = 'bg-cinnabar-50';
      borderClass = 'border-cinnabar-300';
      textClass = 'text-cinnabar-700 font-medium';
    } else if (suggestion.startsWith('【次要改进】')) {
      isHeader = true;
      headerType = 'secondary';
      bgClass = 'bg-amber-50';
      borderClass = 'border-amber-300';
      textClass = 'text-amber-700 font-medium';
    } else if (suggestion.startsWith('【值得肯定】')) {
      isHeader = true;
      headerType = 'positive';
      bgClass = 'bg-green-50';
      borderClass = 'border-green-300';
      textClass = 'text-green-700 font-medium';
    } else if (suggestion.startsWith('【训练计划】')) {
      isHeader = true;
      headerType = 'plan';
      bgClass = 'bg-blue-50';
      borderClass = 'border-blue-300';
      textClass = 'text-blue-700 font-medium';
    } else if (suggestion.startsWith('【进阶建议】')) {
      isHeader = true;
      headerType = 'advanced';
      bgClass = 'bg-purple-50';
      borderClass = 'border-purple-300';
      textClass = 'text-purple-700 font-medium';
    } else if (suggestion.trim().startsWith('•') || suggestion.trim().startsWith('-') || suggestion.trim().startsWith('  •') || suggestion.trim().startsWith('  -')) {
      indentClass = 'pl-8';
      bgClass = 'bg-white/70';
    } else if (suggestion.trim().startsWith('    -')) {
      indentClass = 'pl-12';
      bgClass = 'bg-white/50';
    }

    const displayText = suggestion
      .replace('【首要改进】', '')
      .replace('【次要改进】', '')
      .replace('【值得肯定】', '')
      .replace('【训练计划】', '')
      .replace('【进阶建议】', '')
      .trim();

    return { isHeader, headerType, indentClass, bgClass, borderClass, textClass, displayText };
  };

  const getHeaderIcon = (headerType: string) => {
    switch (headerType) {
      case 'primary':
        return <AlertTriangle class="w-4 h-4 text-cinnabar-500 flex-shrink-0" />;
      case 'secondary':
        return <TrendingUp class="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'positive':
        return <Award class="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'plan':
        return <Target class="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'advanced':
        return <Sparkles class="w-4 h-4 text-purple-500 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div class="space-y-4">
      <h3 class="text-lg font-display text-pottery-800 flex items-center gap-2">
        <Target class="w-5 h-5" />
        分阶段评估结果
      </h3>

      <Show when={props.evaluationResult}>
        <Show when={props.evaluationResult!.diagnosisSummary}>
          <div class="card border-pottery-300 bg-gradient-to-r from-pottery-50 to-amber-50">
            <h4 class="text-sm font-medium text-pottery-700 mb-2 flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-pottery-500" />
              综合诊断摘要
            </h4>
            <p class="text-sm text-pottery-700 leading-relaxed">
              {props.evaluationResult!.diagnosisSummary}
            </p>
            <Show when={props.evaluationResult!.strengthPhases && props.evaluationResult!.strengthPhases.length > 0}>
              <div class="mt-3 pt-3 border-t border-pottery-200">
                <div class="text-xs text-celadon-700 font-medium mb-1 flex items-center gap-1">
                  <Award class="w-3 h-3" />
                  优势阶段
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <For each={props.evaluationResult!.strengthPhases}>
                    {(phaseId) => {
                      const phase = TRAINING_PHASES.find(p => p.id === phaseId)!;
                      const colors = phaseColors[phaseId];
                      const phaseClass = colors.bg + ' ' + colors.text + ' ' + colors.border + ' border';
                      return (
                        <span class={`px-2 py-0.5 rounded-full text-xs font-medium ${phaseClass}`}>
                          ✓ {phase.name}
                        </span>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </Show>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card">
            <Chart
              options={totalScoreOptions()}
              series={totalScoreOptions().series as any}
              type="radialBar"
              height={180}
            />
            <div class="text-center mt-2">
              <span class={`text-sm font-medium ${getScoreColor(props.evaluationResult!.totalScore)}`}>
                {getScoreLabel(props.evaluationResult!.totalScore)}
              </span>
            </div>
          </div>

          <div class="col-span-2 grid grid-cols-2 gap-3">
            <For each={props.evaluationResult!.phaseEvaluations}>
              {(phaseEval) => {
                const colors = phaseColors[phaseEval.phaseId];
                const status = getPhaseScoreStatus(phaseEval.score);
                const cardClass = 'p-4 rounded-xl border-2 ' + colors.bg + ' ' + colors.border;
                return (
                  <div class={cardClass}>
                    <div class="flex items-center justify-between mb-2">
                      <span class={`font-bold ${colors.text}`}>{phaseEval.phaseName}</span>
                      <div class={`p-1.5 rounded-full ${status.bg}`}>
                        {status.icon}
                      </div>
                    </div>
                    <div class="text-2xl font-bold text-pottery-800 mb-2">
                      {phaseEval.score.toFixed(1)}
                      <span class="text-sm font-normal text-pottery-500">分</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1 text-xs">
                      <div class="text-center">
                        <div class="text-pottery-500">对称</div>
                        <div class="font-medium">{phaseEval.symmetry.toFixed(0)}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-pottery-500">平滑</div>
                        <div class="font-medium">{phaseEval.smoothness.toFixed(0)}</div>
                      </div>
                      <div class="text-center">
                        <div class="text-pottery-500">匹配</div>
                        <div class="font-medium">{phaseEval.matching.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <div class="card">
          <h4 class="text-sm font-medium text-pottery-700 mb-3 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-pottery-500" />
            各阶段得分雷达图
          </h4>
          <Chart
            options={phaseRadarOptions()}
            series={phaseRadarOptions().series as any}
            type="radar"
            height={300}
          />
        </div>

        <div class="card">
          <h4 class="text-sm font-medium text-pottery-700 mb-3 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-pottery-500" />
            各阶段指标对比
          </h4>
          <Chart
            options={phaseBarOptions()}
            series={phaseBarOptions().series as any}
            type="bar"
            height={200}
          />
        </div>

        <Show when={worstPhaseDefinition()}>
          <div class="card border-cinnabar-300 bg-cinnabar-50">
            <h4 class="text-sm font-medium text-cinnabar-700 mb-3 flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-cinnabar-500" />
              最差阶段诊断与详细分析
            </h4>
            <div class="p-4 rounded-lg bg-white border border-cinnabar-200">
              <div class="flex items-center gap-3 mb-4">
                <div class={`p-3 rounded-xl ${worstPhaseBgClass()}`}>
                  <span class="text-2xl">⚠️</span>
                </div>
                <div class="flex-1">
                  <div class="font-bold text-pottery-800 text-lg">
                    {worstPhaseDefinition()!.name}
                  </div>
                  <div class="text-sm text-pottery-600">
                    得分 <span class="font-bold text-cinnabar-600">{props.evaluationResult!.worstPhaseScore.toFixed(1)} 分</span>
                    <span class="text-pottery-500"> · 需要重点改进</span>
                  </div>
                </div>
                <div class="ml-auto text-right">
                  <div class="text-xs text-pottery-500">四项排名</div>
                  <div class="font-bold text-cinnabar-600 text-lg">第 4 名</div>
                </div>
              </div>

              <Show when={worstPhaseEval()}>
                <div class="grid grid-cols-3 gap-3 mb-4">
                  <div class={`text-center p-3 rounded-lg ${
                    worstPhaseEval()!.weakestMetric === 'symmetry' ? 'bg-cinnabar-100 border border-cinnabar-300' : 'bg-pottery-50'
                  }`}>
                    <div class="text-xs text-pottery-500 mb-1">
                      对称性
                      {worstPhaseEval()!.weakestMetric === 'symmetry' && <span class="ml-1">⚠</span>}
                    </div>
                    <div class={`text-xl font-bold ${
                      worstPhaseEval()!.weakestMetric === 'symmetry' ? 'text-cinnabar-600' : getScoreColor(worstPhaseEval()!.symmetry)
                    }`}>
                      {worstPhaseEval()!.symmetry.toFixed(1)}
                    </div>
                  </div>
                  <div class={`text-center p-3 rounded-lg ${
                    worstPhaseEval()!.weakestMetric === 'smoothness' ? 'bg-cinnabar-100 border border-cinnabar-300' : 'bg-pottery-50'
                  }`}>
                    <div class="text-xs text-pottery-500 mb-1">
                      平滑度
                      {worstPhaseEval()!.weakestMetric === 'smoothness' && <span class="ml-1">⚠</span>}
                    </div>
                    <div class={`text-xl font-bold ${
                      worstPhaseEval()!.weakestMetric === 'smoothness' ? 'text-cinnabar-600' : getScoreColor(worstPhaseEval()!.smoothness)
                    }`}>
                      {worstPhaseEval()!.smoothness.toFixed(1)}
                    </div>
                  </div>
                  <div class={`text-center p-3 rounded-lg ${
                    worstPhaseEval()!.weakestMetric === 'matching' ? 'bg-cinnabar-100 border border-cinnabar-300' : 'bg-pottery-50'
                  }`}>
                    <div class="text-xs text-pottery-500 mb-1">
                      匹配度
                      {worstPhaseEval()!.weakestMetric === 'matching' && <span class="ml-1">⚠</span>}
                    </div>
                    <div class={`text-xl font-bold ${
                      worstPhaseEval()!.weakestMetric === 'matching' ? 'text-cinnabar-600' : getScoreColor(worstPhaseEval()!.matching)
                    }`}>
                      {worstPhaseEval()!.matching.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div class="space-y-3 text-sm text-pottery-600">
                  <div class="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div class="font-medium text-amber-800 mb-1 flex items-center gap-1">
                      <AlertTriangle class="w-3.5 h-3.5" />
                      诊断分析
                    </div>
                    <div class="text-amber-900 text-xs leading-relaxed">
                      {worstPhaseEval()!.diagnosis}
                    </div>
                  </div>

                  <div>
                    <div class="font-medium mb-1 text-pottery-700">阶段说明：</div>
                    <div class="text-pottery-600">{worstPhaseDefinition()!.description}</div>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        <div class="card border-celadon-300 bg-celadon-50">
          <h4 class="text-sm font-medium text-celadon-700 mb-3 flex items-center gap-2">
            <Lightbulb class="w-4 h-4 text-celadon-500" />
            改进建议与训练计划
          </h4>
          <div class="space-y-2.5">
            <For each={props.evaluationResult!.improvementSuggestions}>
              {(suggestion, index) => {
                const style = getSuggestionStyle(suggestion);
                const icon = style.isHeader ? getHeaderIcon(style.headerType) : null;
                const divClass = 'flex items-start gap-2 ' + style.bgClass + ' rounded-lg p-3 border ' + style.borderClass + ' ' + style.indentClass;
                return (
                  <div class={divClass}>
                    {icon}
                    {!style.isHeader && (
                      <span class="text-celadon-500 font-bold text-sm mt-0.5 flex-shrink-0">
                        {index() + 1}.
                      </span>
                    )}
                    <span class={`text-sm ${style.textClass}`}>
                      {style.displayText}
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-pottery-700 flex items-center gap-2">
              <Trophy class="w-4 h-4 text-pottery-500" />
              综合指标
            </h4>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center p-3 bg-pottery-50 rounded-lg">
              <div class="text-xs text-pottery-500 mb-1">对称性</div>
              <div class={`text-xl font-bold ${getScoreColor(props.evaluationResult!.symmetry)}`}>
                {props.evaluationResult!.symmetry.toFixed(1)}
              </div>
            </div>
            <div class="text-center p-3 bg-pottery-50 rounded-lg">
              <div class="text-xs text-pottery-500 mb-1">平滑度</div>
              <div class={`text-xl font-bold ${getScoreColor(props.evaluationResult!.smoothness)}`}>
                {props.evaluationResult!.smoothness.toFixed(1)}
              </div>
            </div>
            <div class="text-center p-3 bg-pottery-50 rounded-lg">
              <div class="text-xs text-pottery-500 mb-1">匹配度</div>
              <div class={`text-xl font-bold ${getScoreColor(props.evaluationResult!.matching)}`}>
                {props.evaluationResult!.matching.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={!props.evaluationResult}>
        <div class="card text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pottery-100 flex items-center justify-center">
            <Target class="w-8 h-8 text-pottery-400" />
          </div>
          <p class="text-pottery-600 mb-2">暂无分阶段评估结果</p>
          <p class="text-sm text-pottery-500">
            开启分阶段训练模式完成练习后查看详细评估
          </p>
        </div>
      </Show>
    </div>
  );
};
