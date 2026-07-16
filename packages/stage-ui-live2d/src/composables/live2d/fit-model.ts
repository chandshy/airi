import type { MaybeRefOrGetter } from 'vue'

import { isStageWeb } from '@proj-airi/stage-shared'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { computed, toValue } from 'vue'

const breakpoints = useBreakpoints(breakpointsTailwind)

// Web landscape shows the full body in a tall side panel; other targets keep the
// zoomed upper-body framing (e.g. the desktop pet). The model is center-anchored,
// so the vertical fit factor and the y offset together decide how much shows.
const isWebLandscape = computed(() => isStageWeb() && !breakpoints.smallerOrEqual('md').value)

const startingOffsetY = computed(() => {
  if (isWebLandscape.value)
    return 0.5 // full body centered in the avatar panel
  if (isStageWeb())
    return 0.75 // portrait web: 3/4
  return 1 // upper half (desktop pet)
})

// Vertical fit factor: web landscape fits the whole model just inside the pane so
// the feet stay visible above the bottom edge (<1 leaves a small margin); other
// targets zoom to the upper half (×2).
const heightFitFactor = computed(() => (isWebLandscape.value ? 0.9 : 2))

/**
 *  Normalizes the model so that user `scale == 1` fits the model to the pane
 *  (full body in web landscape, twice the viewport height otherwise), centered
 *  horizontally when `position.x == 0`.
 */
export function useFitModel(
  canvasDim: MaybeRefOrGetter<{ width: number, height: number }>,
  modelDim: MaybeRefOrGetter<{ width: number, height: number }>,
) {
  const normalizedParam = computed(() => {
    const canvas = toValue(canvasDim)
    const model = toValue(modelDim)

    const heightScale = (canvas.height / model.height * heightFitFactor.value)
    const widthScale = (canvas.width / model.width * 2)
    let minScale = Math.min(heightScale, widthScale)

    if (Number.isNaN(minScale) || minScale <= 0) {
      minScale = 1e-6
    }
    return {
      scale: minScale,
      x: canvas.width / 2,
      y: canvas.height * startingOffsetY.value,
    }
  })

  return normalizedParam
}
