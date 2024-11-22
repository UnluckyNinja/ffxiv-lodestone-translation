import type { StorageLike } from '@vueuse/core'
import { GM_deleteValue, GM_getValue, GM_setValue } from '$'

const storage: StorageLike = {
  getItem(key) {
    return GM_getValue(key)
  },
  removeItem(key) {
    GM_deleteValue(key)
  },
  setItem(key, value) {
    GM_setValue(key, value)
  },
}
export const useOptions = createGlobalState(
  () => {
    const enableGoogleTranslate = useStorage('enableGoogleTranslate', true, storage)
    const customTranslations = useStorage('customTranslations', {} as Record<string, string>, storage)
    const matchSelectors = useStorage('matchSelectors', ['article *'] as string[], storage)

    function resetOptions(){
      enableGoogleTranslate.value = true
      customTranslations.value = {}
      matchSelectors.value = []
    }

    return {
      enableGoogleTranslate,
      customTranslations,
      matchSelectors,
      resetOptions
    }
  }
)