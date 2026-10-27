// @vitest-environment jsdom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {createPinia,setActivePinia} from 'pinia';
import {useStoryGame} from '../src/stores/storyGameStore';
import {STORY_KEY} from '../src/services/storyStorageService';
import {availableChoices,commitChoice,createSession,openVisit} from '../src/domain/story/sceneEngine';
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();setActivePinia(createPinia());vi.stubGlobal('matchMedia',()=>({matches:false}));vi.stubGlobal('Image',class{onload:(()=>void)|null=null;onerror:(()=>void)|null=null;set src(_v:string){queueMicrotask(()=>this.onload?.());}});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});
async function ready(){const game=useStoryGame();game.start();game.practiceDone();await vi.advanceTimersByTimeAsync(600);game.releaseReady();return game;}
it('atomically saves the next checkpoint but keeps old artwork until black, then waits for release',async()=>{const game=await ready();expect(game.transition).toBe('interactive');const promise=game.choose('one');expect(game.session!.nextSceneIndex).toBe(1);expect(game.displayedIndex).toBe(0);const saved=JSON.parse(localStorage.getItem(STORY_KEY)!);expect(saved[0].nextSceneIndex).toBe(1);expect(saved[0].visits[0].selectedChoiceId).toBe('one');await vi.advanceTimersByTimeAsync(2200);await promise;expect(game.transition).toBe('reading');expect(game.displayedIndex).toBe(0);const next=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;expect(game.displayedIndex).toBe(1);expect(game.transition).toBe('awaitingRelease');await game.choose('all');expect(game.session!.nextSceneIndex).toBe(1);expect(game.visit!.readyAt).toBe(null);game.releaseReady();expect(game.transition).toBe('interactive');});
it('marks lost timing as missing after an abrupt refresh, without losing committed items',async()=>{const game=await ready();game.continueSession(game.session!.sessionId);await vi.advanceTimersByTimeAsync(600);expect(game.visit!.timingMissing).toBe(true);game.releaseReady();const promise=game.choose('extra');await vi.advanceTimersByTimeAsync(2200);await promise;expect(game.session!.visits[0].decisionActiveMs).toBe(null);expect(game.session!.items.filter(i=>i.itemId==='breakfast-extra')).toHaveLength(1);expect(game.session!.events.some(e=>e.type==='session_resumed')).toBe(true);});
it('preserves known fragments across a deliberate pause and return',async()=>{const game=await ready();await vi.advanceTimersByTimeAsync(1000);game.exit();game.continueSession(game.session!.sessionId);await vi.advanceTimersByTimeAsync(600);expect(game.visit!.timingMissing).not.toBe(true);game.releaseReady();await vi.advanceTimersByTimeAsync(500);const p=game.choose('one');await vi.advanceTimersByTimeAsync(2200);await p;expect(game.session!.visits[0].decisionActiveMs).toBe(1500);});
it('reports a storage failure and retains the session in memory for export',()=>{const game=useStoryGame();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});game.start();expect(game.saveError).toContain('in memory only');expect(game.session!.sessionId).toBeTruthy();});
it('shows the seventeenth scene before finishing and reaches feedback after its choice',async()=>{
 const game=useStoryGame();let session=createSession();
 while(session.nextSceneIndex<session.modelSnapshot.length-2){const v=openVisit(session);session=commitChoice(session,v.visitId,availableChoices(session)[0].id,{decisionActiveMs:1,decisionWallMs:1,pausedMs:0});}
 session.studyPhase='story';game.sessions.push(session);game.continueSession(session.sessionId);
 await vi.advanceTimersByTimeAsync(600);game.releaseReady();
 const shirt=game.choose('repair');await vi.advanceTimersByTimeAsync(500);await shirt;
 expect(game.transition).toBe('reading');const next=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;
 expect(game.page).toBe('story');expect(game.currentScene!.id).toBe('S16');expect(game.displayedIndex).toBe(16);
 game.releaseReady();const tidy=game.choose('keep');await vi.advanceTimersByTimeAsync(500);await tidy;
 expect(game.page).toBe('story');expect(game.transition).toBe('reading');const summary=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await summary;
 expect(game.page).toBe('ratings');expect(game.session!.status).toBe('completed');expect(game.session!.visits).toHaveLength(17);
});

it('holds the black caption without a timer in both fade settings and excludes reading from animation time',async()=>{
 for(const short of [false,true]){
  const game=await ready();game.motion=short;
  const choice=game.choose('one');await vi.advanceTimersByTimeAsync(500);await choice;
  expect(game.transition).toBe('reading');expect(game.visit).toBe(null);
  await vi.advanceTimersByTimeAsync(120000);
  expect(game.transition).toBe('reading');expect(game.displayedIndex).toBe(0);expect(game.session!.visits).toHaveLength(1);
  const next=game.continueTransition();const duplicate=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;await duplicate;
  expect(game.displayedIndex).toBe(1);expect(game.session!.visits).toHaveLength(2);expect(game.session!.visits[0].animationMs).toBeLessThan(1200);
  expect(game.session!.visits[1].readyAt).toBe(null);
 }
});
it('restores an unread caption after refresh and after a pause without skipping it',async()=>{
 const game=await ready();const choice=game.choose('extra');await vi.advanceTimersByTimeAsync(500);await choice;
 const sessionId=game.session!.sessionId;game.continueSession(sessionId);
 expect(game.transition).toBe('reading');expect(game.aftermath).toContain('throw away');expect(game.session!.items.filter(i=>i.itemId==='breakfast-extra')).toHaveLength(1);
 game.hidden();game.resume();expect(game.transition).toBe('reading');
 await vi.advanceTimersByTimeAsync(30000);expect(game.displayedIndex).toBe(0);
 const next=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;
 expect(game.displayedIndex).toBe(1);expect(game.session!.pendingTransition).toBeUndefined();
});
it('restores the final caption even when the last choice already completed the saved session',async()=>{
 const game=useStoryGame();let session=createSession();
 while(session.nextSceneIndex<session.modelSnapshot.length-1){const v=openVisit(session);session=commitChoice(session,v.visitId,availableChoices(session)[0].id,{decisionActiveMs:1,decisionWallMs:1,pausedMs:0});}
 session.studyPhase='story';game.sessions.push(session);game.continueSession(session.sessionId);await vi.advanceTimersByTimeAsync(600);game.releaseReady();
 const choice=game.choose('keep');await vi.advanceTimersByTimeAsync(500);await choice;
 expect(game.session!.status).toBe('completed');expect(game.canContinue).toBe(true);
 game.continueSession(game.session!.sessionId);expect(game.transition).toBe('reading');expect(game.page).toBe('story');
 const next=game.continueTransition();await vi.advanceTimersByTimeAsync(600);await next;
 expect(game.page).toBe('ratings');expect(game.session!.pendingTransition).toBeUndefined();
});
it('does not advance a reading screen while a modal is open or a pause is active',async()=>{
 const game=await ready();const choice=game.choose('one');await vi.advanceTimersByTimeAsync(500);await choice;
 game.openModal('pause');await game.continueTransition();expect(game.transition).toBe('reading');
 game.resume();expect(game.transition).toBe('reading');
});
it('cancels a pending fade when leaving for the cover',async()=>{
 const game=await ready();const choice=game.choose('one');game.exit();await vi.advanceTimersByTimeAsync(600);await choice;
 expect(game.page).toBe('cover');expect(game.transition).toBe('awaitingRelease');
 game.continueSession();expect(game.transition).toBe('reading');
});
