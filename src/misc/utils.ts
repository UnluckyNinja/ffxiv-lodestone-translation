
export function lerp(a: number, b: number, x: number, clamp = true) {
  if (!clamp) return a + (b-a)*x
  ;[a, b] = a - b > 0 ? [b, a] : [a, b]
  return Math.max(a, Math.min(a + (b-a)*x, b))
}

export function invLerp(a: number, b: number, x: number, clamp = true) {
  if (!clamp) return (x-a)/(b-a)
  return Math.max(0, Math.min((x-a)/(b-a), 1))
}

export function remap(a: number, b: number, m: number, n: number, x: number, clamp = true) {
  const _x = invLerp(a, b, x, clamp)
  return lerp(m, n, _x, clamp)
}

/**
 * return new array
 */
export function sortWordsByLocale(words: string[]) {
  return radixSort(words)
}

/**
 * Length then localeCompare, return new array
 */
export function sortWordsByLength(words: string[]) {
  const map = Map.groupBy(words, it=>it.length)
  for (const key of map.keys() ) {
    const sorted = radixSort(map.get(key)!, key)
    map.set(key, sorted)
  }
  const sortedKeys = [...map.keys()].sort((a,b)=>a - b)
  const _words = []
  for (let key of sortedKeys) {
    _words.push(...map.get(key)!)
  }
  return _words
}

function radixSort(words: string[], maxLength?: number) {
  if (maxLength === undefined) {
    maxLength = 0
    for (const w of words) {
      if (w.length > maxLength) {
        maxLength = w.length
      }
    }
  }
  let _words = words
  for (let i = maxLength-1; i>=0; --i) {
    const map = Map.groupBy(_words, it=>it.charAt(i))
    const sortedKeys = [...map.keys()].sort((a,b)=>a.localeCompare(b))
    let sortedWords = []
    for (let key of sortedKeys) {
      sortedWords.push(...map.get(key)!)
    }
    _words = sortedWords
  }
  return _words
}

/**
 * To search, will return < 0 when not found  
 * To insert, if returned value < 0, negate it to get insertion position
 * 
 * https://stackoverflow.com/questions/22697936/binary-search-in-javascript
 */
export function binarySearch<K>(arr: K[], el: K, compare_fn: (a: K, b: K) => number) {
  let m = 0;
  let n = arr.length - 1;
  while (m <= n) {
      let k = (n + m) >> 1;
      let cmp = compare_fn(el, arr[k]);
      if (cmp > 0) {
          m = k + 1;
      } else if(cmp < 0) {
          n = k - 1;
      } else {
          return k;
      }
  }
  return ~m;
}