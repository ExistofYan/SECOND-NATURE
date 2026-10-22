import type { BinId, InputMode } from "./domain";

/** Unified input command — both mouse and gesture paths emit this shape only. */
export type InteractionCommand = {
  type: "move" | "grab" | "release" | "cancel";
  source: InputMode;
  x: number; // stage-local CSS pixels
  y: number;
  timestampMs: number; // performance.now(), one clock domain
  reason?: string;
};

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BinHitArea {
  id: BinId;
  rect: Rect;
}

export type DragPhase = "idle" | "dragging" | "locked";

export interface DragState {
  phase: DragPhase;
  /** Current card top-left in stage-local CSS pixels. */
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
}

export type DragOutcome =
  | { type: "grab_success"; x: number; y: number }
  | { type: "failed_grab"; x: number; y: number }
  | { type: "outside_drop"; x: number; y: number }
  | { type: "drop"; binId: BinId; x: number; y: number }
  | { type: "cancel"; reason?: string };

/** Gesture interpreter output frame, converted into InteractionCommand by the caller. */
export interface GestureFrame {
  available: boolean;
  pinching: boolean;
  /** Smoothed pointer in stage-local CSS pixels (already mirrored + mapped). */
  x: number;
  y: number;
  /** One-shot edge events emitted on this update. */
  events: Array<"grab" | "release" | "lost" | "recovered">;
}
