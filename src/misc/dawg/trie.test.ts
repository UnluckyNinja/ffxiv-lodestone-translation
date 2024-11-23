import { expect, test } from 'vitest';
import { compareTrieNode, TrieAutomaton } from './trie';

test('Trie automaton serialization', ()=>{
  const trie = new TrieAutomaton(['acb','bac', 'ab', 'abc', 'bcd', 'a'])
  const s1 = trie.serialize()
  const other = TrieAutomaton.from(s1)
  expect(trie.states.length === other.states.length).toBe(true)
  for (let i = 0; i < trie.states.length; ++i) {
    if (trie.states[i] === null ){
      expect(other.states[i]).toBeNull()
      continue
    }
    expect(compareTrieNode(trie.states[i]!, other.states[i]!)).toBe(0)
  }
  const s2 = other.serialize()
  expect(s1 === s2).toBe(true)
})

