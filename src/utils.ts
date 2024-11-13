
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