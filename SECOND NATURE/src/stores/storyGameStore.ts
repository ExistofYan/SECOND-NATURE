import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Session, SceneVisit, Timing } from '../domain/story/types';
import { createSession, availableChoices, commitChoice, openVisit, markReady, log, DecisionClock, newTimingSegment } from '../domain/story/sceneEngine';
import { loadSessions, saveSessions } from '../services/storyStorageService';
import { prepareArt } from '../services/storyAssetService';
export type Page='cover'|'consent'|'practice'|'pre'|'story'|'post'|'ratings'|'summary'|'sessions';
export type Transition='interactive'|'committing'|'aftermath'|'fadeOut'|'blackHold'|'fadeIn'|'awaitingRelease';
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export const useStoryGame=defineStore('story',()=>{
  const session=ref<Session|null>(null), sessions=ref<Session[]>([]), page=ref<Page>('cover'),transition=ref<Transition>('interactive');
  const modal=ref<'pause'|'backpack'|'help'|null>(null),saveError=ref(''),degraded=ref(false),aftermath=ref(''),summaryPage=ref(0),motion=ref(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pauseReasons=ref<string[]>([]);let clock:DecisionClock|null=null; let animationToken=0;
  const displayedIndex=ref(0);
  try{sessions.value=loadSessions();}catch(e){saveError.value=String(e);}
  const currentScene=computed(()=>session.value?.modelSnapshot[session.value.nextSceneIndex]??null);
  const choices=computed(()=>session.value?availableChoices(session.value):[]);
  const visit=computed(()=>session.value?.visits.find(v=>v.sceneId===currentScene.value?.id&&!v.selectedChoiceId)??null);
  const canContinue=computed(()=>sessions.value.some(s=>s.status==='active'||s.status==='interrupted'||s.kind==='research'&&s.studyPhase!=='summary'));
  const inputAllowed=computed(()=>!['committing','aftermath','fadeOut','blackHold','fadeIn'].includes(transition.value));
  function save(){if(!session.value)return;const i=sessions.value.findIndex(s=>s.sessionId===session.value!.sessionId);if(i<0)sessions.value.push(session.value);else sessions.value[i]=session.value;try{saveSessions(sessions.value);saveError.value='';}catch{saveError.value='This session is in memory only. Device storage failed. Export the report before closing this page.';}}
  function event(type:string,payload:Record<string,unknown>={}){if(session.value)log(session.value,type,payload,visit.value);}
  function start(kind:Session['kind']='play',code:string|null=null,collect=false,set:'A'|'B'='A',parent:string|null=null){clock=null;pauseReasons.value=[];modal.value=null;session.value=createSession(kind,code,parent,motion.value,collect,set);page.value='practice';transition.value='awaitingRelease';summaryPage.value=0;save();}
  function practiceDone(){event('practice_completed');if(session.value){session.value.studyPhase=session.value.kind==='research'&&session.value.collectProbes?'pre':'story';page.value=session.value.studyPhase as Page;save();if(page.value==='story')void prepareScene();}}
  function closeClock(){if(!clock||!session.value||!visit.value)return;const t=clock.read();event('decision_segment_closed',{...t}); const v=visit.value;for(const key of ['decisionWallMs','decisionActiveMs','pausedMs'] as const)v[key]=(v[key]??0)+(t[key]??0);clock=null;}
  function pause(reason:string){if(pauseReasons.value.includes(reason))return;pauseReasons.value.push(reason);clock?.pause(reason);event('pause_started',{reason});save();}
  function removePause(reason:string){pauseReasons.value=pauseReasons.value.filter(r=>r!==reason);clock?.resume(reason);event('pause_ended',{reason});}
  function openModal(which:'pause'|'backpack'|'help'){if(!session.value)return;modal.value=which;pause('modal');}
  function resume(){for(const r of [...pauseReasons.value])removePause(r);modal.value=null;transition.value='awaitingRelease';save();}
  async function prepareScene(){
    if(!session.value||!currentScene.value)return;
    const token=++animationToken;transition.value='blackHold';
    const sceneId=currentScene.value.id;const ready=await prepareArt(sceneId);if(token!==animationToken)return;
    displayedIndex.value=session.value.nextSceneIndex;degraded.value=!ready;const v=openVisit(session.value,ready?'ready':'degraded');v.assetStatus=ready?'ready':'degraded';if(!ready)event('degraded_asset',{sceneId});
    for(const s of session.value.modelSnapshot.slice(session.value.nextSceneIndex+1,session.value.nextSceneIndex+3))void prepareArt(s.id);
    transition.value='fadeIn';await delay(motion.value?80:450);if(token!==animationToken)return;
    transition.value='awaitingRelease';save();
  }
  function releaseReady(){
    if(transition.value!=='awaitingRelease'||modal.value||pauseReasons.value.length)return;
    transition.value='interactive';if(page.value==='story'&&session.value&&visit.value&&!clock){markReady(session.value,visit.value);clock=new DecisionClock();save();}
  }
  async function choose(choiceId:string){
    if(!session.value||page.value!=='story'||transition.value!=='interactive'||modal.value||pauseReasons.value.length||!visit.value||!clock)return;
    const currentVisit=visit.value, selected=choices.value.find(c=>c.id===choiceId);if(!selected)return;
    transition.value='committing';closeClock();
    const timing:Timing={decisionWallMs:currentVisit.timingMissing?null:currentVisit.decisionWallMs,decisionActiveMs:currentVisit.timingMissing?null:currentVisit.decisionActiveMs,pausedMs:currentVisit.timingMissing?null:currentVisit.pausedMs};
    const sceneId=currentVisit.sceneId;session.value=commitChoice(session.value,currentVisit.visitId,choiceId,timing);save();
    aftermath.value=selected.aftermath;transition.value='aftermath';const started=performance.now();await delay(motion.value?80:650);
    log(session.value,'transition_started',{from:sceneId},currentVisit);transition.value='fadeOut';await delay(motion.value?80:400);
    transition.value='blackHold';await delay(motion.value?40:350);
    if(session.value.nextSceneIndex>=16){page.value=session.value.studyPhase as Page;transition.value='fadeIn';await delay(motion.value?80:450);transition.value='awaitingRelease';}
    else await prepareScene();
    const committed=session.value.visits.find(v=>v.visitId===currentVisit.visitId)!;committed.animationMs=performance.now()-started;log(session.value,'transition_completed',{from:sceneId,animationMs:committed.animationMs},committed);save();
  }
  function continueSession(id?:string){
    const found=id?sessions.value.find(s=>s.sessionId===id):[...sessions.value].reverse().find(s=>s.status==='active'||s.status==='interrupted'||s.kind==='research'&&s.studyPhase!=='summary');if(!found)return;
    session.value=JSON.parse(JSON.stringify(found));newTimingSegment();clock=null;pauseReasons.value=[];modal.value=null;
    if(['active','interrupted'].includes(session.value!.status)){session.value!.status='interrupted';event('session_interrupted',{reason:'page_reload_or_return'});session.value!.status='active';event('session_resumed');const v=visit.value;if(v){v.timingInterrupted=true;const ve=session.value!.events.filter(e=>e.sceneVisitId===v.visitId);const lastReady=ve.filter(e=>e.type==='scene_ready').slice(-1)[0];const lastClosed=ve.filter(e=>e.type==='decision_segment_closed').slice(-1)[0];if(lastReady && (!lastClosed||lastReady.seq>lastClosed.seq))v.timingMissing=true;}page.value=session.value!.studyPhase as Page;if(page.value==='story')void prepareScene();else transition.value='awaitingRelease';}
    else {page.value=session.value!.studyPhase as Page;transition.value='awaitingRelease';}
    save();
  }
  function exit(){closeClock();if(session.value&&session.value.status!=='completed'){session.value.status='interrupted';event('session_interrupted',{reason:'ended_and_saved'});}save();modal.value=null;pauseReasons.value=[];page.value='cover';transition.value='awaitingRelease';}
  function abort(){closeClock();if(session.value){session.value.status='aborted';session.value.endedAt=new Date().toISOString();event('session_aborted');}save();modal.value=null;pauseReasons.value=[];page.value='summary';transition.value='awaitingRelease';}
  function rating(key:string,value:number){if(session.value){session.value.ratings[key]=value;event('rating_submitted',{key,value});save();}}
  function probe(phase:string,set:string,questionId:string,choiceId:string,correct:boolean){if(session.value){session.value.probes.push({phase,set,questionId,choiceId,correct});event('probe_answered',{phase,set,questionId,choiceId,correct});save();}}
  function setPage(next:Page){page.value=next;modal.value=null;if(session.value){session.value.studyPhase=next;save();}transition.value='awaitingRelease';if(next==='story')void prepareScene();}
  function hidden(){if(page.value==='story'){pause('page_hidden');closeClock();modal.value='pause';event('session_interrupted',{reason:'page_hidden'});save();}}
  function showSession(s:Session){session.value=s;page.value='summary';summaryPage.value=0;transition.value='awaitingRelease';}
  return {session,sessions,page,transition,modal,saveError,degraded,aftermath,summaryPage,motion,pauseReasons,displayedIndex,currentScene,choices,visit,canContinue,inputAllowed,save,event,start,practiceDone,pause,removePause,openModal,resume,prepareScene,releaseReady,choose,continueSession,exit,abort,rating,probe,setPage,hidden,showSession};
});
