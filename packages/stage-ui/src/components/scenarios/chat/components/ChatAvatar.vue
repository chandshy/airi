<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  /** Display name; also the source for the monogram fallback. */
  name?: string
  /** Portrait image URL; falls back to the monogram when absent or it fails to load. */
  src?: string
  /** Diameter preset. */
  size?: 'sm' | 'md'
}>(), {
  size: 'sm',
})

// Track load failure so a broken preview URL degrades to the monogram.
const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})

const showImage = computed(() => !!props.src && !failed.value)
const monogram = computed(() => (props.name?.trim()?.slice(0, 1) || 'A').toUpperCase())
const sizeClass = computed(() => props.size === 'md' ? 'h-9 w-9 text-base' : 'h-7 w-7 text-xs')
</script>

<template>
  <div
    :class="[
      sizeClass,
      'shrink-0 select-none overflow-hidden rounded-full',
      'flex items-center justify-center',
      'bg-primary-200/60 text-primary-700 dark:bg-primary-800/60 dark:text-primary-100',
      'ring-1 ring-primary-300/40 dark:ring-primary-600/30',
    ]"
    :aria-label="name"
  >
    <img
      v-if="showImage"
      :src="src"
      :alt="name"
      class="h-full w-full object-cover"
      @error="failed = true"
    >
    <span v-else font-medium>{{ monogram }}</span>
  </div>
</template>
