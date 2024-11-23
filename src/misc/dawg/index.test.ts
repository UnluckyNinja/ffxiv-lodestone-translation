import { expect, test } from 'vitest'
import { useDualDAWG } from '.'

test('useDualDAWG', ()=>{
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

test('useDualDAWG', ()=>{
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