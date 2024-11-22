import { binarySearch } from '../utils'

type Comparator<K> = (a: K, b: K) => number

export class SortedMap<K, V> implements Map<K, V> {
  private _keys: K[][]
  private map: Map<K,V>
  readonly compareFunc: Comparator<K[]>
  constructor(comp: Comparator<K>, map?: Map<K,V>) {
    this.compareFunc = (a, b)=>comp(a[0], b[0])
    if (map) {
      this.map = map
      this._keys = [...map.keys().map(it=>[it])].sort(this.compareFunc)
      for (let i = 0; i < this._keys.length-1; ++i) {
        const e1 = this._keys[i];
        const e2 = this._keys[i+1];
        if (this.compareFunc(e1, e2) === 0) {
          e1.push(...e2)
          this._keys.splice(i+1, 1)
        }
      }
    } else {
      this.map = new Map<K,V>()
      this._keys = []
    }
  }
  clear(): void {
    this.map.clear()
    this._keys.length = 0
  }
  delete(key: K): boolean {
    if (this.has(key)) {
      const pos = binarySearch(this._keys, [key], this.compareFunc)
      this.map.delete(key)
      const item = this._keys[pos]
      for (let i = 0; i < item.length; ++i) {
        if (item[i] === key) {
          item.splice(i, 1)
          break
        }
      }
      if (item.length === 0) {
        this._keys.splice(pos, 1) // remove empty array
      }
      return true
    } else {
      return false
    }
  }
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    const newFunc = callbackfn.bind(thisArg)
    this.entries().forEach((([k, v])=>newFunc(v, k, this)))
  }
  get(key: K): V | undefined {
    return this.map.get(key)
  }
  has(key: K): boolean {
    return this.map.has(key)
  }
  set(key: K, value: V): this {
    if (!this.map.has(key)) {
      const toInsert = binarySearch(this._keys, [key], this.compareFunc)
      if (toInsert < 0) {
        this._keys.splice(~toInsert, 0, [key])
      } else {
        this._keys[toInsert].push(key)
      }
    }
    this.map.set(key, value)
    return this
  }
  get size(): number {
    return this.map.size
  }
  *entries(): MapIterator<[K, V]> {
    for (const karr of this._keys) {
      for (const k of karr) {
        yield [k, this.map.get(k) as V]
      }
    }
  }
  *keys(): MapIterator<K> {
    for (const karr of this._keys) {
      for (const k of karr) {
        yield k
      }
    }
  }
  *values(): MapIterator<V> {
    for (const karr of this._keys) {
      for (const k of karr) {
        yield this.map.get(k) as V
      }
    }
  }
  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries()
  }
  get [Symbol.toStringTag](): string {
    return this.toString()
  }
}