<script setup lang="ts">
import type { ChatAssistantMessage, ChatHistoryItem, ChatSlices, ChatSlicesText, ChatSlicesToolCallResult } from '../../../../types/chat'
import type { ChatToolCallRendererRegistry } from './tool-call-renderer'

import { isStageCapacitor, isStageWeb } from '@proj-airi/stage-shared'
import { computed } from 'vue'

import ChatAvatar from './ChatAvatar.vue'
import ChatResponsePart from './response-part.vue'
import ChatToolCallBlock from './tool-call-block.vue'

import { MarkdownRenderer } from '../../../markdown'
import { formatMessageTime, getChatHistoryItemCopyText } from '../utils'
import { ChatActionMenu } from './action-menu'
import { createToolCallResultLookup, resolveToolCallBlockState } from './tool-call-results'

const props = withDefaults(defineProps<{
  message: ChatAssistantMessage
  label: string
  showPlaceholder?: boolean
  variant?: 'desktop' | 'mobile'
  toolCallRenderers?: ChatToolCallRendererRegistry
  /** First message of a same-sender run: renders the avatar + name/time header. */
  groupStart?: boolean
  /** Character portrait URL for the avatar chip (falls back to a monogram). */
  portraitUrl?: string
}>(), {
  showPlaceholder: false,
  variant: 'desktop',
  toolCallRenderers: () => ({}),
  groupStart: true,
})

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'delete'): void
  (e: 'toolCallRerun', payload: { toolCallId: string, toolName: string, args: string }): void
}>()

const resolvedSlices = computed<ChatSlices[]>(() => {
  if (props.message.slices?.length) {
    return props.message.slices
  }

  if (typeof props.message.content === 'string' && props.message.content.trim()) {
    return [{ type: 'text', text: props.message.content } satisfies ChatSlicesText]
  }

  if (Array.isArray(props.message.content)) {
    const textPart = props.message.content.find(part => 'type' in part && part.type === 'text') as { text?: string } | undefined
    if (textPart?.text)
      return [{ type: 'text', text: textPart.text } satisfies ChatSlicesText]
  }

  return []
})

const toolResultById = computed(() => {
  return createToolCallResultLookup(resolvedSlices.value, props.message.tool_results)
})

function getToolCallResult(slice: ChatSlices): ChatSlicesToolCallResult | undefined {
  if (slice.type !== 'tool-call') {
    return undefined
  }

  return toolResultById.value.get(slice.toolCall.toolCallId)
}

function getToolCallState(slice: ChatSlices): 'executing' | 'done' | 'error' {
  return resolveToolCallBlockState(getToolCallResult(slice))
}

function getToolCallRenderer(slice: ChatSlices) {
  if (slice.type !== 'tool-call') {
    return ChatToolCallBlock
  }

  return props.toolCallRenderers[slice.toolCall.toolName] ?? ChatToolCallBlock
}

const showLoader = computed(() => props.showPlaceholder && resolvedSlices.value.length === 0)
const boxClasses = computed(() => [
  props.variant === 'mobile' ? 'px-2 py-2 text-sm bg-primary-50/90 dark:bg-primary-950/90' : 'px-3 py-3 bg-primary-50/80 dark:bg-primary-950/80',
])
const timestamp = computed(() => formatMessageTime((props.message as { createdAt?: number }).createdAt))
const copyText = computed(() => getChatHistoryItemCopyText(props.message as ChatHistoryItem))
</script>

<template>
  <div class="ph-no-capture flex gap-2">
    <!-- Avatar gutter: portrait on the first message of a run, spacer otherwise, so bubbles stay aligned. -->
    <div class="w-7 shrink-0">
      <ChatAvatar v-if="groupStart" :name="label" :src="portraitUrl" />
    </div>
    <!--
      Cap bubble width to the 85% envelope MINUS the avatar gutter (w-7 + gap-2 = 2.25rem),
      so avatar + bubble together stay within 85% and the right edge isn't pushed past the panel.
    -->
    <div flex="~ col" min-w-0 class="max-w-[calc(85%_-_2.25rem)] items-start">
      <div v-if="groupStart" class="mb-1 flex items-baseline gap-2">
        <span text-sm text="black/60 dark:white/65" font-normal>{{ label }}</span>
        <span v-if="timestamp" text-xs text="black/35 dark:white/30">{{ timestamp }}</span>
      </div>
      <ChatActionMenu
        :copy-text="copyText"
        :can-delete="!showPlaceholder"
        @copy="emit('copy')"
        @delete="emit('delete')"
      >
        <template #default="{ setMeasuredElement }">
          <div
            :ref="setMeasuredElement"
            flex="~ col" shadow="sm primary-200/50 dark:none"
            min-w-20 gap-2 h="unset <sm:fit"
            :class="[
              'rounded-2xl rounded-bl-md',
              boxClasses,
              (isStageWeb() || isStageCapacitor()) && props.variant === 'mobile' ? 'select-none sm:select-auto' : '',
            ]"
          >
            <ChatResponsePart
              v-if="message.categorization"
              :message="message"
              :variant="variant"
            />
            <div v-if="resolvedSlices.length > 0" class="flex flex-col gap-2 break-words" text="primary-700 dark:primary-100">
              <template v-for="(slice, sliceIndex) in resolvedSlices" :key="sliceIndex">
                <component
                  :is="getToolCallRenderer(slice)"
                  v-if="slice.type === 'tool-call'"
                  :tool-call-id="slice.toolCall.toolCallId"
                  :tool-name="slice.toolCall.toolName"
                  :args="slice.toolCall.args"
                  :state="getToolCallState(slice)"
                  :result="getToolCallResult(slice)?.result"
                  @tool-call-rerun="emit('toolCallRerun', $event)"
                />
                <template v-else-if="slice.type === 'tool-call-result'" />
                <template v-else-if="slice.type === 'text'">
                  <MarkdownRenderer :content="slice.text" />
                </template>
              </template>
            </div>
            <div v-else-if="showLoader" i-eos-icons:three-dots-loading />
          </div>
        </template>
      </ChatActionMenu>
    </div>
  </div>
</template>
