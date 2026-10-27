import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Session, SceneVisit, Timing } from '../domain/story/types';
import { createSession, availableChoices, commitChoice, openVisit, markReady, log, DecisionClock, newTimingSegment } from '../domain/story/sceneEngine';
import { loadSessions, saveSessions } from '../services/storyStorageService';
import { prepareArt } from '../services/storyAssetService';
import { isRatingValue, ratingQuestions } from '../data/story/probes';
export type Page='cover'|'consent'|'practice'|'pre'|'story'|'post'|'ratings'|'summary'|'sessions';
export type Transition='interactive'|'committing'|'aftermath'|'fadeOut'|'blackHold'|'reading'|'fadeIn'|'awaitingRelease';
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const canResume=(s:Session)=>s.pendingTransition||s.status==='active'||s.status==='interrupted'||s.studyPhase==='ratings'||s.kind==='research'&&s.studyPhase!=='summary';
export const useStoryGame=defineStore('story',()=>{
  const session=ref<Session|null>(null), sessions=ref<Session[]>([]), page=ref<Page>('cover'),transition=ref<Transition>('interactive');
  const modal=ref<'pause'|'backpack'|'help'|null>(null),saveError=ref(''),degraded=ref(false),aftermath=ref(''),summaryPage=ref(0),motion=ref(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pauseReasons=ref<string[]>([]);let clock:DecisionClock|null=null; let animationToken=0;
  const displayedIndex=ref(0);
  try{sessions.value=loadSessions();}catch(e){saveError.value=String(e);}
  const currentScene=computed(()=>session.value?.modelSnapshot[session.value.nextSceneIndex]??null);
  const choices=computed(()=>session.value?availableChoices(session.value):[]);
  const visit=computed(()=>session.value?.visits.find(v=>v.sceneId===currentScene.value?.id&&!v.selectedChoiceId)??null);
  const canContinue=computed(()=>sessions.value.some(canResume));
  const inputAllowed=computed(()=>!['committing','aftermath','fadeOut','blackHold','fadeIn'].includes(transition.value));
  function save(){if(!session.value)return;const i=sessions.value.findIndex(s=>s.sessionId===session.value!.sessionId);if(i<0)sessions.value.push(session.value);else sessions.value[i]=session.value;try{saveSessions(sessions.value);saveError.value='';}catch{saveError.value='This session is in memory only. Device storage failed. Export the report before closing this page.';}}
  function event(type:string,payload:Record<string,unknown>={}){if(session.value)log(session.value,type,payload,visit.value);}
  function start(kind:Session['kind']='play',code:string|null=null,collect=false,set:'A'|'B'='A',parent:string|null=null){animationToken++;clock=null;pauseReasons.value=[];modal.value=null;session.value=createSession(kind,code,parent,motion.value,collect,set);page.value='practice';transition.value='awaitingRelease';summaryPage.value=0;save();}
  function practiceDone(){event('practice_completed');if(session.value){session.value.studyPhase=session.value.kind==='research'&&session.value.collectProbes?'pre':'story';page.value=session.value.studyPhase as Page;save();if(page.value==='story')void prepareScene();}}
  function closeClock(){if(!clock||!session.value||!visit.value)return;const t=clock.read();event('decision_segment_closed',{...t}); const v=visit.value;for(const key of ['decisionWallMs','decisionActiveMs','pausedMs'] as const)v[key]=(v[key]??0)+(t[key]??0);clock=null;}
  function pause(reason:string){if(pauseReasons.value.includes(reason))return;pauseReasons.value.push(reason);clock?.pause(reason);event('pause_started',{reason});save();}
  function removePause(reason:string){pauseReasons.value=pauseReasons.value.filter(r=>r!==reason);clock?.resume(reason);event('pause_ended',{reason});}
  function openModal(which:'pause'|'backpack'|'help'){if(!session.value)return;modal.value=which;pause('modal');}
  function resume(){for(const r of [...pauseReasons.value])removePause(r);modal.value=null;transition.value=session.value?.pendingTransition?'reading':'awaitingRelease';save();}
  async function prepareScene(){
    if(!session.value||!currentScene.value)return false;
    const token=++animationToken;transition.value='blackHold';
    const sceneId=currentScene.value.id;const ready=await prepareArt(currentScene.value.artId ?? sceneId);if(token!==animationToken)return false;
    displayedIndex.value=session.value.nextSceneIndex;degraded.value=!ready;const v=openVisit(session.value,ready?'ready':'degraded');v.assetStatus=ready?'ready':'degraded';if(!ready)event('degraded_asset',{sceneId});
    for(const s of session.value.modelSnapshot.slice(session.value.nextSceneIndex+1,session.value.nextSceneIndex+3))void prepareArt(s.artId ?? s.id);
    transition.value='fadeIn';await delay(motion.value?80:450);if(token!==animationToken)return false;
    transition.value='awaitingRelease';save();return true;
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
    const token=++animationToken, sceneId=currentVisit.sceneId;
    session.value=commitChoice(session.value,currentVisit.visitId,choiceId,timing);
    session.value.pendingTransition={visitId:currentVisit.visitId,sceneId,feedback:selected.aftermath};
    aftermath.value=selected.aftermath;
    log(session.value,'transition_started',{from:sceneId},currentVisit);save();
    const started=performance.now();transition.value='fadeOut';await delay(motion.value?80:400);
    if(token!==animationToken)return;
    const committed=session.value.visits.find(v=>v.visitId===currentVisit.visitId)!;
    committed.animationMs=performance.now()-started;
    transition.value='reading';log(session.value,'transition_reading_started',{from:sceneId},committed);save();
  }
  async function continueTransition(){
    if(!session.value||page.value!=='story'||transition.value!=='reading'||modal.value||pauseReasons.value.length||!session.value.pendingTransition)return;
    const pending=session.value.pendingTransition, sessionId=session.value.sessionId;
    const committed=session.value.visits.find(v=>v.visitId===pending.visitId)!;
    const token=++animationToken, started=performance.now();
    transition.value='blackHold';
    log(session.value,'transition_acknowledged',{from:pending.sceneId},committed);
    delete session.value.pendingTransition;save();
    if(session.value.nextSceneIndex>=session.value.modelSnapshot.length){
      page.value=session.value.studyPhase as Page;transition.value='fadeIn';await delay(motion.value?80:450);
      if(token!==animationToken)return;transition.value='awaitingRelease';
    }else if(!await prepareScene())return;
    if(session.value?.sessionId!==sessionId||page.value==='cover')return;
    // Reading time belongs to neither decision time nor animation time.
    committed.animationMs+=performance.now()-started;
    log(session.value,'transition_completed',{from:pending.sceneId,animationMs:committed.animationMs},committed);save();
  }
  function continueSession(id?:string){
    const found=id?sessions.value.find(s=>s.sessionId===id):[...sessions.value].reverse().find(canResume);if(!found)return;
    animationToken++;session.value=JSON.parse(JSON.stringify(found));newTimingSegment();clock=null;pauseReasons.value=[];modal.value=null;
    if(session.value!.studyPhase==='ratings'&&ratingQuestions.every(q=>isRatingValue(session.value!.ratings[q.key])))session.value!.studyPhase='summary';
    if(session.value!.pendingTransition){
      const pending=session.value!.pendingTransition;
      displayedIndex.value=session.value!.modelSnapshot.findIndex(s=>s.id===pending.sceneId);
      aftermath.value=pending.feedback;page.value='story';transition.value='reading';
      if(session.value!.status==='interrupted')session.value!.status='active';
      event('session_resumed',{pendingTransition:true});save();return;
    }
    if(['active','interrupted'].includes(session.value!.status)){session.value!.status='interrupted';event('session_interrupted',{reason:'page_reload_or_return'});session.value!.status='active';event('session_resumed');const v=visit.value;if(v){v.timingInterrupted=true;const ve=session.value!.events.filter(e=>e.sceneVisitId===v.visitId);const lastReady=ve.filter(e=>e.type==='scene_ready').slice(-1)[0];const lastClosed=ve.filter(e=>e.type==='decision_segment_closed').slice(-1)[0];if(lastReady && (!lastClosed||lastReady.seq>lastClosed.seq))v.timingMissing=true;}page.value=session.value!.studyPhase as Page;if(page.value==='story')void prepareScene();else transition.value='awaitingRelease';}
    else {page.value=session.value!.studyPhase as Page;transition.value='awaitingRelease';}
    save();
  }
  function exit(){animationToken++;closeClock();if(session.value&&session.value.status!=='completed'){session.value.status='interrupted';event('session_interrupted',{reason:'ended_and_saved'});}save();modal.value=null;pauseReasons.value=[];page.value='cover';transition.value='awaitingRelease';}
  function abort(){animationToken++;closeClock();if(session.value){delete session.value.pendingTransition;session.value.status='aborted';session.value.endedAt=new Date().toISOString();event('session_aborted');}save();modal.value=null;pauseReasons.value=[];page.value='summary';transition.value='awaitingRelease';}
  function rating(key:string,value:number){
    const question=ratingQuestions.find(q=>q.key===key);
    if(!session.value||page.value!=='ratings'||!question||!isRatingValue(value)||isRatingValue(session.value.ratings[key]))return false;
    session.value.ratings[key]=value;
    event('rating_submitted',{key,value,question:question.title,low:question.low,high:question.high,label:question.labels[value-1]});
    save();return true;
  }
  function probe(phase:string,set:string,questionId:string,choiceId:string,correct:boolean){if(session.value){session.value.probes.push({phase,set,questionId,choiceId,correct});event('probe_answered',{phase,set,questionId,choiceId,correct});save();}}
  function setPage(next:Page){page.value=next;modal.value=null;if(session.value){session.value.studyPhase=next;save();}transition.value='awaitingRelease';if(next==='story')void prepareScene();}
  function hidden(){if(page.value==='story'){pause('page_hidden');closeClock();modal.value='pause';event('session_interrupted',{reason:'page_hidden'});save();}}
  function showSession(s:Session){animationToken++;session.value=s;page.value='summary';summaryPage.value=0;transition.value='awaitingRelease';}
  return {session,sessions,page,transition,modal,saveError,degraded,aftermath,summaryPage,motion,pauseReasons,displayedIndex,currentScene,choices,visit,canContinue,inputAllowed,save,event,start,practiceDone,pause,removePause,openModal,resume,prepareScene,releaseReady,choose,continueTransition,continueSession,exit,abort,rating,probe,setPage,hidden,showSession};
});
