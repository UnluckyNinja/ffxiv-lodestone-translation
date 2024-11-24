import { atou, sortWordsByLocale, utoa } from '../utils'
import { SortedMap } from './SortedMap'
import Tree from "splaytree"

function compare_fn (a:string, b:string){
  if (a.length > 1 || b.length > 1) throw Error(`a: ${a}, b: ${b}, should be single char`)
  const ca = a.codePointAt(0) ?? 0
  const cb = b.codePointAt(0) ?? 0
  return ca - cb
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
  private spareNodes: TrieNode[] = []
  private register!: Tree<TrieNode>

  constructor(words?: string[], sorted = false){
    if (words && words.length > 0) {
      this.refill(words, sorted)
    } else {
      this.init()
    }
  }

  private init() {
    this._states.length = 0
    this.spareNodes.length = 0
    this._root = this.addNode()
    this.register = new Tree<TrieNode>(compareTrieNode)
  }

  refill(words: string[], sorted = false) {
    this.init()
    let _words = words
    if (!sorted) {
      _words = sortWordsByLocale(words)
    }
    for (let i = 0; i < _words.length; ++i ) {
      this.addWord(_words[i])
    }
  }

  addNode(): TrieNode {
    let node: TrieNode
    if (this.spareNodes.length > 0){
      node = this.spareNodes.pop()!
      node.final = false
      node.inDegree = 0
      node.outEdges.clear()
      this._states[node.id] = node
    } else {
      node = {
        id: this._states.length,
        final: false,
        inDegree: 0,
        outEdges: new SortedMap(compare_fn, new Map())
      }
      this._states.push(node)
    }
    return node
  }

  private cloneNode(node: TrieNode): TrieNode {
    const clone = this.addNode()
    clone.final = node.final
    clone.inDegree = 0
    clone.outEdges = node.outEdges.clone()
    const list = [...clone.outEdges.values()]
    for (let i = 0; i < list.length; ++i) {
      ++list[i].inDegree
    }
    return clone
  }

  private removeFromRegister(node: TrieNode){
    this.register.remove(node)
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
    const list = [...node.outEdges.values()]
    for (let i = 0; i < list.length; ++i){
      --list[i].inDegree
    }

    // remove from register
    if (alsoRegister) {
      this.removeFromRegister(node)
    }

    // put the node in pool
    this.spareNodes.push(node)
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

    // const newRoot = this.cloneNode(this._root)

    // find first confluence state
    // states before confluence are redirected and removed from register 
    // states after confluence are cloned if any
    //  old nodes will be marked as and checked for merge 

    // clone matched nodes & add new nodes
    let lastNode = this._root
    let mode: 1 | 2 | 3 = 1 // 1: redirect, 2: clone, 3: add
    const chain = [lastNode]
    for (let i = 0; i < word.length; ++i) {
      const char = word.charAt(i)
      const child = getTransition(lastNode, char)
      if (mode !== 3) {
        if (!child) {
          if (removing) {
            // removing has no need to add new state
            break
          }
          mode = 3
        } else if (child.inDegree > 1) {
          mode = 2
        }
      }

      if (mode === 1) {
        this.removeFromRegister(child!)
        lastNode = child!
      } else if (mode === 2) {
        const cloned = this.cloneNode(child!)
        setTransition(lastNode, cloned, char)
        lastNode = cloned
      } else {
        mode = 3
        const newNode = this.addNode()
        setTransition(lastNode, newNode, char)
        lastNode = newNode
      }
      chain.push(lastNode)
    }
    if (removing) {
      lastNode.final = false
    } else {
      lastNode.final = true
    }

    // remove unreachable nodes from root
    // TODO: do not clone and remove non-conflunce head, just redirect them
    // let currentNode: TrieNode | undefined = this._root
    // for (const char of word) {
    //   if(!currentNode || currentNode.inDegree > 0) {
    //     break
    //   }
    //   const next = getTransition(currentNode, char)
    //   this.deleteNode(currentNode, true)
    //   currentNode = next
    // }
    // if(currentNode && currentNode.inDegree === 0) {
    //   this.deleteNode(currentNode, true)
    // }

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
    
    // if (child.outEdges.size === 0 && !child.final) {
    //   // when removing a word
    //   removeTransition(state, char)
    //   this.deleteNode(child, false)
    //   return null
    // }
    
    const node = this.register.find(child)
    if (node) {
      const found = node.key
      setTransition(state, found, char)
      this.deleteNode(child, false)
      return found
    } else {
      this.register.add(child)
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
    const list = this._states.map(it=>{
      if (!it) return null
      return [it.final, [...it.outEdges.entries().map(([k,v])=>[k, v.id])]] as [boolean, [string, number][]]
    })
    const allText = JSON.stringify({rootID: this._root.id, states: list})
    return utoa(allText)
  }

  static from(text: string): TrieAutomaton {
    const parsed: { rootID: number, states: ([boolean, [string, number][]] | null)[]} = JSON.parse(atou(text))
    if (!parsed || !Object.hasOwn(parsed,'rootID') || !parsed.states || !parsed.states.length) throw new Error('Incorrect content of serialized text.')

    const trie = new TrieAutomaton()
    trie._states.length = 0
    const edgeMap = new Map<number, [string, number][]>()
    const spareList = []
    for (let i = 0; i < parsed.states.length; ++i) {
      const current = parsed.states[i]
      if (current === null) {
        spareList.push(trie.addNode())
        trie._states[i] = null
        continue
      }
      const [final, _outEdges] = current
      edgeMap.set(i, _outEdges)
      const node = trie.addNode()
      node.final = final
      node.outEdges = new SortedMap(compare_fn, new Map())
    }
    trie.spareNodes = spareList
    // add transitions
    for (let i = 0; i < trie._states.length; ++i) {
      if (trie._states[i] === null) {
        continue
      }
      const transitions: [string, number][] = edgeMap.get(i)!
      for (const t of transitions) {
        setTransition(trie._states[i]!, trie._states[t[1]]!, t[0])
      }
    }
    // add to register
    for (const state of trie._states) {
      if (state === null || state === trie._states[parsed.rootID]) continue
      trie.register.add(state)
    }
    trie._root = trie._states[parsed.rootID]!
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

  for (let i = 0; i < a.outEdges.size; ++i) {
    const ka = a.outEdges.keyAt(i)!
    const kb = b.outEdges.keyAt(i)!
    const ca = ka.codePointAt(0) ?? 0
    const cb = kb.codePointAt(0) ?? 0
    // const kDiff = ka.localeCompare(kb)
    const cDiff = ca - cb 
    if (cDiff !== 0) {
      return cDiff
    }

    const va = a.outEdges.get(ka)!
    const vb = b.outEdges.get(kb)!
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