import { interactionConfig } from '../config/interaction';
import type { Landmark } from '../domain/gestureInterpreter';
import type {DetectedHand} from '../domain/multiHandInterpreter';
import { handAssetUrls } from './handAssets';
import type { WorkerReply, WorkerRequest } from './handWorkerProtocol';

export type HandFrameCallback = (landmarks: Landmark[] | null, timestampMs: number,
  frame: { width: number; height: number }, hands?:DetectedHand[]) => void;
export class HandModelError extends Error {
  constructor(message: string, readonly detail?: string) { super(message); this.name = 'HandModelError'; }
}

/** One worker, one transferable frame in flight, and no inference on the UI thread. */
export class HandTrackingService {
  private worker: Worker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private rejectInit: ((error: Error) => void) | null = null;
  private initTimer: ReturnType<typeof setTimeout> | null = null;
  private video: HTMLVideoElement | null = null;
  private onFrame: HandFrameCallback | null = null;
  private running = false;
  private generation = 0;
  private sequence = 0;
  private inFlight: { id: number; generation: number } | null = null;
  private capturing = false;
  private raf: number | null = null;
  private videoCallback: number | null = null;
  private lastTs = -Infinity;
  private lastVideoTime = -1;
  private onVisibility = () => { if (document.hidden) this.generation++; };
  get ready() { return this.initialized; }

  init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    if (typeof Worker === 'undefined' || typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') {
      return Promise.reject(new HandModelError('This browser cannot run background hand tracking. Use a current desktop Chrome or Edge browser.'));
    }
    const urls = handAssetUrls(import.meta.env.BASE_URL, document.baseURI);
    this.initPromise = new Promise<void>((resolve, reject) => {
      this.rejectInit = reject;
      try {
        const workerUrl = new URL('mediapipe/hand-tracking-worker.js', new URL(import.meta.env.BASE_URL, document.baseURI));
        const worker = new Worker(workerUrl, { name: 'ecosort-hand-tracker' });
        this.worker = worker;
        document.addEventListener('visibilitychange', this.onVisibility);
        const fail = (message: string) => this.fail(new HandModelError('Hand tracking could not start.', message));
        worker.onerror = event => { event.preventDefault(); fail(event.message || 'The background worker stopped.'); };
        worker.onmessageerror = () => fail('The browser could not transfer a hand-tracking frame.');
        worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
          if (worker !== this.worker) return;
          if (data.type === 'ready') {
            this.initialized = true;
            if (this.initTimer) clearTimeout(this.initTimer);
            this.initTimer = null; this.rejectInit = null;
            resolve();
          } else if (data.type === 'error') fail(data.message);
          else if (this.inFlight?.id === data.id) {
            const request = this.inFlight;
            this.inFlight = null;
            if (this.running && request.generation === this.generation && !document.hidden) {
              this.onFrame?.(data.landmarks, data.timestamp, { width: data.width, height: data.height }, data.hands);
            }
            // A newer camera frame may have arrived during inference. Consume it
            // now instead of waiting an additional camera callback; capture()
            // still enforces the rate cap, lifecycle and single-frame limit.
            void this.capture();
          }
        };
        this.initTimer = setTimeout(() => fail('Loading timed out. Check the model and WASM resources, then reload.'), 60000);
        worker.postMessage({ type: 'init', wasmUrl: urls.wasm, modelUrl: urls.model } satisfies WorkerRequest);
      } catch (error) { this.fail(error instanceof Error ? error : new Error(String(error))); }
    });
    const pending = this.initPromise;
    return pending.catch(error => { if (this.initPromise === pending) this.initPromise = null; throw error; });
  }

  private fail(error: Error) {
    const active = this.running;
    const reject = this.rejectInit;
    this.rejectInit = null;
    this.stop();
    if (this.initTimer) clearTimeout(this.initTimer);
    this.initTimer = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.worker?.terminate(); this.worker = null;
    this.initialized = false; this.inFlight = null; this.initPromise = null;
    reject?.(error);
    if (active) window.dispatchEvent(new CustomEvent('ecosort:tracking-error', { detail: error.message }));
  }

  async start(video: HTMLVideoElement, onFrame: HandFrameCallback) {
    await this.init();
    this.stop();
    this.video = video; this.onFrame = onFrame; this.running = true;
    this.lastVideoTime = -1; this.lastTs = -Infinity;
    this.schedule();
  }

  private schedule() {
    if (!this.running || !this.video) return;
    if (typeof this.video.requestVideoFrameCallback === 'function') {
      this.videoCallback = this.video.requestVideoFrameCallback(() => {
        this.videoCallback = null; void this.capture(); this.schedule();
      });
    } else {
      this.raf = requestAnimationFrame(() => { this.raf = null; void this.capture(); this.schedule(); });
    }
  }

  private async capture() {
    const video = this.video;
    if (!this.running || !this.worker || !video || document.hidden || this.capturing || this.inFlight ||
      video.readyState < 2 || video.videoWidth === 0 || video.currentTime === this.lastVideoTime) return;
    const timestamp = performance.now();
    if (timestamp - this.lastTs < 1000 / interactionConfig.handDetectFps - 1) return;
    const generation = this.generation;
    this.capturing = true;
    this.lastVideoTime = video.currentTime; this.lastTs = timestamp;
    const width = Math.min(640, video.videoWidth);
    const height = Math.max(1, Math.round(video.videoHeight * width / video.videoWidth));
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(video, { resizeWidth: width, resizeHeight: height, resizeQuality: 'low' });
      if (!this.running || generation !== this.generation || !this.worker || document.hidden) { bitmap.close(); return; }
      const id = ++this.sequence;
      this.inFlight = { id, generation };
      this.worker.postMessage({ type: 'frame', id, bitmap, timestamp, width, height } satisfies WorkerRequest, [bitmap]);
    } catch (error) {
      bitmap?.close();
      if (generation === this.generation && this.running) this.fail(error instanceof Error ? error : new Error(String(error)));
    } finally { this.capturing = false; }
  }

  stop() {
    this.running = false; this.generation++;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    if (this.videoCallback !== null) this.video?.cancelVideoFrameCallback(this.videoCallback);
    this.raf = null; this.videoCallback = null;
    this.onFrame = null; this.video = null;
    // Preserve the in-flight slot until its reply returns; stale results are ignored.
  }

  dispose() {
    const reject = this.rejectInit;
    this.rejectInit = null;
    this.stop();
    this.worker?.terminate(); this.worker = null;
    if (this.initTimer) clearTimeout(this.initTimer);
    this.initTimer = null; this.inFlight = null;
    this.initialized = false; this.initPromise = null;
    reject?.(new HandModelError('Hand tracking setup was cancelled.'));
  }
}
export const handTrackingService = new HandTrackingService();
