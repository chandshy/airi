<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ChatAvatar from './ChatAvatar.vue'

const props = withDefaults(defineProps<{
  /** Character display name for the greeting + avatar monogram. */
  name?: string
  /** Character portrait URL for the avatar (falls back to a monogram). */
  portraitUrl?: string
}>(), {
  name: 'AIRI',
})

defineEmits<{
  (e: 'selectPrompt', text: string): void
}>()

const { t } = useI18n()
const name = computed(() => props.name)
const portraitUrl = computed(() => props.portraitUrl)

// Starter prompts are individually-keyed so translators can localize each one;
// the labels shown to the user double as the text inserted into the input.
const starterKeys = ['s1', 's2', 's3', 's4'] as const
const starters = computed(() => starterKeys.map(key => t(`stage.chat.starters.${key}`)))
</script>

<template>
  <div class="h-full min-h-0 flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
    <ChatAvatar :name="name" :src="portraitUrl" size="md" />

    <div class="flex flex-col gap-1">
      <div class="text-lg text-neutral-800 font-medium dark:text-neutral-100">
        {{ t('stage.chat.empty.greeting', { name }) }}
      </div>
      <div class="text-sm text-neutral-500 dark:text-neutral-400">
        {{ t('stage.chat.empty.subtitle') }}
      </div>
    </div>

    <div class="max-w-md flex flex-wrap items-center justify-center gap-2">
      <button
        v-for="(prompt, index) in starters"
        :key="index"
        type="button"
        :class="[
          'rounded-full px-3 py-1.5 text-sm',
          'border border-primary-200/60 dark:border-primary-700/40',
          'bg-primary-50/60 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
          'transition-colors hover:bg-primary-100/80 dark:hover:bg-primary-800/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
        ]"
        @click="$emit('selectPrompt', prompt)"
      >
        {{ prompt }}
      </button>
    </div>
  </div>
</template>
