import { atou } from './utils';
import _map from '../map.fflate?raw'
import _trie from '../trie.fflate?raw'
import { useDualDAWG } from './dawg';
import { useOptions } from './store';
import additionalTranslation from '@/translation'

const map = JSON.parse(atou(_map)) as [string, string][]
const gameTextMap = new Map(map)

const engine = useDualDAWG(_trie)
const katakanaRegex = /[\u30A1-\u30FA\u30FD-\u30FF][\u3099\u309A\u30A1-\u30FF]*[\u3099\u309A\u30A1-\u30FA\u30FC-\u30FF]|[\uFF66-\uFF6F\uFF71-\uFF9D][\uFF65-\uFF9F]*[\uFF66-\uFF9F]/y;

Object.keys(additionalTranslation).forEach(w=>{
  addWord(w)
})

const { customTranslations } = useOptions()
Object.keys(customTranslations.value).forEach(w=>{
  addWord(w)
})

interface MatchResult {
  type: 'game' | 'katakana'
  start: number
  end: number
}

export function matchKatakanaOrTerm(text: string) {
  const list = engine.findWords(text)
  const lengthMap = new Map(list.map(it=>[it.start, it.end-it.start]))
  const results: MatchResult[] = []
  for (let i = 0; i < text.length; ++i) {
    katakanaRegex.lastIndex = i
    let match = null
    match = katakanaRegex.exec(text)
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

export function addWord(word: string) {
  engine.trie.addWord(word)
}
export function removeWord(word: string) {
  engine.trie.removeWord(word)
}

export function getBuiltinTranslation(key: string){
  // gametext
  // customTranslation
  return customTranslations.value[key] || additionalTranslation[key] || gameTextMap.get(key)
}
