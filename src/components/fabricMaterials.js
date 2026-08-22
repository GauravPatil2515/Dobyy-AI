/**
 * fabricMaterials.js — physically-plausible cloth materials for Dobby Studio.
 *
 * Generates, per weave type, a procedural set of CanvasTexture maps:
 *   • micro-weave tangent-space NORMAL map (derived from the real weave matrix)
 *   • packed ORM map  (R = ambient occlusion, G = roughness, B = metalness)
 *   • macro cloth BUMP map (drape grain / slub / crease noise)
 * plus a MeshPhysicalMaterial configured with sheen, anisotropy and clearcoat
 * values appropriate for satin / twill / plain / basket constructions.
 *
 * Maps are cached per weave (module level) — they are colour-independent, so
 * changing the sett never regenerates them.
 */
import * as THREE from 'three'
import { weaveMatrix } from '../utils/weaveUtils.js'

/* ── Per-weave physical profile ─────────────────────────────────────────── */
// anisoRot: highlight direction in tangent space (twill = diagonal float line)
export const WEAVE_PROFILE = {
  satin5:  { sheen: 1.00, sheenRough: 0.20, roughness: 0.33, metalness: 0.04, aniso: 0.55, anisoRot: 0.0,          clearcoat: 0.10, ccRough: 0.35, bumpScale: 0.006, normalScale: 0.35, tile: 10, micro: 26, sheenColor: 0xfff4e2, aoStrength: 0.55 },
  twill22: { sheen: 0.58, sheenRough: 0.44, roughness: 0.70, metalness: 0.02, aniso: 0.38, anisoRot: -Math.PI / 4, clearcoat: 0.03, ccRough: 0.60, bumpScale: 0.013, normalScale: 0.75, tile: 8,  micro: 20, sheenColor: 0xfff0dc, aoStrength: 0.85 },
  twill21: { sheen: 0.48, sheenRough: 0.50, roughness: 0.76, metalness: 0.02, aniso: 0.32, anisoRot: -Math.PI / 4, clearcoat: 0.02, ccRough: 0.65, bumpScale: 0.014, normalScale: 0.80, tile: 6,  micro: 20, sheenColor: 0xfff0dc, aoStrength: 0.88 },
  twill31: { sheen: 0.50, sheenRough: 0.48, roughness: 0.74, metalness: 0.02, aniso: 0.35, anisoRot: -Math.PI / 4, clearcoat: 0.02, ccRough: 0.65, bumpScale: 0.013, normalScale: 0.78, tile: 8,  micro: 20, sheenColor: 0xfff0dc, aoStrength: 0.86 },
  plain:   { sheen: 0.32, sheenRough: 0.60, roughness: 0.82, metalness: 0.02, aniso: 0.10, anisoRot: 0.0,          clearcoat: 0.0,  ccRough: 0.70, bumpScale: 0.015, normalScale: 0.90, tile: 8,  micro: 22, sheenColor: 0xfff2e6, aoStrength: 0.95 },
  basket2: { sheen: 0.16, sheenRough: 0.72, roughness: 0.91, metalness: 0.00, aniso: 0.08, anisoRot: 0.0,          clearcoat: 0.0,  ccRough: 0.75, bumpScale: 0.024, normalScale: 1.15, tile: 8,  micro: 14, sheenColor: 0xfff2e6, aoStrength: 1.10 },
  hopsack: { sheen: 0.16, sheenRough: 0.72, roughness: 0.92, metalness: 0.00, aniso: 0.08, anisoRot: 0.0,          clearcoat: 0.0,  ccRough: 0.75, bumpScale: 0.026, normalScale: 1.20, tile: 8,  micro: 13, sheenColor: 0xfff2e6, aoStrength: 1.12 },
}
export const DEFAULT_PROFILE = WEAVE_PROFILE.twill22

export const profileFor = (weave) => WEAVE_PROFILE[weave] || DEFAULT_PROFILE

/* ── Deterministic value noise (no Math.random → stable across rebuilds) ── */
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}
function fbm(x, y, oct = 4) {
  let sum = 0, amp = 0.5, f = 1
  for (let i = 0; i < oct; i++) { sum += vnoise(x * f, y * f) * amp; f *= 2; amp *= 0.5 }
  return sum
}

/* ── Weave height field ─────────────────────────────────────────────────── */
/**
 * Builds a seamless height field of one weave repeat.
 * Warp floats bulge along X, weft floats bulge along Y; float RUN LENGTH
 * modulates amplitude so satin reads glassy-smooth and hopsack reads chunky.
 */
function weaveHeightField(weave, threads, px) {
  const M = weaveMatrix(weave, threads)
  const cell = px / threads
  const H = new Float32Array(px * px)

  // Pre-compute float run length (how long each thread stays on top) per cell.
  const run = Array.from({ length: threads }, () => new Float32Array(threads))
  for (let i = 0; i < threads; i++) {
    for (let j = 0; j < threads; j++) {
      const up = M[i][j] === 1
      let n = 1
      // walk the float in the direction that thread travels
      for (let k = 1; k < threads; k++) {
        const v = up ? M[i][(j + k) % threads] : M[(i + k) % threads][j]
        if ((v === 1) !== up) break
        n++
      }
      run[i][j] = n
    }
  }

  for (let y = 0; y < px; y++) {
    const i = Math.floor(y / cell) % threads
    const fy = (y / cell) % 1
    for (let x = 0; x < px; x++) {
      const j = Math.floor(x / cell) % threads
      const fx = (x / cell) % 1
      const up = M[i][j] === 1
      // cylindrical cross-section of the thread that is on top
      const t = up ? fx : fy
      const dome = Math.sqrt(Math.max(0, 1 - Math.pow(t * 2 - 1, 2)))
      // longer floats sit higher & flatter (satin); short floats crimp deeply
      const r = run[i][j]
      const lift = up ? 1.0 : 0.62
      const flat = Math.min(1, 0.35 + r * 0.18)
      const h = (dome * (1 - flat * 0.45) + flat * 0.45) * lift
      // yarn twist + slub fibre noise
      const fib = fbm(x * 0.36, y * 0.36, 3) * 0.14 + vnoise(x * 1.7, y * 1.7) * 0.05
      H[y * px + x] = h * 0.86 + fib
    }
  }
  return H
}

function canvasFromRGB(px, writer) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = px
  const ctx = cv.getContext('2d')
  const img = ctx.createImageData(px, px)
  writer(img.data)
  ctx.putImageData(img, 0, 0)
  return cv
}

/* ── Map builders ───────────────────────────────────────────────────────── */
function buildNormalCanvas(H, px, strength) {
  const at = (x, y) => H[((y + px) % px) * px + ((x + px) % px)]
  return canvasFromRGB(px, (d) => {
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const dx = (at(x - 1, y) - at(x + 1, y)) * strength
        const dy = (at(x, y - 1) - at(x, y + 1)) * strength
        const len = Math.hypot(dx, dy, 1)
        const o = (y * px + x) * 4
        d[o]     = ((dx / len) * 0.5 + 0.5) * 255
        d[o + 1] = ((dy / len) * 0.5 + 0.5) * 255
        d[o + 2] = ((1 / len) * 0.5 + 0.5) * 255
        d[o + 3] = 255
      }
    }
  })
}

/** Packed ORM: R = AO (interlacing valleys), G = roughness, B = metalness. */
function buildORMCanvas(H, px, p) {
  return canvasFromRGB(px, (d) => {
    for (let i = 0; i < px * px; i++) {
      const h = H[i]                                   // 0..~1
      const ao = 1 - Math.pow(1 - Math.min(1, h), 1.6) * 0.55 * p.aoStrength
      // float crowns catch light (lower roughness); valleys are diffuse
      const rough = THREE.MathUtils.clamp(p.roughness + (0.55 - h) * 0.38, 0.05, 1)
      const o = i * 4
      d[o]     = THREE.MathUtils.clamp(ao, 0, 1) * 255
      d[o + 1] = rough * 255
      d[o + 2] = p.metalness * 255
      d[o + 3] = 255
    }
  })
}

/** Macro cloth bump: drape grain, wrinkle veins and slub irregularity. */
function buildClothBumpCanvas(px) {
  return canvasFromRGB(px, (d) => {
    for (let y = 0; y < px; y++) {
      for (let x = 0; x < px; x++) {
        const u = x / px * 6, v = y / px * 6
        const crease = Math.abs(Math.sin(u * 1.3 + fbm(u, v, 3) * 3.4)) // vein-like folds
        const grain = fbm(u * 5, v * 5, 4)
        const g = THREE.MathUtils.clamp(0.5 + (1 - crease) * 0.22 + (grain - 0.5) * 0.42, 0, 1)
        const o = (y * px + x) * 4
        d[o] = d[o + 1] = d[o + 2] = g * 255
        d[o + 3] = 255
      }
    }
  })
}

/* ── Cache ──────────────────────────────────────────────────────────────── */
const _mapCache = new Map()
let _clothBump = null

function tex(cv, repeat, aniso) {
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = aniso
  t.needsUpdate = true
  return t
}

/**
 * @returns {{ normalMap, ormMap, bumpMap, profile }} cached per weave.
 */
export function getWeaveMaps(weave, renderer) {
  const key = weave || 'twill22'
  if (_mapCache.has(key)) return _mapCache.get(key)

  const p = profileFor(key)
  const maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() ?? 4
  const aniso = Math.min(8, maxAniso)
  const PX = 256

  const H = weaveHeightField(key, p.tile, PX)
  const normalMap = tex(buildNormalCanvas(H, PX, p.normalScale * 26), p.micro, aniso)
  const ormMap = tex(buildORMCanvas(H, PX, p), p.micro, aniso)
  ormMap.channel = 0 // aoMap defaults to uv1 — our geometry only has uv0

  if (!_clothBump) _clothBump = buildClothBumpCanvas(256)
  const bumpMap = tex(_clothBump, 3, aniso)

  const maps = { normalMap, ormMap, bumpMap, profile: p }
  _mapCache.set(key, maps)
  return maps
}

export function disposeWeaveMaps() {
  _mapCache.forEach(m => { m.normalMap.dispose(); m.ormMap.dispose(); m.bumpMap.dispose() })
  _mapCache.clear()
  _clothBump = null
}

/* ── Material factory ───────────────────────────────────────────────────── */
/**
 * Physical cloth material. Falls back to MeshStandardMaterial on WebGL1
 * (sheen / anisotropy / clearcoat are WebGL2-only in practice).
 */
export function createFabricMaterial({ weave, map, renderer }) {
  const { normalMap, ormMap, bumpMap, profile: p } = getWeaveMaps(weave, renderer)
  const webgl2 = renderer?.capabilities?.isWebGL2 !== false

  const common = {
    map,
    normalMap,
    normalScale: new THREE.Vector2(p.normalScale, p.normalScale),
    bumpMap,
    bumpScale: p.bumpScale,
    roughnessMap: ormMap,
    metalnessMap: ormMap,
    aoMap: ormMap,
    aoMapIntensity: 0.85,
    roughness: 1.0,      // modulated by roughnessMap.G
    metalness: 1.0,      // modulated by metalnessMap.B
    side: THREE.DoubleSide,
    envMapIntensity: 0.85,
    dithering: true,
  }

  if (!webgl2) return new THREE.MeshStandardMaterial(common)

  const mat = new THREE.MeshPhysicalMaterial({
    ...common,
    sheen: p.sheen,
    sheenRoughness: p.sheenRough,
    sheenColor: new THREE.Color(p.sheenColor),
    clearcoat: p.clearcoat,
    clearcoatRoughness: p.ccRough,
    specularIntensity: 0.35,
  })
  mat.anisotropy = p.aniso
  mat.anisotropyRotation = p.anisoRot
  return mat
}

/** Re-point an existing fabric material at a different weave (no realloc). */
export function applyWeaveProfile(mat, weave, renderer) {
  if (!mat) return
  const { normalMap, ormMap, bumpMap, profile: p } = getWeaveMaps(weave, renderer)
  mat.normalMap = normalMap
  mat.normalScale.set(p.normalScale, p.normalScale)
  mat.bumpMap = bumpMap
  mat.bumpScale = p.bumpScale
  mat.roughnessMap = ormMap
  mat.metalnessMap = ormMap
  mat.aoMap = ormMap
  mat.roughness = 1
  mat.metalness = 1
  if ('sheen' in mat) {
    mat.sheen = p.sheen
    mat.sheenRoughness = p.sheenRough
    mat.sheenColor.set(p.sheenColor)
    mat.clearcoat = p.clearcoat
    mat.clearcoatRoughness = p.ccRough
    mat.anisotropy = p.aniso
    mat.anisotropyRotation = p.anisoRot
  }
  mat.needsUpdate = true
}

/* ── Trim materials (buttons, buckles, leather, stitching, lining) ──────── */
export function createTrimMaterials() {
  return {
    metal: new THREE.MeshPhysicalMaterial({
      color: 0xc9b28a, metalness: 1.0, roughness: 0.28, envMapIntensity: 1.4, clearcoat: 0.4, clearcoatRoughness: 0.2,
    }),
    leather: new THREE.MeshPhysicalMaterial({
      color: 0x4a2f1d, roughness: 0.62, metalness: 0.0, sheen: 0.25, sheenRoughness: 0.6,
      clearcoat: 0.25, clearcoatRoughness: 0.45, envMapIntensity: 0.7,
    }),
    button: new THREE.MeshPhysicalMaterial({
      color: 0x2b2119, roughness: 0.24, metalness: 0.0, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 1.1,
    }),
    thread: new THREE.MeshStandardMaterial({
      color: 0xd8cbb4, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.5,
    }),
    lining: new THREE.MeshPhysicalMaterial({
      color: 0x16110d, roughness: 0.42, metalness: 0.02, sheen: 0.7, sheenRoughness: 0.35,
      side: THREE.BackSide, envMapIntensity: 0.6,
    }),
  }
}

export function disposeTrimMaterials(trims) {
  if (!trims) return
  Object.values(trims).forEach(m => m?.dispose?.())
}

/* ── Studio environment (procedural equirect "HDRI") ────────────────────── */
/**
 * Generates a soft-box studio equirectangular map and pre-filters it with
 * PMREMGenerator. No external .hdr asset required.
 * @returns {{ texture, dispose }}
 */
export function createStudioEnvironment(renderer, { warm = 0.9 } = {}) {
  const W = 1024, H = 512
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')

  // Vertical falloff: bright ceiling → mid walls → dark sweep floor
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0.00, '#ffffff')
  g.addColorStop(0.28, '#cfd6df')
  g.addColorStop(0.55, '#6d7580')
  g.addColorStop(0.80, '#2c2f34')
  g.addColorStop(1.00, '#121316')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Soft boxes: [u centre, v centre, half-w, half-h, intensity, tint]
  const boxes = [
    [0.52, 0.20, 0.14, 0.16, 1.00, `rgba(255,246,228,`],  // key, upper front-right
    [0.18, 0.28, 0.16, 0.14, 0.60, `rgba(214,232,255,`],  // cool fill, left
    [0.86, 0.24, 0.10, 0.12, 0.72, `rgba(255,255,255,`],  // rim, behind
    [0.35, 0.06, 0.30, 0.08, 0.45, `rgba(255,255,255,`],  // overhead strip
  ]
  ctx.globalCompositeOperation = 'lighter'
  boxes.forEach(([u, v, hw, hh, inten, tint]) => {
    const cx = u * W, cy = v * H, rx = hw * W, ry = hh * H
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
    rg.addColorStop(0, `${tint}${inten})`)
    rg.addColorStop(0.45, `${tint}${inten * 0.45})`)
    rg.addColorStop(1, `${tint}0)`)
    ctx.save()
    ctx.translate(cx, cy); ctx.scale(1, ry / Math.max(rx, ry)); ctx.translate(-cx, -cy)
    ctx.fillStyle = rg
    ctx.fillRect(cx - rx * 2, cy - ry * 2, rx * 4, ry * 4)
    ctx.restore()
  })
  // Warm bounce from the floor
  const bounce = ctx.createLinearGradient(0, H, 0, H * 0.72)
  bounce.addColorStop(0, `rgba(255,196,140,${0.22 * warm})`)
  bounce.addColorStop(1, 'rgba(255,196,140,0)')
  ctx.fillStyle = bounce
  ctx.fillRect(0, H * 0.7, W, H * 0.3)
  ctx.globalCompositeOperation = 'source-over'

  const equirect = new THREE.CanvasTexture(cv)
  equirect.mapping = THREE.EquirectangularReflectionMapping
  equirect.colorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const target = pmrem.fromEquirectangular(equirect)
  equirect.dispose()
  pmrem.dispose()

  return {
    texture: target.texture,
    dispose: () => target.dispose(),
  }
}

/** Radial-gradient contact shadow (cheap, always-on ground occlusion). */
export function createContactShadow({ size = 6, opacity = 0.55, y = -1.42 } = {}) {
  const px = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = px
  const ctx = cv.getContext('2d')
  const rg = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2)
  rg.addColorStop(0.0, 'rgba(0,0,0,0.95)')
  rg.addColorStop(0.35, 'rgba(0,0,0,0.55)')
  rg.addColorStop(0.7, 'rgba(0,0,0,0.14)')
  rg.addColorStop(1.0, 'rgba(0,0,0,0)')
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, px, px)

  const map = new THREE.CanvasTexture(cv)
  map.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, toneMapped: false })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = y
  mesh.renderOrder = -1
  mesh.scale.set(1, 0.72, 1)
  return mesh
}
