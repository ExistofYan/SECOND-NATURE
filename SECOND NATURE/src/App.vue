<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import PinchButton from './components/PinchButton.vue';
import GestureCursor from './components/GestureCursor.vue';
import { handTrackingService } from './services/handTrackingService';
import InkIcon from './components/story/InkIcon.vue';
import ComicScene from './components/story/ComicScene.vue';
import { useGestureNavStore } from './stores/gestureNavStore';
import { useStoryGame } from './stores/storyGameStore';
import { arrivalText, selectedChoice, storyTextFor, travelSummary } from './domain/story/storyNarrative';
import {artPath} from './services/storyAssetService';
import { CHAPTERS, scenes } from './data/story/scenes';
import { isRatingValue,probeSets,ratingQuestions,ratingSections } from './data/story/probes';
import { availableChoices } from './domain/story/sceneEngine';
import {analyze,reflections} from './domain/story/storyAnalysis';
import {exportStory} from './services/storyExportService';
import {cameraService} from './services/cameraService';
import {useDeviceStore} from './stores/deviceStore';
import type {Session} from './domain/story/types';
import { participantError } from './domain/story/participant';
import { APP_VERSION } from './config/interaction';
const game=useStoryGame(),nav=useGestureNavStore();
const device=useDeviceStore();
const video=ref<HTMLVideoElement|null>(null),practiceStep=ref(0),participant=ref(1),collectProbes=ref(false),probeSet=ref<'A'|'B'>('A'),probeIndex=ref(0),sessionPage=ref(0),itemPage=ref(0),downloadStatus=ref('');
const exporting=ref(false);
const fullName=ref(''),studentId=ref(''),course=ref<''|'COMP3900'|'COMP6390'>('');
const nameInput=ref<HTMLInputElement|null>(null),idInput=ref<HTMLInputElement|null>(null);
const registrationError=computed(()=>participantError({fullName:fullName.value,studentId:studentId.value,course:course.value as 'COMP3900'|'COMP6390'}));
function startResearch(){
  if(registrationError.value||!course.value)return;
  practiceStep.value=0;
  game.start('research','P'+String(participant.value).padStart(2,'0'),collectProbes.value,probeSet.value,null,{fullName:fullName.value,studentId:studentId.value,course:course.value});
  fullName.value='';studentId.value='';course.value='';
}
const scene=computed(()=>game.session?.modelSnapshot[game.displayedIndex]);
const visibleChoices=computed(()=>{if(!game.session||!scene.value)return [];const v=game.session.visits.find(v=>v.sceneId===scene.value!.id);return v?scene.value.choices.filter(c=>v.availableChoiceIds.includes(c.id)):availableChoices(game.session,game.displayedIndex);});
const analysis=computed(()=>game.session?analyze(game.session):null);
const reviewPage=ref(0);
const travel=computed(()=>game.session?travelSummary(game.session):null);
const narration=computed(()=>game.session&&scene.value?(game.session.visits.find(v=>v.sceneId===scene.value!.id)?.storyText??storyTextFor(game.session,scene.value)):'');
const stories=computed(()=>game.session?reflections(game.session):[]);
const oldSession=computed(()=>{if(!game.session)return null;return game.sessions.find(s=>s.sessionId===game.session!.parentSessionId)??null;});
const oldAnalysis=computed(()=>oldSession.value?analyze(oldSession.value):null);
const activeProbes=computed(()=>{const base=game.session?.probeSet??'A';return probeSets[game.page==='post'?(base==='A'?'B':'A'):base];});
const probe=computed(()=>activeProbes.value[probeIndex.value]);
const ratingIndex=computed(()=>{const i=ratingQuestions.findIndex(q=>!isRatingValue(game.session?.ratings[q.key]));return i<0?ratingQuestions.length-1:i;});
const rating=computed(()=>ratingQuestions[ratingIndex.value]);
const ratingSection=computed(()=>ratingSections.find(s=>s.key===rating.value.section)!);
const sectionQuestions=computed(()=>ratingQuestions.filter(q=>q.section===rating.value.section));
const sectionQuestionIndex=computed(()=>sectionQuestions.value.findIndex(q=>q.key===rating.value.key));
const transitionTravelArt=computed(()=>game.session?.pendingTransition?.sceneId==='S02T'?artPath('S02T-'+selectedChoice(game.session,'S02T')):null);
const black=computed(()=>game.transition==='fadeOut'||game.transition==='blackHold'||game.transition==='reading');
const inStory=computed(()=>game.page==='story');
const showModal=computed(()=>!!game.modal);
const listItems=computed(()=>analysis.value?.items.filter(i=>i.material!=='food')??[]);
let lossTimer:ReturnType<typeof setTimeout>|null=null;
let lastTracked=false;
function rearm(){nav.rearm();}
watch(()=>[game.page,game.modal,game.transition,game.summaryPage,reviewPage.value,probeIndex.value,ratingIndex.value,sessionPage.value,itemPage.value],()=>{nav.inputLocked=!game.inputAllowed;rearm();},{flush:'sync'});
watch(()=>nav.frameId,()=>{
  if(nav.pointerActive&&!nav.pinching&&!nav.awaitingRelease)game.releaseReady();
  if(nav.pointerActive){if(lossTimer){clearTimeout(lossTimer);lossTimer=null;}if(!lastTracked){game.event('tracking_recovered');lastTracked=true;}}
  else if(lastTracked&&!lossTimer){lossTimer=setTimeout(()=>{lastTracked=false;lossTimer=null;game.event('tracking_lost',{context:game.page==='story'?'reading_or_tracking_unavailable':'outside_story'});if(inStory.value&&game.transition!=='reading'){game.pause('tracking_unavailable');if(!game.modal)game.modal='pause';}},850);}
});
function practicePick(){practiceStep.value=1;game.event('practice_choice');rearm();}
function submitProbe(answer:number){const p=probe.value;if(!p)return;const set=p.id[0];game.probe(game.page,set,p.id,String(answer),answer===p.correct);if(probeIndex.value<activeProbes.value.length-1)probeIndex.value++;else {probeIndex.value=0;game.setPage(game.page==='pre'?'story':'ratings');}}
function submitRating(value:number){if(game.rating(rating.value.key,value)&&ratingQuestions.every(q=>isRatingValue(game.session?.ratings[q.key])))game.setPage('summary');}
function openResearch(){
  fullName.value='';studentId.value='';course.value='';
  const used=new Set(game.sessions.map(s=>s.participantCode));
  participant.value=Array.from({length:99},(_,i)=>i+1).find(i=>!used.has('P'+String(i).padStart(2,'0')) )??99;
  game.session=null;game.page='registration';game.transition='awaitingRelease';
}
function decline(){fullName.value='';studentId.value='';course.value='';game.page='cover';}
async function exportReport(){
  if(!game.session||exporting.value)return;
  exporting.value=true;downloadStatus.value='Preparing your PDF report...';rearm();
  try{await exportStory(game.session,oldSession.value);downloadStatus.value='PDF prepared: your results, personal analysis and original data in one file. Your browser manages the download.';}
  catch(e){downloadStatus.value=`Export could not finish: ${String(e)}`;}
  finally{exporting.value=false;rearm();}
}
function replay(){const parent=game.session?.sessionId;practiceStep.value=0;game.start('play',null,false,'A',parent??null);}
function resume(){game.resume();rearm();}
function outcomeLabel(d:string){return ({in_use:'Still in use',pending:'Pending handling',retained:'Kept for use',repaired:'Repaired and kept',transferred:'Confirmed handover',recycling:'Recycling collection',general:'General collection'} as Record<string,string>)[d]??d;}
function showSaved(s:Session){game.showSession(s);}
function onVisibility(){if(document.hidden)game.hidden();else {rearm();if(!nav.running&&!nav.loading)void nav.enable();}}
function onPageHide(){game.hidden();}
function onTrackingError(){game.pause('tracking_error');game.modal='pause';nav.error='Hand tracking stopped. Reload the page to restore tracking; the last committed choice is saved.';}
onMounted(async()=>{nav.setVideo(video.value);await nav.enable();document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',onPageHide);window.addEventListener('ecosort:tracking-error',onTrackingError);});
onBeforeUnmount(()=>{if(lossTimer)clearTimeout(lossTimer);nav.disable();handTrackingService.dispose();cameraService.stop();document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',onPageHide);window.removeEventListener('ecosort:tracking-error',onTrackingError);});
</script>
<template>
  <div class="app-shell">
    <video ref="video" class="tracking-video" autoplay playsinline muted aria-hidden="true"/>
    <header class="masthead">
      <div class="wordmark"><span class="brand-icon"><InkIcon name="sun" :size="28"/></span><span>ONE DAY,<br><b>LESS WASTE.</b></span></div>
      <div class="edition"><span class="mini-label">AN INTERACTIVE COMIC</span><span>Small choices. One ordinary day.</span></div>
      <div v-if="inStory && scene" class="chapter-track" aria-label="Chapter progress"><span v-for="(c,i) in CHAPTERS" :key="c" :class="{current:i+1===scene.chapter,done:i+1<scene.chapter}">{{String(i+1).padStart(2,'0')}}<i/></span></div>
      <div v-else class="edition-mark">VOL. 01 <span> / </span> CAMPUS LIFE</div>
      <div v-if="inStory" class="header-actions"><PinchButton variant="quiet" @press="game.openModal('backpack')" aria-label="Open backpack"><InkIcon name="bag" :size="27"/> My bag</PinchButton><PinchButton variant="quiet" @press="game.openModal('pause')" aria-label="Pause"><InkIcon name="pause" :size="26"/> Pause</PinchButton></div>
    </header>

    <main v-if="game.page==='cover'" class="cover-page">
      <div class="cover-copy"><span class="eyebrow">A STORY YOU CHOOSE WITH YOUR HANDS</span><h1>One day.<br><span>Less waste.</span></h1><p class="lead">Seventeen connected moments.<br>A day on campus, shaped by you.</p><div class="hand-note"><InkIcon name="hand" :size="40"/><span>Move to point.<br><b>Pinch to choose. Release to reset.</b></span></div>
      <div class="cover-actions"><PinchButton @press="practiceStep=0;game.start()">Start a new day <InkIcon name="arrow"/></PinchButton><PinchButton v-if="game.canContinue" variant="secondary" @press="game.continueSession()">Continue my day</PinchButton></div>
      <div class="text-actions"><PinchButton variant="quiet" @press="openResearch">Research mode</PinchButton><span>·</span><PinchButton variant="quiet" @press="game.page='sessions'">Saved days</PinchButton><span>·</span><PinchButton variant="quiet" @press="game.motion=!game.motion">{{game.motion?'Short fades':'Slow fades'}}</PinchButton></div></div>
      <div class="cover-art"><div class="cover-stamp">A LITTLE<br>GOES A LONG WAY</div><img :src="artPath('cover')" alt="A hand-drawn campus scene with a student and reusable everyday items in muted colours."/><div class="cover-caption"><span>07:00</span> Your day begins with a small choice.</div></div>
    </main>

    <main v-else-if="game.page==='story' && scene && game.session" class="story-page">
      <div class="scene-heading"><div><span class="eyebrow">{{scene.timeLabel}} <span class="dot">·</span> {{scene.location}}</span><h1>{{scene.title}}</h1></div><div class="scene-count"><span>{{CHAPTERS[scene.chapter-1]}}</span><b>SCENE {{game.displayedIndex+1}} OF {{game.session.modelSnapshot.length}}</b></div></div>
      <ComicScene :scene="scene" :session="game.session" :degraded="game.degraded" :aftermath="game.transition==='aftermath'?game.aftermath:''"/>
      <p class="story-text">{{narration}}</p>
      <div class="choices" :class="{'two-choices':visibleChoices.length===2}" role="group" aria-label="Choose an action">
        <PinchButton v-for="(c,i) in visibleChoices" :key="scene.id+c.id" :disabled="game.transition!=='interactive'||!!game.modal||game.pauseReasons.length>0" variant="secondary" @press="game.choose(c.id)"><span class="choice-letter">{{String.fromCharCode(65+i)}}</span><span class="choice-copy"><b>{{c.label}}</b></span><span class="choice-corner">↗</span></PinchButton>
      </div>
    </main>

    <main v-else-if="game.page==='practice'" class="center-page practice-page"><span class="eyebrow">BEFORE YOUR DAY BEGINS</span><h1>A little hand rehearsal.</h1><p>Use either hand. Point with an open hand, then pinch your thumb and index finger to choose.<br>Then open them again. There is no time limit.</p><div class="practice-illustration"><InkIcon name="hand" :size="100"/><span class="practice-dots">·····</span><div class="practice-target">{{practiceStep?'Nicely done!':'Aim here'}}</div></div><template v-if="!practiceStep"><p class="practice-caption">Choose either practice card. Both are just for practice.</p><div class="choices two-choices"><PinchButton variant="secondary" @press="practicePick"><InkIcon name="sun" :size="36"/><b>A sunny morning</b></PinchButton><PinchButton variant="secondary" @press="practicePick"><InkIcon name="moon" :size="36"/><b>A quiet evening</b></PinchButton></div></template><template v-else><p role="status">Choice received. Release your fingers, then make a fresh pinch below.</p><div class="inline-actions"><PinchButton variant="secondary" @press="practiceStep=0">Try again</PinchButton><PinchButton @press="game.practiceDone()">{{game.session?.collectProbes?'Continue':'Begin my day'}} <InkIcon name="arrow"/></PinchButton></div></template><PinchButton variant="quiet" @press="game.exit()">Save and return to the cover</PinchButton></main>

    <main v-else-if="game.page==='registration'" class="registration-page center-page"><span class="eyebrow">BEFORE THE STUDY</span><h1>Participant details</h1><div class="participant-registration">
<p class="registration-note">Researcher setup: type the participant details before the gesture task. Participant: check your details and confirm your current course below.</p>
<label>Full name in English or pinyin<input ref="nameInput" v-model="fullName" maxlength="100" autocomplete="off" placeholder="Firstname Lastname" /></label>
<label>ANU student ID<input ref="idInput" v-model="studentId" maxlength="8" autocomplete="off" spellcheck="false" placeholder="u1234567" /></label>
<div class="registration-focus"><PinchButton variant="quiet" @press="nameInput?.focus()">Edit name</PinchButton><PinchButton variant="quiet" @press="idInput?.focus()">Edit student ID</PinchButton></div>
<div class="registration-courses" role="group" aria-label="Confirm your current course"><PinchButton v-for="c in (['COMP3900','COMP6390'] as const)" :key="c" :aria-pressed="course===c" variant="secondary" @press="course=c">{{course===c?'Confirmed: ':''}}{{c}}</PinchButton></div>
<p role="status">{{registrationError || 'Details ready. Check them before agreeing to participate.'}}</p>
</div><div class="inline-actions"><PinchButton variant="secondary" @press="decline">Cancel</PinchButton><PinchButton :disabled="!!registrationError" @press="game.page='consent'">Review consent <InkIcon name="arrow"/></PinchButton></div></main>

    <main v-else-if="game.page==='consent'" class="consent-page center-page"><span class="eyebrow">RESEARCH PARTICIPATION</span><h1>Your choice to take part.</h1><p>This exploratory class study looks at how students understand waste prevention through a gesture comic.</p><div class="consent-box"><p>The device records choices, timing, pauses and your short responses. Research mode also records your name, student ID, course and timestamps for the course participant list and exported report. It does not save camera video, photos or hand landmarks.</p><p>Participation is voluntary. You can pause, end and export a partial session. Records stay in this browser until exported; exports contain your identity. Your researcher explains course submission access, storage, deletion and withdrawal before you agree. Separate permission is needed for interview recording.</p></div><p><b>{{fullName}}</b> / {{studentId}} / {{course}}</p><PinchButton variant="quiet" @press="game.page='registration'">Edit participant details</PinchButton><div class="study-settings"><div><span class="mini-label">PARTICIPANT CODE</span><div class="code-selector"><PinchButton variant="secondary" @press="participant=Math.max(1,participant-1)">−</PinchButton><strong>P{{String(participant).padStart(2,'0')}}</strong><PinchButton variant="secondary" @press="participant=Math.min(99,participant+1)">+</PinchButton></div></div><PinchButton variant="secondary" @press="collectProbes=!collectProbes">Knowledge checks: {{collectProbes?'ON':'OFF'}}</PinchButton><PinchButton v-if="collectProbes" variant="secondary" @press="probeSet=probeSet==='A'?'B':'A'">Check order: {{probeSet==='A'?'A → B':'B → A'}}</PinchButton></div><div class="inline-actions"><PinchButton variant="secondary" @press="decline">Decline and return</PinchButton><PinchButton :disabled="!!registrationError" @press="startResearch">I agree to take part <InkIcon name="arrow"/></PinchButton></div></main>

    <main v-else-if="game.page==='pre'||game.page==='post'" class="center-page question-page"><span class="eyebrow">{{game.page==='pre'?'BEFORE':'AFTER'}} THE STORY · {{probeIndex+1}} / {{activeProbes.length}}</span><h1>A different everyday moment.</h1><p class="question-text">{{probe.text}}</p><div class="choices two-choices"><PinchButton v-for="(a,i) in probe.answers" :key="probe.id+i" variant="secondary" @press="submitProbe(i)"><span class="choice-letter">{{i?'B':'A'}}</span><b>{{a}}</b></PinchButton></div><small>No time limit. Answers are recorded without immediate corrections.</small><PinchButton variant="quiet" @press="game.exit()">End and save</PinchButton></main>

    <main v-else-if="game.page==='ratings'" class="center-page question-page experience-page"><span class="eyebrow">{{ratingSection.title.toUpperCase()}} · {{ratingIndex+1}} / {{ratingQuestions.length}}</span><p class="rating-section-progress">Part {{ratingSections.findIndex(s=>s.key===rating.section)+1}} / {{ratingSections.length}} · Question {{sectionQuestionIndex+1}} / {{sectionQuestions.length}} in this part</p><h1>{{rating.title}}</h1><p class="rating-context">{{ratingSection.description}}</p><p>Point at a score, pinch to choose, then release before the next question.<br>No typing and no time limit. Your answers will be included in your PDF.</p><p v-if="rating.context" class="rating-context">{{rating.context}}</p><div class="rating-options" role="group" :aria-label="rating.title"><PinchButton v-for="n in 5" :key="rating.key+n" :data-rating-value="n" :aria-label="`${n} out of 5: ${rating.labels[n-1]}`" variant="secondary" @press="submitRating(n)"><b>{{n}}</b><small>{{rating.labels[n-1]}}</small></PinchButton></div><div class="rating-labels"><span>1 · {{rating.low}}</span><span>5 · {{rating.high}}</span></div><small>You can rest your hand between questions. Each answer is saved as you go.</small><PinchButton variant="quiet" @press="game.exit()">Save and finish later</PinchButton></main>

    <main v-else-if="game.page==='summary' && game.session && analysis" class="summary-page">
      <section v-if="game.session.status==='completed'" class="feedback-banner" :class="{'feedback-done':!game.feedbackPending}" aria-label="Experience feedback">
        <div><b>{{game.feedbackPending?'How was your experience?':'Your experience ratings are saved.'}}</b><p>{{game.ratingCount}} / {{ratingQuestions.length}} answered. {{game.feedbackPending?'16 ratings about waste prevention and interface experience. Point and pinch a score from 1 to 5.':'Your scores will be included in the PDF report.'}}</p></div>
        <PinchButton v-if="game.feedbackPending" @press="game.openRatings()" class="open-feedback">Rate my experience <InkIcon name="arrow"/></PinchButton>
      </section>
      <div class="scene-heading"><div><span class="eyebrow">{{game.session.status==='completed'?'21:30 · THE END OF YOUR DAY':'A PARTIAL DAY · SAVED RECORD'}}</span><h1>{{['My day, in little things.','Where things went.','What my choices changed.','Another day, another possibility.'][game.summaryPage]}}</h1></div><span class="summary-count">{{game.summaryPage+1}} / 4</span></div>
      <div v-if="game.summaryPage===0" class="summary-content"><p>{{analysis.completedScenes}} / {{analysis.totalScenes}} scenes completed · {{game.session.kind==='research'?'Research session':'Free play'}} · These are simulated items, not measured environmental impacts.</p><div class="metric-grid"><article><InkIcon name="cup" :size="41"/><strong>{{analysis.newSingleUse}}</strong><h2>New single-use items</h2><p>Acquired today, even if kept.</p></article><article><InkIcon name="recycle" :size="41"/><strong>{{analysis.nonFoodWaste}}</strong><h2>Non-food discarded</h2><p>{{analysis.recycling}} recycling · {{analysis.general}} general<br>Includes paper; see types below.</p></article><article><InkIcon name="food" :size="41"/><strong>{{analysis.foodWaste}} <small>servings</small></strong><h2>Food discarded</h2><p>{{analysis.foodSaved}} saved · {{analysis.foodTransferred}} handed over<br>{{analysis.foodInventory}} edible servings in inventory.</p></article><article><InkIcon name="shirt" :size="41"/><strong>{{analysis.continued.length}}</strong><h2>Items continuing in use</h2><p>Existing and new items, listed separately.</p></article></div><table class="type-table"><thead><tr><th>Item type / unit</th><th>New single-use</th><th>Recycling</th><th>General</th><th>Continued use</th></tr></thead><tbody><tr v-for="(r,type) in analysis.byType" :key="type"><td>{{type}} / {{r.unit}}</td><td>{{r.acquired}}</td><td>{{r.recycling}}</td><td>{{r.general}}</td><td>{{r.continued}}</td></tr></tbody></table></div>
      <div v-else-if="game.summaryPage===1" class="summary-content"><p>Each item keeps the same identity across the day. Collection is still disposal; it does not cancel an acquired item.</p><div class="ledger-list"><div v-for="i in listItems.slice(itemPage*5,itemPage*5+5)" :key="i.itemId"><InkIcon :name="i.type==='reusable'?i.itemId:i.type==='clothing'?'shirt':i.type"/><div><b>{{i.label}}</b><small>{{i.origin==='existing'?'Already owned':'Acquired today'}} · {{i.itemId}} · {{i.unit}}</small></div><span>{{outcomeLabel(i.destination)}}</span></div></div><div class="ledger-nav"><PinchButton variant="quiet" :disabled="itemPage===0" @press="itemPage--">← Earlier items</PinchButton><span>{{itemPage+1}} / {{Math.max(1,Math.ceil(listItems.length/5))}}</span><PinchButton variant="quiet" :disabled="(itemPage+1)*5>=listItems.length" @press="itemPage++">More items →</PinchButton></div><p class="fine-print">Food is listed separately in the report, in servings. Preserved food is not reported as already eaten.</p></div>
      <div v-else-if="game.summaryPage===2" class="summary-content"><p>Look back at each choice: what you did, what happened, and what you could try next time.</p><div v-if="travel" class="travel-note"><b>My journey: {{travel.label}}</b><p>{{travel.text}} {{travel.note}}</p></div><div class="reflection-list"><article v-for="r in stories.slice(reviewPage*3,reviewPage*3+3)" :key="r.sceneId"><span>{{game.session.modelSnapshot.findIndex(s=>s.id===r.sceneId)+1}}</span><div><h2>{{r.title}}</h2><p><b>You chose: {{r.label}}</b></p><p>{{r.text}}</p><p>{{r.lesson}}</p><p v-if="r.improvement"><b>Next time:</b> {{r.nextTime}}</p></div></article><p v-if="!stories.length">Your choices will appear here after you start the story.</p></div><div class="ledger-nav"><PinchButton variant="quiet" :disabled="reviewPage===0" @press="reviewPage--">Earlier choices</PinchButton><span>{{reviewPage+1}} / {{Math.max(1,Math.ceil(stories.length/3))}}</span><PinchButton variant="quiet" :disabled="(reviewPage+1)*3>=stories.length" @press="reviewPage++">More choices</PinchButton></div></div>
      <div v-else class="summary-content end-page"><p>The story supplies facilities and resources that may differ from your own life. Keeping an item tonight does not guarantee it will be used later.</p><template v-if="oldAnalysis"><h2>Your two days</h2><p v-if="oldSession?.modelVersion!==game.session.modelVersion">These days use different story versions. Compare the choices with care; the scenes may differ.</p><table class="comparison-table"><thead><tr><th>Same measure and unit</th><th>Previous day</th><th>This day</th></tr></thead><tbody><tr><td>New single-use items</td><td>{{oldAnalysis.newSingleUse}}</td><td>{{analysis.newSingleUse}}</td></tr><tr><td>Non-food discarded (items, including sheets)</td><td>{{oldAnalysis.nonFoodWaste}}</td><td>{{analysis.nonFoodWaste}}</td></tr><tr><td>Food discarded (servings)</td><td>{{oldAnalysis.foodWaste}}</td><td>{{analysis.foodWaste}}</td></tr></tbody></table><small v-if="oldAnalysis.completedScenes!==oldAnalysis.totalScenes||analysis.completedScenes!==analysis.totalScenes">Partial days have different exposure; totals are not a matched complete-day comparison.</small></template><div class="end-drawing"><InkIcon name="moon" :size="90"/><span>Small things can have a second chapter.</span></div><div class="choices"><PinchButton variant="secondary" :disabled="exporting" @press="exportReport"><InkIcon name="download"/><b>{{exporting?'Preparing PDF...':'Save my report PDF'}}</b></PinchButton><PinchButton variant="secondary" @press="replay"><InkIcon name="sun"/><b>Try another day</b></PinchButton><PinchButton variant="secondary" @press="game.page='cover'"><InkIcon name="arrow"/><b>Back to the cover</b></PinchButton></div><p class="fine-print" role="status">{{downloadStatus||'One PDF: results, choice analysis, practical next steps and original data attachments.'}}</p></div>
      <nav class="summary-nav" aria-label="Summary pages"><PinchButton variant="secondary" :disabled="game.summaryPage===0" @press="game.summaryPage--;itemPage=0;reviewPage=0">← Previous</PinchButton><div class="page-dots"><i v-for="n in 4" :key="n" :class="{active:n-1===game.summaryPage}"/></div><PinchButton variant="secondary" :disabled="game.summaryPage===3" @press="game.summaryPage++;itemPage=0;reviewPage=0">Next page →</PinchButton></nav>
    </main>

    <main v-else-if="game.page==='sessions'" class="center-page sessions-page"><span class="eyebrow">ON THIS DEVICE</span><h1>Days worth remembering.</h1><p>Research and free-play sessions stay separate. A partial day can be continued or exported.</p><div class="session-list"><article v-for="s in [...game.sessions].reverse().slice(sessionPage*3,sessionPage*3+3)" :key="s.sessionId"><div><b>{{s.participantCode||'Free play'}} · {{s.visits.filter(v=>v.selectedChoiceId).length}} / {{s.modelSnapshot.length}} scenes</b><small>{{new Date(s.startedAt).toLocaleString('en-AU')}} · {{s.status}} · {{s.kind}}</small></div><PinchButton v-if="s.pendingTransition||s.status==='active'||s.status==='interrupted'||s.studyPhase==='ratings'" variant="secondary" @press="game.continueSession(s.sessionId)">Continue</PinchButton><PinchButton variant="secondary" @press="showSaved(s)">View / export</PinchButton></article><p v-if="!game.sessions.length">Your first story is still waiting to be told.</p></div><div class="inline-actions"><PinchButton variant="secondary" :disabled="sessionPage===0" @press="sessionPage--">← Earlier page</PinchButton><PinchButton variant="secondary" :disabled="(sessionPage+1)*3>=game.sessions.length" @press="sessionPage++">Next page →</PinchButton><PinchButton @press="game.page='cover'">Back to cover</PinchButton></div></main>

    <footer class="status-bar"><span><i class="status-dot" :class="{filled:nav.pointerActive}"/>{{nav.loading?'Preparing camera and hand tracking…':nav.error?'Camera setup needs attention':nav.pointerActive?(nav.awaitingRelease?'Open your fingers to reset':'Hand found · point and pinch'):'Raise an open hand to begin or continue'}}</span><span class="status-center">NO TIMER. TAKE YOUR TIME.</span><span>{{scenes.length}} MOMENTS <span class="dot">·</span> ONE DAY <small class="app-version">v{{APP_VERSION}}</small></span></footer>
    <div v-if="nav.error" class="setup-notice" role="alert"><InkIcon name="hand"/><div><b>{{device.model==='failed'?'Hand tracking needs attention.':device.permission!=='granted'?'Camera access needs attention.':'Hand tracking stopped.'}}</b><p>{{nav.error}}</p><small>{{device.model==='failed'?'Reload after checking that the complete release is deployed, including art, models and mediapipe folders.':device.permission!=='granted'?'Allow this site to use the camera in your browser settings, then reload.':'Reload this page to restart tracking. Your last committed choice stays saved.'}} Camera frames stay on this device.</small></div></div>
    <div v-if="game.saveError" class="save-notice" role="alert"><b>{{game.saveError}}</b><PinchButton variant="secondary" @press="exportReport">Export now</PinchButton></div>

    <div v-if="showModal" class="modal-backdrop" data-modal="true"><section class="modal-card" role="dialog" aria-modal="true" :aria-label="game.modal==='backpack'?'My backpack':'Paused'"><span class="eyebrow">A MOMENT TO BREATHE</span><template v-if="game.modal==='backpack'"><h1>What I brought.</h1><p>These are existing belongings, not new purchases.</p><div class="backpack-list"><div v-for="i in game.session?.items.filter(i=>i.reusable)" :key="i.itemId"><InkIcon :name="i.itemId"/><b>{{i.label}}</b><span>{{i.carried?'With me':'At home'}} · {{i.condition}}</span></div></div></template><template v-else-if="game.modal==='help'"><h1>Point. Pinch. Release.</h1><p>Move your open hand to aim. Pinch thumb and index finger once to choose. Open them before choosing again.</p><p>Rest your arm while reading. A tracking pause stops decision timing; point to “Continue” when ready.</p><p>The game records observed events, not guesses about your intentions.</p></template><template v-else><h1>Your day is paused.</h1><p>{{game.pauseReasons.includes('tracking_unavailable')?'No hand is currently being tracked. Rest or adjust your hand, then choose Continue.':'Take your time. Put your hand down and come back when you are ready.'}}</p><small>Decision timing is paused. Nothing has been chosen for you.</small></template><div class="modal-actions"><PinchButton @press="resume">Continue my day <InkIcon name="arrow"/></PinchButton><PinchButton v-if="game.modal!=='help'" variant="secondary" @press="game.modal='help'">How to use my hand</PinchButton><PinchButton variant="secondary" @press="game.event('researcher_help');rearm()">Record researcher help</PinchButton><PinchButton variant="secondary" @press="game.exit()">End and save for later</PinchButton><PinchButton variant="quiet" @press="game.abort()">Finish with a partial report</PinchButton></div></section></div>
    <div class="transition-curtain" :class="{black,visible:black||game.transition==='fadeIn'}" :style="{'--fade-time':game.motion?'80ms':'400ms'}" :data-modal="game.transition==='reading'&&!game.modal?'true':undefined" :aria-hidden="!black">
      <section v-if="black" class="transition-panel" role="dialog" aria-modal="true" aria-label="The next part of your story">
        <img v-if="transitionTravelArt" :src="transitionTravelArt" class="transition-art" alt="Your chosen journey to school"/><p v-if="game.aftermath" class="transition-feedback">{{game.aftermath}}</p>
        <template v-if="game.currentScene"><span class="chapter-caption" v-if="game.session && game.session.modelSnapshot[game.session.nextSceneIndex-1]?.chapter!==game.currentScene.chapter">CHAPTER {{game.currentScene.chapter}} · {{CHAPTERS[game.currentScene.chapter-1]}}</span><strong>{{game.currentScene.timeLabel}}</strong><p>{{game.currentScene.location}}</p><p v-if="game.session" class="arrival-caption">{{arrivalText(game.session,game.currentScene)}}</p></template>
        <template v-else><strong>The end of your day.</strong><p>{{game.session?.studyPhase==='post'?'Next: your after-story questions, then 16 waste-prevention and interface ratings.':game.feedbackPending?'Next: 16 ratings about waste prevention and interface experience. Choose a score from 1 to 5 with your hand.':'Let us look back at your choices.'}}</p></template>
        <PinchButton v-if="game.transition==='reading'" class="transition-continue" :disabled="!!game.modal||game.pauseReasons.length>0" @press="game.continueTransition()">{{game.currentScene?'Continue':game.session?.studyPhase==='post'?'Continue to questions':game.feedbackPending?'Rate my experience':'View my results'}} <InkIcon name="arrow"/></PinchButton>
        <small v-if="game.transition==='reading'">Take your time. Point and pinch when you are ready.</small>
      </section>
    </div>
    <GestureCursor/>
  </div>
</template>
