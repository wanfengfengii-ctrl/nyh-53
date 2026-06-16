import { Component, For, Show } from 'solid-js';
import { Play, Pause, Square, RotateCcw, Gauge } from 'lucide-solid';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentIndex: number;
  totalPoints: number;
  playbackSpeed: number;
  availableSpeeds: number[];
  canPlayback: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (index: number) => void;
}

export const PlaybackControls: Component<PlaybackControlsProps> = (props) => {

  return (
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-pottery-800 flex items-center gap-2">
          <Gauge class="w-4 h-4 text-pottery-500" />
          过程回放
        </h4>
        <span class="text-xs text-pottery-500">
          {props.currentIndex} / {props.totalPoints}
        </span>
      </div>

      <div class="mb-4">
        <input
          type="range"
          min="0"
          max={props.totalPoints - 1}
          value={props.currentIndex}
          onInput={(e) => props.onSeek(parseInt(e.target.value))}
          disabled={!props.canPlayback}
          class="w-full h-2 bg-pottery-200 rounded-lg appearance-none cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-4
                 [&::-webkit-slider-thumb]:h-4
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-pottery-500
                 [&::-webkit-slider-thumb]:cursor-pointer
                 [&::-webkit-slider-thumb]:hover:bg-pottery-600"
        />
      </div>

      <div class="flex items-center gap-2 mb-4">
        <button
          onClick={() => (props.isPlaying ? props.onPause() : props.onPlay())}
          disabled={!props.canPlayback}
          class="btn-primary flex items-center gap-2 flex-1"
        >
          <Show when={props.isPlaying}>
            <Pause class="w-4 h-4" />
            暂停
          </Show>
          <Show when={!props.isPlaying}>
            <Play class="w-4 h-4" />
            {props.currentIndex > 0 && props.currentIndex < props.totalPoints - 1 ? '继续' : '播放'}
          </Show>
        </button>
        <button
          onClick={props.onReset}
          disabled={!props.canPlayback}
          class="btn-secondary p-2"
          title="重置"
        >
          <RotateCcw class="w-5 h-5" />
        </button>
        <button
          onClick={props.onStop}
          disabled={!props.canPlayback}
          class="btn-secondary p-2"
          title="停止"
        >
          <Square class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-2">
        <span class="text-xs text-pottery-600 block">回放速度</span>
        <div class="flex gap-2">
          <For each={props.availableSpeeds}>
            {(speed) => (
              <button
                onClick={() => props.onSpeedChange(speed)}
                disabled={!props.canPlayback}
                class={`flex-1 py-1.5 text-sm rounded-lg font-medium transition-all duration-200
                  ${
                    props.playbackSpeed === speed
                      ? 'bg-pottery-500 text-white shadow-md'
                      : 'bg-pottery-100 text-pottery-700 hover:bg-pottery-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {speed}x
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
