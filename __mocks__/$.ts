
const store = new Map()
export function GM_deleteValue(key){
  store.delete(key)
}
export function GM_getValue(key){
  store.get(key)
}
export function GM_setValue(key, value) {
  store.set(key, value)
}