import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildFabricTexture } from './DrapeView.jsx'
import { toast } from '../utils/toast.js'

const WEAVE_MATERIAL = {
  satin5:   { sheen: 1.0,  sheenRoughness: 0.22, roughness: 0.35, metalness: 0.04 },
  twill22:  { sheen: 0.55, sheenRoughness: 0.45, roughness: 0.72, metalness: 0.02 },
  twill21:  { sheen: 0.45, sheenRoughness: 0.5,  roughness: 0.78, metalness: 0.02 },
  twill31:  { sheen: 0.45, sheenRoughness: 0.5,  roughness: 0.78, metalness: 0.02 },
  plain:    { sheen: 0.3,  sheenRoughness: 0.6,  roughness: 0.82, metalness: 0.02 },
  basket2:  { sheen: 0.15, sheenRoughness: 0.7,  roughness: 0.92, metalness: 0.0 },
  hopsack:  { sheen: 0.15, sheenRoughness: 0.7,  roughness: 0.92, metalness: 0.0 },
}
const DEFAULT_MATERIAL_PARAMS = { sheen: 0.4, sheenRoughness: 0.55, roughness: 0.82, metalness: 0.02 }

function buildKilt() {
  const group = new THREE.Group()
  const seg = 160
  const R1 = 0.82
  const R2 = 1.1
  const H = 2.4
  const pleatGeo = new THREE.CylinderGeometry(R1, R2, H, seg, 64, true)
  const pos = pleatGeo.attributes.position
  const uvs = pleatGeo.attributes.uv
  const pleatCount = 28
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const isFrontApron = (ang > -Math.PI/4 && ang < Math.PI/4)
    let pleat = 0
    if (!isFrontApron) {
      // Sharp knife pleats
      const pleatPhase = ang * pleatCount
      pleat = Math.sin(pleatPhase) * 0.05
      // Pleat depth varies with height
      const heightFactor = (y + H/2) / H
      pleat *= 0.7 + heightFactor * 0.3
    }
    const len = Math.sqrt(x * x + z * z)
    const nl = len + pleat
    pos.setX(i, Math.cos(ang) * nl)
    pos.setZ(i, Math.sin(ang) * nl)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * pleatCount, (y + H/2) / H * 4)
  }
  pleatGeo.computeVertexNormals()
  const pleats = new THREE.Mesh(pleatGeo)
  pleats.rotation.y = Math.PI
  group.add(pleats)

  // Front apron - flat unpleated panel
  const apronGeo = new THREE.CylinderGeometry(R1 + 0.03, R2 + 0.03, H, 48, 32, true, -Math.PI/3.5, Math.PI/1.8)
  const apron = new THREE.Mesh(apronGeo)
  apron.rotation.y = -Math.PI / 4
  group.add(apron)

  // Waistband
  const waistGeo = new THREE.CylinderGeometry(R1 - 0.01, R2 - 0.01, 0.08, 64, 8, true)
  const waist = new THREE.Mesh(waistGeo)
  waist.position.y = H/2 - 0.04
  group.add(waist)

  // Leather straps & buckles (2)
  for (let side = -1; side <= 1; side += 2) {
    const strapGeo = new THREE.BoxGeometry(0.06, 0.015, 0.25)
    const strap = new THREE.Mesh(strapGeo)
    strap.position.set(side * 0.35, 0.95, -0.25)
    strap.rotation.z = side * -0.3
    group.add(strap)
    const buckleGeo = new THREE.TorusGeometry(0.035, 0.01, 8, 16, Math.PI * 1.5)
    const buckle = new THREE.Mesh(buckleGeo)
    buckle.position.set(side * 0.35, 0.95, -0.38)
    buckle.rotation.x = Math.PI / 2
    group.add(buckle)
  }

  group.position.y = 0.1
  return { mesh: group }
}

function buildScarf() {
  const group = new THREE.Group()

  // Main Neck Loop - Smooth curved torus with realistic volume
  const neckGeo = new THREE.TorusGeometry(0.55, 0.16, 32, 96)
  neckGeo.rotateX(Math.PI / 2.1)
  neckGeo.scale(1.15, 0.65, 1.25)
  const neck = new THREE.Mesh(neckGeo)
  neck.position.set(0, 1.55, 0)
  group.add(neck)

  // Left Tail - Draped with natural gravity folds
  const tailGeo1 = new THREE.PlaneGeometry(0.48, 2.6, 48, 80)
  const p1 = tailGeo1.attributes.position
  const u1 = tailGeo1.attributes.uv
  for (let i = 0; i < p1.count; i++) {
    const x = p1.getX(i), y = p1.getY(i)
    // Gravity drape with cascading folds
    const fold1 = Math.sin((y + 1.3) * 3.5) * 0.07 * (1 - Math.abs(x) / 0.24)
    const fold2 = Math.sin((y + 1.3) * 7.2 + x * 4) * 0.03
    const twist = Math.sin(y * 2) * x * 0.02
    p1.setZ(i, fold1 + fold2 + twist)
    if (u1) u1.setXY(i, u1.getX(i) * 3, u1.getY(i) * 5)
  }
  tailGeo1.computeVertexNormals()
  const tail1 = new THREE.Mesh(tailGeo1)
  tail1.position.set(-0.32, 0.35, 0.6)
  tail1.rotation.y = 0.12
  tail1.rotation.x = -0.08
  group.add(tail1)

  // Right Tail - asymmetric drape
  const tailGeo2 = new THREE.PlaneGeometry(0.45, 2.8, 48, 80)
  const p2 = tailGeo2.attributes.position
  const u2 = tailGeo2.attributes.uv
  for (let i = 0; i < p2.count; i++) {
    const x = p2.getX(i), y = p2.getY(i)
    const fold1 = Math.cos((y + 1.4) * 3.2) * 0.08 * (1 - Math.abs(x) / 0.225)
    const fold2 = Math.cos((y + 1.4) * 6.8 - x * 3.5) * 0.025
    const twist = Math.cos(y * 1.8) * x * -0.015
    p2.setZ(i, fold1 + fold2 + twist)
    if (u2) u2.setXY(i, u2.getX(i) * 3, u2.getY(i) * 5.5)
  }
  tailGeo2.computeVertexNormals()
  const tail2 = new THREE.Mesh(tailGeo2)
  tail2.position.set(0.28, 0.2, 0.55)
  tail2.rotation.y = -0.18
  tail2.rotation.x = 0.05
  group.add(tail2)

  // Fringe at ends
  const addFringe = (mesh, baseY) => {
    for (let f = 0; f < 12; f++) {
      const fx = (f - 5.5) * 0.035
      const fringeGeo = new THREE.CylinderGeometry(0.003, 0.001, 0.12, 4)
      const fringe = new THREE.Mesh(fringeGeo)
      fringe.position.set(mesh.position.x + fx, baseY - 1.3, mesh.position.z + 0.05)
      fringe.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2
      group.add(fringe)
    }
  }
  addFringe(tail1, 0.35)
  addFringe(tail2, 0.2)

  group.position.y = -0.45
  return { mesh: group }
}

function buildJacket() {
  const group = new THREE.Group()

  // Tailored Torso - anatomically proportioned
  const bodyGeo = new THREE.CylinderGeometry(0.46, 0.5, 1.75, 64, 48, true)
  const pos = bodyGeo.attributes.position
  const uvs = bodyGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const heightNorm = (y + 0.875) / 1.75
    
    // Lapel opening in front - V-shaped
    let lapel = 0
    const lapelAngle = Math.PI * 0.55
    if (ang > lapelAngle - 0.15 * heightNorm && ang < lapelAngle + 0.15 * heightNorm && y > -0.2) {
      lapel = Math.max(0, (y + 0.2) / 1.075) * 0.16 * (1 - heightNorm * 0.5)
    }
    // Symmetric lapel on other side
    if (ang < -lapelAngle + 0.15 * heightNorm && ang > -lapelAngle - 0.15 * heightNorm && y > -0.2) {
      lapel = Math.max(0, (y + 0.2) / 1.075) * 0.16 * (1 - heightNorm * 0.5)
    }
    
    // Waist suppression
    const waistNip = Math.max(0, 1 - Math.abs((y + 0.1) / 0.6)) * 0.03
    
    // Chest fullness
    const chest = y > 0.2 && y < 0.7 ? Math.sin(ang) * 0.015 : 0
    
    // Micro wrinkles on fabric
    const microCloth = Math.sin(y * 10 + x * 6) * 0.004
    
    pos.setX(i, x * (1 - waistNip) + chest - lapel * Math.cos(ang) + microCloth)
    pos.setZ(i, (z * 0.82) * (1 - waistNip) - lapel * Math.sin(ang) + microCloth)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, heightNorm * 3.5)
  }
  bodyGeo.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeo)
  group.add(body)

  // Tailored Sleeves with armhole shaping
  const makeSleeve = (offsetX, rotationZ) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.12, 1.55, 48, 32, true)
    const p = sleeveGeo.attributes.position
    const u = sleeveGeo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), z = p.getZ(i)
      const heightNorm = (y + 0.775) / 1.55
      // Armhole curve at top
      const armhole = (heightNorm > 0.85) ? (1 - (heightNorm - 0.85) / 0.15) * 0.04 : 0
      // Elbow bend
      const elbowBend = (y < -0.1 && y > -0.6) ? Math.sin((y + 0.6) * Math.PI / 0.5) * 0.05 : 0
      // Wrist taper
      const wrist = heightNorm < 0.1 ? (1 - heightNorm / 0.1) * 0.02 : 0
      p.setY(i, y - armhole)
      p.setZ(i, z + elbowBend - wrist)
      if (u) u.setXY(i, u.getX(i) * 2, heightNorm * 2.8)
    }
    sleeveGeo.computeVertexNormals()
    const sleeve = new THREE.Mesh(sleeveGeo)
    sleeve.position.set(offsetX, 0.25, 0.08)
    sleeve.rotation.z = rotationZ
    sleeve.rotation.x = 0.08
    return sleeve
  }

  group.add(makeSleeve(-0.56, Math.PI / 8))
  group.add(makeSleeve(0.56, -Math.PI / 8))

  // Collar & Lapel structure
  const collarGeo = new THREE.TorusGeometry(0.24, 0.055, 24, 48, Math.PI * 1.4)
  collarGeo.rotateX(Math.PI / 2.1)
  collarGeo.rotateZ(-Math.PI * 0.6)
  const collar = new THREE.Mesh(collarGeo)
  collar.position.set(0, 0.9, -0.03)
  group.add(collar)

  // Back vent
  const ventGeo = new THREE.BoxGeometry(0.02, 0.35, 0.02)
  const vent = new THREE.Mesh(ventGeo)
  vent.position.set(0, -0.45, -0.5)
  group.add(vent)

  // Front buttons (3)
  for (let b = 0; b < 3; b++) {
    const btnGeo = new THREE.SphereGeometry(0.012, 8, 8)
    const btn = new THREE.Mesh(btnGeo)
    btn.position.set(-0.08, 0.5 - b * 0.35, 0.48)
    group.add(btn)
  }

  // Chest pocket
  const pocketGeo = new THREE.PlaneGeometry(0.09, 0.11, 2, 2)
  const pocket = new THREE.Mesh(pocketGeo)
  pocket.position.set(-0.28, 0.4, 0.46)
  group.add(pocket)

  // Flap pockets (2)
  for (let side = -1; side <= 1; side += 2) {
    const flapGeo = new THREE.PlaneGeometry(0.12, 0.14, 2, 2)
    const flap = new THREE.Mesh(flapGeo)
    flap.position.set(side * 0.3, -0.35, 0.45)
    flap.rotation.x = -0.1
    group.add(flap)
  }

  group.position.y = 0.55
  return { mesh: group }
}

function buildThrow() {
  const group = new THREE.Group()

  // Main blanket - rectangular with draped folds
  const SEG = 120
  const geo = new THREE.PlaneGeometry(4.8, 4.8, SEG, SEG)
  const pos = geo.attributes.position
  const uvs = geo.attributes.uv
  
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    let z = 0
    
    // Draped over body form - folded at top, cascading down
    const normY = (y + 2.4) / 4.8
    const normX = (x + 2.4) / 4.8
    
    if (normY > 0.65) {
      // Top folded section
      z = Math.cos((normY - 0.65) * 2.5) * -0.5 * (1 - normX * 0.3)
    } else if (normY > 0.25) {
      // Transition - hanging folds
      const fold1 = Math.cos(normY * 8) * 0.15 * (1 - normY * 0.5)
      const fold2 = Math.sin(normX * 10) * 0.08
      z = (0.65 - normY) * 0.8 + fold1 + fold2
    } else if (normY > -0.1) {
      // Cascading drape with gravity
      const gravity = (0.25 - normY) * 1.2
      const cascade = Math.sin(normY * 12 + x * 3) * 0.12 * (1 - normY * 2)
      const edgeRuffle = Math.sin(normX * 16) * 0.06
      z = gravity + cascade + edgeRuffle
    } else {
      // Bottom pooled on ground
      const pool = Math.max(0, -normY - 0.1) * 0.5
      const wrinkle = Math.sin(normY * 8 + x * 5) * 0.04
      z = pool + wrinkle
    }
    
    // Subtle fabric texture
    const microWeave = Math.sin(x * 15 + y * 12) * 0.008
    pos.setZ(i, z + microWeave)
    if (uvs) uvs.setXY(i, uvs.getX(i) * 5, uvs.getY(i) * 5)
  }
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo)
  mesh.rotation.x = -Math.PI / 3.5
  mesh.position.set(0, 0.15, -0.7)
  group.add(mesh)

  // Fringe on all 4 edges
  const addFringe = (startX, startZ, dirX, dirZ, count) => {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const fx = startX + dirX * 4.8 * t
      const fz = startZ + dirZ * 4.8 * t
      for (let f = 0; f < 3; f++) {
        const fringeGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.15, 4)
        const fringe = new THREE.Mesh(fringeGeo)
        const offset = (f - 1) * 0.015
        fringe.position.set(
          fx + dirZ * offset, 
          -0.85 + Math.random() * 0.1, 
          fz + dirX * offset
        )
        fringe.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3
        group.add(fringe)
      }
    }
  }
  // Front edge
  addFringe(-2.4, -2.4, 1, 0, 20)
  // Back edge
  addFringe(-2.4, 2.4, 1, 0, 20)
  // Left edge
  addFringe(-2.4, -2.4, 0, 1, 20)
  // Right edge
  addFringe(2.4, -2.4, 0, 1, 20)

  return { mesh: group }
}

function buildShirt() {
  const group = new THREE.Group()

  // Shirt Body - relaxed fit with subtle shaping
  const bodyGeo = new THREE.CylinderGeometry(0.72, 0.68, 2.2, 64, 48, true)
  const pos = bodyGeo.attributes.position
  const uvs = bodyGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const heightNorm = (y + 1.1) / 2.2
    
    // Front placket
    let placket = 0
    if (ang > Math.PI * 0.45 && ang < Math.PI * 0.55) {
      placket = 0.02
    }
    
    // Side seams taper slightly
    const sideTaper = Math.abs(Math.sin(ang)) * 0.015 * heightNorm
    
    // Micro fabric wrinkles
    const microCloth = Math.sin(y * 8 + x * 4) * 0.003
    
    pos.setX(i, x + placket * Math.cos(ang) - sideTaper * Math.cos(ang) + microCloth)
    pos.setZ(i, z + placket * Math.sin(ang) - sideTaper * Math.sin(ang) + microCloth)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, heightNorm * 3)
  }
  bodyGeo.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeo)
  group.add(body)

  // Collar - classic shirt collar with points
  const collarGeo = new THREE.Shape()
  collarGeo.moveTo(0, 0)
  collarGeo.lineTo(0.18, 0)
  collarGeo.lineTo(0.22, 0.08)
  collarGeo.lineTo(0.18, 0.16)
  collarGeo.lineTo(0, 0.16)
  const collarExtrude = new THREE.ExtrudeGeometry(collarGeo, { depth: 0.03, bevelEnabled: false })
  const collar = new THREE.Mesh(collarExtrude)
  collar.position.set(-0.18, 1.18, 0)
  collar.rotation.y = -Math.PI / 2
  group.add(collar)
  // Mirror for other side
  const collar2 = collar.clone()
  collar2.rotation.y = Math.PI / 2
  collar2.position.set(0.18, 1.18, 0)
  group.add(collar2)

  // Collar band
  const bandGeo = new THREE.TorusGeometry(0.34, 0.045, 16, 32, Math.PI * 1.6)
  bandGeo.rotateX(Math.PI / 2)
  bandGeo.rotateZ(-Math.PI * 0.7)
  const band = new THREE.Mesh(bandGeo)
  band.position.set(0, 1.12, 0)
  group.add(band)

  // Sleeves - relaxed with cuffs
  const makeSleeve = (offsetX, rotationZ) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.24, 0.16, 1.7, 32, 32, true)
    const p = sleeveGeo.attributes.position
    const u = sleeveGeo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), z = p.getZ(i)
      const heightNorm = (y + 0.85) / 1.7
      // Elbow ease
      const elbow = (y < -0.1 && y > -0.65) ? Math.sin((y + 0.65) * Math.PI / 0.55) * 0.03 : 0
      // Cuff taper
      const cuff = heightNorm < 0.08 ? (1 - heightNorm / 0.08) * 0.02 : 0
      p.setZ(i, z + elbow - cuff)
      if (u) u.setXY(i, u.getX(i) * 2, heightNorm * 2.5)
    }
    sleeveGeo.computeVertexNormals()
    const sleeve = new THREE.Mesh(sleeveGeo)
    sleeve.position.set(offsetX, 0.15, 0)
    sleeve.rotation.z = rotationZ
    return sleeve
  }

  group.add(makeSleeve(-0.9, Math.PI / 3.5))
  group.add(makeSleeve(0.9, -Math.PI / 3.5))

  // Button placket (6 buttons)
  for (let b = 0; b < 6; b++) {
    const btnGeo = new THREE.SphereGeometry(0.01, 8, 8)
    const btn = new THREE.Mesh(btnGeo)
    btn.position.set(-0.06, 0.8 - b * 0.32, 0.68)
    group.add(btn)
  }

  // Chest pocket
  const pocketGeo = new THREE.PlaneGeometry(0.1, 0.12, 2, 2)
  const pocket = new THREE.Mesh(pocketGeo)
  pocket.position.set(-0.35, 0.35, 0.66)
  pocket.rotation.y = -0.1
  group.add(pocket)

  // Back yoke
  const yokeGeo = new THREE.PlaneGeometry(1.1, 0.25, 4, 2)
  const yoke = new THREE.Mesh(yokeGeo)
  yoke.position.set(0, 0.85, 0)
  yoke.rotation.y = Math.PI
  yoke.rotation.x = -0.15
  group.add(yoke)

  // Back pleat (box pleat)
  const pleatGeo = new THREE.BoxGeometry(0.04, 0.6, 0.01)
  const pleat = new THREE.Mesh(pleatGeo)
  pleat.position.set(0, 0.2, -0.65)
  group.add(pleat)

  group.position.y = 0.05
  return { mesh: group }
}

function buildPants() {
  const group = new THREE.Group()

  // ── Waistband – elliptical cross-section like real trousers ──
  const wbGeo = new THREE.CylinderGeometry(0.44, 0.46, 0.10, 64, 8, true)
  const wp = wbGeo.attributes.position
  for (let i = 0; i < wp.count; i++) {
    // Flatten front-to-back to get oval waist
    wp.setZ(i, wp.getZ(i) * 0.76)
  }
  wbGeo.computeVertexNormals()
  const waistband = new THREE.Mesh(wbGeo)
  waistband.position.y = 1.01
  group.add(waistband)

  // Belt loops (6 evenly spaced)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const loopGeo = new THREE.BoxGeometry(0.018, 0.09, 0.012)
    const loop = new THREE.Mesh(loopGeo)
    loop.position.set(
      Math.cos(angle) * 0.45,
      1.01,
      Math.sin(angle) * 0.34
    )
    loop.rotation.y = -angle
    group.add(loop)
  }

  // Fly / Zipper placket
  const flyGeo = new THREE.BoxGeometry(0.038, 0.30, 0.01)
  const fly = new THREE.Mesh(flyGeo)
  fly.position.set(0.02, 0.84, 0.455)
  group.add(fly)
  // Zipper pull
  const pullGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.025, 8)
  const pull = new THREE.Mesh(pullGeo)
  pull.position.set(0.02, 0.86, 0.46)
  pull.rotation.z = Math.PI / 2
  group.add(pull)

  // ── Hip/Seat – anatomically shaped ──
  const hipGeo = new THREE.CylinderGeometry(0.44, 0.50, 0.55, 64, 24, true)
  const hp = hipGeo.attributes.position
  const hu = hipGeo.attributes.uv
  for (let i = 0; i < hp.count; i++) {
    const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i)
    const ang = Math.atan2(z, x)
    const hn = (y + 0.275) / 0.55
    // Oval: flatten front-back
    const scaleZ = 0.76
    // Seat fullness at rear
    const isBack = (ang < -Math.PI * 0.3 || ang > Math.PI * 0.3)
    const seat = isBack ? (1 - hn) * 0.04 * Math.max(0, (1 - Math.abs(ang) / Math.PI)) : 0
    // Crotch curve (front)
    const crotch = (ang > Math.PI * 0.35 && ang < Math.PI * 0.65 && hn < 0.3) ? (0.3 - hn) * 0.06 : 0
    // Hip flare (sides)
    const flare = Math.abs(Math.sin(ang)) * 0.025 * (1 - hn)
    hp.setZ(i, z * scaleZ + seat)
    hp.setX(i, x + flare * Math.cos(ang) + crotch * Math.cos(ang))
    if (hu) hu.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, hn * 2)
  }
  hipGeo.computeVertexNormals()
  const hips = new THREE.Mesh(hipGeo)
  hips.position.y = 0.61
  group.add(hips)

  // Back pockets with stitching detail
  for (let side of [-1, 1]) {
    const pGeo = new THREE.PlaneGeometry(0.13, 0.11)
    const pocket = new THREE.Mesh(pGeo)
    pocket.position.set(side * 0.22, 0.62, -0.40)
    pocket.rotation.y = Math.PI + side * 0.18
    pocket.rotation.x = -0.1
    group.add(pocket)
    // Pocket stitch border
    const stitch = new THREE.EdgesGeometry(pGeo)
    const stitchLine = new THREE.LineSegments(stitch)
    stitchLine.position.copy(pocket.position)
    stitchLine.rotation.copy(pocket.rotation)
    group.add(stitchLine)
  }

  // Front slash pockets
  for (let side of [-1, 1]) {
    const fpGeo = new THREE.PlaneGeometry(0.04, 0.15)
    const fp = new THREE.Mesh(fpGeo)
    fp.position.set(side * 0.38, 0.76, 0.31)
    fp.rotation.y = side * -0.4
    fp.rotation.x = 0.2
    group.add(fp)
  }

  // ── Left & Right Legs with realistic cloth anatomy ──
  const makeLeg = (offsetX, tiltZ, isLeft) => {
    const lg = new THREE.Group()

    // Upper thigh – slightly oval with inner-thigh curvature
    const thighGeo = new THREE.CylinderGeometry(0.195, 0.145, 0.72, 48, 28, true)
    const tp = thighGeo.attributes.position
    const tu = thighGeo.attributes.uv
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i)
      const ang = Math.atan2(z, x)
      const hn = (y + 0.36) / 0.72
      // Inner thigh volume
      const inner = (isLeft ? -1 : 1) * Math.cos(ang) * 0.012 * (1 - hn)
      // Front/back shaping (inseam)
      const inseam = Math.sin(ang) * 0.01 * hn
      // Slight front crease
      const crease = (Math.abs(ang - Math.PI * 0.5) < 0.12) ? 0.006 : 0
      // Cloth micro-wrinkles
      const micro = Math.sin(y * 10 + x * 7) * 0.003
      tp.setX(i, x + inner + micro)
      tp.setZ(i, z * 0.80 + inseam + crease + micro)
      if (tu) tu.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 2, hn * 3)
    }
    thighGeo.computeVertexNormals()
    const thigh = new THREE.Mesh(thighGeo)
    thigh.position.set(offsetX, 0.14, 0)
    lg.add(thigh)

    // Knee area – subtle forward bulge
    const kneeGeo = new THREE.SphereGeometry(0.15, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52)
    const kp = kneeGeo.attributes.position
    for (let i = 0; i < kp.count; i++) {
      kp.setX(i, kp.getX(i) * 0.88)  // slightly narrow
      kp.setZ(i, kp.getZ(i) * 1.0)
    }
    kneeGeo.computeVertexNormals()
    const knee = new THREE.Mesh(kneeGeo)
    knee.position.set(offsetX, -0.22, isLeft ? 0.015 : -0.015)
    knee.scale.set(1, 0.72, 1.06)
    lg.add(knee)

    // Calf – organic taper to ankle
    const calfGeo = new THREE.CylinderGeometry(0.145, 0.088, 0.80, 48, 28, true)
    const cp = calfGeo.attributes.position
    const cu = calfGeo.attributes.uv
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i)
      const ang = Math.atan2(z, x)
      const hn = (y + 0.40) / 0.80
      // Calf muscle (rear)
      const calf = Math.sin(ang + Math.PI) * Math.max(0, (0.55 - y) / 0.55) * 0.022 * (1 - hn * 0.5)
      // Shinbone (front flatter)
      const shin = Math.sin(ang) * Math.max(0, hn) * -0.008
      // Cloth wrinkle stack at ankle
      const wrinkle = Math.sin(y * 14 + x * 8) * (hn < 0.2 ? 0.005 : 0.002)
      cp.setX(i, x + calf * Math.cos(ang) + shin + wrinkle)
      cp.setZ(i, (z * 0.82) + calf * Math.sin(ang) + wrinkle)
      if (cu) cu.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 2, hn * 3)
    }
    calfGeo.computeVertexNormals()
    const calf = new THREE.Mesh(calfGeo)
    calf.position.set(offsetX, -0.61, 0)
    lg.add(calf)

    // Ankle cuff – slight flare
    const cuffGeo = new THREE.CylinderGeometry(0.092, 0.098, 0.042, 32, 4, true)
    const cuff = new THREE.Mesh(cuffGeo)
    cuff.position.set(offsetX, -1.005, 0)
    lg.add(cuff)

    // Cuff fold (turned-up hem on some trousers)
    const foldGeo = new THREE.TorusGeometry(0.092, 0.01, 8, 32)
    foldGeo.rotateX(Math.PI / 2)
    const fold = new THREE.Mesh(foldGeo)
    fold.position.set(offsetX, -0.985, 0)
    lg.add(fold)

    lg.rotation.z = tiltZ
    return lg
  }

  group.add(makeLeg(-0.22, -0.018, true))   // Left
  group.add(makeLeg(0.22,  0.018, false))   // Right
  group.position.y = 0.48
  return { mesh: group }
}

const BUILDERS = { kilt: buildKilt, scarf: buildScarf, jacket: buildJacket, throw: buildThrow, shirt: buildShirt, pants: buildPants }

function frameCameraToObject(camera, controls, object, fitOffset = 1.35) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxSize = Math.max(size.x, size.y, size.z) || 1
  const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)
  const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(-1)
  controls.target.copy(center)
  camera.position.copy(center).sub(direction.multiplyScalar(distance))
  camera.near = distance / 100
  camera.far = distance * 100
  camera.updateProjectionMatrix()
  controls.maxDistance = distance * 4
  controls.minDistance = distance * 0.3
  controls.update()
}

export default function TryOnView({ state, garment = 'kilt', onGarmentChange }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})
  const [error, setError] = useState(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [modelLoading, setModelLoading] = useState(true)

  const applyMat = (obj, mat) => {
    obj.traverse(c => {
      if (c.isMesh) { c.material = mat; c.castShadow = true; c.receiveShadow = true }
    })
  }

  const disposeMesh = (mesh) => {
    if (!mesh) return
    mesh.traverse(c => {
      if (c.isMesh) {
        if (c.geometry) c.geometry.dispose()
        if (c.material && c.material !== sceneRef.current.mat) {
          const mats = Array.isArray(c.material) ? c.material : [c.material]
          mats.forEach(m => {
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(slot => {
              if (m[slot]) m[slot].dispose()
            })
            m.dispose()
          })
        }
      }
    })
  }

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth || 600
    const H = el.clientHeight || 480
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch (e) {
      setError('WebGL not available')
      return
    }
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1815)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
    camera.position.set(0, 0.6, 3.2)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.0
    controls.maxDistance = 8
    controls.target.set(0, 0.1, 0)
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.45))
    const key = new THREE.DirectionalLight(0xfff5e0, 1.3)
    key.position.set(3, 5, 4)
    key.castShadow = true
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xe0f0ff, 0.45)
    fill.position.set(-4, 1, 2)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.6)
    rim.position.set(0, 2, -4)
    scene.add(rim)

    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 })
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), shadowMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.position.y = -1.4
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    const texCanvas = buildFabricTexture(state)
    const texture = new THREE.CanvasTexture(texCanvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    texture.colorSpace = THREE.SRGBColorSpace

    const weaveParams = WEAVE_MATERIAL[state.weave] || DEFAULT_MATERIAL_PARAMS
    const useSheen = renderer.capabilities.isWebGL2
    const mat = useSheen
      ? new THREE.MeshPhysicalMaterial({
          map: texture, roughness: weaveParams.roughness, metalness: weaveParams.metalness,
          sheen: weaveParams.sheen, sheenRoughness: weaveParams.sheenRoughness, side: THREE.DoubleSide,
          envMapIntensity: 0.6,
        })
      : new THREE.MeshStandardMaterial({
          map: texture, roughness: weaveParams.roughness, metalness: weaveParams.metalness, side: THREE.DoubleSide,
          envMapIntensity: 0.6,
        })

    let frame
    let t = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      t += 0.01
      const mesh = sceneRef.current.mesh
      if (mesh) {
        if (mesh.userData?.drape) {
          const pos = mesh.geometry.attributes.position
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i)
            const z = Math.sin(x * 1.4 + t * 0.4) * 0.09 + Math.cos(y * 1.1 - t * 0.3) * 0.06
            pos.setZ(i, z)
          }
          pos.needsUpdate = true
          mesh.geometry.computeVertexNormals()
        } else {
          mesh.rotation.y = Math.sin(t * 0.4) * 0.15
        }
      }
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (sceneRef.current.mesh) { frameCameraToObject(camera, controls, sceneRef.current.mesh) }
    }
    window.addEventListener('resize', onResize)

    sceneRef.current = { renderer, scene, camera, controls, mesh: null, mat, texture, frame, garmentKey: null, envTex, pmrem }
    setCanvasReady(true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      const s = sceneRef.current
      if (s.mat) s.mat.dispose()
      if (s.texture) s.texture.dispose()
      if (s.envTex) s.envTex.dispose()
      if (s.pmrem) s.pmrem.dispose()
      if (s.mesh) disposeMesh(s.mesh)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const s = sceneRef.current
    if (!s.scene) return
    let active = true

    const loadGarment = async () => {
      setModelLoading(true)
      const loader = new GLTFLoader()
      try {
        if (garment !== 'shirt') {
          throw new Error('Procedural model')
        }
        const gltf = await loader.loadAsync(`/models/${garment}.glb`)
        if (!active) return
        if (s.mesh) { disposeMesh(s.mesh); s.scene.remove(s.mesh) }
        const mesh = gltf.scene
        mesh.position.set(0, -0.5, 0)
        const box = new THREE.Box3().setFromObject(mesh)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())
        mesh.position.x += (mesh.position.x - center.x)
        mesh.position.y += (mesh.position.y - center.y) + 0.5
        mesh.position.z += (mesh.position.z - center.z)
        const scale = 2.5 / size
        mesh.scale.setScalar(scale)
        applyMat(mesh, s.mat)
        s.scene.add(mesh)
        s.mesh = mesh
        frameCameraToObject(s.camera, s.controls, mesh)
      } catch (err) {
        console.warn('Failed to load GLTF, falling back to procedural:', err)
        if (!active) return
        toast(`Using stylized preview for ${garment} — 3D model unavailable`, 'info')
        if (s.mesh) { disposeMesh(s.mesh); s.scene.remove(s.mesh) }
        const built = BUILDERS[garment] || BUILDERS.kilt
        const { mesh } = built()
        applyMat(mesh, s.mat)
        s.scene.add(mesh)
        s.mesh = mesh
        frameCameraToObject(s.camera, s.controls, mesh)
      }
      s.garmentKey = garment
      setModelLoading(false)
    }

    loadGarment()
    return () => { active = false }
  }, [garment])

  useEffect(() => {
    const s = sceneRef.current
    if (!s.mat || !s.texture) return
    const timer = setTimeout(() => {
      const texCanvas = buildFabricTexture(state)
      if (!texCanvas) return
      s.texture.image = texCanvas
      s.texture.needsUpdate = true
      const weaveParams = WEAVE_MATERIAL[state.weave] || DEFAULT_MATERIAL_PARAMS
      s.mat.roughness = weaveParams.roughness
      s.mat.metalness = weaveParams.metalness
      if ('sheen' in s.mat) {
        s.mat.sheen = weaveParams.sheen
        s.mat.sheenRoughness = weaveParams.sheenRoughness
      }
      s.mat.needsUpdate = true
    }, 100)
    return () => clearTimeout(timer)
  }, [state.sett, state.weave, state.ts, state.reps])

  const exportTryOnPNG = () => {
    const s = sceneRef.current
    if (!s.renderer) return
    s.renderer.render(s.scene, s.camera)
    const url = s.renderer.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.download = `dobby-tryon-${garment}-${Date.now()}.png`
    a.href = url; a.click()
  }

  const exportFlatLay = () => {
    const s = sceneRef.current
    if (!s.renderer || !s.scene || !s.camera || !s.mesh) return
    const prevCam = s.camera
    const ortho = new THREE.OrthographicCamera(-2.2, 2.2, 2.2, -2.2, 0.1, 100)
    ortho.position.set(0, 5, 0.01)
    ortho.lookAt(0, 0, 0)
    const prevRot = s.mesh.rotation.clone()
    s.mesh.rotation.set(0, 0, 0)
    const w = s.renderer.domElement.width, h = s.renderer.domElement.height
    s.renderer.setSize(800, 800, false)
    s.renderer.render(s.scene, ortho)
    const url = s.renderer.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.download = `dobby-flatlay-${garment}-${Date.now()}.png`
    a.href = url; a.click()
    s.mesh.rotation.copy(prevRot)
    s.renderer.setSize(w, h, false)
    s.renderer.render(s.scene, prevCam)
  }

  if (error) { return <div className="tryon-error">⚠️ {error}</div> }

  return (
    <div className="tryon-wrap">
      <div className="tryon-toolbar">
        {[{ id: 'shirt', icon: '👔', label: 'Shirt' },
          { id: 'pants', icon: '👖', label: 'Pants' },
          { id: 'kilt', icon: '🏴', label: 'Kilt' },
          { id: 'scarf', icon: '🧣', label: 'Scarf' },
          { id: 'jacket', icon: '🧥', label: 'Jacket' },
          { id: 'throw', icon: '🛋️', label: 'Throw' }].map(g => (
          <button
            key={g.id}
            className={`tryon-garment-btn${garment === g.id ? ' active' : ''}`}
            onClick={() => onGarmentChange?.(g.id)}
          >
            {g.icon} {g.label}
          </button>
        ))}
        <div className="tryon-toolbar-spacer" />
        <button className="tryon-export-btn" onClick={exportFlatLay} title="Overhead flat-lay PNG">⬓ Flat Lay</button>
        <button className="tryon-export-btn" onClick={exportTryOnPNG} title="Screenshot of 3D view">⬇ Export Frame</button>
      </div>

      {(!canvasReady || modelLoading) && (
        <div className="tryon-loading-overlay">
          Preparing 3D view…
        </div>
      )}

      <div ref={mountRef} className="tryon-canvas" />
      <div className="tryon-hint">Drag to orbit · scroll to zoom</div>
    </div>
  )
}
