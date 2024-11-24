import { binarySearch } from '../utils'

type Comparator<K> = (a: K, b: K) => number

/**
 * Doesn't support multiple equal keys
 */
export class SortedMap<K, V> implements Map<K, V> {
  private _keys: K[]
  private map: Map<K,V>
  readonly compareFunc: Comparator<K>
  constructor(comp: Comparator<K>, map?: Map<K,V>) {
    this.compareFunc = comp
    if (map) {
      this.map = new Map(map)
      this._keys = [...map.keys()].sort(this.compareFunc)
      // for (let i = 0; i < this._keys.length-1; ++i) {
      //   const e1 = this._keys[i];
      //   const e2 = this._keys[i+1];
      //   if (this.compareFunc(e1, e2) === 0) {
      //     e1.push(...e2)
      //     this._keys.splice(i+1, 1)
      //   }
      // }
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
      const pos = binarySearch(this._keys, key, this.compareFunc)
      this.map.delete(key)
      this._keys.splice(pos, 1)
      // const item = this._keys[pos]
      // for (let i = 0; i < item.length; ++i) {
      //   if (item[i] === key) {
      //     item.splice(i, 1)
      //     break
      //   }
      // }
      // if (item.length === 0) {
      //   this._keys.splice(pos, 1) // remove empty array
      // }
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
      const pos = binarySearch(this._keys, key, this.compareFunc)
      if (pos < 0) {
        this._keys.splice(~pos, 0, key)
      } else {
        this.map.delete(this._keys[pos])
        this._keys[pos] = key
      }
    }
    this.map.set(key, value)
    return this
  }
  get size(): number {
    return this.map.size
  }
  *entries(): MapIterator<[K, V]> {
    for (let i = 0; i < this._keys.length; ++i){
      const item = this._keys[i]
      yield [item, this.map.get(item)!]
      // if (arr.length === 1) {
      //   yield [arr[0], this.map.get(arr[0])!]
      //   continue
      // }
      // for (let j = 0; j < arr.length; ++j) {
      //   const k = arr[j]
      //   yield [k, this.map.get(k)!]
      // }
    }
  }
  *keys(): MapIterator<K> {
    for (let i = 0; i < this._keys.length; ++i){
      const item = this._keys[i]
      yield item
      // if (arr.length === 1) {
      //   yield arr[0]
      //   continue
      // }
      // for (let j = 0; j < arr.length; ++j) {
      //   yield arr[j]
      // }
    }
  }
  *values(): MapIterator<V> {
    for (let i = 0; i < this._keys.length; ++i){
      const item = this._keys[i]
      yield this.map.get(item)!
      // if (arr.length === 1) {
      //   yield this.map.get(arr[0])!
      //   continue
      // }
      // for (let j = 0; j < arr.length; ++j) {
      //   yield this.map.get(arr[j])!
      // }
    }
  }
  keyAt(index: number): K | undefined {
    return this._keys[index]
  }
  valueAt(index: number): V | undefined {
    return this.map.get(this._keys[index])
  }
  entryAt(index: number): [K, V] | [undefined, undefined] {
    return [this._keys[index], this.map.get(this._keys[index])!]
  }
  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries()
  }
  get [Symbol.toStringTag](): string {
    return 'SortedMap'
  }
  clone() {
    const newOne = new SortedMap<K,V>(this.compareFunc)
    newOne._keys = this._keys.slice()
    newOne.map = new Map(this.map)
    return newOne
  }
}