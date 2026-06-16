export interface Point {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

export interface ContourPoint {
  height: number;
  radius: number;
}

export interface Vessel {
  id: string;
  name: string;
  description: string;
  targetContour: ContourPoint[];
  previewPath: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DeviationSegment {
  startHeight: number;
  endHeight: number;
  maxDeviation: number;
  deviationType: 'too_wide' | 'too_narrow';
}

export interface EvaluationResult {
  symmetry: number;
  smoothness: number;
  matching: number;
  deviationSegments: DeviationSegment[];
  contour: ContourPoint[];
}

export interface PracticeState {
  selectedVessel: Vessel | null;
  gesturePoints: Point[];
  generatedContour: ContourPoint[] | null;
  evaluationResult: EvaluationResult | null;
  isRecording: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  currentPlaybackIndex: number;
}

export const MIN_POINTS_FOR_CONTOUR = 50;
export const MATCHING_THRESHOLD = 70;
export const MAX_DEVIATION_SEGMENTS = 3;
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;
