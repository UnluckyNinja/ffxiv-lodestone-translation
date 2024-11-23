import { expect, test } from 'vitest';
import { SuffixAutomaton } from './sam';

test('suffix automaton', ()=>{
  const sam = new SuffixAutomaton('abcdef')
  expect(sam.root.next.has('a')).toBeTruthy()
  expect(sam.root.next.has('b')).toBeTruthy()
  expect(sam.root.next.has('c')).toBeTruthy()
  expect(sam.root.next.has('d')).toBeTruthy()
  expect(sam.root.next.has('e')).toBeTruthy()
  expect(sam.root.next.has('f')).toBeTruthy()
})