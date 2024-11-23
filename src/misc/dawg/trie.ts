import { atou, binarySearch, utoa } from '../utils'
import { SortedMap } from './SortedMap'

function compare_fn (a:string,b:string){
  return a.localeCompare(b)
}

export interface TrieNode {
  id: number
  final: boolean
  inDegree: number
  outEdges: SortedMap<string, TrieNode>
}

export class TrieAutomaton {
  private _root!: TrieNode
  get root(){
    return this._root
  }
  private _states: (TrieNode | null)[] = []
  get states(): Readonly<typeof this._states>{
    return this._states
  }
  private spareIDs: number[] = []
  private register: TrieNode[] = []

  constructor(words?: string[]){
    if (words && words.length > 0) {
      this.refill(words)
    }
  }

  private refill(words: string[]) {
    this._states.length = 0
    this.spareIDs.length = 0
    this._root = this.addNode()
    this.register = [this._root]
    let _words = words
    // if (!sorted) {
    //   _words = sortWordsByLocale(words)
    // }
    for (const word of _words) {
      this.addWord(word)
    }
  }

  addNode(): TrieNode {
    const node: TrieNode = {
      id: this._states.length,
      final: false,
      inDegree: 0,
      outEdges: new SortedMap(compare_fn, new Map())
    }
    if (this.spareIDs.length > 0){
      node.id = this.spareIDs.pop()!
      this._states[node.id] = node
    } else {
      this._states.push(node)
    }
    return node
  }

  private cloneNode(node: TrieNode): TrieNode {
    const clone = this.addNode()
    clone.final = node.final
    clone.inDegree = 0
    clone.outEdges = new SortedMap(compare_fn, new Map(node.outEdges))
    for (const other of clone.outEdges.values()) {
      ++other.inDegree
    }
    return clone
  }

  /**
   * @returns false if the parameter is not presented in states, true otherwise.
   */
  private deleteNode(node: TrieNode, alsoRegister: boolean): boolean {
    // if (node.inDegree > 0) {
    //   throw new Error('To delete node, you should remove all transitions to this node first')
    // }
    const id = node.id
    if (!this._states[id] || this._states[id] !== node) return false

    // remove all transitions
    for (const other of node.outEdges.values()){
      --other.inDegree
    }

    // remove from register
    if (alsoRegister) {
      const pos = binarySearch(this.register, node, compareTrieNode)
      if (pos >= 0) {
        this.register.splice(pos, 1)
      }
    }

    // put the id in spareIDs array
    this.spareIDs.push(id)
    this._states[id] = null
    return true
  }

  addWord(word: string): void {
    this.changeWord(word, false)
  }
  removeWord(word: string): void {
    this.changeWord(word, true)
  }
  private changeWord(word: string, removing: boolean) {

    const newRoot = this.cloneNode(this._root)

    // clone matched nodes & add new nodes
    let lastNode = newRoot
    let oriParent = this._root
    let cloning = true
    const chain = [newRoot]
    for (const char of word) {
      let cloned
      if (cloning && hasTransition(oriParent,char)) {
        const oriChild = getTransition(oriParent, char)!
        cloned = this.cloneNode(oriChild)
        oriParent = oriChild
      } else {
        cloning = false
        cloned = this.addNode()
      }
      setTransition(lastNode, cloned, char)
      lastNode = cloned
      chain.push(cloned)
    }
    if (removing) {
      lastNode.final = false
    } else {
      lastNode.final = true
    }

    // remove unreachable nodes from root
    let currentNode: TrieNode | undefined = this._root
    for (const char of word) {
      if(!currentNode || currentNode.inDegree > 0) {
        break
      }
      const next = getTransition(currentNode, char)
      this.deleteNode(currentNode, true)
      currentNode = next
    }
    if(currentNode && currentNode.inDegree === 0) {
      this.deleteNode(currentNode, true)
    }

    this._root = newRoot
    for (let i = chain.length - 2; i >= 0; --i) {
      this.replaceOrRegister(chain[i], word.charAt(i))
    }
  }

  /**
   * Will register child
   */
  private replaceOrRegister(state: TrieNode, char: string) {
    const child = getTransition(state, char)
    if (!child) throw new Error(`State doesn't have a transition of "${char}"`);
    if (child.inDegree > 1) throw new Error(`There are more than one transition to the child by "${char}"`);
    
    if (child.outEdges.size === 0 && !child.final) {
      // when removing a word
      removeTransition(state, char)
      this.deleteNode(child, false)
      return null
    }
    
    const pos = binarySearch(this.register, child, compareTrieNode)
    if (pos >= 0) {
      const found = this.register[pos]
      setTransition(state, found, char)
      this.deleteNode(child, false)
      return found
    } else {
      this.register.splice(~pos, 0, child)
      return child
    }
  }

  /**
   * Return value includes root, so a common prefix on 'abc' will be 4 states.
   */
  // private commonPrefix(word: string): TrieNode[] {
  //   const list: TrieNode[] = []
  //   list.push(this._root)
  //   for (let idx = 0; idx < word.length; idx++) {
  //     const char = word.charAt(idx);
  //     const next = getTransition(list[idx], char)
  //     if (next) {
  //       list.push(next)
  //     } else {
  //       break
  //     }
  //   }
  //   return list
  // }

  match(word: string, start: TrieNode = this._root): TrieNode | null {
    const result = this.tryMatch(word, start)
    if (result.matched < word.length) {
      return null
    } else {
      return result.end
    }
  }

  tryMatch(word: string, start: TrieNode = this._root){
    let end = start
    let matched = 0
    if (word.length === 0) return {matched, end }
    for (matched = 0; matched < word.length; matched++) {
      const char = word.charAt(matched);
      const next = getTransition(end, char)
      if (next) {
        end = next
      } else {
        break
      }
    }
    return { matched, end }
  }

  serialize() {
    function stringifyState(state: TrieNode) {
      const final = state.final ? '1' : '0'
      return final+'\0'+
        JSON.stringify([
          ...state.outEdges.entries().map(([k,v])=>[k, v.id])
        ])
    }
    const idx = this._states.findIndex(it=>it)
    let text = stringifyState(this._states[idx]!)
    for(let i = idx+1; i < this._states.length; ++i) {
      const state = this._states[i]!
      if (state === null) {
        text = text + '\0\0' + JSON.stringify(null)
        continue
      }
      text = text+'\0\0'+stringifyState(state)
    }
    const allText = text+'\0\0'+JSON.stringify(this._root.id)
    return utoa(allText)
  }

  static from(text: string): TrieAutomaton {
    const statesTexts = atou(text).split('\0\0')
    if (statesTexts.length < 2) throw new Error('Incorrect content of serialized text.')
    const rootID = JSON.parse(statesTexts.pop()!)
    const trie = new TrieAutomaton()
    const edgeMap = new Map()
    for (let i = 0; i < statesTexts.length; ++i) {
      if (JSON.stringify(null) === statesTexts[i]) {
        trie._states[i] = null
        continue
      }
      const [final, _outEdges] = statesTexts[i].split('\0')
      edgeMap.set(i, _outEdges)
      const node = trie.addNode()
      node.final = final === '1' ? true : false
      node.outEdges = new SortedMap(compare_fn, new Map())
    }
    // add transitions
    for (let i = 0; i < trie._states.length; ++i) {
      if (trie._states[i] === null) {
        trie.spareIDs.push(i)
        continue
      }
      const outEdges = edgeMap.get(i)!
      const transitions: [string, number][] = JSON.parse(outEdges)
      for (const t of transitions) {
        setTransition(trie._states[i]!, trie._states[t[1]]!, t[0])
      }
    }
    // add to register
    for (const state of trie._states) {
      if (state === null) continue
      const pos = binarySearch(trie.register, state, compareTrieNode)
      if (pos >= 0) throw new Error('Error when parsing trie.')
      trie.register.splice(~pos, 0, state)
    }
    trie._root = trie._states[rootID]!
    return trie
  }
  
}

function setTransition(from: TrieNode, to: TrieNode, char: string) {
  if (from.outEdges.has(char)) {
    removeTransition(from, char)
  }
  from.outEdges.set(char, to)
  ++to.inDegree
}

function removeTransition(from: TrieNode, char: string) {
  const to = from.outEdges.get(char)
  from.outEdges.delete(char)
  if (to) {
    --to.inDegree
  }
}

export function getTransition(from: TrieNode, char: string) {
  return from.outEdges.get(char)
}

export function hasTransition(from: TrieNode, char: string) {
  return from.outEdges.has(char)
}


/**
 * Objects must be from the same automaton or result will be wrong.
 */
export function compareTrieNode(a: TrieNode, b: TrieNode): number {
  if (a.final !== b.final) {
    if (b.final) {
      return -1
    } else {
      return 1
    }
  }
  let outDiff = a.outEdges.size - b.outEdges.size
  if (outDiff !== 0) {
    return outDiff
  }
  const iteratorA = a.outEdges.keys()
  const iteratorB = b.outEdges.keys()
  let ka
  while (!(ka = iteratorA.next()).done) {
    const kb = iteratorB.next()
    const kDiff = ka.value.localeCompare(kb.value!)
    if (kDiff !== 0) {
      return kDiff
    }
    const va = a.outEdges.get(ka.value)!
    const vb = b.outEdges.get(kb.value!)!
    /*
    const vDiff = compareTrieNode(va, vb)
    if (vDiff !== 0) {
      return vDiff
    }
    */
    if (va !== vb) {
      return va.id - vb.id
    }
  }
  // if (compareWithID) {
  //   return a.id - b.id
  // }
  return 0
}