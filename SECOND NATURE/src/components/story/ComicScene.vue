<script setup lang="ts">
import { computed } from 'vue';
import type { Session, Scene } from '../../domain/story/types';
import { artPath } from '../../services/storyAssetService';
import InkIcon from './InkIcon.vue';
const props=defineProps<{scene:Scene;session:Session;degraded?:boolean;aftermath?:string}>();
const carried=computed(()=>props.session.items.filter(i=>i.carried));
const selected=computed(()=>props.session.visits.find(v=>v.sceneId===props.scene.id)?.selectedChoiceId);
const sceneAsset=computed(()=>props.scene.id==='S02T'&&selected.value?`S02T-${selected.value}`:(props.scene.id==='S02T'?'S02T':props.scene.artId??props.scene.id));
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
  <img v-if="!degraded" class="scene-art" :src="artPath(sceneAsset)" :alt="scene.alt"/>
  <div v-else class="art-fallback"><InkIcon name="paper" :size="64"/><p>Illustration unavailable</p><p>{{scene.alt}}</p><small>Text-only fallback · this visit is marked as degraded.</small></div>
  <span class="scene-scribble">{{scene.timeLabel}} · a little moment</span>
  <div v-if="variants.length" class="prop-strip" :aria-label="scene.id==='S16'?'Actual items from today':'Current story items'"><span v-for="v in variants" :key="v.id"><InkIcon :name="v.id" :size="25"/><b>{{v.label}}</b></span></div>
  <div v-if="aftermath" class="aftermath-bubble" role="status"><span class="mini-label">YOU CHOSE · {{selected}}</span>{{aftermath}}</div>
</div></template>
