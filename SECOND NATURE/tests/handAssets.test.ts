import {describe, expect, it, vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {handAssetUrls, loadHandAssets} from '../src/services/handAssets';

const model='https://example.com/day/models/hand_landmarker.task';
const vision={wasmLoaderPath:'https://example.com/day/mediapipe/wasm/loader.js',wasmBinaryPath:'https://example.com/day/mediapipe/wasm/model.wasm'};
describe('deployed hand resources',()=>{
  it('resolves root and subfolder resources to absolute page URLs',()=>{
    expect(handAssetUrls('./','https://example.com/day/index.html')).toEqual({wasm:'https://example.com/day/mediapipe/wasm',model});
    expect(handAssetUrls('/','https://example.com/day/')).toEqual({wasm:'https://example.com/mediapipe/wasm',model:'https://example.com/models/hand_landmarker.task'});
  });
  it('loads the model once and checks the selected WASM files',async()=>{
    const fetcher=vi.fn(async(_url:string,init?:RequestInit)=>init?.method==='HEAD'?new Response(null):new Response(new Uint8Array([80,75,3,4,1,2])));
    expect(await loadHandAssets(model,vision,fetcher as typeof fetch)).toEqual(new Uint8Array([80,75,3,4,1,2]));
    expect(fetcher.mock.calls.filter(c=>c[0]===model)).toHaveLength(1);
    expect(fetcher.mock.calls.filter(c=>c[1]?.method==='HEAD')).toHaveLength(2);
  });
  it('names a missing model and explains complete-folder deployment',async()=>{
    const fetcher=vi.fn(async()=>new Response(null,{status:404}));
    await expect(loadHandAssets(model,vision,fetcher as typeof fetch)).rejects.toThrow('/day/models/hand_landmarker.task: HTTP 404. Upload the complete dist folder');
  });
  it('rejects a host fallback page even when it returns HTTP 200',async()=>{
    const fetcher=vi.fn(async(url:string)=>url===model?new Response('<html/>',{headers:{'content-type':'text/html'}}):new Response(null));
    await expect(loadHandAssets(model,vision,fetcher as typeof fetch)).rejects.toThrow('HTML page instead of the asset');
  });
  it('passes the actual aligned MediaPipe task bundle through unchanged',async()=>{
    const bytes=readFileSync(new URL('../public/models/hand_landmarker.task',import.meta.url));
    expect([...bytes.subarray(0,6)]).toEqual([0,0,80,75,3,4]);
    const fetcher=vi.fn(async(url:string)=>url===model?new Response(bytes):new Response(null));
    const loaded=await loadHandAssets(model,vision,fetcher as typeof fetch);
    expect(Buffer.compare(Buffer.from(loaded),bytes)).toBe(0);
  });
  it('rejects an empty model download and identifies a missing WASM binary',async()=>{
    await expect(loadHandAssets(model,vision,(async()=>new Response(null)) as typeof fetch)).rejects.toThrow('download is empty');
    const fetcher=vi.fn(async(url:string)=>url===vision.wasmBinaryPath?new Response(null,{status:404}):url===model?new Response(new Uint8Array([80,75,3,4])):new Response(null));
    await expect(loadHandAssets(model,vision,fetcher as typeof fetch)).rejects.toThrow('/day/mediapipe/wasm/model.wasm: HTTP 404');
  });
});
