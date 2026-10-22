import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { interactionConfig } from "../config/interaction";
import type { Landmark } from "../domain/gestureInterpreter";
import { handAssetUrls, loadHandAssets } from './handAssets';

export type HandFrameCallback = (
  landmarks: Landmark[] | null,
  timestampMs: number,
  frame: { width: number; height: number },
) => void;

export class HandModelError extends Error {
  constructor(message: string, readonly detail?: string) {
    super(message);
    this.name = "HandModelError";
  }
}

/**
 * MediaPipe HandLandmarker wrapper (spec §9.1).
 * - one shared video element, one detection loop, VIDEO running mode, numHands 1
 * - detectForVideo only on new frames, monotonically increasing timestamps
 * - GPU init failure falls back to CPU once; real errors surface, never fake landmarks
 */
class HandTrackingService {
  private landmarker: HandLandmarker | null = null;
  private raf: number | null = null;
  private video: HTMLVideoElement | null = null;
  private onFrame: HandFrameCallback | null = null;
  private lastTs = 0;
  private lastVideoTime = -1;
  private running = false;
  private initPromise: Promise<void> | null = null;

  get ready(): boolean {
    return this.landmarker !== null;
  }

  async init(): Promise<void> {
    if (this.landmarker) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const urls = handAssetUrls(import.meta.env.BASE_URL, document.baseURI);
      let vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;
      let model: Uint8Array;
      try {
        vision = await FilesetResolver.forVisionTasks(urls.wasm);
        model = await loadHandAssets(urls.model, vision);
      } catch (err) {
        throw new HandModelError(
          "Hand tracking resources could not load.",
          String((err as Error).message ?? err),
        );
      }
      const create = async (delegate: "GPU" | "CPU") =>
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetBuffer: model, delegate },
          runningMode: "VIDEO",
          numHands: 1,
        });
      try {
        this.landmarker = await create("GPU");
      } catch (gpuErr) {
        try {
          this.landmarker = await create("CPU");
        } catch (cpuErr) {
          this.initPromise = null;
          throw new HandModelError(
            "Hand tracking could not start with GPU or CPU. Try a current Chrome or Edge browser and reload.",
            `GPU: ${String((gpuErr as Error).message ?? gpuErr)} | CPU: ${String((cpuErr as Error).message ?? cpuErr)}`,
          );
        }
      }
    })();
    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  async start(video: HTMLVideoElement, onFrame: HandFrameCallback): Promise<void> {
    await this.init();
    if (!this.landmarker) throw new HandModelError("Hand model not initialised.");
    this.stop();
    this.lastVideoTime = -1;
    this.video = video;
    this.onFrame = onFrame;
    this.running = true;

    const loop = () => {
      if (!this.running || !this.landmarker || !this.video) return;
      const v = this.video;
      if (v.readyState >= 2 && v.videoWidth > 0 && v.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = v.currentTime;
        const ts = performance.now();
        // detectForVideo is sync compute; pace it to the configured target fps
        if (ts - this.lastTs >= 1000 / interactionConfig.handDetectFps - 1) {
          this.lastTs = ts;
          let result: HandLandmarkerResult | null = null;
          try {
            result = this.landmarker.detectForVideo(v, ts);
          } catch (err) {
            const failedFrame = this.onFrame;
            this.stop();
            failedFrame?.(null, ts, { width: v.videoWidth, height: v.videoHeight });
            window.dispatchEvent(new CustomEvent("ecosort:tracking-error", { detail: String((err as Error).message ?? err) }));
            return;
          }
          const hand = result?.landmarks?.[0] ?? null;
          const landmarks: Landmark[] | null =
            hand && hand.length > 17 ? hand.map((p) => ({ x: p.x, y: p.y, z: p.z })) : null;
          this.onFrame?.(landmarks, ts, { width: v.videoWidth, height: v.videoHeight });
        }
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.onFrame = null;
    this.video = null;
  }

  dispose(): void {
    this.stop();
    this.landmarker?.close();
    this.landmarker = null;
    this.initPromise = null;
  }
}

export const handTrackingService = new HandTrackingService();
