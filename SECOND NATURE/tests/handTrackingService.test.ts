// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const harness=vi.hoisted(()=>({workers:[] as any[]}));
class TestWorker {
  onmessage:any; onerror:any; onmessageerror:any; messages:any[]=[]; terminated=false;
  constructor(){harness.workers.push(this);}
  postMessage(message:any){this.messages.push(message);}
  terminate(){this.terminated=true;}
  reply(data:any){this.onmessage?.({data});}
}
import {HandTrackingService} from '../src/services/handTrackingService';
describe('background inference backpressure',()=>{
 let service:HandTrackingService;
 let callbacks:Map<number,FrameRequestCallback>, next:number, time:number;
 const tick=async()=>{time+=40;const pending=[...callbacks.values()];callbacks.clear();for(const cb of pending)cb(time);await Promise.resolve();await Promise.resolve();};
 const video=()=>({readyState:4,videoWidth:1920,videoHeight:1080,currentTime:1}) as HTMLVideoElement;
 beforeEach(()=>{harness.workers.length=0;callbacks=new Map();next=0;time=0;
  vi.stubGlobal('Worker',TestWorker);vi.stubGlobal('OffscreenCanvas',class{});
  vi.stubGlobal('createImageBitmap',vi.fn(async()=>({close:vi.fn()})));
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callbacks.set(++next,cb);return next;});
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>callbacks.delete(id));
  vi.spyOn(performance,'now').mockImplementation(()=>time);
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  service=new HandTrackingService();
 });
 afterEach(()=>{service.dispose();vi.restoreAllMocks();vi.unstubAllGlobals();});
 async function start(v:HTMLVideoElement,receive=vi.fn()){const pending=service.start(v,receive);harness.workers[0].reply({type:'ready',delegate:'CPU'});await pending;return receive;}
 const frames=()=>harness.workers[0].messages.filter((m:any)=>m.type==='frame');
 function reply(request:any){harness.workers[0].reply({type:'result',id:request.id,timestamp:request.timestamp,landmarks:null,width:request.width,height:request.height,inferenceMs:30});}
 it('never queues frames while inference is busy, resizes input, and uses the newest frame next',async()=>{
  const v=video();await start(v);await tick();expect(frames()).toHaveLength(1);
  expect(createImageBitmap).toHaveBeenCalledWith(v,{resizeWidth:640,resizeHeight:360,resizeQuality:'low'});
  v.currentTime=2;await tick();v.currentTime=3;await tick();expect(frames()).toHaveLength(1);
  reply(frames()[0]);await tick();expect(frames()).toHaveLength(2);
  expect(frames()[1].timestamp).toBe(time);
 });
 it('drops stale results after stop/restart and does not infer while hidden',async()=>{
  const v=video(),oldReceive=await start(v);await tick();const stale=frames()[0];service.stop();
  const receive=vi.fn();await service.start(v,receive);v.currentTime=2;await tick();expect(frames()).toHaveLength(1);
  reply(stale);expect(oldReceive).not.toHaveBeenCalled();expect(receive).not.toHaveBeenCalled();
  Object.defineProperty(document,'hidden',{configurable:true,value:true});v.currentTime=3;await tick();expect(frames()).toHaveLength(1);
  Object.defineProperty(document,'hidden',{configurable:true,value:false});await tick();expect(frames()).toHaveLength(2);
  reply(frames()[1]);expect(receive).toHaveBeenCalledTimes(1);
 });
 it('ignores a pre-hide result even if the page is visible again when it arrives',async()=>{
  const v=video(),receive=await start(v);await tick();const request=frames()[0];
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
  reply(request);expect(receive).not.toHaveBeenCalled();v.currentTime=2;await tick();reply(frames()[1]);expect(receive).toHaveBeenCalledOnce();
 });
 it('closes a captured bitmap when stopped before capture finishes',async()=>{
  let finish!:(bitmap:ImageBitmap)=>void;vi.mocked(createImageBitmap).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  await start(video());await tick();service.stop();const close=vi.fn();finish({close} as unknown as ImageBitmap);
  await Promise.resolve();await Promise.resolve();expect(close).toHaveBeenCalledOnce();expect(frames()).toHaveLength(0);
 });
 it('forwards both detected hands to the stable hand selector',async()=>{
  const v=video(),receive=await start(v);await tick();const request=frames()[0];
  const hands=[{landmarks:[{x:.2,y:.3}],handedness:'Left'},{landmarks:[{x:.7,y:.3}],handedness:'Right'}];
  harness.workers[0].reply({type:'result',id:request.id,timestamp:request.timestamp,landmarks:hands[0].landmarks,hands,width:request.width,height:request.height,inferenceMs:30});
  expect(receive).toHaveBeenCalledWith(hands[0].landmarks,request.timestamp,{width:request.width,height:request.height},hands);
 });
});
