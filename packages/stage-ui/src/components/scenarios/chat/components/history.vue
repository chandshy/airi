<script setup lang="ts">
import type { ChatAssistantMessage, ChatHistoryItem, ContextMessage } from '../../../../types/chat'
import type { ChatToolCallRendererRegistry } from './tool-call-renderer'

import { computed, provide, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ChatAssistantItem from './assistant-item.vue'
import ChatEmptyState from './ChatEmptyState.vue'
import ChatErrorItem from './error-item.vue'
import ChatUserItem from './user-item.vue'

import { useChatHistoryScroll } from '../composables/use-chat-history-scroll'
import { chatScrollContainerKey } from '../constants'
import { getChatHistoryItemKey } from '../utils'

const props = withDefaults(defineProps<{
  messages: ChatHistoryItem[]
  streamingMessage?: ChatAssistantMessage & { createdAt?: number }
  sending?: boolean
  assistantLabel?: string
  /** Character portrait URL for assistant avatars + empty state (host supplies it; falls back to a monogram). */
  assistantPortraitUrl?: string
  userLabel?: string
  errorLabel?: string
  retryLabel?: string
  variant?: 'desktop' | 'mobile'
  toolCallRenderers?: ChatToolCallRendererRegistry
}>(), {
  sending: false,
  variant: 'desktop',
  toolCallRenderers: () => ({}),
})

const emit = defineEmits<{
  (e: 'copyMessage', payload: { message: ChatHistoryItem, index: number, key: string | number }): void
  (e: 'deleteMessage', payload: { message: ChatHistoryItem, index: number, key: string | number }): void
  (e: 'retryMessage', payload: { message: ChatHistoryItem, index: number, key: string | number }): void
  (e: 'toolCallRerun', payload: { message: ChatHistoryItem, index: number, key: string | number, toolCallId: string, toolName: string, args: string }): void
  (e: 'selectPrompt', text: string): void
}>()

const chatHistoryRef = ref<HTMLDivElement>()
provide(chatScrollContainerKey, chatHistoryRef)

const { t } = useI18n()
const labels = computed(() => ({
  assistant: props.assistantLabel ?? t('stage.chat.message.character-name.airi'),
  user: props.userLabel ?? t('stage.chat.message.character-name.you'),
  error: props.errorLabel ?? t('stage.chat.message.character-name.core-system'),
  retry: props.retryLabel ?? t('stage.chat.actions.retry'),
}))

const streaming = computed<ChatAssistantMessage & { context?: ContextMessage } & { createdAt?: number }>(() => props.streamingMessage ?? { role: 'assistant', content: '', slices: [], tool_results: [], createdAt: Date.now() })
const showStreamingPlaceholder = computed(() => (streaming.value.slices?.length ?? 0) === 0 && !streaming.value.content)
const streamingTs = computed(() => streaming.value?.createdAt)
function shouldShowPlaceholder(message: ChatHistoryItem) {
  const ts = streamingTs.value
  if (ts == null)
    return false

  return message.context?.createdAt === ts || message.createdAt === ts
}
const renderMessages = computed<ChatHistoryItem[]>(() => {
  if (!props.sending)
    return props.messages

  const streamTs = streamingTs.value
  if (!streamTs)
    return props.messages

  const hasStreamAlready = streamTs && props.messages.some(msg => msg?.role === 'assistant' && msg?.createdAt === streamTs)
  if (hasStreamAlready)
    return props.messages

  return [...props.messages, streaming.value]
})

// Empty state shows only when there are no user/assistant/error turns; the
// session's leading system message (never rendered) does not count as content.
const hasVisibleMessages = computed(() =>
  renderMessages.value.some(message => message.role === 'user' || message.role === 'assistant' || message.role === 'error'),
)

// First message of a same-sender run: drives the avatar + name/time header.
function isGroupStart(index: number): boolean {
  const previous = renderMessages.value[index - 1]
  return !previous || previous.role !== renderMessages.value[index]?.role
}

useChatHistoryScroll({
  containerRef: chatHistoryRef,
  messages: renderMessages,
  getKey: getChatHistoryItemKey,
})

function emitCopyMessage(message: ChatHistoryItem, index: number) {
  emit('copyMessage', {
    message,
    index,
    key: getChatHistoryItemKey(message, index),
  })
}

function emitDeleteMessage(message: ChatHistoryItem, index: number) {
  emit('deleteMessage', {
    message,
    index,
    key: getChatHistoryItemKey(message, index),
  })
}

function emitRetryMessage(message: ChatHistoryItem, index: number) {
  emit('retryMessage', {
    message,
    index,
    key: getChatHistoryItemKey(message, index),
  })
}

function emitToolCallRerun(
  message: ChatHistoryItem,
  index: number,
  payload: { toolCallId: string, toolName: string, args: string },
) {
  emit('toolCallRerun', {
    message,
    index,
    key: getChatHistoryItemKey(message, index),
    ...payload,
  })
}
</script>

<template>
  <div ref="chatHistoryRef" v-auto-animate flex="~ col" relative h-full w-full overflow-y-auto rounded-xl px="4 <sm:2" py="<sm:2" :class="variant === 'mobile' ? 'gap-1' : 'gap-2'">
    <ChatEmptyState
      v-if="!hasVisibleMessages"
      :name="labels.assistant"
      :portrait-url="assistantPortraitUrl"
      @select-prompt="emit('selectPrompt', $event)"
    />
    <template v-for="(message, index) in renderMessages" v-else :key="getChatHistoryItemKey(message, index)">
      <div
        :data-chat-message-index="index"
        :data-chat-message-key="String(getChatHistoryItemKey(message, index))"
        :data-chat-message-role="message.role"
        :class="isGroupStart(index) ? '' : (variant === 'mobile' ? '-mt-1' : '-mt-1.5')"
      >
        <ChatErrorItem
          v-if="message.role === 'error'"
          :message="message"
          :label="labels.error"
          :retry-label="labels.retry"
          :can-retry="renderMessages[index - 1]?.role === 'user'"
          :show-placeholder="sending && index === renderMessages.length - 1"
          :variant="variant"
          @copy="emitCopyMessage(message, index)"
          @retry="emitRetryMessage(message, index)"
          @delete="emitDeleteMessage(message, index)"
        />
        <ChatAssistantItem
          v-else-if="message.role === 'assistant'"
          :message="message"
          :label="labels.assistant"
          :group-start="isGroupStart(index)"
          :portrait-url="assistantPortraitUrl"
          :show-placeholder="shouldShowPlaceholder(message) && showStreamingPlaceholder"
          :variant="variant"
          :tool-call-renderers="toolCallRenderers"
          @copy="emitCopyMessage(message, index)"
          @delete="emitDeleteMessage(message, index)"
          @tool-call-rerun="emitToolCallRerun(message, index, $event)"
        />
        <ChatUserItem
          v-else-if="message.role === 'user'"
          :message="message"
          :label="labels.user"
          :group-start="isGroupStart(index)"
          :variant="variant"
          @copy="emitCopyMessage(message, index)"
          @delete="emitDeleteMessage(message, index)"
        />
      </div>
    </template>
  </div>
</template>
