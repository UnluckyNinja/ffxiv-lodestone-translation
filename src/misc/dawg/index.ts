import { binaryInsert } from '../utils'
import { SuffixAutomaton, SuffixNode, walkSAM } from './sam'
import { TrieAutomaton, TrieNode } from './trie'

export type DAWGPatterns<T> = [string, T][] | Map<string, T>

type WalkState = [number, number, TrieNode | null, boolean
  , string
]
interface Result {
  start: number,
  end: number
}

export function useDualDAWG(patterns: string[] | string | ArrayBuffer) {
  // let list 
  // if (Array.isArray(patterns)) {
  //   list = patterns.flatMap(it=>it[0])
  // } else {
  //   list = [...patterns.keys()]
  // }
  let trie: TrieAutomaton
  if (typeof(patterns) === 'string' || patterns instanceof ArrayBuffer) {
    trie = TrieAutomaton.from(patterns)
  } else {
    trie = new TrieAutomaton(patterns)
  }
  function findWords(text: string) {
    const wordLength = text.length
    const compareFunc = createCompareByLeftPos(wordLength)
    const sam = new SuffixAutomaton(text)
    const finals = sam.getFinals()
    const rightMost = new Map<number, number>()
    let rightMostOfFinal = 0
    const result: Result[] = []
    walkSAM<WalkState>((samNode, state, queue)=>{
      let [matched, matching, trieNode, final
        , prefix
      ] = state
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
        insertQueue(samNode, [matched, matching, null, true
          , prefix
        ])
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
            insertQueue(samNode.next.get(char)!, [matched, matching + 1, nextNode, false
              , prefix+char
            ])
          } else {
            if (matched > 0) {
              insertQueue(samNode.next.get(char)!, [matched, matching + 1, null, false
                , prefix
              ])
            }
          }
        }
      } else {
        for (const char of samNode.next.keys()) {
          insertQueue(samNode.next.get(char)!, [matched, matching + 1, null, false
            , prefix
          ])
        }
      }
      return queue
    }, [sam.root, [0, 0, trie.root, false
      , ''
    ]])
    return result
  }
  return {
    trie,
    findWords
  }
}

// sort element by the start of substring
// buggy, need futher test
function createCompareByLeftPos(wordLength: number) {
  function compareByLeftPos(a: [SuffixNode, WalkState], b: [SuffixNode, WalkState]) {
    const samA = a[0]
    const stateA = a[1]
    const samB = b[0]
    const stateB = b[1]
    let value
    if (stateA[3] !== stateB[3]) { // postpone final
      if (stateA[3] === false) return -1
      return 1
    }
    if (!stateA[3] && samA.len !== samB.len) {
      return samA.len - samB.len
    }
    if (!stateA[3] && samA.id !== samB.id) {
      return samA.id - samB.id
    }
    // sort by starting point of matching
    // stateA[3] (final flag) is equal to stateB[3] here
    let leftA, leftB
    if (stateA[3]) {
      leftA = wordLength - stateA[1]
      leftB = wordLength - stateB[1]
    } else {
      leftA = samA.len - stateA[1]
      leftB = samB.len - stateB[1]
    }

    value = leftA - leftB
    return value
  }
  return compareByLeftPos
}