import { binaryInsert } from '../utils'
import { SuffixAutomaton, SuffixNode, walkSAM } from './sam'
import { TrieAutomaton, TrieNode } from './trie'

export type DAWGPatterns<T> = [string, T][] | Map<string, T>

type WalkState = [number, number, TrieNode | null, boolean]
interface Result {
  start: number,
  end: number
}

export function useDualDAWG(patterns: string[]) {
  // let list 
  // if (Array.isArray(patterns)) {
  //   list = patterns.flatMap(it=>it[0])
  // } else {
  //   list = [...patterns.keys()]
  // }
  const trie = new TrieAutomaton(patterns)
  function findWords(text: string) {
    const wordLength = text.length
    const compareFunc = createCompareByLeftPos(wordLength)
    const sam = new SuffixAutomaton(text)
    const finals = sam.getFinals()
    const rightMost = new Map<number, number>()
    let rightMostOfFinal = 0
    const result: Result[] = []
    walkSAM<WalkState>((samNode, state, queue)=>{
      let [matched, matching, trieNode, final] = state

      // final state
      if (final) {
        const start = wordLength - matching
        const end = start + matched
        if (start < rightMostOfFinal) return queue
        rightMostOfFinal = end
        result.push({
          start,
          end,
        })
        return queue
      }

      // store right most position on endPos(id), not work on final output
      // must make sure more left-starting node are processed first
      if (rightMost.has(samNode.id)) {
        const right = rightMost.get(samNode.id)!
        if(right+matching > samNode.len) {
          return queue // when a matching is overlaping with a matched substring, stop
        }
        if (samNode.len - matching + matched > right) {
          rightMost.set(samNode.id, samNode.len - matching + matched)
        }
      } else {
        rightMost.set(samNode.id, samNode.len - matching + matched)
      }

      // if matched a final state in trie, it means there is a longer match
      if (trieNode && trieNode.final) {
        matched = matching
      }

      function insertQueue(node: SuffixNode, st: WalkState){
        const entry = [node, st] as [SuffixNode, WalkState]
        binaryInsert(queue, entry, compareFunc)
      }

      // postpone final state
      if (matched > 0 && finals.get(samNode.id)) {
        insertQueue(samNode, [matched, matching, null, true])
      }
      
      // trieNode === null -> partly matched only propagate to final state.
      // trieNode !== null -> try to match dict of trie
      //   nextNode === null -> unmatched, 
      //     mathed > 0 -> propagate a partly matched state with trieNode === null
      //     else -> do nothing
      //   nextNode !== null -> matched, propagate with trieNode !== null
      if (trieNode) {
        for (const char of samNode.next.keys()) {
          const nextNode = trie.match(char, trieNode)
          if (nextNode) {
            insertQueue(samNode.next.get(char)!, [matched, matching + 1, nextNode, false])
          } else {
            if (matched > 0) {
              insertQueue(samNode.next.get(char)!, [matched, matching + 1, null, false])
            }
          }
        }
      } else {
        for (const char of samNode.next.keys()) {
          insertQueue(samNode.next.get(char)!, [matched, matching + 1, null, false])
        }
      }
      return queue
    }, [sam.root, [0, 0, trie.root, false]])
    return result
  }
  return {
    trie,
    findWords
  }
}
function createCompareByLeftPos(wordLength: number) {
  function compareByLeftPos(a: [SuffixNode, WalkState], b: [SuffixNode, WalkState]) {
    let value
    if (a[1][3] !== b[1][3]) { // postpone final
      if (a[1][3] === false) return -1
      return 1
    }

    // sort by starting point of matching
    // a[1][3] (final flag) is equal to b[1][3] here
    let leftA, leftB
    if (a[1][3]) {
      leftA = wordLength - a[1][1]
      leftB = wordLength - b[1][1]
    } else {
      leftA = a[0].len - a[1][1]
      leftB = b[0].len - b[1][1]
    }

    value = leftA - leftB
    return value
  }
  return compareByLeftPos
}