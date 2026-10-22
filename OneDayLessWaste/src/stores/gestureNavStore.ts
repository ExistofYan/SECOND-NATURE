import { defineStore } from "pinia";
import { interactionConfig } from "../config/interaction";
import { GestureInterpreter, type Landmark } from "../domain/gestureInterpreter";
import { toStagePoint } from "../domain/coordinateMapper";
import { cameraService } from "../services/cameraService";
import { handTrackingService } from "../services/handTrackingService";
import { useDeviceStore } from "./deviceStore";

let video: HTMLVideoElement | null = null;
let interpreter: GestureInterpreter | null = null;
let startup: Promise<void> | null = null;
let generation = 0;

/** One detection loop and one viewport coordinate system for the entire app. */
export const useGestureNavStore = defineStore("gestureNav", {
  state: () => ({
    running: false, loading: false,
    x: 0, y: 0, pointerActive: false, pinching: false, isDragging: false,
    pressId: 0, consumedPressId: 0, frameId: 0, timestamp: 0, lost: false,
    events: [] as Array<"grab" | "release" | "lost" | "recovered">,
    landmarks: null as Landmark[] | null,
    error: null as string | null,
    inputLocked: false, awaitingRelease: true,
  }),
  getters: {
    mergedActive: (s) => s.running && s.pointerActive,
    mergedPinching: (s) => s.pointerActive && s.pinching,
    mergedX: (s) => s.x,
    mergedY: (s) => s.y,
  },
  actions: {
    rearm() { this.awaitingRelease = true; this.consumedPressId = this.pressId; },
    setVideo(el: HTMLVideoElement | null) { video = el; },
    async enable() {
      if (this.running) return;
      if (startup) return startup;
      if (!video) return;
      const token = generation;
      this.loading = true;
      this.error = null;
      startup = (async () => {
        const device = useDeviceStore();
        if (await device.enableCamera() !== "granted") throw new Error(device.cameraError ?? "Camera unavailable.");
        if (token !== generation) { cameraService.stop(); return; }
        if (!await device.prepareHandModel()) throw new Error(device.modelError ?? "Hand tracking unavailable.");
        if (token !== generation || !video) return;
        video.srcObject = cameraService.getStream();
        await video.play();
        if (token !== generation) return;
        interpreter = new GestureInterpreter(interactionConfig);
        await handTrackingService.start(video, (lms, ts, size) => this.onFrame(lms, ts, size));
        if (token !== generation) { handTrackingService.stop(); return; }
        this.running = true;
      })().catch((err: unknown) => {
        this.error = err instanceof Error ? err.message : String(err);
      }).finally(() => { this.loading = false; startup = null; });
      return startup;
    },
    onFrame(lms: Landmark[] | null, ts: number, size: { width: number; height: number }) {
      if (!interpreter) return;
      const g = interpreter.update(lms, ts, size);
      const p = toStagePoint(g.x, g.y,
        { width: window.innerWidth, height: window.innerHeight },
        { regionMin: interactionConfig.pointerRegionMin, regionMax: interactionConfig.pointerRegionMax, stageInsetPx: 8 });
      this.x = p.x; this.y = p.y;
      this.pointerActive = g.available;
      this.pinching = g.pinching;
      if (g.available && !g.pinching) this.awaitingRelease = false;
      this.landmarks = lms;
      this.events = g.events;
      this.timestamp = ts;
      this.lost = g.events.includes("lost") || (this.lost && !g.events.includes("recovered"));
      if (g.events.includes("grab")) this.pressId++;
      // Publish last so subscribers always receive a complete frame.
      this.frameId++;
      if (g.available && !g.pinching && !this.isDragging) {
        const edge = 45;
        const panel = document.querySelector<HTMLElement>('[data-modal="true"] [role="dialog"]');
        if (panel) {
          const r = panel.getBoundingClientRect();
          if (p.x >= r.left && p.x <= r.right) {
            if (p.y < r.top + edge) panel.scrollBy(0, -10);
            else if (p.y > r.bottom - edge) panel.scrollBy(0, 10);
          }
        } else if (p.y < edge) window.scrollBy(0, -Math.min(14, (edge - p.y) / 3));
        else if (p.y > window.innerHeight - edge) window.scrollBy(0, Math.min(14, (p.y - window.innerHeight + edge) / 3));
      }
    },
    disable() {
      generation++;
      handTrackingService.stop();
      interpreter = null;
      this.running = false; this.pointerActive = false;
      this.pinching = false; this.isDragging = false;
      if (video) video.srcObject = null;
    },
  },
});
