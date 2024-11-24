import { expect, test } from 'vitest'
import { atou, binarySearch, sortWordsByLength, sortWordsByLocale, utoa } from './utils'

const words = [
  'bc',
  'abc',
  'df',
  'dfe',
  'z',
  'def'
]
test('sortWordsByLocale', () => {
  expect(sortWordsByLocale(words)).toMatchInlineSnapshot(`
    [
      "abc",
      "bc",
      "def",
      "df",
      "dfe",
      "z",
    ]
  `)
})
test('sortWordsByLength', () => {
  expect(sortWordsByLength(words)).toMatchInlineSnapshot(`
    [
      "z",
      "bc",
      "df",
      "abc",
      "def",
      "dfe",
    ]
  `)
})

test('binarySearch', () => {
  const array = [0,1,2,3,4,5,6,7,8,9,10]
  expect(binarySearch(array, 8, (a,b)=>a-b)).toBe(8)
  expect(binarySearch(array, 3.5, (a,b)=>a-b)).toBe(~4)
  expect(binarySearch(array, -1, (a,b)=>a-b)).toBe(~0)
  expect(binarySearch(array, 11, (a,b)=>a-b)).toBe(~11)
})

test('atou utoa', () => {
  const array = ['测试']
  const str1 = JSON.stringify(array)
  const base64 = utoa(str1)
  const str2 = atou(base64)
  const arr = JSON.parse(str2)
  expect(str1 === str2).toBe(true)
  expect(Array.isArray(arr)).toBe(true)
})