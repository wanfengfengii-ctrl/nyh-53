import { Component } from 'solid-js';

interface MetricCardProps {
  title: string;
  value: number;
  icon?: string;
  colorClass?: string;
  bgColorClass?: string;
  label?: string;
}

export const MetricCard: Component<MetricCardProps> = (props) => {
  const colorClass = () => props.colorClass || 'text-pottery-600';
  const bgColorClass = () => props.bgColorClass || 'bg-pottery-500';

  const getLabel = () => {
    if (props.label) return props.label;
    const score = props.value;
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    if (score >= 60) return '及格';
    return '需要练习';
  };

  return (
    <div class="card animate-slide-up">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-pottery-600 font-medium">{props.title}</span>
        {props.icon && <span class="text-pottery-400">{props.icon}</span>}
      </div>
      <div class="flex items-end justify-between">
        <span class={`text-3xl font-bold ${colorClass()}`}>
          {props.value.toFixed(1)}
        </span>
        <span class={`text-xs px-2 py-1 rounded-full text-white ${bgColorClass()}`}>
          {getLabel()}
        </span>
      </div>
      <div class="progress-bar mt-3">
        <div
          class={`progress-fill ${bgColorClass()}`}
          style={{ width: `${Math.min(100, props.value)}%` }}
        />
      </div>
    </div>
  );
};
