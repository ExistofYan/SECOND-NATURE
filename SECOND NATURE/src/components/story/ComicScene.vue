<script setup lang="ts">
import { computed,ref,onMounted,onBeforeUnmount } from 'vue';
import type { Session, Scene } from '../../domain/story/types';
import { artPath } from '../../services/storyAssetService';
import InkIcon from './InkIcon.vue';
const props=defineProps<{scene:Scene;session:Session;degraded?:boolean;aftermath?:string}>();
const carried=computed(()=>props.session.items.filter(i=>i.carried));
const selected=computed(()=>props.session.visits.find(v=>v.sceneId===props.scene.id)?.selectedChoiceId);
const fruitCount=computed(()=>props.session.items.filter(i=>/^fruit-[123]$/.test(i.itemId)).length);
const paperCount=computed(()=>props.session.items.filter(i=>i.type==='paper').length);
const bagCount=computed(()=>props.session.items.filter(i=>i.type==='bag'&&i.origin==='new').length);
const compact=ref(window.innerWidth<900);
const resize=()=>{compact.value=window.innerWidth<900;};
onMounted(()=>window.addEventListener('resize',resize));
onBeforeUnmount(()=>window.removeEventListener('resize',resize));
const variants=computed(()=>{
 const s=props.session;
 if(props.scene.id==='S02')return carried.value.map(i=>({id:i.itemId,label:i.label}));
 if(['S10','S11','S12'].includes(props.scene.id)&&s.items.some(i=>i.itemId==='fruit-1'))return [{id:'food',label:`${s.items.filter(i=>i.itemId.startsWith('fruit-')&&!['fruit-tray','fruit-film'].includes(i.itemId)).length} fruit serving${s.items.some(i=>i.itemId==='fruit-3')?'s':''}`}];
 if(props.scene.id==='S16')return [{id:'paper',label:`${s.items.filter(i=>i.type==='paper').length} sheets`},{id:'bag',label:`${s.items.filter(i=>i.type==='bag'&&i.origin==='new').length} new bags`}];
 return carried.value.slice(0,4).map(i=>({id:i.itemId,label:i.label}));
});
</script>
<template><div class="comic-frame" :class="{'has-aftermath':aftermath}">
  <div class="panel-number">{{session.modelSnapshot.findIndex(s=>s.id===scene.id)+1}} <span>/ {{session.modelSnapshot.length}}</span></div>
  <svg v-if="!degraded" class="scene-art" viewBox="0 0 1600 900" :preserveAspectRatio="compact?'xMidYMid meet':'xMidYMid slice'" role="img" :aria-label="scene.alt">
    <defs><g id="live-fruit" fill="white" stroke="black" stroke-width="4.2" stroke-linejoin="round"><path d="M24 0C-14 -17 -20 39 7 54Q23 67 35 54C64 26 56 -16 24 0Z"/><path fill="none" d="M24 0Q17 -17 30 -24M27 -13Q48 -24 48 -10Q37 -4 27 -13"/></g><g id="live-paper" fill="white" stroke="black" stroke-width="4.2"><rect width="77" height="98"/><path d="M14 25H62M14 41H54M14 57H62M14 74H43"/></g><g id="live-bag" fill="white" stroke="black" stroke-width="4.2" stroke-linejoin="round"><path d="M0 12H76L84 99Q43 108 -6 100Z"/><path fill="none" d="M18 14V-10Q37 -44 58 -10V14M12 63Q40 46 65 64"/></g></defs>
    <image :href="artPath(scene.artId ?? scene.id)" width="1600" height="900"/>
    <g v-if="scene.id==='S11'"><use v-for="n in fruitCount" :key="n" href="#live-fruit" :transform="`translate(${440+(n-1)*60} 533) scale(.85)`"/></g>
    <g v-if="scene.id==='S16'"><use v-for="n in paperCount" :key="'p'+n" href="#live-paper" :transform="`translate(${345+(n-1)*12} ${521-(n-1)*7}) scale(.8)`"/><use v-for="n in bagCount" :key="'b'+n" href="#live-bag" :transform="`translate(${715+(n-1)*70} 488) scale(.7)`"/></g>
  </svg>
  <div v-else class="art-fallback"><InkIcon name="paper" :size="64"/><p>Illustration unavailable</p><p>{{scene.alt}}</p><small>Text-only fallback · this visit is marked as degraded.</small></div>
  <span class="scene-scribble">{{scene.timeLabel}} · a little moment</span>
  <div v-if="variants.length" class="prop-strip" :aria-label="scene.id==='S16'?'Actual items from today':'Current story items'"><span v-for="v in variants" :key="v.id"><InkIcon :name="v.id" :size="25"/><b>{{v.label}}</b></span></div>
  <div v-if="aftermath" class="aftermath-bubble" role="status"><span class="mini-label">YOU CHOSE · {{selected}}</span>{{aftermath}}</div>
</div></template>
