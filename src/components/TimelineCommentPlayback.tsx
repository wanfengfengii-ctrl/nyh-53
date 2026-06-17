import { Component, For, Show, createSignal, createMemo } from 'solid-js';
import type { Point, StandardTrajectory } from '@/types/pottery';
import { Play, Pause, Square, RotateCcw, Gauge, MessageSquarePlus, Trash2, X, Save, Clock } from 'lucide-solid';
import { PLAYBACK_SPEEDS } from '@/types/pottery';

interface TimelineCommentPlaybackProps {
  points: Point[];
  isPlaying: boolean;
  currentIndex: number;
  playbackSpeed: number;
  canPlayback: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek: (index: number) => void;
  selectedTrajectory: StandardTrajectory | null;
  editingTimelineComment: number | null;
  setEditingTimelineComment: (index: number | null) => void;
  onAddTimelineComment: (pointIndex: number, timestamp: number, content: string) => void;
  onDeleteTimelineComment: (id: string) => void;
}

export const TimelineCommentPlayback: Component<TimelineCommentPlaybackProps> = (props) => {
  const [commentText, setCommentText] = createSignal('');

  const timelineMarkers = createMemo(() => {
    if (!props.selectedTrajectory) return [];
    return props.selectedTrajectory.timelineComments.map(c => ({
      ...c,
      position: props.points.length > 1 ? (c.pointIndex / (props.points.length - 1)) * 100 : 0,
    }));
  });

  const handleSliderClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const index = Math.round(percent * (props.points.length - 1));
    props.onSeek(Math.max(0, Math.min(props.points.length - 1, index)));
  };

  const handleAddComment = () => {
    if (!commentText().trim()) return;
    const point = props.points[props.currentIndex];
    props.onAddTimelineComment(
      props.currentIndex,
      point?.timestamp || Date.now(),
      commentText().trim()
    );
    setCommentText('');
  };

  return (
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-pottery-800 flex items-center gap-2">
          <Gauge class="w-4 h-4 text-pottery-500" />
          带时间轴点评回放
        </h4>
        <span class="text-xs text-pottery-500">
          {props.currentIndex} / {props.points.length}
        </span>
      </div>

      <div class="relative mb-2">
        <div
          class="relative w-full h-10 bg-pottery-100 rounded-lg cursor-pointer"
          onClick={handleSliderClick}
        >
          <div
            class="absolute left-0 top-0 h-full bg-pottery-400 rounded-lg transition-all duration-100"
            style={{ width: `${props.points.length > 1 ? (props.currentIndex / (props.points.length - 1)) * 100 : 0}%` }}
          />
          <input
            type="range"
            min="0"
            max={props.points.length - 1}
            value={props.currentIndex}
            onInput={(e) => props.onSeek(parseInt(e.target.value))}
            disabled={!props.canPlayback}
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <For each={timelineMarkers()}>
            {(marker) => (
              <div
                class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                style={{ left: `${marker.position}%` }}
              >
                <div class="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow cursor-pointer" />
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-amber-500 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-[150px] truncate">
                  {marker.content}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <Show when={props.selectedTrajectory && props.selectedTrajectory.timelineComments.length > 0}>
        <div class="mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200 max-h-24 overflow-y-auto no-scrollbar">
          <div class="text-[10px] font-medium text-amber-700 mb-1 flex items-center gap-1">
            <Clock class="w-3 h-3" />
            时间轴点评 ({props.selectedTrajectory!.timelineComments.length})
          </div>
          <div class="space-y-1">
            <For each={props.selectedTrajectory!.timelineComments}>
              {(comment) => (
                <div class="flex items-start gap-2 p-1.5 bg-white rounded text-xs group">
                  <div class="flex-shrink-0 w-10 text-[10px] text-pottery-400 pt-0.5">
                    #{comment.pointIndex}
                  </div>
                  <div class="flex-1 text-pottery-700 leading-relaxed">{comment.content}</div>
                  <button
                    onClick={() => props.onDeleteTimelineComment(comment.id)}
                    class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-cinnabar-50 text-pottery-400 hover:text-cinnabar-600 transition-opacity"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="flex items-center gap-2 mb-3">
        <button
          onClick={() => (props.isPlaying ? props.onPause() : props.onPlay())}
          disabled={!props.canPlayback}
          class="btn-primary flex items-center gap-2 flex-1 text-sm py-2"
        >
          <Show when={props.isPlaying}>
            <Pause class="w-4 h-4" />
            暂停
          </Show>
          <Show when={!props.isPlaying}>
            <Play class="w-4 h-4" />
            {props.currentIndex > 0 && props.currentIndex < props.points.length - 1 ? '继续' : '播放'}
          </Show>
        </button>
        <button
          onClick={props.onReset}
          disabled={!props.canPlayback}
          class="btn-secondary p-2"
          title="重置"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
        <button
          onClick={props.onStop}
          disabled={!props.canPlayback}
          class="btn-secondary p-2"
          title="停止"
        >
          <Square class="w-4 h-4" />
        </button>
        <Show when={props.selectedTrajectory}>
          <button
            onClick={() => {
              if (props.editingTimelineComment === props.currentIndex) {
                props.setEditingTimelineComment(null);
              } else {
                props.setEditingTimelineComment(props.currentIndex);
                setCommentText('');
              }
            }}
            class={`p-2 rounded-lg transition-colors ${
              props.editingTimelineComment === props.currentIndex
                ? 'bg-amber-500 text-white'
                : 'btn-secondary'
            }`}
            title="添加时间轴点评"
          >
            <MessageSquarePlus class="w-4 h-4" />
          </button>
        </Show>
      </div>

      <Show when={props.editingTimelineComment !== null}>
        <div class="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-medium text-amber-700 flex items-center gap-1">
              <MessageSquarePlus class="w-3 h-3" />
              在位置 #{props.currentIndex} 添加点评
            </div>
            <button
              onClick={() => props.setEditingTimelineComment(null)}
              class="p-0.5 rounded hover:bg-amber-100 text-amber-600"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={commentText()}
            onInput={(e) => setCommentText(e.target.value)}
            placeholder="输入此时间点的点评内容..."
            rows={2}
            class="w-full p-2 text-sm rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
          />
          <div class="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              disabled={!commentText().trim()}
              class="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Save class="w-3 h-3" />
              保存点评
            </button>
          </div>
        </div>
      </Show>

      <div class="space-y-2">
        <span class="text-xs text-pottery-600 block">回放速度</span>
        <div class="flex gap-2">
          <For each={PLAYBACK_SPEEDS}>
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
