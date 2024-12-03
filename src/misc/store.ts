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
    const translateMode = useStorage('translateMode', 'full', storage)
    const customTranslations = useStorage('customTranslations', {} as Record<string, string>, storage)
    const matchSelectors = useStorage('matchSelectors', ['article *'] as string[], storage)
    const katakanaLanguage = useStorage('googleLanguage', 'en', storage)

    function resetOptions(){
      enableGoogleTranslate.value = true
      translateMode.value = 'full'
      customTranslations.value = {}
      matchSelectors.value = ['article *']
      katakanaLanguage.value = 'en'
    }

    return {
      enableGoogleTranslate,
      translateMode,
      customTranslations,
      matchSelectors,
      katakanaLanguage,
      resetOptions
    }
  }
)