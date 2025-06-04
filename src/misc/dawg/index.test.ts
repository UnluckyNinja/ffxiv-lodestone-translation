import { expect, test } from 'vitest'
import { useDualDAWG } from '.'
import map from '../../assets/map_jp_itemonly.fflate?url'

import { strFromU8, unzlibSync } from 'fflate'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

test('useDualDAWG 1', ()=>{
  const text = 'abcdea'
  const words = ['a', 'b', 'bc', 'dea']
  const { findWords } = useDualDAWG(words)
  const result = findWords(text)
  expect(result).toMatchInlineSnapshot(`
    [
      {
        "end": 1,
        "start": 0,
      },
      {
        "end": 3,
        "start": 1,
      },
      {
        "end": 6,
        "start": 3,
      },
    ]
  `)
})

test('useDualDAWG 2', ()=>{
  const text = '山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？'
  const words = ['山', '陋之', '何陋之有', '有', '苔痕上阶', '苔痕上阶绿']
  const { findWords } = useDualDAWG(words)
  const result = findWords(text)
  expect(result.map(it=>text.slice(it.start, it.end))).toMatchInlineSnapshot(`
    [
      "山",
      "有",
      "有",
      "苔痕上阶绿",
      "有",
      "何陋之有",
    ]
  `)
})

test('useDualDAWG big data', async ()=>{

  const buffer = await readFile(path.resolve(process.cwd(), '.'+map))

  const entries = JSON.parse(strFromU8(unzlibSync(new Uint8Array(buffer)))) as [string, string][]
  const text = entries[0][0]
  const words = entries.slice(0).map(it=>it[0])
  const { findWords } = useDualDAWG(words)
  const result = findWords(text)
  expect(result.map(it=>text.slice(it.start, it.end))).toMatchInlineSnapshot(`
    [
      "ファイアシャード",
    ]
  `)
})