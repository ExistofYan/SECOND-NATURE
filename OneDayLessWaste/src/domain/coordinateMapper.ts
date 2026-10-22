export interface StageSize {
  width: number;
  height: number;
}

export interface MappedPoint {
  /** stage-local CSS pixels, clamped to the stage */
  x: number;
  y: number;
}

export interface MapperConfig {
  /** camera normalised region mapped onto the full stage (spec §9.3) */
  regionMin: number; // e.g. 0.15
  regionMax: number; // e.g. 0.85
  /** safe-area inset on the stage in px so the pointer can reach edges */
  stageInsetPx: number;
}

/**
 * Maps a mirrored, smoothed normalised pointer (x already flipped by the
 * gesture interpreter) into stage-local CSS pixels.
 * Pure + sync; tested in tests/coordinateMapper.test.ts.
 */
export function toStagePoint(nx: number, ny: number, stage: StageSize, cfg: MapperConfig): MappedPoint {
  const span = cfg.regionMax - cfg.regionMin;
  if (span <= 0) {
    throw new Error("coordinateMapper: regionMax must be greater than regionMin");
  }
  const fit = (n: number, size: number) => {
    const t = Math.min(1, Math.max(0, (n - cfg.regionMin) / span)); // camera region -> [0,1]
    const inset = Math.min(cfg.stageInsetPx, size / 2);
    return inset + t * (size - 2 * inset); // -> stage safe area
  };
  return {
    x: Math.min(stage.width, Math.max(0, fit(nx, stage.width))),
    y: Math.min(stage.height, Math.max(0, fit(ny, stage.height))),
  };
}

export interface VideoOverlayRect {
  /** where the actual video content sits inside the preview element (object-fit: contain) */
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * For drawing the hand skeleton ON the mirrored preview: takes unmirrored
 * normalised landmarks and the preview element + intrinsic video sizes,
 * accounts for object-fit contain letterboxing and the mirror flip.
 * Must NOT be fed stage control coordinates.
 */
export function toVideoOverlayPoint(
  normX: number,
  normY: number,
  previewEl: { width: number; height: number },
  video: { videoWidth: number; videoHeight: number },
): MappedPoint {
  const box = containRect(previewEl.width, previewEl.height, video.videoWidth, video.videoHeight);
  // mirrored to match the CSS-mirrored preview
  return {
    x: box.x + (1 - normX) * box.w,
    y: box.y + normY * box.h,
  };
}

export function containRect(
  elW: number,
  elH: number,
  videoW: number,
  videoH: number,
): VideoOverlayRect {
  if (videoW <= 0 || videoH <= 0 || elW <= 0 || elH <= 0) {
    return { x: 0, y: 0, w: elW, h: elH };
  }
  const scale = Math.min(elW / videoW, elH / videoH);
  const w = videoW * scale;
  const h = videoH * scale;
  return { x: (elW - w) / 2, y: (elH - h) / 2, w, h };
}

/** clientX/Y -> stage-local CSS px (spec §9.3: all DOM hit maths in one space) */
export function clientToStage(
  clientX: number,
  clientY: number,
  stageRect: { left: number; top: number },
): MappedPoint {
  return { x: clientX - stageRect.left, y: clientY - stageRect.top };
}
