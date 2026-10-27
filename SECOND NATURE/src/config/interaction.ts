/**
 * Tunable interaction parameters (spec §9.2 table).
 * These are engineering starting points, not universal optima.
 * Any change during user trials must be recorded in docs/acceptance.md.
 */
export const interactionConfig = {
  /** pinch candidate: ratio below this starts candidate "pinched" */
  pinchCloseRatio: 0.3,
  /** pinch candidate: ratio above this starts candidate "open" (hysteresis) */
  pinchOpenRatio: 0.45,
  /** how long a candidate state must persist before switching */
  gestureStableMs: 70,
  /** grace window a short hand dropout is frozen, not cancelled */
  trackingLossGraceMs: 300,
  /** pointer smoothing time constant (alpha = 1 - exp(-dt/tau)) */
  pointerSmoothingTauMs: 35,
  /** hard timeout per formal trial, measured in active time */
  taskTimeoutMs: 60_000,
  /** QR frames per second cap */
  qrScanFps: 6,
  /** consecutive stable reads required before a candidate appears */
  qrStableReads: 3,
  /** hand detection target frequency */
  handDetectFps: 60,
  /** normalised camera-region -> stage mapping window (spec §9.3) */
  pointerRegionMin: 0.15,
  pointerRegionMax: 0.85,
  /** minimum plausible palm width in pixels; below this the frame is unusable */
  minPalmWidthPx: 20,
  /** scan hint after no result */
  scanNoResultHintMs: 8_000,
} as const;

export type InteractionConfig = typeof interactionConfig;

export function configSnapshot(): Record<string, number | string | boolean> {
  return { ...interactionConfig };
}

export const APP_VERSION = "1.2.2";
export const STORAGE_KEY = "ecosort:sessions:v1";
export const SCHEMA_VERSION = 1 as const;
