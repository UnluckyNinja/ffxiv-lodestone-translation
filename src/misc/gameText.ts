import _map_en_full from '../assets/map_en_full.fflate?url'
import _map_en_itemonly from '../assets/map_en_itemonly.fflate?url'
import _map_jp_full from '../assets/map_jp_full.fflate?url'
import _map_jp_itemonly from '../assets/map_jp_itemonly.fflate?url'
import _trie_en_full from '../assets/trie_en_full.fflate?url'
import _trie_en_itemonly from '../assets/trie_en_itemonly.fflate?url'
import _trie_jp_full from '../assets/trie_jp_full.fflate?url'
import _trie_jp_itemonly from '../assets/trie_jp_itemonly.fflate?url'
import { useDualDAWG } from './dawg';
import { useOptions } from './store';
import additionalTranslation from '@/translation'
import { strFromU8, unzlibSync } from 'fflate';

interface MatchResult {
  type: 'game' | 'katakana'
  start: number
  end: number
}

const files = {
  map: {
    en: {
      full: _map_en_full,
      itemonly: _map_en_itemonly,
    },
    jp: {
      full: _map_jp_full,
      itemonly: _map_jp_itemonly,
    }
  },
  trie: {
    en: {
      full: _trie_en_full,
      itemonly: _trie_en_itemonly,
    },
    jp: {
      full: _trie_jp_full,
      itemonly: _trie_jp_itemonly,
    }
  },
}

async function getResource(file: 'map' | 'trie', lang: 'jp' | 'en', mode: 'full' | 'itemonly', toBuffer?: boolean) {
  const url = files[file][lang][mode]
  const buffer = await (await fetch(url)).arrayBuffer()
  if(toBuffer) {
    return buffer
  }
  return JSON.parse(strFromU8(unzlibSync(new Uint8Array(buffer))))
}

export const useGameText = createGlobalState(() => {

  const { customTranslations, enableGoogleTranslate, sourceLanguage, datasetType } = useOptions()

  const isLoading = ref(true)

  let gameTextMap = new Map()
  let engine = useDualDAWG([])

  // watch([sourceLanguage, datasetType], async ([lang, dataset])=>{
  function loadResources(entries: [string, string][], trie: string[] | string | ArrayBuffer){
    isLoading.value = true
    gameTextMap = new Map(entries)
    engine = useDualDAWG(trie)
    Object.keys(additionalTranslation).forEach(w => {
      addWord(w)
    })

    Object.keys(customTranslations.value).forEach(w => {
      addWord(w)
    })
  
    isLoading.value = false
  }
  // }, {immediate: true})
  if (typeof window !== 'undefined') {
    (async function(){
      loadResources(await getResource('map', sourceLanguage.value, datasetType.value), await getResource('trie', sourceLanguage.value, datasetType.value, true))
    })()
  }


  const katakanaRegex = /[\u30A1-\u30FA\u30FD-\u30FF][\u3099\u309A\u30A1-\u30FF]*[\u3099\u309A\u30A1-\u30FA\u30FC-\u30FF]|[\uFF66-\uFF6F\uFF71-\uFF9D][\uFF65-\uFF9F]*[\uFF66-\uFF9F]/y;

  function matchKatakanaOrTerm(text: string) {
    const list = engine.findWords(text)
    const lengthMap = new Map(list.map(it => [it.start, it.end - it.start]))
    const results: MatchResult[] = []
    for (let i = 0; i < text.length; ++i) {
      katakanaRegex.lastIndex = i
      let match = null
      if (enableGoogleTranslate.value && sourceLanguage.value === 'jp') {
        match = katakanaRegex.exec(text)
      }
      const length = lengthMap.get(i)
      if (match) {
        if (length && length >= match[0].length) { // -> gameText > match, pick gameText
          results.push({
            type: 'game',
            start: i,
            end: i + length
          })
          i = i + length
          --i
        } else { // -> !gameText || gameText < match, pick match
          results.push({
            type: 'katakana',
            start: i,
            end: i + match[0].length
          })
          i = i + match[0].length
          --i
        }
      } else {
        if (length && length > 0) { // -> !match && gameText, pick gameText
          results.push({
            type: 'game',
            start: i,
            end: i + length
          })
          i = i + length
          --i
        }
        // no match and no game text, do nothing
      }
    }
    return results
  }

  function addWord(word: string) {
    engine.trie.addWord(word)
  }
  function removeWord(word: string) {
    engine.trie.removeWord(word)
  }

  function getBuiltinTranslation(key: string) {
    // gametext
    // customTranslation
    return customTranslations.value[key] || additionalTranslation[key] || gameTextMap.get(key)
  }
  return {
    isLoading,
    loadResources,
    matchKatakanaOrTerm,
    addWord,
    removeWord,
    getBuiltinTranslation
  }
})
