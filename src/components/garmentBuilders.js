/**
 * garmentBuilders.js — procedural, photoreal-leaning garment geometry.
 *
 * Every builder returns `{ mesh: THREE.Group }`. Sub-meshes may carry
 * `userData.mat` to request a non-fabric material slot:
 *   'fabric' (default) | 'lining' | 'leather' | 'metal' | 'button' | 'thread'
 *
 * Conventions
 *  • radius/height fields are modulated by anatomical *profile* functions so
 *    limbs are continuous (no cylinder-stack seams);
 *  • cloth behaviour is layered on top: gravity sag, fold stacks at joints,
 *    hem break, seam piping;
 *  • repeated small parts (fringe) are InstancedMesh for draw-call economy.
 */
import * as THREE from 'three'

/* ── utilities ──────────────────────────────────────────────────────────── */
const PLACEHOLDER = new THREE.MeshBasicMaterial()

const tag = (o, slot) => { o.userData.mat = slot; return o }

/** deterministic RNG — stable geometry across rebuilds */
function rng(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
const smooth = (t) => t * t * (3 - 2 * t)
const gauss = (x, w) => Math.exp(-(x * x) / (2 * w * w))

/** piecewise-smooth profile through control points [[t, v], …] (t ascending) */
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

/** shared, slightly-curled thread geometry used for all fringe instances */
let _threadGeo = null
function threadGeometry() {
  if (_threadGeo) return _threadGeo
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.012, -0.28, 0.01),
    new THREE.Vector3(-0.006, -0.62, 0.03),
    new THREE.Vector3(0.014, -1.0, 0.02),
  ])
  _threadGeo = new THREE.TubeGeometry(curve, 10, 0.0032, 5, false)
  return _threadGeo
}

/**
 * Instanced fringe. `place(dummy, i, rand)` positions one thread whose pivot
 * is its top and whose unit length is 1 (scale to taste).
 */
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
  im.castShadow = true
  im.receiveShadow = true
  return tag(im, 'fabric')
}

/** thin piping / seam run along an arbitrary 3D curve */
function piping(points, radius = 0.006, slot = 'fabric') {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
  const geo = new THREE.TubeGeometry(curve, 48, radius, 6, false)
  return tag(new THREE.Mesh(geo, PLACEHOLDER), slot)
}

/** planar UV remap — ExtrudeGeometry's default UVs are in model units */
function planarUV(geo, repeat = 3) {
  geo.computeBoundingBox()
  const b = geo.boundingBox
  const sx = Math.max(1e-6, b.max.x - b.min.x), sy = Math.max(1e-6, b.max.y - b.min.y)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - b.min.x) / sx * repeat, (pos.getY(i) - b.min.y) / sy * repeat)
  }
  uv.needsUpdate = true
  return geo
}

/** sloped shoulder cap so open-ended torsos don't read as buckets */
function shoulderCap(radius, y, squashZ = 0.84, rise = 0.30) {
  const geo = new THREE.SphereGeometry(radius, 56, 18, 0, Math.PI * 2, 0, Math.PI * 0.5)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), py = p.getY(i), z = p.getZ(i)
    const a = Math.atan2(z, x)
    // squarer across the shoulders, softer front-to-back
    const k = 1 + Math.abs(Math.cos(a)) * 0.06
    p.setX(i, x * k)
    p.setY(i, py * rise)
    p.setZ(i, z * squashZ)
  }
  const uv = geo.attributes.uv
  if (uv) {
    for (let i = 0; i < p.count; i++) {
      const a = Math.atan2(p.getZ(i), p.getX(i))
      uv.setXY(i, (a + Math.PI) / (2 * Math.PI) * 3, 3.4 + p.getY(i) * 2.4)
    }
    uv.needsUpdate = true
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, PLACEHOLDER)
  m.position.y = y
  return m
}

/** place a detail on a (squashed) cylindrical body, facing outward */
function onBody(obj, x, y, r, squashZ) {
  const cl = Math.min(1, Math.max(-1, x / r))
  const ang = Math.acos(cl)                 // 0..π, front hemisphere
  obj.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r * squashZ)
  obj.rotation.y = Math.PI / 2 - ang
  return obj
}

/** dimensional button: disc + rim + two stitch threads */
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

/** welt pocket: shadow slit + welt lip + curled flap, all surface-mounted */
function weltPocket({ w = 0.13, h = 0.11, flap = true }) {
  const g = new THREE.Group()

  const slit = new THREE.Mesh(new THREE.BoxGeometry(w, 0.014, 0.006), PLACEHOLDER)
  slit.position.set(0, h / 2, 0.002)
  g.add(tag(slit, 'lining'))

  const lip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.008, 0.022, 0.012), PLACEHOLDER)
  lip.position.set(0, h / 2 - 0.016, 0.008)
  g.add(tag(lip, 'fabric'))

  // stitched pocket bag outline sitting just proud of the body
  const bag = new THREE.PlaneGeometry(w, h, 8, 8)
  const bp = bag.attributes.position, bu = bag.attributes.uv
  for (let i = 0; i < bp.count; i++) {
    const nx = bp.getX(i) / (w / 2), ny = bp.getY(i) / (h / 2)
    bp.setZ(i, 0.006 + (1 - nx * nx) * (1 - ny * ny) * 0.014)   // slight pillow
    if (bu) bu.setXY(i, bu.getX(i) * 1.5, bu.getY(i) * 1.5)
  }
  bag.computeVertexNormals()
  const bagMesh = new THREE.Mesh(bag, PLACEHOLDER)
  bagMesh.position.set(0, -0.004, 0)
  g.add(tag(bagMesh, 'fabric'))

  if (flap) {
    const fg = new THREE.PlaneGeometry(w + 0.006, h * 0.62, 10, 8)
    const p = fg.attributes.position, u = fg.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), t = (h * 0.31 - y) / (h * 0.62)
      p.setZ(i, 0.016 + t * t * 0.016)                          // flap falls away & curls
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

/* ══════════════════════════════════════════════════════════════════════════
   PANTS — cloth weight, crotch/knee drape wrinkles, tapered cuff, side piping
   ══════════════════════════════════════════════════════════════════════════ */
export function buildPants() {
  const group = new THREE.Group()

  /* Waistband — oval, with a rolled top edge */
  const wbGeo = new THREE.CylinderGeometry(0.432, 0.44, 0.11, 72, 6, true)
  const wp = wbGeo.attributes.position
  for (let i = 0; i < wp.count; i++) wp.setZ(i, wp.getZ(i) * 0.78)
  wbGeo.computeVertexNormals()
  const waistband = new THREE.Mesh(wbGeo, PLACEHOLDER)
  waistband.position.y = 1.01
  group.add(waistband)

  const rollGeo = new THREE.TorusGeometry(0.434, 0.012, 8, 72)
  rollGeo.rotateX(Math.PI / 2)
  rollGeo.scale(1, 1, 0.78)
  const roll = new THREE.Mesh(rollGeo, PLACEHOLDER)
  roll.position.y = 1.065
  group.add(roll)

  /* Belt loops */
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    const loop = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.014), PLACEHOLDER)
    loop.position.set(Math.cos(a) * 0.444, 1.01, Math.sin(a) * 0.342)
    loop.rotation.y = -a
    group.add(loop)
  }

  /* Fly placket + metal pull */
  const fly = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.012), PLACEHOLDER)
  fly.position.set(0.02, 0.84, 0.336)
  group.add(fly)
  const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.026, 10), PLACEHOLDER)
  pull.position.set(0.02, 0.87, 0.344)
  pull.rotation.z = Math.PI / 2
  group.add(tag(pull, 'metal'))
  const waistBtn = button(0.014, 0.006)
  waistBtn.position.set(0.02, 1.0, 0.342)
  group.add(waistBtn)

  /* Hip / seat block — anatomical, with crotch drape folds */
  const hipGeo = new THREE.CylinderGeometry(0.432, 0.40, 0.60, 72, 44, true)
  const hp = hipGeo.attributes.position, hu = hipGeo.attributes.uv
  for (let i = 0; i < hp.count; i++) {
    const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i)
    const ang = Math.atan2(z, x)
    const hn = (y + 0.30) / 0.60                       // 0 = crotch, 1 = waist
    const front = Math.max(0, Math.sin(ang))
    const back = Math.max(0, -Math.sin(ang))

    const seat = back * (1 - hn) * 0.10                // seat fullness
    const flare = Math.abs(Math.cos(ang)) * 0.028 * (1 - hn * 0.6)
    // crotch drape: whiskers radiating from the fly, strongest low & front
    const whisker = front * gauss(hn - 0.12, 0.16) *
      Math.sin(ang * 5.0 + hn * 16) * 0.012
    // seat smile folds under the seat
    const smile = back * gauss(hn - 0.18, 0.12) * Math.sin(ang * 7 + 1.2) * 0.009
    const micro = Math.sin(y * 26 + x * 17) * 0.0022

    const L = Math.hypot(x, z)
    const r = 1 + flare + whisker + smile + micro + seat
    hp.setX(i, Math.cos(ang) * L * r)
    hp.setZ(i, Math.sin(ang) * L * r * 0.78)
    if (hu) hu.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, hn * 2)
  }
  hipGeo.computeVertexNormals()
  const hips = new THREE.Mesh(hipGeo, PLACEHOLDER)
  hips.position.y = 0.655
  group.add(hips)

  /* Back pockets (welted, with stitch outline) */
  for (const side of [-1, 1]) {
    const p = weltPocket({ w: 0.135, h: 0.115, flap: false })
    onBody(p, side * 0.22, 0.63, 0.415, 0.78)
    p.position.z *= -1
    p.rotation.y = Math.PI - p.rotation.y
    p.rotation.x = -0.08
    group.add(p)
  }
  /* Front slash pockets */
  for (const side of [-1, 1]) {
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.16, 2, 4), PLACEHOLDER)
    onBody(fp, side * 0.395, 0.77, 0.42, 0.78)
    fp.rotation.x = 0.18
    group.add(tag(fp, 'lining'))
  }

  /* ── Legs: one continuous surface driven by an anatomical profile ── */
  const LEG_H = 1.5
  // [normalised height from hem → crotch, radius]
  const LEG = [
    [0.00, 0.098], [0.05, 0.093], [0.12, 0.096], [0.26, 0.132],
    [0.40, 0.124], [0.50, 0.128], [0.62, 0.152], [0.85, 0.186], [1.00, 0.203],
  ]

  const makeLeg = (offsetX, tiltZ, isLeft) => {
    const lg = new THREE.Group()
    const geo = new THREE.CylinderGeometry(1, 1, LEG_H, 64, 110, true)
    const p = geo.attributes.position, u = geo.attributes.uv
    const inward = isLeft ? 1 : -1

    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const ang = Math.atan2(z, x)
      const hn = (y + LEG_H / 2) / LEG_H
      const front = Math.max(0, Math.sin(ang))
      const back = Math.max(0, -Math.sin(ang))

      let r = profile(LEG, hn)

      // cloth weight: fabric hangs off the knee & thigh instead of shrink-wrapping
      r += gauss(hn - 0.72, 0.18) * 0.012 + gauss(hn - 0.30, 0.14) * 0.008

      // knee drape wrinkles — horizontal fold stack just above the knee
      r += front * gauss(hn - 0.46, 0.075) * Math.sin((hn - 0.46) * 105) * 0.011
      r += front * gauss(hn - 0.40, 0.05) * 0.006

      // crotch pull wrinkles at the very top inner face
      const innerFace = Math.max(0, Math.cos(ang) * inward)
      r += innerFace * gauss(hn - 0.94, 0.07) * Math.sin(ang * 4 + hn * 22) * 0.010

      // hem break — cloth stacks on the shoe
      r += gauss(hn - 0.055, 0.045) * Math.sin(hn * 150) * 0.006
      r += front * gauss(hn - 0.09, 0.05) * 0.007

      // calf muscle & flatter shin
      r += back * gauss(hn - 0.27, 0.10) * 0.014
      r -= front * gauss(hn - 0.22, 0.12) * 0.006

      // permanent front crease of a pressed trouser
      const creaseF = gauss(((ang - Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI, 0.10)
      const creaseB = gauss(((ang + Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI, 0.10)
      r += (creaseF + creaseB) * 0.005 * Math.min(1, hn * 4)

      const micro = Math.sin(y * 40 + x * 26) * 0.0018

      // gravity lean: the leg column drops slightly forward as it descends
      const sag = (1 - hn) * 0.012

      p.setX(i, Math.cos(ang) * (r + micro))
      p.setZ(i, Math.sin(ang) * (r + micro) * 0.9 + sag)
      if (u) u.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 2.2, hn * 3.2)
    }
    geo.computeVertexNormals()
    const leg = new THREE.Mesh(geo, PLACEHOLDER)
    leg.position.set(offsetX, LEG_H / 2 - 1.5, 0)
    lg.add(leg)

    // side-seam piping down the outer leg
    const outer = isLeft ? -1 : 1
    const seamPts = []
    for (let k = 0; k <= 10; k++) {
      const hn = k / 10
      const r = profile(LEG, hn) + 0.002
      seamPts.push([offsetX + outer * r, LEG_H * hn - 1.5, (1 - hn) * 0.012])
    }
    lg.add(piping(seamPts, 0.0055))

    // inseam piping
    const inPts = seamPts.map(([px, py, pz], k) => [offsetX - outer * profile(LEG, k / 10), py, pz])
      .filter((_, k) => k / 10 <= 0.92)
    lg.add(piping(inPts, 0.0042))

    // tapered hem cuff + turn-up
    const cuffGeo = new THREE.CylinderGeometry(0.101, 0.108, 0.062, 40, 4, true)
    cuffGeo.scale(1, 1, 0.9)
    const cuff = new THREE.Mesh(cuffGeo, PLACEHOLDER)
    cuff.position.set(offsetX, -1.475, 0.012)
    lg.add(cuff)

    const foldGeo = new THREE.TorusGeometry(0.1035, 0.011, 8, 40)
    foldGeo.rotateX(Math.PI / 2)
    foldGeo.scale(1, 1, 0.9)
    const fold = new THREE.Mesh(foldGeo, PLACEHOLDER)
    fold.position.set(offsetX, -1.5, 0.012)
    lg.add(fold)

    lg.rotation.z = tiltZ
    lg.position.y = 0.365           // leg top meets the bottom of the hip block
    return lg
  }

  group.add(makeLeg(-0.22, -0.02, true))
  group.add(makeLeg(0.22, 0.02, false))
  group.position.y = 0.48
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   JACKET — notch lapels, shoulder pads, elbow wrinkles, rear vent, welts
   ══════════════════════════════════════════════════════════════════════════ */
function lapelShape() {
  const s = new THREE.Shape()
  s.moveTo(0.00, 0.00)   // roll bottom, at the top button
  s.lineTo(0.105, 0.24)  // outer edge climbing
  s.lineTo(0.158, 0.44)  // lapel point
  s.lineTo(0.082, 0.505) // ── notch cut ──
  s.lineTo(0.140, 0.585) // collar point
  s.lineTo(0.028, 0.645) // neck
  s.lineTo(-0.018, 0.34)
  s.lineTo(-0.010, 0.05)
  s.closePath()
  return s
}

export function buildJacket() {
  const group = new THREE.Group()
  const H = 1.8

  /* Torso — drape, waist suppression, chest fullness, rear vent split */
  const bodyGeo = new THREE.CylinderGeometry(0.47, 0.52, H, 80, 64, true)
  const pos = bodyGeo.attributes.position, uvs = bodyGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    let ang = Math.atan2(z, x)
    const hn = (y + H / 2) / H
    const front = Math.max(0, Math.sin(ang))
    const back = Math.max(0, -Math.sin(ang))

    // tailoring
    const waist = -gauss(hn - 0.46, 0.16) * 0.035
    const chest = front * gauss(hn - 0.72, 0.14) * 0.022
    const blades = back * gauss(hn - 0.74, 0.12) * 0.018
    const skirt = gauss(hn - 0.10, 0.12) * 0.016            // hem flare over the hips

    // front opening: fabric folds back to reveal the lapel roll
    const open = gauss(((ang - Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI, 0.16)
    const openDepth = -open * Math.max(0, hn - 0.42) * 0.30

    // drape wrinkles under the arms and at the waist
    const armPit = Math.abs(Math.cos(ang)) * gauss(hn - 0.78, 0.08) *
      Math.sin(ang * 9 + hn * 20) * 0.010
    const waistFold = gauss(hn - 0.40, 0.10) * Math.sin(ang * 6.5) * 0.006
    const micro = Math.sin(y * 30 + x * 19) * 0.0022

    let r = 1 + waist + chest + blades + skirt + openDepth + armPit + waistFold + micro

    // rear vent: a real split in the back hem
    const vent = gauss(((ang + Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI, 0.035)
    const ventOpen = vent * Math.max(0, 0.34 - hn) / 0.34
    ang += ventOpen * 0.10 * (z >= 0 ? 1 : -1)
    r -= ventOpen * 0.02

    const L = Math.hypot(x, z)
    pos.setX(i, Math.cos(ang) * L * r)
    pos.setZ(i, Math.sin(ang) * L * r * 0.84)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, hn * 3.5)
  }
  bodyGeo.computeVertexNormals()
  group.add(new THREE.Mesh(bodyGeo, PLACEHOLDER))
  group.add(shoulderCap(0.472, 0.895, 0.84, 0.34))

  /* Vent under-flap + lining reveal */
  const ventFlap = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.34, 4, 8), PLACEHOLDER)
  ventFlap.position.set(0, -0.72, -0.44)
  ventFlap.rotation.y = Math.PI
  group.add(ventFlap)
  const ventLining = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.32, 2, 6), PLACEHOLDER)
  ventLining.position.set(0, -0.72, -0.415)
  ventLining.rotation.y = Math.PI
  group.add(tag(ventLining, 'lining'))

  /* Shoulder pads — structured, slightly squared roped head */
  for (const side of [-1, 1]) {
    const padGeo = new THREE.SphereGeometry(0.2, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55)
    padGeo.scale(1.05, 0.5, 0.78)
    const pad = new THREE.Mesh(padGeo, PLACEHOLDER)
    pad.position.set(side * 0.36, 0.83, 0)
    pad.rotation.z = side * -0.12
    group.add(pad)
    // sleevehead rope
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.014, 8, 32, Math.PI * 1.1), PLACEHOLDER)
    rope.position.set(side * 0.5, 0.78, 0)
    rope.rotation.set(Math.PI / 2, 0, side * 0.35)
    rope.scale.set(1, 1, 0.8)
    group.add(rope)
  }

  /* Sleeves — tapered with elbow fold stack and cuff buttons */
  const SLEEVE_H = 1.6
  const SLEEVE = [[0.00, 0.115], [0.10, 0.118], [0.45, 0.145], [0.70, 0.165], [1.00, 0.195]]
  const makeSleeve = (offsetX, rotZ, side) => {
    const geo = new THREE.CylinderGeometry(1, 1, SLEEVE_H, 48, 80, true)
    const p = geo.attributes.position, u = geo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const ang = Math.atan2(z, x)
      const hn = (y + SLEEVE_H / 2) / SLEEVE_H
      const back = Math.max(0, -Math.sin(ang))
      const front = Math.max(0, Math.sin(ang))

      let r = profile(SLEEVE, hn)
      // elbow: compression folds on the inside of the bend, stretch outside
      r += back * gauss(hn - 0.45, 0.085) * Math.sin((hn - 0.45) * 95) * 0.013
      r += back * gauss(hn - 0.45, 0.10) * 0.010
      r -= front * gauss(hn - 0.45, 0.07) * 0.005
      // cuff & armhole ease
      r += gauss(hn - 0.07, 0.05) * 0.004
      r += gauss(hn - 0.97, 0.05) * 0.014
      r += Math.sin(y * 34 + x * 21) * 0.0018

      p.setX(i, Math.cos(ang) * r)
      p.setZ(i, Math.sin(ang) * r * 0.94 + gauss(hn - 0.45, 0.2) * 0.03)
      if (u) u.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 2, hn * 2.8)
    }
    geo.computeVertexNormals()
    const arm = new THREE.Group()
    arm.add(new THREE.Mesh(geo, PLACEHOLDER))

    // cuff buttons ride in the sleeve's own frame
    for (let b = 0; b < 3; b++) {
      const bt = button(0.012, 0.006)
      bt.position.set(side * 0.115, -SLEEVE_H / 2 + 0.07 + b * 0.045, 0.03)
      bt.rotation.y = side * Math.PI / 2.2
      arm.add(bt)
    }
    // shoulder sits at the top of the sleeve, the hem swings outward
    arm.position.set(offsetX, 0.07, 0.03)
    arm.rotation.set(0.06, 0, rotZ)
    return arm
  }
  group.add(makeSleeve(-0.62, -0.28, -1))
  group.add(makeSleeve(0.62, 0.28, 1))

  /* Notch lapels (extruded, with a rolled collar behind) */
  for (const side of [-1, 1]) {
    const geo = planarUV(new THREE.ExtrudeGeometry(lapelShape(), {
      depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2,
    }), 2.2)
    const lapel = new THREE.Mesh(geo, PLACEHOLDER)
    lapel.scale.set(side * 1.15, 1.12, 1.6)
    lapel.position.set(side * 0.075, 0.14, 0.405)
    lapel.rotation.set(-0.14, side * 0.62, side * 0.05)
    group.add(lapel)
    // lapel under-side in lining, giving the roll visible depth
    const under = lapel.clone()
    under.position.z -= 0.022
    under.scale.multiplyScalar(0.95)
    group.add(tag(under, 'lining'))
  }

  /* Rolled collar band */
  const collarGeo = new THREE.TorusGeometry(0.2, 0.052, 20, 56, Math.PI * 1.05)
  collarGeo.rotateX(Math.PI / 2.15)
  collarGeo.rotateZ(-Math.PI * 0.525)
  collarGeo.scale(1, 0.75, 0.9)
  const collar = new THREE.Mesh(collarGeo, PLACEHOLDER)
  collar.position.set(0, 0.955, -0.075)
  group.add(collar)

  /* Front buttons */
  for (let b = 0; b < 2; b++) {
    const bt = button(0.019, 0.009)
    onBody(bt, -0.05, 0.10 - b * 0.19, 0.478, 0.84)
    bt.rotation.x = -0.06
    group.add(bt)
  }

  /* Chest welt + flap hip pockets */
  const chest = weltPocket({ w: 0.115, h: 0.085, flap: false })
  onBody(chest, -0.26, 0.42, 0.46, 0.84)
  chest.rotation.z = 0.05
  group.add(chest)
  for (const side of [-1, 1]) {
    const hip = weltPocket({ w: 0.155, h: 0.125, flap: true })
    onBody(hip, side * 0.27, -0.38, 0.505, 0.84)
    hip.rotation.x = -0.06
    group.add(hip)
  }

  group.position.y = 0.55
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   SCARF — cascading catenary drape, edge curl, instanced fringe
   ══════════════════════════════════════════════════════════════════════════ */
export function buildScarf() {
  const group = new THREE.Group()

  /* Neck loop with gravity-flattened cross-section */
  const neckGeo = new THREE.TorusGeometry(0.33, 0.155, 28, 120)
  neckGeo.rotateX(Math.PI / 2.1)
  neckGeo.scale(1.14, 1.0, 1.1)
  const np = neckGeo.attributes.position
  for (let i = 0; i < np.count; i++) {
    const x = np.getX(i), y = np.getY(i), z = np.getZ(i)
    const a = Math.atan2(z, x)
    np.setY(i, y - Math.max(0, Math.sin(a)) * 0.07)          // front of the loop sags
    np.setX(i, x + Math.sin(a * 9) * 0.008)                  // soft ripples
    np.setZ(i, z + Math.cos(a * 9) * 0.008)
  }
  neckGeo.computeVertexNormals()
  const neck = new THREE.Mesh(neckGeo, PLACEHOLDER)
  neck.position.set(0, 1.5, 0.03)
  neck.rotation.x = 0.16
  group.add(neck)

  /* A hanging tail: catenary sag + travelling folds + edge curl */
  const makeTail = (w, len, seed, dir) => {
    const geo = new THREE.PlaneGeometry(w, len, 40, 110)
    const p = geo.attributes.position, u = geo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i)
      const t = (len / 2 - y) / len                          // 0 top → 1 bottom
      const nx = x / (w / 2)                                 // -1..1 across width

      // folds get deeper and wider as the cloth falls away from the neck
      const amp = 0.045 + t * 0.105
      const fold = Math.sin((t * 9 + dir * nx * 0.9 + seed) * 1.9) * amp * (1 - nx * nx * 0.55)
      const micro = Math.sin(t * 34 + nx * 7) * 0.008
      // selvedge curl — free edges roll toward the body
      const curl = Math.pow(Math.abs(nx), 3) * 0.05 * dir
      // twist increases down the length
      const twist = nx * t * 0.09 * dir

      p.setZ(i, fold + micro + curl + twist)
      // the whole panel meanders sideways as it falls — that is what reads as
      // "cloth" in silhouette, not depth-only ripples
      const sway = Math.sin(t * 4.2 + seed) * t * 0.075 * dir
      p.setX(i, x * (1 + t * 0.10) + sway)
      p.setY(i, y - t * t * 0.05)                            // catenary droop
      if (u) u.setXY(i, u.getX(i) * 3, u.getY(i) * 5)
    }
    geo.computeVertexNormals()
    return new THREE.Mesh(geo, PLACEHOLDER)
  }

  const tail1 = makeTail(0.40, 2.45, 0.0, 1)
  tail1.position.set(-0.24, 0.3, 0.30)
  tail1.rotation.set(-0.05, 0.26, 0.075)
  group.add(tail1)

  const tail2 = makeTail(0.38, 2.7, 1.7, -1)
  tail2.position.set(0.25, 0.16, 0.19)
  tail2.rotation.set(0.03, -0.34, -0.09)
  group.add(tail2)

  /* Instanced fringe at both hems */
  const fringeFor = (tail, w, len, seed) => makeFringe(26, (d, i, rand) => {
    const t = i / 25
    d.position.set(
      tail.position.x + (t - 0.5) * w * 1.06,
      tail.position.y - len / 2 - 0.05,
      tail.position.z + 0.03 + (rand() - 0.5) * 0.02
    )
    d.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI, (rand() - 0.5) * 0.3)
    d.scale.setScalar(0.16 + rand() * 0.05)
  }, seed)
  group.add(fringeFor(tail1, 0.40, 2.45, 11))
  group.add(fringeFor(tail2, 0.38, 2.7, 23))

  group.position.y = -0.45
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   KILT — true knife pleats, swinging hem, apron fringe, straps & buckles
   ══════════════════════════════════════════════════════════════════════════ */
export function buildKilt() {
  const group = new THREE.Group()
  const R1 = 0.82, R2 = 1.12, H = 2.4
  const PLEATS = 26

  const geo = new THREE.CylinderGeometry(R1, R2, H, 320, 96, true)
  const pos = geo.attributes.position, uvs = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const hn = Math.min(1, Math.max(0, (y + H / 2) / H))       // 0 hem → 1 waist
    const len = Math.hypot(x, z)
    const isApron = ang > Math.PI / 4 && ang < Math.PI * 0.75

    let off = 0
    if (!isApron) {
      // knife pleat: sharp crease, long face, short return
      const s = ((ang * PLEATS) / (2 * Math.PI) + 100) % 1
      const depth = 0.075 * (0.45 + (1 - hn) * 0.55)          // pleats open toward the hem
      off = s < 0.72
        ? -depth + (2 * depth) * (s / 0.72)
        : depth - (2 * depth) * ((s - 0.72) / 0.28)
      // the pleat stack swings as it falls
      off += Math.sin(ang * 3 + hn * 4) * (1 - hn) * 0.018
    } else {
      // flat apron with a couple of soft body folds
      off += Math.sin(ang * 6.5) * (1 - hn) * 0.012
    }
    // hem weight: the whole skirt bells out at the bottom
    const bell = Math.pow(1 - hn, 2.2) * 0.05
    const micro = Math.sin(y * 22 + x * 15) * 0.0025

    const nl = len + off + bell + micro
    pos.setX(i, Math.cos(ang) * nl)
    pos.setZ(i, Math.sin(ang) * nl)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * PLEATS * 0.55, hn * 4)
  }
  geo.computeVertexNormals()
  const skirt = new THREE.Mesh(geo, PLACEHOLDER)
  group.add(skirt)

  /* Over-apron panel sitting proud of the pleats */
  const APRON_A0 = Math.PI / 4 - 0.06, APRON_LEN = Math.PI / 2 + 0.12
  const apronGeo = new THREE.CylinderGeometry(R1 + 0.035, R2 + 0.045, H, 64, 48, true, -APRON_A0 - APRON_LEN, APRON_LEN)
  const ap = apronGeo.attributes.position
  for (let i = 0; i < ap.count; i++) {
    const x = ap.getX(i), y = ap.getY(i), z = ap.getZ(i)
    const hn = (y + H / 2) / H
    const a = Math.atan2(z, x)
    const l = Math.hypot(x, z) + Math.sin(a * 7) * (1 - hn) * 0.01
    ap.setX(i, Math.cos(a) * l)
    ap.setZ(i, Math.sin(a) * l)
  }
  apronGeo.computeVertexNormals()
  const apron = new THREE.Mesh(apronGeo, PLACEHOLDER)
  group.add(apron)

  /* Fringed selvedge on the apron's free edge */
  group.add(makeFringe(34, (d, i, rand) => {
    const t = i / 33                                       // 0 hem → 1 waist
    const a = APRON_A0 + APRON_LEN - 0.015
    const y = -H / 2 + t * H * 0.96
    const r = (R2 + 0.05) + ((R1 + 0.04) - (R2 + 0.05)) * t
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    d.rotation.set((rand() - 0.5) * 0.25, -a, (rand() - 0.5) * 0.2)
    d.scale.setScalar(0.085 + rand() * 0.03)
  }, 41))

  /* Waistband */
  const waistGeo = new THREE.CylinderGeometry(R1 - 0.012, R1 + 0.02, 0.1, 96, 6, true)
  const waist = new THREE.Mesh(waistGeo, PLACEHOLDER)
  waist.position.y = H / 2 - 0.05
  group.add(waist)

  /* Leather straps + brass buckles */
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.3), PLACEHOLDER)
    strap.position.set(side * 0.36, 0.95, -0.26)
    strap.rotation.z = side * -0.3
    group.add(tag(strap, 'leather'))
    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 10, 24, Math.PI * 1.5), PLACEHOLDER)
    buckle.position.set(side * 0.36, 0.95, -0.4)
    buckle.rotation.x = Math.PI / 2
    group.add(tag(buckle, 'metal'))
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8), PLACEHOLDER)
    prong.position.set(side * 0.36, 0.95, -0.4)
    prong.rotation.z = Math.PI / 2
    group.add(tag(prong, 'metal'))
  }

  /* Kilt pin */
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 8), PLACEHOLDER)
  pin.position.set(0.16, -0.72, 1.02)
  pin.rotation.x = Math.PI / 2.05
  group.add(tag(pin, 'metal'))

  group.position.y = 0.1
  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   THROW — pooled drape with instanced fringe on all four selvedges
   ══════════════════════════════════════════════════════════════════════════ */
export function buildThrow() {
  const group = new THREE.Group()
  const S = 4.8, SEG = 140
  const geo = new THREE.PlaneGeometry(S, S, SEG, SEG)
  const pos = geo.attributes.position, uvs = geo.attributes.uv

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const ny = (y + S / 2) / S, nx = (x + S / 2) / S
    let z

    if (ny > 0.65) {
      z = Math.cos((ny - 0.65) * 2.5) * -0.5 * (1 - nx * 0.3)
    } else if (ny > 0.25) {
      z = (0.65 - ny) * 0.8 + Math.cos(ny * 8) * 0.15 * (1 - ny * 0.5) + Math.sin(nx * 10) * 0.08
    } else if (ny > -0.1) {
      z = (0.25 - ny) * 1.2 + Math.sin(ny * 12 + x * 3) * 0.12 * (1 - ny * 2) + Math.sin(nx * 16) * 0.06
    } else {
      z = Math.max(0, -ny - 0.1) * 0.5 + Math.sin(ny * 8 + x * 5) * 0.04
    }
    // secondary gravity folds and cloth weight
    z += Math.sin(nx * 7.5 + ny * 2.2) * 0.06 * (1 - ny)
    z += Math.sin(x * 15 + y * 12) * 0.008
    pos.setZ(i, z)
    if (uvs) uvs.setXY(i, uvs.getX(i) * 5, uvs.getY(i) * 5)
  }
  geo.computeVertexNormals()
  const cloth = new THREE.Mesh(geo, PLACEHOLDER)
  cloth.rotation.x = -Math.PI / 3.5
  cloth.position.set(0, 0.15, -0.7)
  group.add(cloth)

  const EDGES = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  EDGES.forEach(([dx, dz], e) => {
    group.add(makeFringe(44, (d, i, rand) => {
      const t = i / 43 - 0.5
      const px = dx !== 0 ? dx * S / 2 : t * S
      const pz = dz !== 0 ? dz * S / 2 : t * S
      d.position.set(px, -0.85 + rand() * 0.08, pz)
      d.rotation.set((rand() - 0.5) * 0.4, rand() * Math.PI, (rand() - 0.5) * 0.4)
      d.scale.setScalar(0.14 + rand() * 0.05)
    }, 101 + e * 13))
  })

  return { mesh: group }
}

/* ══════════════════════════════════════════════════════════════════════════
   SHIRT — soft drape, roll collar, plackets, cuffs
   ══════════════════════════════════════════════════════════════════════════ */
export function buildShirt() {
  const group = new THREE.Group()
  const H = 2.2

  const bodyGeo = new THREE.CylinderGeometry(0.72, 0.7, H, 72, 56, true)
  const pos = bodyGeo.attributes.position, uvs = bodyGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const hn = (y + H / 2) / H
    const front = Math.max(0, Math.sin(ang))
    const back = Math.max(0, -Math.sin(ang))

    const placket = gauss(((ang - Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI, 0.06) * 0.02
    const taper = -gauss(hn - 0.5, 0.24) * 0.02
    // soft shirting drape: loose vertical folds, deeper at the hem
    const drape = Math.sin(ang * 7 + hn * 2.5) * (0.006 + (1 - hn) * 0.014)
    const yokePull = back * gauss(hn - 0.82, 0.07) * Math.sin(ang * 8) * 0.007
    const micro = Math.sin(y * 28 + x * 18) * 0.002

    const r = 1 + placket + taper + drape + yokePull + micro + front * gauss(hn - 0.15, 0.1) * 0.008
    pos.setX(i, Math.cos(ang) * Math.hypot(x, z) * r)
    pos.setZ(i, Math.sin(ang) * Math.hypot(x, z) * r * 0.92)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, hn * 3)
  }
  bodyGeo.computeVertexNormals()
  group.add(new THREE.Mesh(bodyGeo, PLACEHOLDER))
  group.add(shoulderCap(0.722, 1.095, 0.92, 0.26))

  /* Collar points + band */
  const shape = new THREE.Shape()
  shape.moveTo(0, 0); shape.lineTo(0.19, -0.02); shape.lineTo(0.235, 0.075)
  shape.lineTo(0.185, 0.165); shape.lineTo(0, 0.165); shape.closePath()
  for (const side of [-1, 1]) {
    const geo = planarUV(new THREE.ExtrudeGeometry(shape, {
      depth: 0.022, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2,
    }), 1.6)
    const c = new THREE.Mesh(geo, PLACEHOLDER)
    c.scale.x = side
    c.position.set(side * 0.11, 1.2, 0.24)
    c.rotation.set(-0.55, side * -0.45, side * 0.1)
    group.add(c)
  }
  const bandGeo = new THREE.TorusGeometry(0.34, 0.05, 18, 44, Math.PI * 1.65)
  bandGeo.rotateX(Math.PI / 2)
  bandGeo.rotateZ(-Math.PI * 0.72)
  bandGeo.scale(0.92, 0.9, 0.9)
  const band = new THREE.Mesh(bandGeo, PLACEHOLDER)
  band.position.set(0, 1.2, -0.02)
  group.add(band)

  /* Sleeves with elbow ease and buttoned cuffs */
  const SH = 1.7
  const SP = [[0, 0.155], [0.1, 0.16], [0.5, 0.205], [1, 0.245]]
  const makeSleeve = (offsetX, rotZ, side) => {
    const geo = new THREE.CylinderGeometry(1, 1, SH, 40, 64, true)
    const p = geo.attributes.position, u = geo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const ang = Math.atan2(z, x)
      const hn = (y + SH / 2) / SH
      const back = Math.max(0, -Math.sin(ang))
      let r = profile(SP, hn)
      r += back * gauss(hn - 0.42, 0.09) * Math.sin((hn - 0.42) * 80) * 0.016
      r += Math.sin(ang * 5 + hn * 3) * 0.008 * (1 - hn * 0.4)   // soft shirting folds
      r += gauss(hn - 0.06, 0.05) * -0.02                        // gathered into the cuff
      p.setX(i, Math.cos(ang) * r)
      p.setZ(i, Math.sin(ang) * r)
      if (u) u.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 2, hn * 2.5)
    }
    geo.computeVertexNormals()
    const arm = new THREE.Group()
    arm.add(new THREE.Mesh(geo, PLACEHOLDER))

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.152, 0.12, 32, 3, true), PLACEHOLDER)
    cuff.position.y = -SH / 2 + 0.05
    arm.add(cuff)
    const bt = button(0.011, 0.005)
    bt.position.set(side * 0.145, -SH / 2 + 0.05, 0.03)
    bt.rotation.y = side * Math.PI / 2
    arm.add(bt)

    arm.position.set(offsetX, 0.28, 0)
    arm.rotation.z = rotZ
    return arm
  }
  group.add(makeSleeve(-1.02, -0.48, -1))
  group.add(makeSleeve(1.02, 0.48, 1))

  /* Front placket + buttons */
  const plk = new THREE.Mesh(new THREE.BoxGeometry(0.055, 1.9, 0.014), PLACEHOLDER)
  plk.position.set(0, 0.05, 0.668)
  group.add(plk)
  for (let b = 0; b < 6; b++) {
    const bt = button(0.012, 0.005)
    bt.position.set(0, 0.8 - b * 0.32, 0.678)
    group.add(bt)
  }

  /* Chest pocket, yoke, box pleat */
  const pocket = weltPocket({ w: 0.13, h: 0.15, flap: false })
  onBody(pocket, -0.32, 0.36, 0.715, 0.92)
  group.add(pocket)

  const yoke = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.26, 8, 4), PLACEHOLDER)
  yoke.position.set(0, 0.86, -0.05)
  yoke.rotation.set(-0.15, Math.PI, 0)
  group.add(yoke)

  const pleat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.014), PLACEHOLDER)
  pleat.position.set(0, 0.2, -0.68)
  group.add(pleat)

  group.position.y = 0.05
  return { mesh: group }
}

export const BUILDERS = {
  kilt: buildKilt, scarf: buildScarf, jacket: buildJacket,
  throw: buildThrow, shirt: buildShirt, pants: buildPants,
}

export function disposeSharedGarmentGeometry() {
  if (_threadGeo) { _threadGeo.dispose(); _threadGeo = null }
}
