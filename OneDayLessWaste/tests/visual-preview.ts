/* Development-only visual fixture. Not an input mode and not in the production build. */
import {createApp} from 'vue';
import {createPinia} from 'pinia';
import App from '../src/App.vue';
import '../src/style.css';
import {useGestureNavStore} from '../src/stores/gestureNavStore';
import {useStoryGame} from '../src/stores/storyGameStore';
import {createSession,openVisit,markReady,commitChoice} from '../src/domain/story/sceneEngine';
const pinia=createPinia(),nav=useGestureNavStore(pinia),game=useStoryGame(pinia);
nav.enable=async()=>{};
const q=new URLSearchParams(location.search),target=Math.min(16,Math.max(1,Number(q.get('scene')||1)));
let s=createSession();const route=['one','all','own','refill','double','own','one','poster','bagged','three','paper','own','cook','save','repair','keep'];
for(let i=0;i<(q.has('summary')?16:target-1);i++){const v=openVisit(s);markReady(s,v);s=commitChoice(s,v.visitId,route[i],{decisionActiveMs:2000,decisionWallMs:2000,pausedMs:0});}
if(q.has('summary')){s.studyPhase='summary';game.session=s;game.page='summary';game.summaryPage=Number(q.get('summary')||0);}
else if(!q.has('cover')){s.studyPhase='story';openVisit(s);game.session=s;game.page='story';game.displayedIndex=target-1;game.transition='interactive';}
createApp(App).use(pinia).mount('#app');
