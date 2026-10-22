/** Resolve assets against the page, never against the compiled /assets/ module. */
export function handAssetUrls(base: string, pageUrl: string) {
  const root = new URL(base, pageUrl);
  return {
    wasm: new URL('mediapipe/wasm/', root).href.replace(/\/$/, ''),
    model: new URL('models/hand_landmarker.task', root).href,
  };
}

export class HandAssetError extends Error {}

async function request(url: string, method: 'GET' | 'HEAD', fetcher: typeof fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetcher(url, { method, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if ((response.headers.get('content-type') ?? '').includes('text/html')) {
      throw new Error('the server returned an HTML page instead of the asset');
    }
    return method === 'GET' ? new Uint8Array(await response.arrayBuffer()) : null;
  } catch (error) {
    throw new HandAssetError(`Cannot load ${new URL(url).pathname}: ${String((error as Error).message ?? error)}. Upload the complete dist folder, including models and mediapipe, then reload.`);
  } finally {
    clearTimeout(timeout);
  }
}

/** The model is fetched once and reused by both GPU and CPU initialization. */
export async function loadHandAssets(
  modelUrl: string,
  vision: { wasmLoaderPath: string; wasmBinaryPath: string },
  fetcher: typeof fetch = fetch,
): Promise<Uint8Array> {
  const [model] = await Promise.all([
    request(modelUrl, 'GET', fetcher),
    request(vision.wasmLoaderPath, 'HEAD', fetcher),
    request(vision.wasmBinaryPath, 'HEAD', fetcher),
  ]);
  // Task bundles may have alignment bytes before the ZIP header. Pass the
  // original bytes unchanged to MediaPipe, which owns model-format validation.
  if (!model || model.length === 0) {
    throw new HandAssetError('The hand model download is empty. Upload dist/models/hand_landmarker.task from the complete release.');
  }
  return model;
}
