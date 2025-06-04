import { expect, test, vi } from 'vitest'
import { useGameText } from './gameText'

test('japanese example', async () => {
  vi.mock('./src/misc/store.ts', () => {
    return {
      useOptions: ()=> ({
        enableGoogleTranslate: { value: false },
        translateMode: { value: 'full' },
        customTranslations: {},
        matchSelectors: {},
        katakanaLanguage: 'en',
        resetOptions: () => null,
        sourceLanguage: ref('jp'),
        datasetType: ref('itemonly'),
      })
    }
  })
  const { matchKatakanaOrTerm } = useGameText()
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