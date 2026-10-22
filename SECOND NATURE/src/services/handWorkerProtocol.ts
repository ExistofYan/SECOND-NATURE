import type { Landmark } from '../domain/gestureInterpreter';
export type WorkerRequest =
  | { type: 'init'; wasmUrl: string; modelUrl: string }
  | { type: 'frame'; id: number; bitmap: ImageBitmap; timestamp: number; width: number; height: number };
export type WorkerReply =
  | { type: 'ready'; delegate: 'GPU' | 'CPU' }
  | { type: 'result'; id: number; timestamp: number; landmarks: Landmark[] | null; width: number; height: number; inferenceMs: number }
  | { type: 'error'; message: string };
