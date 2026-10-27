// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createApp,nextTick,type App as VueApp} from 'vue';
import {createPinia,setActivePinia} from 'pinia';
import App from '../src/App.vue';
import {useGestureNavStore} from '../src/stores/gestureNavStore';
import {useStoryGame} from '../src/stores/storyGameStore';
import {createSession,openVisit,commitChoice,availableChoices} from '../src/domain/story/sceneEngine';
import {ratingQuestions} from '../src/data/story/probes';
import {STORY_KEY} from '../src/services/storyStorageService';
import {buildStoryPdf} from '../src/services/storyPdfService';
import {resetGestureHitTest} from '../src/services/gestureHitTest';

let app:VueApp|null=null;
beforeEach(()=>{
 vi.useFakeTimers();localStorage.clear();resetGestureHitTest();document.body.innerHTML='<div id="app"></div>';
 setActivePinia(createPinia());
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 vi.stubGlobal('Image',class{onload:(()=>void)|null=null;set src(_v:string){queueMicrotask(()=>this.onload?.());}});
});
afterEach(()=>{app?.unmount();app=null;vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});

function almostFinished(kind:'play'|'research'='play',probes=false){
 let s=createSession(kind,kind==='research'?'P01':null,null,false,probes);
 while(s.nextSceneIndex<s.modelSnapshot.length-1){const v=openVisit(s);s=commitChoice(s,v.visitId,availableChoices(s)[0].id,{decisionActiveMs:1000,decisionWallMs:1000,pausedMs:0});}
 s.studyPhase='story';return s;
}
function completedLegacy(){
 const s=almostFinished(),v=openVisit(s);
 const completed=commitChoice(s,v.visitId,'keep',{decisionActiveMs:1000,decisionWallMs:1000,pausedMs:0});
 completed.studyPhase='summary';completed.appVersion='1.2.0';return completed;
}

it.each(['play','research'] as const)('records four fresh gesture ratings after %s and includes those answers in the PDF',async kind=>{
 const pinia=createPinia(),nav=useGestureNavStore(pinia),game=useStoryGame(pinia);
 vi.spyOn(nav,'enable').mockResolvedValue(undefined);
 app=createApp(App);app.use(pinia);app.mount('#app');
 const session=almostFinished(kind);game.sessions.push(session);game.continueSession(session.sessionId);
 await vi.advanceTimersByTimeAsync(600);game.releaseReady();
 const finish=game.choose('keep');await vi.advanceTimersByTimeAsync(500);await finish;
 expect(game.page).toBe('story');expect(game.transition).toBe('reading');
 const next=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;await nextTick();
 expect(game.page).toBe('ratings');expect(document.querySelectorAll('[data-rating-value]')).toHaveLength(5);
 expect(document.querySelector('input,textarea')).toBeNull();
 nav.running=true;nav.pointerActive=true;
 let target:Element|null=null;
 Object.defineProperty(document,'elementFromPoint',{configurable:true,value:()=>target});
 const scores=[2,4,5,3];
 for(let i=0;i<ratingQuestions.length;i++){
  expect(document.querySelector('.experience-page h1')?.textContent).toBe(ratingQuestions[i].title);
  target=document.querySelector(`[data-rating-value="${scores[i]}"]`);
  expect(target?.textContent).toContain(ratingQuestions[i].labels[scores[i]-1]);
  // Native mouse click does not submit a response.
  (target as HTMLButtonElement).click();await nextTick();
  expect(game.session!.ratings[ratingQuestions[i].key]).toBeUndefined();
  nav.pinching=false;nav.awaitingRelease=false;nav.frameId++;await nextTick();
  // The first open frame also unlocks the post-transition screen; a second
  // stable open frame rearms the gesture before the next actual pinch.
  nav.awaitingRelease=false;nav.frameId++;await nextTick();
  nav.pinching=true;nav.pressId++;nav.frameId++;await nextTick();
  expect(game.session!.ratings[ratingQuestions[i].key]).toBe(scores[i]);
  expect(game.session!.events.filter(e=>e.type==='rating_submitted')).toHaveLength(i+1);
  const saved=JSON.parse(localStorage.getItem(STORY_KEY)!)[0];
  expect(saved.ratings[ratingQuestions[i].key]).toBe(scores[i]);
  // A held pinch cannot answer the next question.
  nav.frameId++;await nextTick();
  expect(game.session!.events.filter(e=>e.type==='rating_submitted')).toHaveLength(i+1);
  if(i===0){
   game.exit();expect(game.canContinue).toBe(true);game.continueSession();await nextTick();
   expect(game.page).toBe('ratings');
   expect(document.querySelector('.experience-page h1')?.textContent).toBe(ratingQuestions[1].title);
  }
 }
 expect(game.page).toBe('summary');expect(game.session!.studyPhase).toBe('summary');expect(game.canContinue).toBe(false);
 expect(game.session!.ratings).toEqual({ease:2,fatigue:4,coherence:5,clarity:3});
 for(const e of game.session!.events.filter(e=>e.type==='rating_submitted')){
  expect(e.wallTimeISO).toBeTruthy();expect(e.payload.question).toBeTruthy();expect(e.payload.label).toBeTruthy();
 }
 const pdf=new TextDecoder().decode(buildStoryPdf(game.session!));
 expect(pdf).toContain('Your four experience ratings');expect(pdf).toContain('4 of 4 ratings submitted');
 scores.forEach(n=>expect(pdf).toContain(`(${n} / 5)`));
});

it('keeps optional research post-checks before the four experience ratings',()=>{
 const s=almostFinished('research',true),v=openVisit(s);
 const completed=commitChoice(s,v.visitId,'keep',{decisionActiveMs:1,decisionWallMs:1,pausedMs:0});
 expect(completed.studyPhase).toBe('post');
});

it('rejects out-of-range, fractional, unknown and duplicate ratings',()=>{
 const game=useStoryGame();game.start();game.setPage('ratings');
 for(const n of [0,6,2.5,NaN])expect(game.rating('ease',n)).toBe(false);
 expect(game.rating('unknown',3)).toBe(false);expect(game.session!.ratings).toEqual({});
 expect(game.rating('ease',2)).toBe(true);expect(game.rating('ease',5)).toBe(false);
 expect(game.session!.ratings.ease).toBe(2);
});

it.each(['view','resume'] as const)('opens unanswered feedback from a legacy completed day via %s without replacing its original data',entry=>{
 const game=useStoryGame(),s=completedLegacy(),original=JSON.parse(JSON.stringify(s));game.sessions.push(s);
 expect(game.canContinue).toBe(true);
 if(entry==='view')game.showSession(s);else game.continueSession(s.sessionId);
 expect(game.page).toBe('ratings');expect(game.session!.ratings).toEqual({});
 expect(game.session!.sessionId).toBe(original.sessionId);expect(game.session!.appVersion).toBe('1.2.0');
 expect(game.session!.visits).toEqual(original.visits);expect(game.session!.endedAt).toBe(original.endedAt);
 expect(game.session!.events.slice(0,original.events.length)).toEqual(original.events);
 const opened=game.session!.events[game.session!.events.length-1];
 expect(opened.type).toBe('ratings_opened');
 expect(opened.payload.storyEndedAt).toBe(original.endedAt);
});

it('provides a visible gesture entry from results that are already open',async()=>{
 const pinia=createPinia(),nav=useGestureNavStore(pinia),game=useStoryGame(pinia);
 vi.spyOn(nav,'enable').mockResolvedValue(undefined);
 app=createApp(App);app.use(pinia);app.mount('#app');
 const s=completedLegacy();game.sessions.push(s);game.session=s;game.setPage('summary');await nextTick();
 const target=document.querySelector<HTMLButtonElement>('.open-feedback')!;
 expect(target.textContent).toContain('Rate my experience');
 expect(document.querySelector('.feedback-banner')?.textContent).toContain('0 / 4 answered');
 Object.defineProperty(document,'elementFromPoint',{configurable:true,value:()=>target});
 nav.running=true;nav.pointerActive=true;nav.pinching=false;nav.awaitingRelease=false;nav.frameId++;await nextTick();
 nav.awaitingRelease=false;nav.frameId++;await nextTick();
 nav.pinching=true;nav.pressId++;nav.frameId++;await nextTick();
 expect(game.page).toBe('ratings');expect(document.querySelectorAll('[data-rating-value]')).toHaveLength(5);
});

it('routes an old final caption to ratings even if its stored next page is summary',async()=>{
 const game=useStoryGame(),s=completedLegacy(),v=s.visits[s.visits.length-1];
 s.pendingTransition={visitId:v.visitId,sceneId:v.sceneId,feedback:'Your final choice is saved.'};
 game.sessions.push(s);game.continueSession(s.sessionId);
 expect(game.page).toBe('story');expect(game.transition).toBe('reading');
 const next=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;
 expect(game.page).toBe('ratings');expect(game.session!.studyPhase).toBe('ratings');
});

it('leaves incomplete days and already-rated days available as results without new ratings',()=>{
 const game=useStoryGame(),partial=almostFinished();game.sessions.push(partial);game.showSession(partial);
 expect(game.page).toBe('summary');expect(game.feedbackPending).toBe(false);expect(game.openRatings()).toBe(false);
 const rated=completedLegacy();rated.ratings={ease:2,fatigue:4,coherence:5,clarity:3};game.sessions.push(rated);game.showSession(rated);
 expect(game.page).toBe('summary');expect(game.feedbackPending).toBe(false);expect(game.ratingCount).toBe(4);
});
