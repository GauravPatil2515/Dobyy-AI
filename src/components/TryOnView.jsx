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
  const seg = 128
  const R1 = 0.82
  const R2 = 1.05
  const H = 2.2
  const pleatGeo = new THREE.CylinderGeometry(R1, R2, H, seg, 48, true)
  const pos = pleatGeo.attributes.position
  const uvs = pleatGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    const isFront = (ang > -Math.PI/3.5 && ang < Math.PI/3.5)
    let pleat = 0
    if (!isFront) { pleat = Math.sin(ang * 36) * 0.04 }
    const len = Math.sqrt(x * x + z * z)
    const nl = len + pleat
    pos.setX(i, Math.cos(ang) * nl)
    pos.setZ(i, Math.sin(ang) * nl)
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 4, (y + H/2) / H * 3)
  }
  pleatGeo.computeVertexNormals()
  const pleats = new THREE.Mesh(pleatGeo)
  pleats.rotation.y = Math.PI
  group.add(pleats)

  const apronGeo = new THREE.CylinderGeometry(R1 + 0.03, R2 + 0.03, H, 48, 24, true, -Math.PI/3.2, Math.PI/1.6)
  const apron = new THREE.Mesh(apronGeo)
  apron.rotation.y = -Math.PI / 4
  group.add(apron)
  group.position.y = 0.1
  return { mesh: group }
}

function buildScarf() {
  const group = new THREE.Group()

  // Main Neck Loop - Smooth curved torus
  const neckGeo = new THREE.TorusGeometry(0.55, 0.18, 48, 96)
  neckGeo.rotateX(Math.PI / 2.1)
  neckGeo.scale(1.1, 0.7, 1.2)
  const neck = new THREE.Mesh(neckGeo)
  neck.position.set(0, 1.5, 0)
  group.add(neck)

  // Left Tail - Draped flat rectangle with subtle end curl
  const tailGeo1 = new THREE.PlaneGeometry(0.5, 2.4, 32, 64)
  const p1 = tailGeo1.attributes.position
  const u1 = tailGeo1.attributes.uv
  for (let i = 0; i < p1.count; i++) {
    const y = p1.getY(i)
    const curve = Math.sin((y + 1.2) * 2.0) * 0.06
    p1.setZ(i, curve)
    if (u1) u1.setXY(i, u1.getX(i) * 2, u1.getY(i) * 4)
  }
  tailGeo1.computeVertexNormals()
  const tail1 = new THREE.Mesh(tailGeo1)
  tail1.position.set(-0.3, 0.3, 0.65)
  tail1.rotation.y = 0.15
  group.add(tail1)

  // Right Tail
  const tailGeo2 = new THREE.PlaneGeometry(0.48, 2.7, 32, 64)
  const p2 = tailGeo2.attributes.position
  const u2 = tailGeo2.attributes.uv
  for (let i = 0; i < p2.count; i++) {
    const y = p2.getY(i)
    const curve = Math.cos((y + 1.35) * 1.8) * 0.07
    p2.setZ(i, curve)
    if (u2) u2.setXY(i, u2.getX(i) * 2, u2.getY(i) * 4.5)
  }
  tailGeo2.computeVertexNormals()
  const tail2 = new THREE.Mesh(tailGeo2)
  tail2.position.set(0.3, 0.15, 0.62)
  tail2.rotation.y = -0.2
  group.add(tail2)

  group.position.y = -0.4
  return { mesh: group }
}

function buildJacket() {
  const group = new THREE.Group()

  // Tailored Torso
  const bodyGeo = new THREE.CylinderGeometry(0.85, 0.92, 2.4, 64, 48, true)
  const pos = bodyGeo.attributes.position
  const uvs = bodyGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    // Lapel opening in front
    let lapel = 0
    if (ang > Math.PI * 0.38 && ang < Math.PI * 0.62 && y > 0) {
      lapel = (y / 1.2) * 0.12
    }
    const microCloth = Math.sin(y * 6 + x * 4) * 0.008
    pos.setX(i, x * (1 + microCloth) - lapel * Math.cos(ang))
    pos.setZ(i, z * (1 + microCloth) - lapel * Math.sin(ang))
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, (y + 1.2) / 2.4 * 3)
  }
  bodyGeo.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeo)
  group.add(body)

  // Sleek Tailored Sleeves (Angled smoothly without accordion distortions!)
  const makeSleeve = (offsetX, rotationZ) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.32, 0.24, 2.1, 48, 32, true)
    const p = sleeveGeo.attributes.position
    const u = sleeveGeo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), z = p.getZ(i)
      const elbowBend = (y < 0) ? Math.sin(-y * 1.5) * 0.05 : 0
      p.setZ(i, z + elbowBend)
      if (u) u.setXY(i, u.getX(i) * 2, u.getY(i) * 3)
    }
    sleeveGeo.computeVertexNormals()
    const sleeve = new THREE.Mesh(sleeveGeo)
    sleeve.position.set(offsetX, 0.05, 0.05)
    sleeve.rotation.z = rotationZ
    sleeve.rotation.x = 0.1
    return sleeve
  }

  group.add(makeSleeve(-1.05, Math.PI / 6))
  group.add(makeSleeve(1.05, -Math.PI / 6))

  // Collar Band
  const collarGeo = new THREE.TorusGeometry(0.42, 0.08, 24, 48, Math.PI * 1.4)
  collarGeo.rotateX(Math.PI / 2.2)
  collarGeo.rotateZ(-Math.PI * 0.7)
  const collar = new THREE.Mesh(collarGeo)
  collar.position.set(0, 1.22, -0.05)
  group.add(collar)

  group.position.y = 0.1
  return { mesh: group }
}

function buildThrow() {
  const SEG = 96
  const geo = new THREE.PlaneGeometry(4.5, 4.5, SEG, SEG)
  const pos = geo.attributes.position
  const uvs = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    let z = 0
    if (y > 0.5) z = Math.cos((y - 0.5) * 1.2) * -0.8 + 0.8
    if (y <= 0.5 && y > -1.0) z = (0.5 - y) * 0.9
    if (y <= -1.0) z = 1.35
    const softFold = Math.sin(x * 3 + y * 2) * 0.06 + Math.cos(x * 6 - y * 4) * 0.02
    pos.setZ(i, z + softFold)
    if (uvs) uvs.setXY(i, uvs.getX(i) * 4, uvs.getY(i) * 4)
  }
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo)
  mesh.rotation.x = -Math.PI / 4
  mesh.position.set(0, 0, -0.8)
  return { mesh }
}

function buildShirt() {
  const group = new THREE.Group()
  const bodyGeo = new THREE.CylinderGeometry(0.78, 0.74, 2.3, 64, 48, true)
  const pos = bodyGeo.attributes.position
  const uvs = bodyGeo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    let placket = 0
    if (ang > Math.PI*0.42 && ang < Math.PI*0.58) { placket = 0.025 }
    pos.setX(i, x + placket * Math.cos(ang))
    pos.setZ(i, z + placket * Math.sin(ang))
    if (uvs) uvs.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, (y + 1.15) / 2.3 * 3)
  }
  bodyGeo.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeo)
  group.add(body)

  const collarGeo = new THREE.TorusGeometry(0.38, 0.09, 24, 48, Math.PI * 1.5)
  collarGeo.rotateX(Math.PI / 2.2)
  collarGeo.rotateZ(-Math.PI * 0.75)
  const collar = new THREE.Mesh(collarGeo)
  collar.position.set(0, 1.18, 0)
  group.add(collar)

  const sleeveGeo1 = new THREE.CylinderGeometry(0.28, 0.22, 1.8, 32, 32, true)
  const left = new THREE.Mesh(sleeveGeo1)
  left.rotation.z = Math.PI / 4
  left.position.set(-0.95, 0.2, 0)
  group.add(left)

  const sleeveGeo2 = new THREE.CylinderGeometry(0.28, 0.22, 1.8, 32, 32, true)
  const right = new THREE.Mesh(sleeveGeo2)
  right.rotation.z = -Math.PI / 4
  right.position.set(0.95, 0.2, 0)
  group.add(right)

  group.position.y = 0.1
  return { mesh: group }
}

function buildPants() {
  const group = new THREE.Group()

  // Waistband
  const waistGeo = new THREE.CylinderGeometry(0.76, 0.74, 0.35, 64, 16, true)
  const waist = new THREE.Mesh(waistGeo)
  waist.position.y = 1.15
  group.add(waist)

  // Crotch / Hip joining region
  const hipGeo = new THREE.CylinderGeometry(0.74, 0.70, 0.5, 64, 16, true)
  const hp = hipGeo.attributes.position
  const hu = hipGeo.attributes.uv
  for (let i = 0; i < hp.count; i++) {
    const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i)
    const ang = Math.atan2(z, x)
    const fly = (ang > Math.PI * 0.4 && ang < Math.PI * 0.6 && y > -0.1) ? 0.03 : 0
    hp.setZ(i, z * (1 + (y < 0 ? 0.05 : 0)) + fly)
    if (hu) hu.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 3, (y + 0.25) / 0.5 * 1)
  }
  hipGeo.computeVertexNormals()
  const hips = new THREE.Mesh(hipGeo)
  hips.position.y = 0.75
  group.add(hips)

  // Left & Right Legs with clean UV projection and no accordion distortions
  const makeLeg = (offsetX, angleZ) => {
    const legGeo = new THREE.CylinderGeometry(0.35, 0.25, 2.2, 48, 32, true)
    const p = legGeo.attributes.position
    const u = legGeo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
      const ang = Math.atan2(z, x)
      const crease = (z > 0.1) ? 0.02 : 0
      p.setZ(i, z + crease)
      if (u) u.setXY(i, (ang + Math.PI) / (2 * Math.PI) * 2, (y + 1.1) / 2.2 * 3)
    }
    legGeo.computeVertexNormals()
    const leg = new THREE.Mesh(legGeo)
    leg.position.set(offsetX, -0.4, 0)
    leg.rotation.z = angleZ
    return leg
  }

  group.add(makeLeg(-0.34, -0.02))
  group.add(makeLeg(0.34, 0.02))
  group.position.y = 0.1
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
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
    <div className="tryon-wrap" style={{ position: 'relative' }}>
      <div className="tryon-toolbar">
        {[
          { id: 'shirt', icon: '👔', label: 'Shirt' },
          { id: 'pants', icon: '👖', label: 'Pants' },
          { id: 'kilt', icon: '🏴', label: 'Kilt' },
          { id: 'scarf', icon: '🧣', label: 'Scarf' },
          { id: 'jacket', icon: '🧥', label: 'Jacket' },
          { id: 'throw', icon: '🛋️', label: 'Throw' }
        ].map(g => (
          <button key={g.id} className={`tryon-garment-btn${garment === g.id ? ' active' : ''}`} onClick={() => onGarmentChange?.(g.id)}>
            {g.icon} {g.label}
          </button>
        ))}
        <div className="tryon-toolbar-spacer" />
        <button className="tryon-export-btn" onClick={exportFlatLay} title="Overhead flat-lay PNG">⬓ Flat Lay</button>
        <button className="tryon-export-btn" onClick={exportTryOnPNG} title="Screenshot of 3D view">⬇ Export Frame</button>
      </div>

      {(!canvasReady || modelLoading) && (
        <div style={{ position: 'absolute', inset: 0, top: 46, background: '#1a1815', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5c5648', fontSize: '0.8rem' }}>
          Preparing 3D view…
        </div>
      )}

      <div ref={mountRef} className="tryon-canvas" />
      <div className="tryon-hint">Drag to orbit · scroll to zoom</div>
    </div>
  )
}
