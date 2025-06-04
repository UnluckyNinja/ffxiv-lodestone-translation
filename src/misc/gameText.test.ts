import { expect, test, vi } from 'vitest'
import { useGameText } from './gameText'
import { readFile } from 'fs/promises'

import _map_jp_itemonly from '../assets/map_jp_itemonly.fflate?url'
import _trie_jp_itemonly from '../assets/trie_jp_itemonly.fflate?url'
import { strFromU8, unzlibSync } from 'fflate/node'
import path from 'path'

test('japanese example', {timeout: 10000}, async () => {
  vi.mock('./store.ts', () => {
    return {
      useOptions: ()=> ({
        enableGoogleTranslate: ref(false),
        translateMode: ref('katakana'),
        customTranslations: ref({}),
        matchSelectors: ref([]),
        katakanaLanguage: 'en',
        sourceLanguage: ref('jp'),
        datasetType: ref('itemonly'),
        resetOptions: () => null,
      })
    }
  })

  const { isLoading, matchKatakanaOrTerm, loadResources } = useGameText()
  console.log(_map_jp_itemonly)
  console.log(path.resolve(process.cwd(), '.'+_map_jp_itemonly))

  const map_buffer = await readFile(path.resolve(process.cwd(), '.'+_map_jp_itemonly))
  const trie_buffer = await readFile(path.resolve(process.cwd(), '.'+_trie_jp_itemonly))

  loadResources(JSON.parse(strFromU8(unzlibSync(new Uint8Array(map_buffer)))), new Uint8Array(trie_buffer).buffer)
  await until(isLoading).toBe(false)
  const text = '「クロの賞状:金賞」「クロの賞状:銀賞」「クロの賞状:銅賞」と引き換えられるご褒美が追加／変更されます。'
  const result = matchKatakanaOrTerm(text)
  expect(result.map(it => text.slice(it.start, it.end))).toMatchInlineSnapshot(`
    [
      "クロの賞状:金賞",
      "クロの賞状:銀賞",
      "クロの賞状:銅賞",
    ]
  `)
  vi.unmock('$')
})