<script setup lang="ts">
import type { ChatHistoryItem, ChatMessage } from '../../../../types/chat'

import { isStageCapacitor, isStageWeb } from '@proj-airi/stage-shared'
import { computed } from 'vue'

import { MarkdownRenderer } from '../../../markdown'
import { ChatActionMenu } from '../components/action-menu'
import { formatMessageTime, getChatHistoryItemCopyText } from '../utils'

const props = withDefaults(defineProps<{
  message: Extract<ChatMessage, { role: 'user' }>
  label: string
  variant?: 'desktop' | 'mobile'
  /** First message of a same-sender run: renders the name/time header. */
  groupStart?: boolean
}>(), {
  variant: 'desktop',
  groupStart: true,
})

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'delete'): void
}>()

const content = computed(() => {
  const raw = props.message.content
  if (typeof raw === 'string')
    return raw

  if (Array.isArray(raw)) {
    const textPart = raw.find(part => 'type' in part && part.type === 'text') as { text?: string } | undefined
    if (textPart?.text)
      return textPart.text

    return raw.map(entry => JSON.stringify(entry)).join('\n')
  }

  return ''
})

const containerClasses = computed(() => [
  'flex',
  props.variant === 'mobile' ? 'justify-start' : 'justify-end',
])
// Cap bubble width so long text never spans the full panel or hugs the edge.
const columnClasses = computed(() => [
  'min-w-0 max-w-[85%]',
  props.variant === 'mobile' ? 'items-start' : 'items-end',
])

const boxClasses = computed(() => [
  props.variant === 'mobile' ? 'px-2 py-2 text-sm bg-neutral-100/90 dark:bg-neutral-800/90' : 'px-3 py-3 bg-neutral-100/80 dark:bg-neutral-800/80',
])
const timestamp = computed(() => formatMessageTime((props.message as { createdAt?: number }).createdAt))
const copyText = computed(() => getChatHistoryItemCopyText(props.message as ChatHistoryItem))
</script>

<template>
  <div v-if="message.role === 'user'" :class="containerClasses" class="ph-no-capture">
    <div flex="~ col" :class="columnClasses">
      <div v-if="groupStart" class="mb-1 flex items-baseline gap-2">
        <span v-if="timestamp" text-xs text="black/35 dark:white/30">{{ timestamp }}</span>
        <span text-sm text="black/60 dark:white/65" font-normal>{{ label }}</span>
      </div>
      <ChatActionMenu
        :copy-text="copyText"
        placement="left"
        @copy="emit('copy')"
        @delete="emit('delete')"
      >
        <template #default="{ setMeasuredElement }">
          <div
            :ref="setMeasuredElement"
            flex="~ col" shadow="sm neutral-200/50 dark:none"
            min-w-20 h="unset <sm:fit"
            :class="[
              'rounded-2xl rounded-br-md',
              boxClasses,
              (isStageWeb() || isStageCapacitor()) && props.variant === 'mobile' ? 'select-none sm:select-auto' : '',
            ]"
          >
            <MarkdownRenderer
              :content="content as string"
              class="break-words"
            />
          </div>
        </template>
      </ChatActionMenu>
    </div>
  </div>
</template>
