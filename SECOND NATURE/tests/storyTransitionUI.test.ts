// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createApp,nextTick,type App as VueApp} from 'vue';
import {createPinia} from 'pinia';
import App from '../src/App.vue';
import {useGestureNavStore} from '../src/stores/gestureNavStore';
import {useStoryGame} from '../src/stores/storyGameStore';
import {resetGestureHitTest} from '../src/services/gestureHitTest';

let app:VueApp|null=null;
beforeEach(()=>{
 vi.useFakeTimers();localStorage.clear();resetGestureHitTest();document.body.innerHTML='<div id="app"></div>';
 vi.stubGlobal('matchMedia',()=>({matches:false}));
 vi.stubGlobal('Image',class{onload:(()=>void)|null=null;set src(_v:string){queueMicrotask(()=>this.onload?.());}});
});
afterEach(()=>{app?.unmount();app=null;vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();});

it('renders label-only choices, holds the black panel and requires a fresh gesture on Continue',async()=>{
 const pinia=createPinia(),nav=useGestureNavStore(pinia),game=useStoryGame(pinia);
 vi.spyOn(nav,'enable').mockResolvedValue(undefined);
 app=createApp(App);app.use(pinia);app.mount('#app');
 game.start();game.practiceDone();await vi.advanceTimersByTimeAsync(600);game.releaseReady();await nextTick();
 const choices=[...document.querySelectorAll('.story-page .choices button')];
 expect(choices).toHaveLength(2);expect(choices[0].textContent).toContain('Take one serving');
 expect(choices[0].querySelector('small')).toBe(null);
 expect(choices[1].textContent).toContain('Take two servings; throw one away');

 let target=choices[0];
 Object.defineProperty(document,'elementFromPoint',{configurable:true,value:()=>target});
 nav.running=true;nav.pointerActive=true;nav.awaitingRelease=false;
 nav.pinching=true;nav.frameId++;nav.pressId++;await nextTick();
 await vi.advanceTimersByTimeAsync(500);await nextTick();
 expect(game.transition).toBe('reading');
 const button=document.querySelector<HTMLButtonElement>('.transition-continue')!;target=button;
 expect(button.textContent).toContain('Continue');
 expect(document.querySelector('.transition-feedback')?.textContent).toContain('No food goes in the bin');
 expect(document.querySelector('.transition-curtain')?.classList.contains('black')).toBe(true);

 button.click();await nextTick();expect(game.transition).toBe('reading');
 // The pinch used for the choice must not activate the newly mounted Continue button.
 nav.frameId++;nav.pressId++;await nextTick();expect(game.transition).toBe('reading');
 await vi.advanceTimersByTimeAsync(60000);expect(game.displayedIndex).toBe(0);
 // Lowering the hand for reading must not cover the subtitle with a tracking modal.
 nav.pointerActive=false;nav.frameId++;await nextTick();await vi.advanceTimersByTimeAsync(1000);
 expect(game.modal).toBe(null);expect(game.transition).toBe('reading');
 nav.pointerActive=true;nav.pinching=false;nav.awaitingRelease=false;nav.frameId++;await nextTick();
 nav.pinching=true;nav.frameId++;nav.pressId++;await nextTick();
 await vi.advanceTimersByTimeAsync(600);await nextTick();
 expect(game.displayedIndex).toBe(1);expect(game.transition).toBe('awaitingRelease');
 expect(game.session!.nextSceneIndex).toBe(1);expect(game.session!.visits[1].selectedChoiceId).toBe(null);
});
