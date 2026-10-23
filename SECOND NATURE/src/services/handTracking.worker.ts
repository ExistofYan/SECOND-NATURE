import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { loadHandAssets } from './handAssets';
import type { WorkerRequest, WorkerReply } from './handWorkerProtocol';
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerReply): void;
};
let tracker: HandLandmarker | null = null;
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
scope.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const vision = await FilesetResolver.forVisionTasks(data.wasmUrl);
      const model = await loadHandAssets(data.modelUrl, vision);
      const canvas = new OffscreenCanvas(640, 480);
      const create = (delegate: 'GPU' | 'CPU') => HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetBuffer: model, delegate },
        canvas, runningMode: 'VIDEO', numHands: 2,
      });
      let delegate: 'GPU' | 'CPU' = 'GPU';
      try { tracker = await create('GPU'); }
      catch (gpuError) {
        delegate = 'CPU';
        try { tracker = await create('CPU'); }
        catch (cpuError) { throw new Error('GPU: ' + message(gpuError) + ' | CPU: ' + message(cpuError)); }
      }
      scope.postMessage({ type: 'ready', delegate });
    } else {
      try {
        if (!tracker) throw new Error('Hand tracking is not ready. Reload the page.');
        const started = performance.now();
        const result = tracker.detectForVideo(data.bitmap, data.timestamp);
        const hand = result.landmarks[0];
        scope.postMessage({
          type: 'result', id: data.id, timestamp: data.timestamp,
          landmarks: hand?.length > 17 ? hand.map(p => ({ x: p.x, y: p.y, z: p.z })) : null,
          hands:result.landmarks.map((landmarks,i)=>({landmarks:landmarks.map(p=>({x:p.x,y:p.y,z:p.z})),handedness:result.handedness[i]?.[0]?.categoryName,score:result.handedness[i]?.[0]?.score})),
          width: data.width, height: data.height, inferenceMs: performance.now() - started,
        });
      } finally { data.bitmap.close(); }
    }
  } catch (error) { scope.postMessage({ type: 'error', message: message(error) }); }
};
