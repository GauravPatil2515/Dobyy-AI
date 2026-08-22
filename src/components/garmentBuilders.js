/**
 * garmentBuilders.js — procedural garment geometry built from real pattern blocks.
 *
 * The core primitive is `loft()`: a stack of super-elliptical cross-sections
 * swept along a spine. That is how tailoring actually describes a garment
 * (waist / chest / shoulder measurements at given heights), so silhouettes come
 * out as shoulders, waist suppression, crotch rise and bent sleeves rather than
 * cylinders. Sheets (scarf, throw) use `gridSolid()`, which gives them real
 * thickness and a visible selvedge edge.
 *
 * Every builder returns `{ mesh: THREE.Group }`. Sub-meshes may carry
 * `userData.mat` to request a material slot:
 *   'fabric' (default) | 'lining' | 'leather' | 'metal' | 'button' | 'thread'
 */
import * as THREE from 'three'

const PLACEHOLDER = new THREE.MeshBasicMaterial()
const tag = (o, slot) => { o.userData.mat = slot; return o }

/* ── math helpers ───────────────────────────────────────────────────────── */
function rng(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
const smooth = (t) => t * t * (3 - 2 * t)
const gauss = (x, w) => Math.exp(-(x * x) / (2 * w * w))
/** shortest signed angular distance from a to b */
const angDelta = (a, b) => {
  let d = (a - b) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}
function profile(pts, t) {
  if (t <= pts[0][0]) return pts[0][1]
  const last = pts[pts.length - 1]
  if (t >= last[0]) return last[1]
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i], [t1, v1] = pts[i + 1]
    if (t >= t0 && t <= t1) return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0))
  }
  return last[1]
}

/**
 * Resample a coarse section table into a smooth one. Control rings describe the
 * garment's measurements; this interpolates them (Catmull-Rom on every field)
 * so the lofted surface curves instead of faceting.
 */
function resample(sections, steps) {
  const N = sections.length
  if (N < 2) return sections
  const keys = ['y', 'x', 'z', 'rx', 'rz', 'n']
  const at = (k, i) => sections[Math.min(N - 1, Math.max(0, i))][k] ?? (k === 'n' ? 2 : 0)
  const spline = (k, i, f) => at(k, i) + (at(k, i + 1) - at(k, i)) * smooth(f)
  const out = []
  for (let s = 0; s < steps; s++) {
    const u = (s / (steps - 1)) * (N - 1)
    const i = Math.min(N - 2, Math.floor(u))
    const f = u - i
    const o = {}
    keys.forEach(k => { o[k] = spline(k, i, f) })
    out.push(o)
  }
  return out
}

/* ── loft: super-elliptical sections swept along a spine ────────────────── */
/**
 * @param {Array} sections  [{ y, x?, z?, rx, rz, n? }] ordered along the spine.
 *   `n` is the super-ellipse exponent: 2 = ellipse, >3 = squared-off (shoulders).
 * @param {number} seg      radial resolution
 * @param {object} opts
 *   deform(p, theta, v, section, center) — displace a vertex after placement
 *   uScale/vScale — texture repeats; both are corrected for circumference and
 *   arc length so the plaid keeps a constant thread density over the garment.
 */
function loft(rawSections, seg = 64, opts = {}) {
  const { uScale = 1, deform = null, steps = 0, thetaStart = 0, thetaLength = Math.PI * 2 } = opts
  const sections = steps ? resample(rawSections, steps) : rawSections
  const N = sections.length
  const cols = seg + 1
  const positions = new Float32Array(N * cols * 3)
  const uvs = new Float32Array(N * cols * 2)
  const indices = []

  const centers = sections.map(s => new THREE.Vector3(s.x || 0, s.y, s.z || 0))
  // arc-length parameter for V
  const arc = [0]
  for (let i = 1; i < N; i++) arc.push(arc[i - 1] + centers[i].distanceTo(centers[i - 1]))
  const total = arc[N - 1] || 1
  // average circumference — used once, to pick a V scale that keeps the check
  // square. U must stay constant per column or the texture shears row to row.
  const refC = sections.reduce((a, s) => a + (s.rx + s.rz), 0) / N * Math.PI
  const vSpan = opts.vScale ?? (uScale * (total / refC))

  const up = new THREE.Vector3(0, 1, 0)
  const tan = new THREE.Vector3()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()

  for (let i = 0; i < N; i++) {
    const a = centers[Math.max(0, i - 1)], b = centers[Math.min(N - 1, i + 1)]
    tan.subVectors(b, a)
    if (tan.lengthSq() < 1e-12) tan.set(0, 1, 0)
    tan.normalize()
    q.setFromUnitVectors(up, tan)

    const s = sections[i]
    const e = 2 / (s.n ?? 2)
    const v = arc[i] / total

    for (let j = 0; j < cols; j++) {
      const t = thetaStart + (j / seg) * thetaLength
      const ct = Math.cos(t), st = Math.sin(t)
      const sx = Math.sign(ct) * Math.pow(Math.abs(ct), e) * s.rx
      const sz = Math.sign(st) * Math.pow(Math.abs(st), e) * s.rz
      p.set(sx, 0, sz).applyQuaternion(q).add(centers[i])
      if (deform) deform(p, t, v, s, centers[i])
      const o = (i * cols + j) * 3
      positions[o] = p.x; positions[o + 1] = p.y; positions[o + 2] = p.z
      const uo = (i * cols + j) * 2
      uvs[uo] = (j / seg) * uScale
      uvs[uo + 1] = (arc[i] / total) * vSpan
    }
  }
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1
      indices.push(a, b, c, b, d, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/** flat disc closing off a loft opening (neck hole, hem, cuff) */
function discCap(section, seg = 48, shrink = 1) {
  const s = section
  const e = 2 / (s.n ?? 2)
  const pts = []
  for (let j = 0; j < seg; j++) {
    const t = (j / seg) * Math.PI * 2
    const ct = Math.cos(t), st = Math.sin(t)
    pts.push(new THREE.Vector2(
      Math.sign(ct) * Math.pow(Math.abs(ct), e) * s.rx * shrink,
      Math.sign(st) * Math.pow(Math.abs(st), e) * s.rz * shrink
    ))
  }
  const geo = new THREE.ShapeGeometry(new THREE.Shape(pts), 1)
  geo.rotateX(Math.PI / 2)
  geo.translate(s.x || 0, s.y, s.z || 0)
  return new THREE.Mesh(geo, PLACEHOLDER)
}

/* ── gridSolid: a cloth sheet with real thickness and a selvedge rim ────── */
/**
 * @param rows/cols grid resolution
 * @param point(i, j) -> THREE.Vector3 on the face side of the sheet
 * @param uv(i, j) -> [u, v]
 */
function gridSolid({ rows, cols, point, uv, thickness = 0.012 }) {
  const R = rows + 1, C = cols + 1
  const front = []
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) front.push(point(i, j))

  // per-vertex normal from finite differences across the grid
  const nrm = []
  const du = new THREE.Vector3(), dv = new THREE.Vector3()
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      const a = front[i * C + Math.min(C - 1, j + 1)], b = front[i * C + Math.max(0, j - 1)]
      const c = front[Math.min(R - 1, i + 1) * C + j], d = front[Math.max(0, i - 1) * C + j]
      du.subVectors(a, b); dv.subVectors(c, d)
      const n = new THREE.Vector3().crossVectors(dv, du)
      if (n.lengthSq() < 1e-12) n.set(0, 0, 1)
      nrm.push(n.normalize())
    }
  }

  const pos = [], uvs = [], idx = []
  const push = (v, u) => { pos.push(v.x, v.y, v.z); uvs.push(u[0], u[1]) }
  // face
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) push(front[i * C + j], uv(i, j))
  // back, offset along -normal
  const back = new THREE.Vector3()
  for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
    back.copy(front[i * C + j]).addScaledVector(nrm[i * C + j], -thickness)
    push(back, uv(i, j))
  }
  const O = R * C
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const a = i * C + j, b = a + 1, c = a + C, d = c + 1
    idx.push(a, c, b, b, c, d)                       // face
    idx.push(O + a, O + b, O + c, O + b, O + d, O + c) // back (reversed)
  }
  // rim quads around the four boundaries
  const rim = (a, b) => idx.push(a, O + a, b, b, O + a, O + b)
  for (let j = 0; j < cols; j++) rim((0) * C + j + 1, (0) * C + j)
  for (let j = 0; j < cols; j++) rim(rows * C + j, rows * C + j + 1)
  for (let i = 0; i < rows; i++) rim(i * C, (i + 1) * C)
  for (let i = 0; i < rows; i++) rim((i + 1) * C + cols, i * C + cols)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

/** cloth ribbon following a 3D curve, with folds across its width */
function ribbon(pathPts, { width = 0.3, segs = 120, wSegs = 14, thickness = 0.01, fold, uRepeat = 2, vRepeat = 8 }) {
  const widthAt = typeof width === 'function' ? width : () => width
  const curve = new THREE.CatmullRomCurve3(pathPts.map(p => new THREE.Vector3(...p)))
  const frames = curve.computeFrenetFrames(segs, false)
  const pts = []
  for (let i = 0; i <= segs; i++) pts.push(curve.getPoint(i / segs))
  const p = new THREE.Vector3()
  return gridSolid({
    rows: segs, cols: wSegs, thickness,
    point: (i, j) => {
      const t = i / segs, w = j / wSegs - 0.5
      const B = frames.binormals[Math.min(segs - 1, i)]
      const N = frames.normals[Math.min(segs - 1, i)]
      p.copy(pts[i]).addScaledVector(B, w * widthAt(t))
      if (fold) p.addScaledVector(N, fold(t, w))
      return p.clone()
    },
    uv: (i, j) => [(j / wSegs) * uRepeat, (i / segs) * vRepeat],
  })
}

/* ── small parts ────────────────────────────────────────────────────────── */
let _threadGeo = null
function threadGeometry() {
  if (_threadGeo) return _threadGeo
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.012, -0.28, 0.01),
    new THREE.Vector3(-0.006, -0.62, 0.03), new THREE.Vector3(0.014, -1.0, 0.02),
  ])
  _threadGeo = new THREE.TubeGeometry(curve, 10, 0.0032, 5, false)
  return _threadGeo
}
function makeFringe(count, place, seed = 7) {
  const im = new THREE.InstancedMesh(threadGeometry(), PLACEHOLDER, count)
  const d = new THREE.Object3D()
  const rand = rng(seed)
  for (let i = 0; i < count; i++) {
    d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1)
    place(d, i, rand)
    d.updateMatrix()
    im.setMatrixAt(i, d.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  im.castShadow = im.receiveShadow = true
  return tag(im, 'fabric')
}
function piping(points, radius = 0.006, slot = 'fabric') {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
  const geo = new THREE.TubeGeometry(curve, 60, radius, 6, false)
  return tag(new THREE.Mesh(geo, PLACEHOLDER), slot)
}
function planarUV(geo, repeat = 3) {
  geo.computeBoundingBox()
  const b = geo.boundingBox
  const sx = Math.max(1e-6, b.max.x - b.min.x), sy = Math.max(1e-6, b.max.y - b.min.y)
  const pos = geo.attributes.position, uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - b.min.x) / sx * repeat, (pos.getY(i) - b.min.y) / sy * repeat)
  }
  uv.needsUpdate = true
  return geo
}
function button(r = 0.017, depth = 0.008) {
  const g = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.94, depth, 20, 1), PLACEHOLDER)
  disc.rotation.x = Math.PI / 2
  g.add(tag(disc, 'button'))
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, r * 0.09, 6, 20), PLACEHOLDER)
  rim.position.z = depth * 0.45
  g.add(tag(rim, 'button'))
  for (const sx of [-1, 1]) {
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, r * 0.9, 5), PLACEHOLDER)
    th.rotation.z = Math.PI / 2
    th.position.set(0, sx * r * 0.24, depth * 0.55)
    g.add(tag(th, 'thread'))
  }
  return g
}
/** welt pocket: shadow slit + welt lip + pillowed bag + optional flap */
function weltPocket({ w = 0.13, h = 0.11, flap = true }) {
  const g = new THREE.Group()
  const slit = new THREE.Mesh(new THREE.BoxGeometry(w, 0.014, 0.006), PLACEHOLDER)
  slit.position.set(0, h / 2, 0.002)
  g.add(tag(slit, 'lining'))
  const lip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.008, 0.022, 0.012), PLACEHOLDER)
  lip.position.set(0, h / 2 - 0.016, 0.008)
  g.add(tag(lip, 'fabric'))
  const bag = new THREE.PlaneGeometry(w, h, 8, 8)
  const bp = bag.attributes.position, bu = bag.attributes.uv
  for (let i = 0; i < bp.count; i++) {
    const nx = bp.getX(i) / (w / 2), ny = bp.getY(i) / (h / 2)
    bp.setZ(i, 0.006 + (1 - nx * nx) * (1 - ny * ny) * 0.014)
    if (bu) bu.setXY(i, bu.getX(i) * 1.5, bu.getY(i) * 1.5)
  }
  bag.computeVertexNormals()
  g.add(tag(new THREE.Mesh(bag, PLACEHOLDER), 'fabric'))
  if (flap) {
    const fg = new THREE.PlaneGeometry(w + 0.006, h * 0.62, 10, 8)
    const p = fg.attributes.position, u = fg.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), t = (h * 0.31 - y) / (h * 0.62)
      p.setZ(i, 0.016 + t * t * 0.016)
      p.setY(i, y - t * 0.004)
      if (u) u.setXY(i, u.getX(i) * 1.4, u.getY(i) * 1.0)
    }
    fg.computeVertexNormals()
    const f = new THREE.Mesh(fg, PLACEHOLDER)
    f.position.set(0, h * 0.2, 0)
    g.add(tag(f, 'fabric'))
  }
  return g
}
/** place a detail on a lofted body: walk out to the surface at (x, y) */
function onBody(obj, x, y, rx, rz) {
  const cl = Math.min(1, Math.max(-1, x / rx))
  const ang = Math.acos(cl)
  obj.position.set(Math.cos(ang) * rx, y, Math.sin(ang) * rz)
  obj.rotation.y = Math.PI / 2 - ang
  return obj
}

/* ══════════════════════════════════════════════════════════════════════════
   PANTS — yoke block with a real crotch rise + two tapered lofted legs
   ══════════════════════════════════════════════════════════════════════════ */
const PANTS_YOKE = [
  // Sits entirely INSIDE the two leg lofts: the legs form the visible hip,
  // the yoke only fills the seat and the gap between them.
  { y: 0.30, rx: 0.300, rz: 0.186, n: 2.4 },   // crotch seam
  { y: 0.44, rx: 0.352, rz: 0.212, n: 2.4, z: -0.008 },
  { y: 0.60, rx: 0.388, rz: 0.226, n: 2.5, z: -0.016 },
  { y: 0.76, rx: 0.398, rz: 0.230, n: 2.5, z: -0.012 },
  { y: 0.90, rx: 0.394, rz: 0.228, n: 2.45 },
  { y: 1.00, rx: 0.390, rz: 0.226, n: 2.4 },
  { y: 1.07, rx: 0.388, rz: 0.225, n: 2.4 },
]
const PANTS_LEG = [
  { y: -1.09, rx: 0.112, rz: 0.118, x: 0.214, z: -0.006 },  // cuff
  { y: -1.00, rx: 0.108, rz: 0.114, x: 0.214, z: -0.004 },
  { y: -0.86, rx: 0.124, rz: 0.132, x: 0.215, z: 0.000 },
  { y: -0.68, rx: 0.146, rz: 0.158, x: 0.216, z: 0.006 },   // calf
  { y: -0.52, rx: 0.149, rz: 0.159, x: 0.216, z: 0.014 },
  { y: -0.34, rx: 0.153, rz: 0.161, x: 0.215, z: 0.020 },   // knee
  { y: -0.16, rx: 0.163, rz: 0.171, x: 0.214, z: 0.016 },
  { y: 0.06, rx: 0.179, rz: 0.185, x: 0.212, z: 0.010 },
  { y: 0.28, rx: 0.197, rz: 0.201, x: 0.208, z: 0.004 },
  { y: 0.52, rx: 0.216, rz: 0.220, x: 0.203, z: 0.000 },
  { y: 0.78, rx: 0.242, rz: 0.250, x: 0.196, z: -0.006 },   // hip
  { y: 0.96, rx: 0.252, rz: 0.264, x: 0.190, z: -0.010 },
  { y: 1.05, rx: 0.246, rz: 0.258, x: 0.188, z: -0.010 },   // waist
]

export function buildPants() {
  const group = new THREE.Group()

  /* Yoke: seat fullness, crotch rise between the legs, drape whiskers */
  const yoke = new THREE.Mesh(loft(PANTS_YOKE, 72, {
    uScale: 3.2, steps: 30,
    deform: (p, t, v, s, c) => {
      const front = Math.max(0, Math.sin(t)), back = Math.max(0, -Math.sin(t))
      const dx = p.x - c.x, dz = p.z - c.z
      const rl = Math.hypot(dx, dz) || 1
      // a shallow lift at the very bottom keeps the crotch seam from reading
      // as a flat cut; the legs cover the rest
      if (v < 0.12) p.y += (1 - v / 0.12) * 0.05 * gauss(p.x, 0.10)
      let r = 0
      r += back * gauss(v - 0.30, 0.22) * 0.030                       // seat
      r += front * gauss(v - 0.14, 0.16) * Math.sin(t * 5 + v * 14) * 0.011  // whiskers
      r += back * gauss(v - 0.22, 0.13) * Math.sin(t * 7 + 1.2) * 0.008      // smile folds
      r += Math.sin(v * 34 + t * 9) * 0.0022
      p.x += (dx / rl) * r
      p.z += (dz / rl) * r
    },
  }))
  group.add(yoke)

  /* Waistband + rolled top edge + belt loops */
  const wbSections = [
    { y: 1.040, rx: 0.432, rz: 0.272, n: 2.6 },
    { y: 1.090, rx: 0.438, rz: 0.276, n: 2.6 },
    { y: 1.135, rx: 0.434, rz: 0.273, n: 2.6 },
  ]
  group.add(new THREE.Mesh(loft(wbSections, 72, { uScale: 3.2 })))
  group.add(tag(discCap(wbSections[2], 48, 0.98), 'lining'))
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.2
    const loop = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.11, 0.014), PLACEHOLDER)
    loop.position.set(Math.cos(a) * 0.440, 1.09, Math.sin(a) * 0.278)
    loop.rotation.y = -a
    group.add(loop)
  }

  /* Fly, zip pull, waist button */
  const fly = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.34, 0.012), PLACEHOLDER)
  fly.position.set(0.022, 0.88, 0.266)
  group.add(fly)
  const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.028, 10), PLACEHOLDER)
  pull.position.set(0.022, 0.96, 0.276)
  pull.rotation.z = Math.PI / 2
  group.add(tag(pull, 'metal'))
  const wbtn = button(0.015, 0.006)
  wbtn.position.set(0.022, 1.075, 0.280)
  group.add(wbtn)

  /* Pockets */
  for (const side of [-1, 1]) {
    const p = weltPocket({ w: 0.115, h: 0.095, flap: false })
    p.position.set(side * 0.185, 0.74, -0.252)
    p.rotation.set(-0.05, Math.PI - side * 0.30, 0)
    p.scale.setScalar(0.9)
    group.add(p)
    // front slash pocket: a short seam line, not a panel
    const fp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.15, 0.02), PLACEHOLDER)
    onBody(fp, side * 0.360, 0.84, 0.424, 0.256)
    fp.rotation.x = 0.30
    group.add(tag(fp, 'lining'))
  }

  /* Legs */
  const makeLeg = (side) => {
    const secs = PANTS_LEG.map(s => ({ ...s, x: s.x * side }))
    const geo = loft(secs, 56, {
      uScale: 3.2, steps: 84,
      deform: (p, t, v, s, c) => {
        const front = Math.max(0, Math.sin(t)), back = Math.max(0, -Math.sin(t))
        const inner = Math.max(0, Math.cos(t) * side)
        const dx = p.x - c.x, dz = p.z - c.z
        const rl = Math.hypot(dx, dz) || 1
        let r = 0
        r += gauss(v - 0.86, 0.14) * 0.012 + gauss(v - 0.42, 0.12) * 0.007   // cloth weight
        r += front * gauss(v - 0.58, 0.065) * Math.sin((v - 0.58) * 120) * 0.012 // knee folds
        r += front * gauss(v - 0.52, 0.05) * 0.006
        r += inner * gauss(v - 0.96, 0.06) * Math.sin(t * 4 + v * 24) * 0.010    // crotch pull
        r += gauss(v - 0.045, 0.04) * Math.sin(v * 170) * 0.006                  // hem break
        r += front * gauss(v - 0.085, 0.05) * 0.007
        r += back * gauss(v - 0.30, 0.09) * 0.010                               // calf
        // pressed front and back creases
        r += (gauss(angDelta(t, Math.PI / 2), 0.10) + gauss(angDelta(t, -Math.PI / 2), 0.10))
          * 0.005 * Math.min(1, v * 5)
        r += Math.sin(v * 46 + t * 13) * 0.0018
        p.x += (dx / rl) * r
        p.z += (dz / rl) * r
      },
    })
    const lg = new THREE.Group()
    lg.add(new THREE.Mesh(geo, PLACEHOLDER))
    lg.add(tag(discCap(secs[0], 48, 0.94), 'lining'))

    // seam piping down the outer leg and the inseam
    const outer = [], inseam = []
    secs.forEach(s => {
      outer.push([s.x + side * (s.rx + 0.002), s.y, s.z || 0])
      if (s.y < 0.4) inseam.push([s.x - side * (s.rx + 0.002), s.y, (s.z || 0) + 0.01])
    })
    lg.add(piping(outer, 0.0055))
    lg.add(piping(inseam, 0.0042))

    // turn-up at the hem
    const foldGeo = new THREE.TorusGeometry(0.116, 0.011, 8, 44)
    foldGeo.rotateX(Math.PI / 2)
    foldGeo.scale(1, 1, 1.05)
    const fold = new THREE.Mesh(foldGeo, PLACEHOLDER)
    fold.position.set(side * 0.214, -1.085, -0.006)
    lg.add(fold)
    return lg
  }
  group.add(makeLeg(-1))
  group.add(makeLeg(1))

  group.position.y = -0.05
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   JACKET — tailored block: sloped square shoulders, waist suppression,
   flared skirt, notch lapels, bent sleeves, rear vent
   ══════════════════════════════════════════════════════════════════════════ */
const JACKET_BODY = [
  { y: -0.86, rx: 0.520, rz: 0.298, n: 2.7 },   // hem
  { y: -0.62, rx: 0.508, rz: 0.292, n: 2.65 },
  { y: -0.40, rx: 0.487, rz: 0.283, n: 2.6 },   // hip
  { y: -0.14, rx: 0.442, rz: 0.264, n: 2.5 },   // waist
  { y: 0.12, rx: 0.463, rz: 0.283, n: 2.6 },
  { y: 0.40, rx: 0.500, rz: 0.306, n: 2.75 },   // chest
  { y: 0.63, rx: 0.529, rz: 0.312, n: 2.95 },
  { y: 0.78, rx: 0.512, rz: 0.296, n: 3.05 },   // shoulder point
  { y: 0.86, rx: 0.452, rz: 0.268, n: 2.85 },   // shoulder slope
  { y: 0.91, rx: 0.318, rz: 0.216, n: 2.55 },   // neck shelf
  { y: 0.925, rx: 0.186, rz: 0.150, n: 2.30 },  // neck
]
const JACKET_SLEEVE = [
  { y: -0.62, rx: 0.104, rz: 0.110, x: 0.566, z: 0.150 },  // wrist
  { y: -0.40, rx: 0.118, rz: 0.124, x: 0.576, z: 0.136 },
  { y: -0.14, rx: 0.134, rz: 0.140, x: 0.584, z: 0.106 },
  { y: 0.13, rx: 0.148, rz: 0.154, x: 0.578, z: 0.064 },   // elbow
  { y: 0.40, rx: 0.160, rz: 0.165, x: 0.552, z: 0.030 },
  { y: 0.60, rx: 0.166, rz: 0.170, x: 0.506, z: 0.012 },
  { y: 0.73, rx: 0.158, rz: 0.160, x: 0.446, z: 0.000 },   // sleeve head
  { y: 0.80, rx: 0.120, rz: 0.122, x: 0.396, z: 0.000 },   // set into the armhole
]
function lapelShape() {
  const s = new THREE.Shape()
  s.moveTo(0.000, 0.000)
  s.lineTo(0.105, 0.240)
  s.lineTo(0.158, 0.440)   // lapel point
  s.lineTo(0.082, 0.505)   // notch
  s.lineTo(0.140, 0.585)   // collar point
  s.lineTo(0.028, 0.645)
  s.lineTo(-0.018, 0.340)
  s.lineTo(-0.010, 0.050)
  s.closePath()
  return s
}

export function buildJacket() {
  const group = new THREE.Group()

  const body = new THREE.Mesh(loft(JACKET_BODY, 84, {
    uScale: 3.2, steps: 66,
    deform: (p, t, v, s, c) => {
      const front = Math.max(0, Math.sin(t)), back = Math.max(0, -Math.sin(t))
      const dx = p.x - c.x, dz = p.z - c.z
      const rl = Math.hypot(dx, dz) || 1
      let r = 0
      r += front * gauss(v - 0.72, 0.13) * 0.016                        // chest
      r += back * gauss(v - 0.74, 0.12) * 0.014                         // shoulder blades
      r += Math.abs(Math.cos(t)) * gauss(v - 0.80, 0.07)
        * Math.sin(t * 9 + v * 20) * 0.009                              // underarm drape
      r += gauss(v - 0.42, 0.10) * Math.sin(t * 6.5) * 0.006            // waist folds
      r += Math.sin(v * 32 + t * 11) * 0.0022
      p.x += (dx / rl) * r
      p.z += (dz / rl) * r

      // front opening: the chest rolls back into a V above the top button
      const fo = gauss(angDelta(t, Math.PI / 2), 0.30)
      if (v > 0.58) p.z -= fo * Math.pow((v - 0.58) / 0.42, 1.4) * 0.055
      // rear vent: a split in the back hem
      const vt = gauss(angDelta(t, -Math.PI / 2), 0.045)
      if (v < 0.22) {
        const k = vt * (1 - v / 0.22)
        p.x += Math.sign(Math.cos(t) || 1) * k * 0.05
        p.z += k * 0.022
      }
    },
  }), PLACEHOLDER)
  group.add(body)
  group.add(tag(discCap(JACKET_BODY[0], 60, 0.97), 'lining'))
  group.add(tag(discCap(JACKET_BODY[JACKET_BODY.length - 1], 40, 0.9), 'lining'))

  /* Vent under-flap */
  const ventFlap = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.30, 4, 8), PLACEHOLDER)
  ventFlap.position.set(0.03, -0.70, -0.29)
  ventFlap.rotation.y = Math.PI
  group.add(ventFlap)
  const ventLin = new THREE.Mesh(new THREE.PlaneGeometry(0.10, 0.28, 2, 6), PLACEHOLDER)
  ventLin.position.set(0.01, -0.70, -0.275)
  ventLin.rotation.y = Math.PI
  group.add(tag(ventLin, 'lining'))

  /* Sleeves */
  const makeSleeve = (side) => {
    const secs = JACKET_SLEEVE.map(s => ({ ...s, x: s.x * side }))
    const geo = loft(secs, 48, {
      uScale: 3.2, steps: 48,
      deform: (p, t, v, s, c) => {
        const back = Math.max(0, -Math.sin(t)), front = Math.max(0, Math.sin(t))
        const dx = p.x - c.x, dz = p.z - c.z
        const rl = Math.hypot(dx, dz) || 1
        let r = 0
        r += back * gauss(v - 0.45, 0.08) * Math.sin((v - 0.45) * 100) * 0.013  // elbow folds
        r += back * gauss(v - 0.45, 0.10) * 0.009
        r -= front * gauss(v - 0.45, 0.07) * 0.005
        r += gauss(v - 0.06, 0.05) * 0.004
        r += Math.sin(v * 38 + t * 12) * 0.0018
        p.x += (dx / rl) * r
        p.z += (dz / rl) * r
      },
    })
    const g = new THREE.Group()
    g.add(new THREE.Mesh(geo, PLACEHOLDER))
    g.add(tag(discCap(secs[0], 40, 0.92), 'lining'))
    for (let b = 0; b < 3; b++) {
      const bt = button(0.012, 0.006)
      bt.position.set(side * (0.566 + 0.102), -0.54 + b * 0.045, 0.150)
      bt.rotation.y = side * Math.PI / 2
      g.add(bt)
    }
    return g
  }
  group.add(makeSleeve(-1))
  group.add(makeSleeve(1))

  /* Notch lapels + rolled collar */
  for (const side of [-1, 1]) {
    const geo = planarUV(new THREE.ExtrudeGeometry(lapelShape(), {
      depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2,
    }), 2.0)
    const lapel = new THREE.Mesh(geo, PLACEHOLDER)
    lapel.scale.set(side * 1.05, 0.92, 1.0)
    lapel.position.set(side * 0.068, 0.19, 0.300)
    lapel.rotation.set(-0.30, side * 0.42, side * 0.05)
    group.add(lapel)
    const under = lapel.clone()
    under.position.z -= 0.026
    under.scale.multiplyScalar(0.95)
    group.add(tag(under, 'lining'))
  }
  // turn-down collar: a short cone flaring outward, left open at the front
  const collar = new THREE.Mesh(loft([
    { y: 0.930, rx: 0.196, rz: 0.158 },
    { y: 0.900, rx: 0.232, rz: 0.190 },
    { y: 0.862, rx: 0.268, rz: 0.222 },
  ], 44, { uScale: 1.1, steps: 12, thetaStart: Math.PI * 0.62, thetaLength: Math.PI * 1.76 }), PLACEHOLDER)
  group.add(collar)

  /* Buttons + pockets, walked out onto the tailored surface */
  for (let b = 0; b < 2; b++) {
    const bt = button(0.019, 0.009)
    onBody(bt, -0.05, 0.06 - b * 0.19, 0.455, 0.276)
    bt.rotation.x = -0.06
    group.add(bt)
  }
  const chest = weltPocket({ w: 0.115, h: 0.085, flap: false })
  onBody(chest, -0.255, 0.40, 0.500, 0.306)
  chest.rotation.z = 0.05
  group.add(chest)
  for (const side of [-1, 1]) {
    const hip = weltPocket({ w: 0.16, h: 0.13, flap: true })
    onBody(hip, side * 0.265, -0.36, 0.490, 0.284)
    hip.rotation.x = -0.06
    group.add(hip)
  }

  group.position.y = 0.1
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   SHIRT — softer block, roll collar, placket, cuffed sleeves
   ══════════════════════════════════════════════════════════════════════════ */
const SHIRT_BODY = [
  { y: -1.00, rx: 0.500, rz: 0.310, n: 2.5 },
  { y: -0.70, rx: 0.496, rz: 0.306, n: 2.5 },
  { y: -0.35, rx: 0.478, rz: 0.296, n: 2.5 },
  { y: 0.00, rx: 0.470, rz: 0.292, n: 2.5 },
  { y: 0.35, rx: 0.492, rz: 0.304, n: 2.6 },
  { y: 0.62, rx: 0.516, rz: 0.308, n: 2.8 },
  { y: 0.79, rx: 0.508, rz: 0.294, n: 3.0 },
  { y: 0.87, rx: 0.448, rz: 0.264, n: 2.8 },
  { y: 0.92, rx: 0.308, rz: 0.212, n: 2.5 },
  { y: 0.935, rx: 0.180, rz: 0.146, n: 2.3 },
]
const SHIRT_SLEEVE = [
  { y: -0.68, rx: 0.112, rz: 0.116, x: 0.596, z: 0.132 },
  { y: -0.46, rx: 0.136, rz: 0.142, x: 0.610, z: 0.118 },
  { y: -0.18, rx: 0.158, rz: 0.164, x: 0.616, z: 0.090 },
  { y: 0.12, rx: 0.174, rz: 0.180, x: 0.606, z: 0.054 },
  { y: 0.40, rx: 0.184, rz: 0.189, x: 0.572, z: 0.024 },
  { y: 0.62, rx: 0.184, rz: 0.188, x: 0.508, z: 0.008 },
  { y: 0.74, rx: 0.172, rz: 0.175, x: 0.442, z: 0.000 },
  { y: 0.80, rx: 0.128, rz: 0.130, x: 0.392, z: 0.000 },
]

export function buildShirt() {
  const group = new THREE.Group()

  group.add(new THREE.Mesh(loft(SHIRT_BODY, 72, {
    uScale: 3.2, steps: 60,
    deform: (p, t, v, s, c) => {
      const back = Math.max(0, -Math.sin(t))
      const dx = p.x - c.x, dz = p.z - c.z
      const rl = Math.hypot(dx, dz) || 1
      let r = 0
      r += Math.sin(t * 7 + v * 2.5) * (0.006 + (1 - v) * 0.014)   // soft shirting folds
      r += back * gauss(v - 0.80, 0.06) * Math.sin(t * 8) * 0.007  // yoke pull
      r += gauss(angDelta(t, Math.PI / 2), 0.05) * 0.014           // placket ridge
      r += Math.sin(v * 30 + t * 10) * 0.002
      p.x += (dx / rl) * r
      p.z += (dz / rl) * r
    },
  }), PLACEHOLDER))
  group.add(tag(discCap(SHIRT_BODY[0], 56, 0.97), 'lining'))
  group.add(tag(discCap(SHIRT_BODY[SHIRT_BODY.length - 1], 40, 0.9), 'lining'))

  const makeSleeve = (side) => {
    const secs = SHIRT_SLEEVE.map(s => ({ ...s, x: s.x * side }))
    const g = new THREE.Group()
    g.add(new THREE.Mesh(loft(secs, 44, {
      uScale: 3.2, steps: 44,
      deform: (p, t, v, s, c) => {
        const back = Math.max(0, -Math.sin(t))
        const dx = p.x - c.x, dz = p.z - c.z
        const rl = Math.hypot(dx, dz) || 1
        let r = back * gauss(v - 0.42, 0.09) * Math.sin((v - 0.42) * 85) * 0.015
        r += Math.sin(t * 5 + v * 3) * 0.008 * (1 - v * 0.4)
        r -= gauss(v - 0.09, 0.06) * 0.018                          // gathered into the cuff
        p.x += (dx / rl) * r
        p.z += (dz / rl) * r
      },
    }), PLACEHOLDER))
    // cuff
    g.add(new THREE.Mesh(loft([
      { y: -0.72, rx: 0.120, rz: 0.124, x: side * 0.594, z: 0.134 },
      { y: -0.62, rx: 0.122, rz: 0.126, x: side * 0.597, z: 0.130 },
    ], 40, { uScale: 3.2 }), PLACEHOLDER))
    g.add(tag(discCap({ y: -0.725, rx: 0.120, rz: 0.124, x: side * 0.594, z: 0.134 }, 36, 0.9), 'lining'))
    const bt = button(0.011, 0.005)
    bt.position.set(side * 0.716, -0.67, 0.134)
    bt.rotation.y = side * Math.PI / 2
    g.add(bt)
    return g
  }
  group.add(makeSleeve(-1))
  group.add(makeSleeve(1))

  /* Collar band + points */
  group.add(new THREE.Mesh(loft([
    { y: 0.930, rx: 0.184, rz: 0.148 },
    { y: 0.975, rx: 0.188, rz: 0.151 },
  ], 44, { uScale: 1.0, steps: 6 }), PLACEHOLDER))

  const collar = new THREE.Mesh(loft([
    { y: 0.945, rx: 0.190, rz: 0.152 },
    { y: 0.912, rx: 0.228, rz: 0.186 },
    { y: 0.872, rx: 0.268, rz: 0.222 },
    { y: 0.845, rx: 0.292, rz: 0.244 },
  ], 44, { uScale: 1.15, steps: 14, thetaStart: Math.PI * 0.60, thetaLength: Math.PI * 1.80 }), PLACEHOLDER)
  group.add(collar)

  /* Placket, buttons, chest pocket, yoke */
  const plk = new THREE.Mesh(new THREE.BoxGeometry(0.058, 1.95, 0.014), PLACEHOLDER)
  plk.position.set(0, 0.0, 0.302)
  group.add(plk)
  for (let b = 0; b < 6; b++) {
    const bt = button(0.012, 0.005)
    bt.position.set(0, 0.80 - b * 0.33, 0.312)
    group.add(bt)
  }
  const pocket = weltPocket({ w: 0.13, h: 0.15, flap: false })
  onBody(pocket, -0.30, 0.34, 0.492, 0.304)
  group.add(pocket)
  const yoke = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.24, 8, 4), PLACEHOLDER)
  yoke.position.set(0, 0.80, -0.30)
  yoke.rotation.set(0.12, Math.PI, 0)
  group.add(yoke)

  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   KILT — fitted waist, hip flare, deep knife pleats, apron, straps
   ══════════════════════════════════════════════════════════════════════════ */
export function buildKilt() {
  const group = new THREE.Group()
  const PLEATS = 26
  // [v, radius scale] — fitted at the waist, flaring below the hip
  const KILT = [
    { y: -0.36, rx: 0.640, rz: 0.520, n: 2.3 },   // hem
    { y: -0.10, rx: 0.596, rz: 0.480, n: 2.3 },
    { y: 0.16, rx: 0.552, rz: 0.436, n: 2.35 },
    { y: 0.42, rx: 0.512, rz: 0.394, n: 2.4 },
    { y: 0.66, rx: 0.468, rz: 0.350, n: 2.45 },   // hip
    { y: 0.86, rx: 0.424, rz: 0.316, n: 2.4 },
    { y: 1.00, rx: 0.400, rz: 0.298, n: 2.4 },    // waist
    { y: 1.08, rx: 0.398, rz: 0.296, n: 2.4 },
  ]

  const skirt = new THREE.Mesh(loft(KILT, 360, {
    uScale: 3.2, steps: 54,
    deform: (p, t, v, s, c) => {
      const dx = p.x - c.x, dz = p.z - c.z
      const rl = Math.hypot(dx, dz) || 1
      const isApron = Math.abs(angDelta(t, Math.PI / 2)) < Math.PI / 4
      let off = 0
      if (!isApron) {
        // knife pleat: sharp crease, long face, short return
        const k = ((t * PLEATS) / (2 * Math.PI) + 100) % 1
        const depth = 0.055 * (0.35 + (1 - v) * 0.65)   // pleats open toward the hem
        off = k < 0.72 ? -depth + 2 * depth * (k / 0.72)
          : depth - 2 * depth * ((k - 0.72) / 0.28)
        off += Math.sin(t * 3 + v * 4) * (1 - v) * 0.014  // the stack swings
      } else {
        off += Math.sin(t * 6.5) * (1 - v) * 0.010
      }
      off += Math.sin(v * 26 + t * 9) * 0.0025
      p.x += (dx / rl) * off
      p.z += (dz / rl) * off
    },
  }), PLACEHOLDER)
  group.add(skirt)
  group.add(tag(discCap(KILT[KILT.length - 1], 48, 0.95), 'lining'))

  /* Over-apron: a flat panel proud of the pleats, across the front quarter */
  const A0 = Math.PI / 4 - 0.05, A1 = Math.PI * 0.75 + 0.05
  const apron = new THREE.Mesh(gridSolid({
    rows: 40, cols: 34, thickness: 0.008,
    point: (i, j) => {
      const v = i / 40                    // 0 hem → 1 waist
      const a = A0 + (A1 - A0) * (j / 34)
      const y = -0.36 + v * 1.44
      const rx = profile([[0, 0.652], [0.5, 0.526], [1, 0.410]], v)
      const rz = profile([[0, 0.532], [0.5, 0.406], [1, 0.308]], v)
      const swing = Math.sin(a * 7) * (1 - v) * 0.012 + 0.014   // proud of the pleats
      return new THREE.Vector3(Math.cos(a) * (rx + swing), y, Math.sin(a) * (rz + swing))
    },
    // matches the skirt's density: the skirt spends ~0.85 of a repeat across
    // this quarter of the circumference, and ~1.7 over its height
    uv: (i, j) => [(j / 34) * 0.85, (i / 40) * 1.70],
  }), PLACEHOLDER)
  group.add(apron)

  /* Fringed selvedge down the apron's free edge */
  group.add(makeFringe(34, (d, i, rand) => {
    const t = i / 33
    const y = -0.36 + t * 1.40
    const rx = profile([[0, 0.656], [0.5, 0.530], [1, 0.414]], t)
    const rz = profile([[0, 0.536], [0.5, 0.410], [1, 0.312]], t)
    d.position.set(Math.cos(A1) * rx, y, Math.sin(A1) * rz)
    d.rotation.set((rand() - 0.5) * 0.25, -A1, (rand() - 0.5) * 0.2)
    d.scale.setScalar(0.075 + rand() * 0.03)
  }, 41))

  /* Waistband */
  group.add(new THREE.Mesh(loft([
    { y: 1.00, rx: 0.404, rz: 0.301, n: 2.4 },
    { y: 1.09, rx: 0.408, rz: 0.304, n: 2.4 },
    { y: 1.14, rx: 0.404, rz: 0.301, n: 2.4 },
  ], 72, { uScale: 3.2, steps: 10 }), PLACEHOLDER))

  /* Leather straps + brass buckles at the left hip */
  for (const yy of [0.98, 0.78]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.05, 0.016), PLACEHOLDER)
    strap.position.set(-0.34, yy, 0.20)
    strap.rotation.y = -0.9
    group.add(tag(strap, 'leather'))
    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.011, 10, 24), PLACEHOLDER)
    buckle.position.set(-0.44, yy, 0.10)
    buckle.rotation.y = -0.9
    group.add(tag(buckle, 'metal'))
  }

  /* Kilt pin on the front apron */
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.17, 8), PLACEHOLDER)
  pin.position.set(0.24, -0.16, 0.44)
  pin.rotation.x = Math.PI / 2.1
  group.add(tag(pin, 'metal'))

  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   SCARF — one continuous ribbon wrapped round the neck with two hanging tails
   ══════════════════════════════════════════════════════════════════════════ */
export function buildScarf() {
  const group = new THREE.Group()

  // folds run along the length and deepen where the cloth hangs free
  const fold = (t, w) => {
    const free = Math.min(1, Math.abs(t - 0.5) / 0.32)          // 0 at the neck, 1 at the ends
    return Math.sin(t * 42 + w * 4) * (0.006 + free * 0.038) * (1 - w * w * 2.4)
      + Math.pow(Math.abs(w * 2), 3) * 0.03 * Math.sin(t * 13)  // selvedge curl
  }
  // gathers slightly where it passes behind the neck
  const width = (t) => 0.40 - 0.09 * gauss(t - 0.5, 0.10)

  // one continuous piece: left hem → up the front → round the neck → right hem
  const scarf = ribbon([
    [-0.19, -1.02, 0.27], [-0.24, -0.62, 0.29], [-0.19, -0.20, 0.30],
    [-0.24, 0.22, 0.30], [-0.20, 0.62, 0.29], [-0.26, 0.96, 0.24],
    [-0.35, 1.20, 0.08], [-0.31, 1.33, -0.14], [-0.11, 1.38, -0.27],
    [0.13, 1.37, -0.25], [0.31, 1.31, -0.08], [0.34, 1.18, 0.12],
    [0.28, 0.94, 0.25], [0.23, 0.56, 0.29], [0.27, 0.14, 0.30],
    [0.21, -0.28, 0.29], [0.25, -0.68, 0.27], [0.20, -0.94, 0.26],
  ], { width, segs: 220, wSegs: 18, thickness: 0.012, fold, uRepeat: 1.15, vRepeat: 13 })
  group.add(new THREE.Mesh(scarf, PLACEHOLDER))

  const hem = (cx, cz, y, seed) => makeFringe(26, (d, i, rand) => {
    const t = i / 25 - 0.5
    d.position.set(cx + t * 0.39, y, cz + (rand() - 0.5) * 0.025)
    d.rotation.set((rand() - 0.5) * 0.3, rand() * Math.PI, (rand() - 0.5) * 0.28)
    d.scale.setScalar(0.14 + rand() * 0.05)
  }, seed)
  group.add(hem(-0.19, 0.27, -1.03, 11))
  group.add(hem(0.20, 0.26, -0.95, 23))

  group.position.y = -0.2
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   THROW — thick blanket folded over an implied arm, pooling on the floor
   ══════════════════════════════════════════════════════════════════════════ */
export function buildThrow() {
  const group = new THREE.Group()
  const ROWS = 150, COLS = 110
  const W = 3.6

  // The sheet runs over a rounded roll at the top, then falls in catenary
  // folds whose amplitude grows as the cloth leaves the support.
  const surface = (i, j) => {
    const t = i / ROWS               // 0 = back top, 1 = front hem
    const u = j / COLS - 0.5
    const x = u * W
    let y, z

    if (t < 0.22) {                  // laid over the top of the support
      const k = t / 0.22
      y = 0.95 - k * 0.02
      z = -0.85 + k * 0.85
    } else if (t < 0.36) {           // rolling over the front edge
      const k = (t - 0.22) / 0.14
      const a = k * Math.PI * 0.5
      y = 0.93 - (1 - Math.cos(a)) * 0.34
      z = 0.0 + Math.sin(a) * 0.34
    } else {                         // free fall + pooling
      const k = (t - 0.36) / 0.64
      y = 0.59 - k * 1.62
      z = 0.34 + Math.sin(k * 1.35) * 0.20
      if (k > 0.86) {                // pools and buckles on the ground
        const q = (k - 0.86) / 0.14
        y = 0.59 - 0.86 * 1.62 - q * 0.06
        z = 0.34 + Math.sin(0.86 * 1.35) * 0.20 + q * 0.55
      }
    }

    // folds: vertical waves that deepen down the drop and get pushed sideways
    const drop = Math.max(0, (t - 0.30) / 0.70)
    const amp = 0.02 + drop * drop * 0.17
    const w1 = Math.sin(u * 30.0 + drop * 1.6) * amp
    const w2 = Math.sin(u * 63.0 - drop * 2.4) * amp * 0.30
    const slack = Math.sin(drop * 6.0 + u * 9.0) * drop * 0.06
    z += w1 + w2
    y += slack * 0.25
    return new THREE.Vector3(x + (w1 + w2) * 0.45, y, z)
  }

  group.add(new THREE.Mesh(gridSolid({
    rows: ROWS, cols: COLS, thickness: 0.018,
    point: surface,
    uv: (i, j) => [(j / COLS) * 5.2, (i / ROWS) * 6.4],
  }), PLACEHOLDER))

  // fringe on both cut ends
  const endFringe = (row, seed, dir) => makeFringe(52, (d, i, rand) => {
    const j = Math.round((i / 51) * COLS)
    const p = surface(row, j)
    d.position.copy(p)
    d.rotation.set((rand() - 0.5) * 0.35 + dir, rand() * Math.PI, (rand() - 0.5) * 0.35)
    d.scale.setScalar(0.15 + rand() * 0.05)
  }, seed)
  group.add(endFringe(ROWS, 101, 0))
  group.add(endFringe(0, 131, Math.PI * 0.5))

  group.position.y = -0.1
  return { mesh: group }
}

export const BUILDERS = {
  kilt: buildKilt, scarf: buildScarf, jacket: buildJacket,
  throw: buildThrow, shirt: buildShirt, pants: buildPants,
}

export function disposeSharedGarmentGeometry() {
  if (_threadGeo) { _threadGeo.dispose(); _threadGeo = null }
}
