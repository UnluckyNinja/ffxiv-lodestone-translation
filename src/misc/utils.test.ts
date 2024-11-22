import { expect, test } from 'vitest'
import { binarySearch, sortWordsByLength, sortWordsByLocale } from './utils'

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