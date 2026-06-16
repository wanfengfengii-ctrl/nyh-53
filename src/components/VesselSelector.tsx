import { Component, For } from 'solid-js';
import type { Vessel } from '@/types/pottery';
import { vessels } from '@/data/vessels';
import { generateVesselPreviewPath } from '@/utils/geometry';
import { Circle, Hexagon, FlaskConical, Coffee } from 'lucide-solid';

interface VesselSelectorProps {
  selectedVessel: Vessel | null;
  onSelect: (vessel: Vessel) => void;
}

const difficultyColors = {
  easy: 'bg-celadon-100 text-celadon-700 border-celadon-300',
  medium: 'bg-pottery-100 text-pottery-700 border-pottery-300',
  hard: 'bg-cinnabar-100 text-cinnabar-700 border-cinnabar-300',
};

const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const vesselIcons: Record<string, Component<{ class?: string }>> = {
  bowl: Circle,
  plate: Circle,
  jar: Hexagon,
  vase: FlaskConical,
  teapot: Coffee,
};

export const VesselSelector: Component<VesselSelectorProps> = (props) => {
  const getIcon = (vesselId: string) => {
    const Icon = vesselIcons[vesselId] || Circle;
    return Icon;
  };

  return (
    <div class="space-y-3">
      <h3 class="text-lg font-display text-pottery-800 mb-4">选择目标器型</h3>
      <div class="grid grid-cols-1 gap-3">
        <For each={vessels}>
          {(vessel) => {
            const Icon = getIcon(vessel.id);
            const isSelected = props.selectedVessel?.id === vessel.id;
            return (
              <div
                onClick={() => props.onSelect(vessel)}
                class={`card-hover flex items-center gap-4 p-3 transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-pottery-500 border-pottery-500 bg-pottery-50'
                    : ''
                }`}
              >
                <div class="w-16 h-16 flex-shrink-0 bg-pottery-50 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 100 100" class="w-14 h-14">
                    <defs>
                      <linearGradient id={`grad-${vessel.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#D4C4A8" />
                        <stop offset="100%" stop-color="#8B4513" />
                      </linearGradient>
                    </defs>
                    <path
                      d={generateVesselPreviewPath(vessel.targetContour, 100)}
                      fill={`url(#grad-${vessel.id})`}
                      stroke="#8B4513"
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <Icon class="w-4 h-4 text-pottery-500" />
                    <span class="font-medium text-pottery-800">{vessel.name}</span>
                    <span
                      class={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[vessel.difficulty]}`}
                    >
                      {difficultyLabels[vessel.difficulty]}
                    </span>
                  </div>
                  <p class="text-sm text-pottery-600 truncate">{vessel.description}</p>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
