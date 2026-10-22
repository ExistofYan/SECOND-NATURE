<script setup lang="ts">
import { computed } from 'vue';
import { useGestureNavStore } from '../stores/gestureNavStore';
const nav = useGestureNavStore();
const position = computed(() => ({
  transform: 'translate3d(' + (nav.x - 15) + 'px,' + (nav.y - 15) + 'px,0)' + (nav.pinching ? ' scale(.8)' : ''),
}));
</script>
<template>
  <div v-if="nav.pointerActive" class="gesture-cursor" :class="{pinching:nav.pinching,locked:nav.inputLocked||nav.awaitingRelease}" :style="position" aria-hidden="true"><i/></div>
</template>
