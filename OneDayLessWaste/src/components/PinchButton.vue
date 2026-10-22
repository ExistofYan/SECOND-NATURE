<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useGestureNavStore } from "../stores/gestureNavStore";

defineOptions({ inheritAttrs: false });
const props = defineProps<{ disabled?: boolean; variant?: "primary" | "secondary" | "quiet" }>();
const emit = defineEmits<{ (e: "press"): void }>();
const nav = useGestureNavStore();
const el = ref<HTMLButtonElement | null>(null);
const hovered = computed(() => {
  void nav.frameId;
  if (!el.value || !nav.mergedActive || props.disabled || nav.inputLocked || nav.awaitingRelease) return false;
  const r = el.value.getBoundingClientRect();
  return nav.x >= r.left && nav.x <= r.right && nav.y >= r.top && nav.y <= r.bottom;
});
// No timer. A new pinch triggers exactly once. Mounting under a held pinch
// cannot activate a new button: it must receive a subsequent pinch edge.
watch(() => nav.pressId, () => {
  if (hovered.value && !nav.isDragging && !props.disabled && nav.consumedPressId !== nav.pressId) {
    // Only the topmost control may consume an edge, including during a modal
    // close or a page change. One pinch must never spill into a second action.
    const top = document.elementFromPoint?.(nav.x, nav.y);
    if (top && !el.value?.contains(top)) return;
    nav.consumedPressId = nav.pressId;
    emit("press");
  }
});
</script>

<template>
  <button ref="el" type="button" v-bind="$attrs" :disabled="disabled"
    :class="['pinch-button', `button-${variant ?? 'primary'}`, { 'gesture-hover': hovered }]"
    @click.prevent @keydown.enter.prevent @keydown.space.prevent>
    <slot />
  </button>
</template>
