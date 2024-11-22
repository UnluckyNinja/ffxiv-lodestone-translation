import { expect, test } from 'vitest';
import { SortedMap } from './SortedMap';

test('SortedMap', () => {
  const map = new SortedMap((a, b) => a - b, new Map<number, any>())
  map.set(3, 3)
  map.set(2, 2)
  map.set(4, 4)
  map.set(5, 5)
  map.set(1, 1)
  expect([...map.keys()]).toMatchInlineSnapshot(`
    [
      1,
      2,
      3,
      4,
      5,
    ]
  `)
  expect([...map.entries()]).toMatchInlineSnapshot(`
    [
      [
        1,
        1,
      ],
      [
        2,
        2,
      ],
      [
        3,
        3,
      ],
      [
        4,
        4,
      ],
      [
        5,
        5,
      ],
    ]
  `)
  expect([...map.values()]).toMatchInlineSnapshot(`
    [
      1,
      2,
      3,
      4,
      5,
    ]
  `)
  map.set(2.5, 2.5)
  expect([...map.entries()]).toMatchInlineSnapshot(`
    [
      [
        1,
        1,
      ],
      [
        2,
        2,
      ],
      [
        2.5,
        2.5,
      ],
      [
        3,
        3,
      ],
      [
        4,
        4,
      ],
      [
        5,
        5,
      ],
    ]
  `)
  map.delete(2)
  expect([...map.entries()]).toMatchInlineSnapshot(`
    [
      [
        1,
        1,
      ],
      [
        2.5,
        2.5,
      ],
      [
        3,
        3,
      ],
      [
        4,
        4,
      ],
      [
        5,
        5,
      ],
    ]
  `)
})