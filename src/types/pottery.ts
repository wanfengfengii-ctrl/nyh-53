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

export type TrainingPhase = 'base_forming' | 'opening' | 'pulling_up' | 'necking';

export interface PhaseDefinition {
  id: TrainingPhase;
  name: string;
  description: string;
  startHeight: number;
  endHeight: number;
  tips: string[];
  commonMistakes: string[];
}

export interface PhaseEvaluation {
  phaseId: TrainingPhase;
  phaseName: string;
  score: number;
  symmetry: number;
  smoothness: number;
  matching: number;
  maxDeviation: number;
  deviationSegments: DeviationSegment[];
  contour: ContourPoint[];
  weakestMetric: 'symmetry' | 'smoothness' | 'matching';
  diagnosis: string;
}

export interface RealTimeFeedback {
  currentPhaseId: TrainingPhase;
  phaseName: string;
  currentScore: number;
  symmetry: number;
  smoothness: number;
  matching: number;
  hotZones: { height: number; deviation: number; type: 'too_wide' | 'too_narrow' }[];
  tips: string[];
  warnings: string[];
}

export interface ComparisonDetail {
  contourDiffs: { height: number; radiusDiff: number; type: 'wider' | 'narrower' }[];
  gestureDiff: { avgSpeedDiff: number; pressureDiff: number };
}

export interface PhasedEvaluationResult extends EvaluationResult {
  phaseEvaluations: PhaseEvaluation[];
  totalScore: number;
  worstPhase: TrainingPhase;
  worstPhaseScore: number;
  improvementSuggestions: string[];
  practiceRecord: PracticeRecord;
  diagnosisSummary: string;
  strengthPhases: TrainingPhase[];
}

export interface PracticeRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  timestamp: number;
  gesturePoints: Point[];
  contour: ContourPoint[];
  evaluation: PhasedEvaluationResult;
  totalScore: number;
}

export interface PhaseState {
  currentPhase: TrainingPhase;
  phaseProgress: Record<TrainingPhase, boolean>;
  isPhasedMode: boolean;
  phaseContours: Record<TrainingPhase, ContourPoint[]>;
}

export interface PracticeState {
  selectedVessel: Vessel | null;
  gesturePoints: Point[];
  generatedContour: ContourPoint[] | null;
  evaluationResult: EvaluationResult | null;
  phasedEvaluationResult: PhasedEvaluationResult | null;
  isRecording: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  currentPlaybackIndex: number;
  phaseState: PhaseState;
  practiceHistory: PracticeRecord[];
  selectedComparisonRecord: PracticeRecord | null;
  showComparison: boolean;
}

export const TRAINING_PHASES: PhaseDefinition[] = [
  {
    id: 'base_forming',
    name: '底部起坯',
    description: '建立稳定的底部基础，确保器型重心稳定',
    startHeight: 0,
    endHeight: 0.25,
    tips: [
      '双手轻轻扶住泥料两侧，保持压力均匀',
      '拇指放在中心，向外按压形成底部',
      '保持转速稳定，避免过快或过慢',
    ],
    commonMistakes: [
      '底部过薄容易导致变形',
      '双手压力不均造成偏心',
      '底部中心点偏移',
    ],
  },
  {
    id: 'opening',
    name: '开口',
    description: '从底部向上扩展，形成器型的内部空间',
    startHeight: 0.25,
    endHeight: 0.5,
    tips: [
      '拇指从中心向外按压，逐渐扩大口径',
      '保持壁厚均匀，约5-8mm',
      '双手配合，内侧施压外侧支撑',
    ],
    commonMistakes: [
      '开口过快导致壁薄不均',
      '口径过大难以控制后续造型',
      '内壁不平整有凹凸',
    ],
  },
  {
    id: 'pulling_up',
    name: '拉高',
    description: '将泥料向上提拉，形成器型的主体高度',
    startHeight: 0.5,
    endHeight: 0.75,
    tips: [
      '双手呈C形包裹泥料，匀速向上移动',
      '每次提拉高度不超过2cm',
      '保持内壁支撑，防止塌陷',
    ],
    commonMistakes: [
      '提拉过快导致泥料断裂',
      '双手压力不稳定造成粗细不均',
      '器型歪斜不对称',
    ],
  },
  {
    id: 'necking',
    name: '收口',
    description: '修整口部，完成最终的器型轮廓',
    startHeight: 0.75,
    endHeight: 1,
    tips: [
      '用指尖轻轻收拢口部',
      '保持口部圆润平整',
      '修整口沿厚度，使其均匀一致',
    ],
    commonMistakes: [
      '收口过紧导致口部变形',
      '口沿厚薄不均',
      '最终轮廓不流畅',
    ],
  },
];

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface PhaseComment {
  id: string;
  phaseId: TrainingPhase;
  phaseName: string;
  teacherId: string;
  teacherName: string;
  content: string;
  createdAt: number;
  timestampStart?: number;
  timestampEnd?: number;
}

export interface TimelineComment {
  id: string;
  teacherId: string;
  teacherName: string;
  content: string;
  createdAt: number;
  timestamp: number;
  pointIndex: number;
}

export interface StandardTrajectory {
  id: string;
  name: string;
  description: string;
  vesselId: string;
  vesselName: string;
  teacherId: string;
  teacherName: string;
  createdAt: number;
  updatedAt: number;
  gesturePoints: Point[];
  contour: ContourPoint[];
  phaseComments: PhaseComment[];
  timelineComments: TimelineComment[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface KeyDeviationPoint {
  height: number;
  radiusDiff: number;
  type: 'wider' | 'narrower';
  severity: 'low' | 'medium' | 'high';
  relatedComment?: PhaseComment | TimelineComment;
}

export interface PracticeReport {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  teacherName?: string;
  vesselId: string;
  vesselName: string;
  standardTrajectoryId?: string;
  standardTrajectoryName?: string;
  createdAt: number;
  practiceRecord: PracticeRecord;
  standardContour?: ContourPoint[];
  phaseEvaluations: PhaseEvaluation[];
  totalScore: number;
  keyDeviationPoints: KeyDeviationPoint[];
  phaseComments: PhaseComment[];
  timelineComments: TimelineComment[];
  teacherFeedback?: string;
  shareUrl?: string;
  isShared: boolean;
}

export interface SparringSession {
  id: string;
  name: string;
  vesselId: string;
  vesselName: string;
  standardTrajectoryId: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  createdAt: number;
  deadline?: number;
  isActive: boolean;
  studentReports: {
    studentId: string;
    studentName: string;
    reportId: string;
    submittedAt: number;
    score: number;
  }[];
}

export const MIN_POINTS_FOR_CONTOUR = 50;
export const MATCHING_THRESHOLD = 70;
export const MAX_DEVIATION_SEGMENTS = 3;
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;
