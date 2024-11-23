
export interface SuffixNode {
  id: number
  len: number
  link: SuffixNode | null
  next: Map<string, SuffixNode>
}

/**
 * Reference: https://oi-wiki.org/string/sam/
 */
export class SuffixAutomaton {
  private _root: SuffixNode
  get root(){
    return this._root
  }
  private _last: SuffixNode
  get last(){
    return this._last
  }
  private states: SuffixNode[] = []
  constructor(text: string) {
    this._root = this.addNode()
    this._last = this._root
    for (const char of text) {
      this.extend(char)
    }
  }
  private addNode(): SuffixNode{
    const node = {
      id: this.states.length,
      len: 0,
      link: null,
      next: new Map()
    }
    this.states.push(node)
    return node
  }
  private cloneNode(node: SuffixNode): SuffixNode {
    const clone = this.addNode()
    clone.len = node.len
    clone.link = node.link
    clone.next = new Map(node.next)
    return clone
  }
  extend(char: string) {
    const cur = this.addNode()
    cur.len = this._last.len + 1
    let p: SuffixNode | null = this._last
    while (p && !p.next.has(char)) {
      p.next.set(char, cur)
      p = p.link
    }
    if (!p) {
      cur.link = this._root
    } else {
      let q = p.next.get(char)!
      if (p.len + 1 === q.len) {
        cur.link = q
      } else {
        const clone = this.cloneNode(q)
        clone.len = p.len + 1
        while(p && p.next.get(char) === q) {
          p.next.set(char, clone)
          p = p.link
        }
        q.link = (cur.link = clone)
      }
    }
    this._last = cur
  }

  getFinals() {
    const map = new Map()
    let node = this._last
    while (node.link) {
      map.set(node.id, true)
      node = node.link
    }
    return map
  }
}

export function walkSAM<V>(func: (node: SuffixNode, value: V, queue: [SuffixNode, V][])=>[SuffixNode, V][], initialValue: [SuffixNode, V]) {
  let queue: [SuffixNode, V][] = [initialValue]
  while (queue.length > 0) {
    const [node, value] = queue.shift()!
    queue = func(node, value, queue)
  }
}
