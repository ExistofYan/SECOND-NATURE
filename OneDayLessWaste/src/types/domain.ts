// Domain types — implementation contract per EcoSort spec §6.
// Fields may be added, but existing semantics must not change silently.

export type InputMode = "mouse" | "gesture";
export type RecognitionMethod = "qr" | "manual" | "image";
export type SessionKind = "practice" | "study";
export type BinId = string; // defined by the rule profile; a profile may have >3 bins
export type TrialStatus = "submitted" | "skipped" | "timeout" | "aborted";
export type ItemSet = "A" | "B" | "practice";

export interface WasteItem {
  id: string;
  name: string;
  imagePath: string;
  description: string; // visible state info only — must never contain the correct bin
  qrPayload: string;
  set: ItemSet;
}

export interface RuleEntry {
  itemId: string;
  acceptedBinIds: BinId[];
  explanation: string;
  preparation: string[];
  sourceUrls: string[];
  verifiedAt: string | null;
}

export interface RuleBin {
  id: BinId;
  label: string;
  color: string;
  icon: string;
}

export interface RuleProfile {
  id: string;
  version: string;
  label: string;
  location: string | null;
  status: "illustrative" | "verified";
  bins: RuleBin[];
  rules: RuleEntry[];
}

export interface TrialPlan {
  trialId: string;
  conditionIndex: number;
  taskIndex: number;
  itemId: string;
  mode: InputMode;
  set: "A" | "B";
}

export interface TrialResult {
  trialId: string;
  sessionId: string;
  participantId: string;
  itemId: string;
  mode: InputMode;
  ruleProfileId: string;
  ruleVersion: string;
  status: TrialStatus;
  selectedBinId: BinId | null;
  correct: boolean | null;
  recognitionMethod: RecognitionMethod;
  recognitionTimeMs: number | null;
  totalTaskTimeMs: number | null;
  pausedTimeMs: number;
  activeTaskTimeMs: number | null;
  failedGrabCount: number;
  outsideDropCount: number;
  trackingLossCount: number;
  assistanceCount: number;
  eligibleForComparison: boolean;
  exclusionReasons: string[];
  createdAt: string;
}

export type StudyEventType =
  | "session_start"
  | "recognition_start"
  | "item_detected"
  | "recognition_retry"
  | "item_confirmed"
  | "task_start"
  | "grab_success"
  | "failed_grab"
  | "outside_drop"
  | "tracking_loss"
  | "tracking_recovered"
  | "task_pause"
  | "task_resume"
  | "task_submit"
  | "task_timeout"
  | "task_skip"
  | "task_abort"
  | "researcher_assistance"
  | "survey_submit"
  | "session_end";

export interface StudyEvent {
  eventId: string;
  sessionId: string;
  trialId: string | null;
  type: StudyEventType;
  wallTimeISO: string;
  elapsedMs: number | null; // null before the task clock starts
  details: Record<string, string | number | boolean | null>;
}

export interface SurveyResponse {
  sessionId: string;
  conditionIndex: number;
  mode: InputMode;
  ease: number; // 1-5
  engagement: number; // 1-5
  fatigue: number; // 1-5 (high = more tired)
  confidence: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface StudySession {
  schemaVersion: 1;
  sessionId: string;
  kind: SessionKind;
  participantId: string;
  startedAt: string;
  endedAt: string | null;
  sequenceId: 1 | 2 | 3 | 4;
  appVersion: string;
  ruleSnapshot: RuleProfile;
  interactionConfigSnapshot: Record<string, number | string | boolean>;
  plan: TrialPlan[];
  trials: TrialResult[];
  events: StudyEvent[];
  surveys: SurveyResponse[];
}

export interface RecognitionResult {
  itemId: string;
  method: RecognitionMethod;
  confidence: number | null; // QR has no model confidence — never fake a 99%
}

export interface ItemRecognizer {
  init(): Promise<void>;
  detect(video: HTMLVideoElement): Promise<RecognitionResult | null>;
  dispose(): void;
}
