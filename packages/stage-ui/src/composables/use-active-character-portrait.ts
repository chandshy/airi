import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useDisplayModelsStore } from '../stores/display-models'
import { useAiriCardStore } from '../stores/modules/airi-card'

/**
 * Resolves the active character's display identity for chat UI (avatar chips,
 * empty state, header status).
 *
 * The portrait is derived from the active card's selected display model preview:
 * `activeCard → modules.displayModelId → displayModels[id].previewImage`. The
 * display-model list is read reactively (presets are always present; user
 * uploads carry a generated preview), so the URL fills in once the store has
 * loaded and stays empty-safe before then — callers fall back to the monogram.
 */
export function useActiveCharacterPortrait() {
  const { activeCard } = storeToRefs(useAiriCardStore())
  const { displayModels } = storeToRefs(useDisplayModelsStore())

  const name = computed(() => activeCard.value?.name?.trim() || 'AIRI')

  const portraitUrl = computed(() => {
    const id = activeCard.value?.extensions?.airi?.modules?.displayModelId
    if (!id)
      return undefined

    return displayModels.value.find(model => model.id === id)?.previewImage
  })

  // Single-letter fallback rendered when no portrait image is available.
  const monogram = computed(() => name.value.slice(0, 1).toUpperCase())

  return { name, portraitUrl, monogram }
}
