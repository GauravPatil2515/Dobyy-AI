import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { buildFabricTexture } from './DrapeView.jsx'
import {
  createFabricMaterial, applyWeaveProfile, createTrimMaterials, disposeTrimMaterials,
  createStudioEnvironment, createContactShadow, profileFor,
} from './fabricMaterials.js'
import { BUILDERS } from './garmentBuilders.js'
import { toast } from '../utils/toast.js'

const GARMENTS = [
  { id: 'shirt',  icon: '👔', label: 'Shirt' },
  { id: 'pants',  icon: '👖', label: 'Pants' },
  { id: 'kilt',   icon: '🏴', label: 'Kilt' },
  { id: 'scarf',  icon: '🧣', label: 'Scarf' },
  { id: 'jacket', icon: '🧥', label: 'Jacket' },
  { id: 'throw',  icon: '🛋️', label: 'Throw' },
]

/** Camera framing that keeps the whole garment in shot on any aspect ratio. */
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
  camera.near = Math.max(0.01, distance / 100)
  camera.far = distance * 100
  camera.updateProjectionMatrix()
  controls.maxDistance = distance * 4
  controls.minDistance = distance * 0.3
  controls.update()
  return { box, center, size }
}

/** Auto quality tier — post FX are only worth it when there is GPU headroom. */
function detectTier(renderer) {
  if (!renderer?.capabilities?.isWebGL2) return 'low'
  const px = window.devicePixelRatio || 1
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  if (cores <= 4 || mem <= 4 || px > 2.5) return 'medium'
  return 'high'
}

export default function TryOnView({ state, garment = 'kilt', onGarmentChange }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})
  const [error, setError] = useState(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [modelLoading, setModelLoading] = useState(true)
  const [hq, setHq] = useState(true)
  const hqRef = useRef(true)
  useEffect(() => { hqRef.current = hq }, [hq])

  /* ── material slot dispatch ───────────────────────────────────────────── */
  const applyMats = useCallback((obj, mats) => {
    obj.traverse(c => {
      if (c.isLineSegments) { c.material = mats.stitch; return }
      if (!c.isMesh) return
      c.material = mats[c.userData.mat || 'fabric'] || mats.fabric
      c.castShadow = true
      c.receiveShadow = true
    })
  }, [])

  /** Geometry-only disposal — every material in the scene is shared. */
  const disposeMesh = useCallback((mesh) => {
    if (!mesh) return
    mesh.traverse(c => { if (c.geometry) c.geometry.dispose() })
  }, [])

  /* ── scene bootstrap (once) ───────────────────────────────────────────── */
  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth || 600
    const H = el.clientHeight || 480

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance',
      })
    } catch {
      setError('WebGL not available')
      return
    }

    const tier = detectTier(renderer)
    const maxDpr = tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x14120f)
    scene.fog = new THREE.Fog(0x14120f, 9, 22)

    /* Procedural studio HDRI (soft boxes + floor bounce), PMREM pre-filtered */
    const env = createStudioEnvironment(renderer, { warm: 0.95 })
    scene.environment = env.texture
    scene.environmentIntensity = 1.0

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
    camera.position.set(0, 0.6, 3.2)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.0
    controls.maxDistance = 8
    controls.target.set(0, 0.1, 0)
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }

    /* ── Studio lighting rig ── */
    scene.add(new THREE.AmbientLight(0xfff6ec, 0.18))
    scene.add(new THREE.HemisphereLight(0xdcecff, 0x2a1e14, 0.35))

    const key = new THREE.DirectionalLight(0xfff2dc, 2.1)
    key.position.set(3.2, 4.8, 3.6)
    key.castShadow = true
    key.shadow.mapSize.set(tier === 'high' ? 2048 : 1024, tier === 'high' ? 2048 : 1024)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 18
    key.shadow.camera.left = -3.5
    key.shadow.camera.right = 3.5
    key.shadow.camera.top = 3.5
    key.shadow.camera.bottom = -3.5
    key.shadow.bias = -0.0006
    key.shadow.normalBias = 0.022
    key.shadow.radius = 3
    scene.add(key)
    scene.add(key.target)

    const fill = new THREE.DirectionalLight(0xd6e8ff, 0.55)
    fill.position.set(-4.2, 1.4, 2.4)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0xffffff, 1.15)   // separates cloth from bg
    rim.position.set(-1.2, 2.6, -4.2)
    scene.add(rim)

    const kicker = new THREE.SpotLight(0xffd9a8, 12, 12, Math.PI / 6, 0.6, 2)
    kicker.position.set(2.6, 1.2, -3.0)
    scene.add(kicker)
    scene.add(kicker.target)

    /* Ground: cast shadows + a baked contact shadow for close-range occlusion */
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.ShadowMaterial({ opacity: 0.34 })
    )
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.position.y = -1.4
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    const contact = createContactShadow({ size: 5.2, opacity: 0.5, y: -1.39 })
    scene.add(contact)

    /* ── Materials ── */
    const texCanvas = buildFabricTexture(state)
    const texture = new THREE.CanvasTexture(texCanvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())

    const fabric = createFabricMaterial({ weave: state.weave, map: texture, renderer })
    const trims = createTrimMaterials()
    trims.stitch = new THREE.LineBasicMaterial({ color: 0xd8cbb4, transparent: true, opacity: 0.6 })
    const mats = { fabric, ...trims }

    /* ── Post-processing chain ── */
    let composer = null, gtao = null
    if (tier !== 'low') {
      composer = new EffectComposer(renderer)
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(W, H)
      composer.addPass(new RenderPass(scene, camera))

      gtao = new GTAOPass(scene, camera, W, H)
      gtao.output = GTAOPass.OUTPUT.Default
      gtao.blendIntensity = 0.85
      gtao.updateGtaoMaterial({
        radius: 0.16, distanceExponent: 1.0, thickness: 0.5, scale: 1.0,
        samples: tier === 'high' ? 16 : 8, screenSpaceRadius: false,
      })
      composer.addPass(gtao)

      composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.16, 0.75, 0.92))
      composer.addPass(new OutputPass())
      if (tier === 'high') composer.addPass(new SMAAPass())
    }

    /* ── Render loop (gated on visibility to save battery) ── */
    let frame = 0, t = 0, onScreen = true
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting }, { threshold: 0.01 })
      : null
    io?.observe(el)

    const animate = () => {
      frame = requestAnimationFrame(animate)
      if (!onScreen || document.hidden) return
      t += 0.01
      const s = sceneRef.current
      if (s.mesh) {
        // gentle turntable sway; cloth reads best in motion
        s.mesh.rotation.y = (s.baseRotY || 0) + Math.sin(t * 0.4) * 0.15
        if (s.sway) {
          s.sway.rotation.z = Math.sin(t * 0.8) * 0.012
          s.sway.rotation.x = Math.cos(t * 0.6) * 0.008
        }
      }
      controls.update()
      if (hqRef.current && composer) composer.render()
      else renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = el.clientWidth || W, h = el.clientHeight || H
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      composer?.setSize(w, h)
      if (sceneRef.current.mesh) frameCameraToObject(camera, controls, sceneRef.current.mesh)
    }
    window.addEventListener('resize', onResize)

    sceneRef.current = {
      renderer, scene, camera, controls, composer, gtao, tier,
      mesh: null, sway: null, baseRotY: 0,
      mats, fabric, texture, env, contact, key,
    }
    setCanvasReady(true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      io?.disconnect()
      const s = sceneRef.current
      controls.dispose()
      if (s.mesh) disposeMesh(s.mesh)
      composer?.dispose?.()
      gtao?.dispose?.()
      fabric.dispose()
      disposeTrimMaterials(trims)
      texture.dispose()
      env.dispose()
      contact.material.map?.dispose()
      contact.material.dispose()
      contact.geometry.dispose()
      shadowPlane.geometry.dispose()
      shadowPlane.material.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── garment swap ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const s = sceneRef.current
    if (!s.scene) return
    let active = true

    const mount = (root) => {
      if (s.mesh) { disposeMesh(s.mesh); s.scene.remove(s.mesh) }
      applyMats(root, s.mats)
      s.scene.add(root)
      s.mesh = root
      s.sway = root.children[0] || null
      s.baseRotY = root.rotation.y
      const { box } = frameCameraToObject(s.camera, s.controls, root)
      // keep contact shadow glued to the garment's footprint
      if (s.contact) {
        s.contact.position.y = box.min.y - 0.01
        const w = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
        s.contact.scale.set(w * 0.55, 0.72 * w * 0.55, 1)
      }
      if (s.key) { s.key.target.position.copy(s.controls.target); s.key.target.updateMatrixWorld() }
    }

    const loadGarment = async () => {
      setModelLoading(true)
      try {
        if (garment !== 'shirt') throw new Error('procedural')
        const gltf = await new GLTFLoader().loadAsync(`/models/${garment}.glb`)
        if (!active) return
        const root = gltf.scene
        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())
        root.position.sub(center)
        root.scale.setScalar(2.5 / size)
        mount(root)
      } catch (err) {
        if (!active) return
        if (garment === 'shirt') {
          console.warn('GLTF unavailable, using procedural shirt:', err?.message)
          toast('Using stylized preview for shirt — 3D model unavailable', 'info')
        }
        const { mesh } = (BUILDERS[garment] || BUILDERS.kilt)()
        mount(mesh)
      }
      s.garmentKey = garment
      setModelLoading(false)
    }

    loadGarment()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment])

  /* ── fabric / weave updates (debounced) ───────────────────────────────── */
  useEffect(() => {
    const s = sceneRef.current
    if (!s.fabric || !s.texture) return
    const timer = setTimeout(() => {
      const texCanvas = buildFabricTexture(state)
      if (texCanvas) {
        s.texture.image = texCanvas
        s.texture.needsUpdate = true
      }
      applyWeaveProfile(s.fabric, state.weave, s.renderer)
      const p = profileFor(state.weave)
      // shinier constructions want a touch less exposure so highlights hold
      if (s.renderer) s.renderer.toneMappingExposure = 1.0 - p.sheen * 0.08
    }, 100)
    return () => clearTimeout(timer)
  }, [state.sett, state.weave, state.ts, state.reps])

  /* ── exports ──────────────────────────────────────────────────────────── */
  const renderOnce = (s) => {
    if (hqRef.current && s.composer) s.composer.render()
    else s.renderer.render(s.scene, s.camera)
  }

  const exportTryOnPNG = () => {
    const s = sceneRef.current
    if (!s.renderer) return
    renderOnce(s)
    const a = document.createElement('a')
    a.download = `dobby-tryon-${garment}-${Date.now()}.png`
    a.href = s.renderer.domElement.toDataURL('image/png')
    a.click()
  }

  const exportFlatLay = () => {
    const s = sceneRef.current
    if (!s.renderer || !s.mesh) return
    const box = new THREE.Box3().setFromObject(s.mesh)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const half = Math.max(size.x, size.z) * 0.62
    const ortho = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100)
    ortho.position.set(center.x, center.y + size.y + 4, center.z + 0.01)
    ortho.lookAt(center)

    const prevRot = s.mesh.rotation.clone()
    const prevSize = new THREE.Vector2()
    s.renderer.getSize(prevSize)
    s.mesh.rotation.set(0, 0, 0)
    s.renderer.setSize(900, 900, false)
    s.renderer.render(s.scene, ortho)
    const a = document.createElement('a')
    a.download = `dobby-flatlay-${garment}-${Date.now()}.png`
    a.href = s.renderer.domElement.toDataURL('image/png')
    a.click()
    s.mesh.rotation.copy(prevRot)
    s.renderer.setSize(prevSize.x, prevSize.y, false)
    renderOnce(s)
  }

  if (error) return <div className="tryon-error">⚠️ {error}</div>

  return (
    <div className="tryon-wrap">
      <div className="tryon-toolbar">
        {GARMENTS.map(g => (
          <button
            key={g.id}
            className={`tryon-garment-btn${garment === g.id ? ' active' : ''}`}
            onClick={() => onGarmentChange?.(g.id)}
          >
            {g.icon} {g.label}
          </button>
        ))}
        <div className="tryon-toolbar-spacer" />
        <button
          className={`tryon-export-btn${hq ? ' active' : ''}`}
          onClick={() => setHq(v => !v)}
          title="Ambient occlusion + bloom + anti-aliasing"
        >
          {hq ? '✦ HQ On' : '✦ HQ Off'}
        </button>
        <button className="tryon-export-btn" onClick={exportFlatLay} title="Overhead flat-lay PNG">⬓ Flat Lay</button>
        <button className="tryon-export-btn" onClick={exportTryOnPNG} title="Screenshot of 3D view">⬇ Export Frame</button>
      </div>

      {(!canvasReady || modelLoading) && (
        <div className="tryon-loading-overlay">Preparing 3D view…</div>
      )}

      <div ref={mountRef} className="tryon-canvas" />
      <div className="tryon-hint">Drag to orbit · scroll to zoom</div>
    </div>
  )
}
