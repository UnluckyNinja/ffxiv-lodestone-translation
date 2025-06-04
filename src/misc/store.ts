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
    const enableGoogleTranslate = useStorage('enableGoogleTranslate', false, storage)
    const translateMode = useStorage<'full' | 'katakana'>('translateMode', 'katakana', storage)
    const customTranslations = useStorage('customTranslations', {} as Record<string, string>, storage)
    const matchSelectors = useStorage('matchSelectors', ['article *'] as string[], storage)
    const katakanaLanguage = useStorage('googleLanguage', 'en', storage)
    const sourceLanguage = useStorage<'jp' | 'en'>('source-language', 'jp', storage)
    const datasetType = useStorage<'full' | 'itemonly'>('dataset-type', 'itemonly', storage)

    function resetOptions(){
      enableGoogleTranslate.value = false
      translateMode.value = 'katakana'
      customTranslations.value = {}
      matchSelectors.value = ['article *']
      katakanaLanguage.value = 'en'
      sourceLanguage.value = 'jp'
      datasetType.value = 'itemonly'
    }

    return {
      enableGoogleTranslate,
      translateMode,
      customTranslations,
      matchSelectors,
      katakanaLanguage,
      sourceLanguage,
      datasetType,
      resetOptions
    }
  }
)