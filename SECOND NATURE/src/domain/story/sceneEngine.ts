import { storyTextFor } from './storyNarrative';
import { scenes, initialInventory } from '../../data/story/scenes';
import type { Choice, Item, Session, StoryEvent, Timing, SceneVisit } from './types';
export const VERSION = 'comic-day-1.2.0';
const clone = <T>(x:T): T => JSON.parse(JSON.stringify(x));
export const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let timingSegmentId = id();
export function newTimingSegment() { timingSegmentId = id(); }
export function log(s:Session, type:string, payload:Record<string,unknown> = {}, visit:SceneVisit | null = null): StoryEvent {
  const e = {eventId:id(),seq:s.events.length+1,wallTimeISO:new Date().toISOString(),elapsedMonotonicMs:performance.now(),timingSegmentId,sceneVisitId:visit?.visitId ?? null,sceneId:visit?.sceneId ?? null,type,payload,schemaVersion:1};
  s.events.push(e); return e;
}
export function createSession(kind:Session['kind']='play', participantCode:string|null=null, parentSessionId:string|null=null, reducedMotion=false, collectProbes=false, probeSet:'A'|'B'='A'): Session {
  const s:Session = {sessionId:id(),schemaVersion:1,modelVersion:VERSION,appVersion:'1.2.0',kind,participantCode,consentAt:kind==='research'?new Date().toISOString():null,startedAt:new Date().toISOString(),endedAt:null,status:'active',parentSessionId,modelSnapshot:clone(scenes),initialInventory:clone(initialInventory),items:clone(initialInventory),events:[],visits:[],nextSceneIndex:0,reducedMotion,ratings:{},probes:[],studyPhase:'practice',collectProbes,probeSet};
  log(s,'session_started',{kind,parentSessionId,reducedMotion});
  if(s.consentAt) log(s,'consent_given',{participantCode});
  return s;
}
export function availableChoices(s:Session, index=s.nextSceneIndex):Choice[] {
  return (s.modelSnapshot[index]?.choices ?? []).filter(c => {
    if(!c.requires) return true;
    const invert=c.requires.startsWith('!'), target=c.requires.replace('!','');
    const has=s.items.some(i=>i.itemId===target && i.carried && (target!=='kit' && target!=='cup' || i.condition==='clean'));
    return invert ? !has : has;
  });
}
export function openVisit(s:Session, assetStatus:SceneVisit['assetStatus']='ready'): SceneVisit {
  const scene=s.modelSnapshot[s.nextSceneIndex]; if(!scene) throw new Error('No next scene');
  const found=s.visits.find(v=>v.sceneId===scene.id && !v.selectedChoiceId); if(found) return found;
  const carrying=s.items.filter(i=>i.carried).map(i=>`${i.itemId}:${i.condition}`).sort().join('+')||'none';
  const variantId=`${scene.id}|carry=${carrying}|fruit=${s.items.filter(i=>/^fruit-[123]$/.test(i.itemId)).length}|paper=${s.items.filter(i=>i.type==='paper').length}|bags=${s.items.filter(i=>i.type==='bag'&&i.origin==='new').length}`;
  const v:SceneVisit={storyText:storyTextFor(s,scene),visitId:id(),sceneId:scene.id,variantId,availableChoiceIds:availableChoices(s).map(c=>c.id),choicePositions:availableChoices(s).map(c=>c.id),readyAt:null,submittedAt:null,selectedChoiceId:null,decisionWallMs:null,decisionActiveMs:null,pausedMs:null,animationMs:0,assetStatus,timingInterrupted:false};
  s.visits.push(v);return v;
}
export function markReady(s:Session,v:SceneVisit) { v.readyAt ??= new Date().toISOString(); log(s,'scene_ready',{assetStatus:v.assetStatus,availableChoiceIds:v.availableChoiceIds,variantId:v.variantId},v); }
export function commitChoice(source:Session, visitId:string, choiceId:string, timing:Timing):Session {
  const previous=source.visits.find(v=>v.visitId===visitId); if(!previous) throw new Error('Unknown visit');
  if(previous.selectedChoiceId) return source; // idempotent even after advancing
  if(source.status!=='active' || source.modelSnapshot[source.nextSceneIndex]?.id!==previous.sceneId) throw new Error('Scene is not active');
  const choice=availableChoices(source).find(c=>c.id===choiceId); if(!choice) throw new Error('Choice unavailable');
  const s=clone(source), v=s.visits.find(v=>v.visitId===visitId)!;
  const commitId=id();
  const emitItem = (item:Item,type:string) => log(s,type,{choiceCommitId:commitId,item:clone(item)},v);
  for(const e of choice.effects) {
    if(e.type==='acquire') {
      if(s.items.some(i=>i.itemId===e.item.itemId)) throw new Error(`Duplicate item ${e.item.itemId}`);
      s.items.push(clone(e.item));emitItem(e.item,'item_acquired');
    } else if(e.type==='update') {
      for(const iid of e.ids){ const i=s.items.find(x=>x.itemId===iid); if(!i) throw new Error(`Missing item ${iid}`); Object.assign(i,e.patch);emitItem(i,e.patch.destination==='eaten'?'item_consumed':e.patch.destination?'item_destination_changed':'item_condition_changed'); }
    } else if(e.type==='pack') {
      for(const i of s.items.filter(x=>x.reusable)){ i.carried=e.ids.includes(i.itemId);emitItem(i,'item_condition_changed'); }
    } else {
      for(const i of s.items) {
        if(i.reusable) { i.condition='clean'; i.destination='retained';emitItem(i,'item_condition_changed'); continue; }
        if(i.material==='food' || !['pending','in_use'].includes(i.destination)) continue;
        if(e.mode==='keep' && i.retainable){i.destination='retained'; i.condition='clean';}
        else {i.destination=e.mode==='mixed'?'general':i.material==='paper'&&i.retainable || i.type==='bottle'?'recycling':'general';i.holder='collection';}
        emitItem(i,'item_destination_changed');
      }
    }
  }
  Object.assign(v,timing,{selectedChoiceId:choice.id,submittedAt:new Date().toISOString()});
  log(s,'choice_committed',{choiceCommitId:commitId,choiceId:choice.id,label:choice.label,feedback:choice.aftermath,effects:choice.effects,nextSceneId:s.modelSnapshot[s.nextSceneIndex+1]?.id ?? null,...timing},v);
  s.nextSceneIndex++;
  if(s.nextSceneIndex===s.modelSnapshot.length){s.status='completed';s.endedAt=new Date().toISOString();s.studyPhase=s.kind==='research'?(s.collectProbes?'post':'ratings'):'summary';log(s,'session_completed');}
  return s;
}
export function replayItems(s:Session): Item[] {const map=new Map(s.initialInventory.map(i=>[i.itemId,clone(i)]));for(const e of s.events) if(e.type.startsWith('item_') && e.payload.item){ const i=e.payload.item as Item;map.set(i.itemId,clone(i));}return [...map.values()];}
export function unionMs(intervals:Array<[number,number]>,from=0,to=Infinity):number {
  const xs=intervals.map(([a,b])=>[Math.max(from,a),Math.min(to,b)]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
  let total=0,end=from; for(const [a,b] of xs){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return total;
}
export class DecisionClock {
  start:number; reasons=new Map<string,number>(); intervals:Array<[number,number]>=[];
  constructor(now=performance.now()){this.start=now;}
  pause(reason:string,now=performance.now()){if(!this.reasons.has(reason))this.reasons.set(reason,now);}
  resume(reason:string,now=performance.now()){const a=this.reasons.get(reason);if(a!==undefined){this.intervals.push([a,now]);this.reasons.delete(reason);}}
  read(now=performance.now()):Timing {const wall=Math.max(0,now-this.start), paused=unionMs([...this.intervals,...[...this.reasons.values()].map(a=>[a,now] as [number,number])],this.start,now);return {decisionWallMs:wall,decisionActiveMs:Math.max(0,wall-paused),pausedMs:paused};}
}
