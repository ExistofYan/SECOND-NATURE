import type { GestureFrame } from "../types/interaction";

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export interface GestureInterpreterConfig {
  pinchCloseRatio: number; // < -> candidate pinch
  pinchOpenRatio: number; // > -> candidate open (hysteresis band between)
  gestureStableMs: number;
  trackingLossGraceMs: number;
  pointerSmoothingTauMs: number;
  /** palm width below this (px) makes the frame unusable — avoids div-by-zero */
  minPalmWidthPx: number;
}

export interface FrameSize {
  width: number;
  height: number;
}

const TIP_THUMB = 4;
const TIP_INDEX = 8;
const PINKY_MCP = 17;
const INDEX_MCP = 5;

function distPx(a: Landmark, b: Landmark, size: FrameSize): number {
  const dx = (a.x - b.x) * size.width;
  const dy = (a.y - b.y) * size.height;
  return Math.hypot(dx, dy);
}

function finiteLandmarks(lms: unknown, size: FrameSize, minPalm: number): Landmark[] | null {
  if (!Array.isArray(lms) || lms.length <= PINKY_MCP) return null;
  const arr = lms as Landmark[];
  for (const idx of [TIP_THUMB, TIP_INDEX, INDEX_MCP, PINKY_MCP]) {
    const p = arr[idx];
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  }
  const palm = distPx(arr[INDEX_MCP], arr[PINKY_MCP], size);
  if (!Number.isFinite(palm) || palm < minPalm) return null;
  return arr;
}

/**
 * Pure gesture state machine (spec §9.2 / §9.4).
 * Emits one-shot edge events; never repeats grab while holding; a dropout
 * inside the grace window freezes, beyond it emits a single "lost" (-> cancel).
 * Output pointer is mirrored (1 - x) and smoothed in normalised camera space;
 * stage mapping belongs to coordinateMapper.
 */
export class GestureInterpreter {
  private pinching = false;
  private candidate: "pinch" | "open" | null = null;
  private candidateStartMs = 0;
  private handPresent = false;
  private lostEmitted = false;
  /** after a "lost", re-open must stabilise before any new grab */
  private awaitingOpenConfirm = true;
  private lastPresentMs: number | null = null;
  private smoothed: { x: number; y: number } | null = null;

  constructor(private readonly cfg: GestureInterpreterConfig) {}

  reset(): void {
    this.pinching = false;
    this.candidate = null;
    this.candidateStartMs = 0;
    this.handPresent = false;
    this.lostEmitted = false;
    this.awaitingOpenConfirm = true;
    this.lastPresentMs = null;
    this.smoothed = null;
  }

  /**
   * @param landmarks MediaPipe normalised landmarks for one hand, or null when nothing detected
   * @param timestampMs monotonic ms (performance.now clock domain)
   */
  update(landmarks: Landmark[] | null, timestampMs: number, size: FrameSize): GestureFrame {
    const events: GestureFrame["events"] = [];
    const valid = landmarks ? finiteLandmarks(landmarks, size, this.cfg.minPalmWidthPx) : null;

    if (!valid) {
      // Hand absent: never interpret as release. Freeze within grace.
      if (this.handPresent) {
        // started losing now; grace handled by caller's timer via lastPresentMs
        this.handPresent = false;
      }
      const lostSince = this.lastPresentMs === null ? null : timestampMs - this.lastPresentMs;
      if (this.pinching && lostSince !== null && lostSince > this.cfg.trackingLossGraceMs && !this.lostEmitted) {
        events.push("lost");
        this.lostEmitted = true;
        this.pinching = false;
        this.candidate = null;
        this.awaitingOpenConfirm = true;
      }
      return { available: false, pinching: this.pinching, openConfirmed:false, x: this.smoothed?.x ?? 0.5, y: this.smoothed?.y ?? 0.5, events };
    }

    const wasLost = !this.handPresent;
    this.handPresent = true;
    const gap = this.lastPresentMs === null ? 0 : timestampMs - this.lastPresentMs;
    this.lastPresentMs = timestampMs;
    if(gap>this.cfg.trackingLossGraceMs){this.candidate=null;this.pinching=false;this.awaitingOpenConfirm=true;}

    // re-appeared after a real dropout: reset filter so the pointer doesn't fly across
    if (wasLost && gap > this.cfg.trackingLossGraceMs / 2) {
      this.smoothed = null;
    }

    const ratio = distPx(valid[TIP_THUMB], valid[TIP_INDEX], size) /
      distPx(valid[INDEX_MCP], valid[PINKY_MCP], size);
    const wasPinching = this.pinching;

    let nextCandidate = this.candidate;
    if (ratio < this.cfg.pinchCloseRatio) nextCandidate = "pinch";
    else if (ratio > this.cfg.pinchOpenRatio) nextCandidate = "open";
    // inside the hysteresis band: keep previous candidate (hold last state)

    if (nextCandidate !== this.candidate) {
      this.candidate = nextCandidate;
      this.candidateStartMs = timestampMs;
    }

    const stabilized =
      this.candidate !== null &&
      timestampMs - this.candidateStartMs >= this.cfg.gestureStableMs;

    if (stabilized && this.candidate === "open") {
      if (this.awaitingOpenConfirm) {
        events.push("recovered");
        this.awaitingOpenConfirm = false;
        this.lostEmitted = false;
      }
      if (this.pinching) {
        events.push("release");
        this.pinching = false;
      }
    } else if (stabilized && this.candidate === "pinch") {
      // still pinching at recovery time must NOT auto-grab
      if (!this.awaitingOpenConfirm && !this.pinching) {
        events.push("grab");
        this.pinching = true;
      }
    }

    // pointer = index fingertip, mirrored, smoothed (time-based EMA)
    const rawX = 1 - valid[TIP_INDEX].x;
    const rawY = valid[TIP_INDEX].y;
    if (this.smoothed === null) {
      this.smoothed = { x: rawX, y: rawY };
    } else if (this.candidate !== 'pinch' && !(wasPinching && this.candidate === "open")) {
      // Opening thumb/index changes the fingertip position. Hold the aim while
      // confirming release, so an intended drop cannot jump out of its target.
      const dt = Math.max(0, gap);
      const alpha = 1 - Math.exp(-dt / this.cfg.pointerSmoothingTauMs);
      this.smoothed = {
        x: this.smoothed.x + alpha * (rawX - this.smoothed.x),
        y: this.smoothed.y + alpha * (rawY - this.smoothed.y),
      };
    }

    return {
      available: true,
      pinching: this.pinching,
      openConfirmed: !this.awaitingOpenConfirm && this.candidate === 'open' && !this.pinching,
      x: this.smoothed.x,
      y: this.smoothed.y,
      events,
    };
  }

}
