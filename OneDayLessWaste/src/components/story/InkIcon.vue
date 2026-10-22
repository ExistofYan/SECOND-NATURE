<script setup lang="ts">withDefaults(defineProps<{name?:string;size?:number}>(),{name:'bag',size:32});</script>
<template><svg :width="size" :height="size" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <g v-if="name==='cup'"><path d="M8 15h26l-3 25H12zM34 20c17-5 16 17-1 12M16 9c-6-6 5-6 0-12M26 9c-6-6 5-6 0-12"/></g>
  <g v-else-if="name==='bottle'"><path d="M19 3h10v6l6 8v26H13V17l6-8zM19 9h10M15 24h18M15 33h18"/></g>
  <g v-else-if="name==='kit'||name==='box'"><rect x="4" y="13" width="29" height="27" rx="5"/><path d="M4 21h29M40 8v32M36 8v12h8V8"/></g>
  <g v-else-if="name==='paper'"><path d="M10 3h21l8 9v32H10zM31 3v10h8M17 23h15M17 30h15M17 37h9"/></g>
  <g v-else-if="name==='food'"><ellipse cx="24" cy="35" rx="21" ry="8"/><path d="M10 31c-2-19 10-26 16-10 8-14 17-7 14 10M7 45h34"/></g>
  <g v-else-if="name==='shirt'"><path d="M15 7l-12 9 7 12 6-4v19h16V24l6 4 7-12-12-9c-3 9-15 9-18 0z"/></g>
  <g v-else-if="name==='hand'"><path d="M13 27V14c0-5 7-5 7 0v10M20 23V8c0-5 7-5 7 0v16M27 23V12c0-5 7-5 7 0v16M34 26V20c0-5 7-5 7 0v14c0 14-20 14-24 8L7 30c-4-6 2-9 6-3l5 6"/></g>
  <g v-else-if="name==='arrow'"><path d="M6 24h35M29 12l12 12-12 12"/></g>
  <g v-else-if="name==='pause'"><path d="M17 10v28M31 10v28" stroke-width="5"/></g>
  <g v-else-if="name==='sun'"><circle cx="24" cy="24" r="9"/><path d="M24 2v6M24 40v6M2 24h6M40 24h6M8 8l5 5M35 35l5 5M8 40l5-5M35 13l5-5"/></g>
  <g v-else-if="name==='moon'"><path d="M32 5a20 20 0 1 0 12 26C24 39 14 19 32 5z"/></g>
  <g v-else-if="name==='download'"><path d="M24 4v27M14 21l10 10 10-10M7 32v11h34V32"/></g>
  <g v-else-if="name==='recycle'"><path d="M14 13l8-10 8 14M29 9l1 8-8-1M38 24l6 12H27M32 42l-5-6 6-5M17 38H4l8-15M5 25l7-2 3 8"/></g>
  <g v-else-if="name==='bag'"><path d="M9 13h30l4 30H5zM16 16V9c0-10 16-10 16 0v7M13 29c9-7 14-7 23 0"/></g>
  <g v-else><circle cx="24" cy="24" r="19"/><path d="M19 17c0-9 16-8 13 1-1 4-8 4-8 10M24 35h.1"/></g>
</svg></template>
