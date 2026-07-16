<script setup lang="ts">
import { useAnalytics } from '@proj-airi/stage-ui/composables/use-analytics'
import { useChatMaintenanceStore } from '@proj-airi/stage-ui/stores/chat/maintenance'
import { useChatSessionStore } from '@proj-airi/stage-ui/stores/chat/session-store'
import { useTheme } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ViewControls from '../Layouts/InteractiveArea/Actions/ViewControls.vue'

import { BackgroundDialogPicker } from '../Backgrounds'

const { cleanupMessages } = useChatMaintenanceStore()
const { messages } = storeToRefs(useChatSessionStore())
const { trackChatMessagesCleared } = useAnalytics()
const { isDark, toggleDark } = useTheme()
const { t } = useI18n()

const backgroundDialogOpen = ref(false)

function handleCleanupMessages() {
  const messageCount = messages.value.filter(message => message.role !== 'system').length
  cleanupMessages()
  trackChatMessagesCleared({
    source: 'chat_controls',
    message_count: messageCount,
  })
}
</script>

<template>
  <BackgroundDialogPicker v-model="backgroundDialogOpen" />
  <!-- Global chat controls as a right-aligned header row so they never overlap message content. -->
  <div :class="['flex justify-end gap-2', 'px-2 pt-2']">
    <ViewControls />
    <button
      :class="['chat-icon-btn', 'text-lg', 'hover:text-red-500 dark:hover:text-red-400']"
      :title="t('stage.controls.cleanup')"
      :aria-label="t('stage.controls.cleanup')"
      @click="handleCleanupMessages"
    >
      <div class="i-solar:trash-bin-2-bold-duotone" />
    </button>

    <button
      :class="['chat-icon-btn', 'text-lg']"
      :title="t('stage.controls.theme')"
      :aria-label="t('stage.controls.theme')"
      @click="() => toggleDark()"
    >
      <Transition name="fade" mode="out-in">
        <div v-if="isDark" i-solar:moon-bold />
        <div v-else i-solar:sun-2-bold />
      </Transition>
    </button>
    <button
      :class="['chat-icon-btn', 'text-lg']"
      :title="t('stage.controls.background')"
      :aria-label="t('stage.controls.background')"
      @click="backgroundDialogOpen = true"
    >
      <div i-solar:gallery-wide-bold-duotone />
    </button>
  </div>
</template>
