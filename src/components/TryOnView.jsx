import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildFabricTexture } from './DrapeView.jsx'

/**
 * TryOnView — Virtual Try-On / Drape Simulation.
 * Renders GLTF models from /models/ with procedural fallback.
 */

function buildKilt() {
  const group = new THREE.Group()
  const seg = 128
  const R1 = 0.8
  const R2 = 1.0 // Flare out at bottom
  const H = 2.4
  const pleatGeo = new THREE.CylinderGeometry(R1, R2, H, seg, 32, true)
  const pos = pleatGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    // deep pleats at back/sides
    const isFront = (ang > -Math.PI/3 && ang < Math.PI/3)
    let pleat = 0
    if (!isFront) {
      pleat = Math.sin(ang * 40) * 0.08
    }
    const len = Math.sqrt(x * x + z * z)
    const nl = len + pleat
    pos.setX(i, Math.cos(ang) * nl)
    pos.setZ(i, Math.sin(ang) * nl)
  }
  pleatGeo.computeVertexNormals()
  const pleats = new THREE.Mesh(pleatGeo)
  pleats.rotation.y = Math.PI
  group.add(pleats)
  
  // Front apron (slightly curved)
  const apronGeo = new THREE.CylinderGeometry(R1+0.05, R2+0.05, H, 32, 16, true, -Math.PI/4, Math.PI/2)
  const apron = new THREE.Mesh(apronGeo)
  apron.rotation.y = -Math.PI / 4
  group.add(apron)
  
  group.position.y = 0.2
  return { mesh: group }
}

function buildScarf() {
  const group = new THREE.Group()
  
  // Neck wrap
  const neckGeo = new THREE.TorusGeometry(0.6, 0.25, 64, 128)
  neckGeo.rotateX(Math.PI / 2)
  neckGeo.scale(1, 0.6, 1.2)
  const neck = new THREE.Mesh(neckGeo)
  neck.position.set(0, 1.6, 0)
  group.add(neck)
  
  // Left hanging tail
  const tailGeo1 = new THREE.CylinderGeometry(0.25, 0.35, 2.5, 64, 64, true, 0, Math.PI)
  tailGeo1.scale(1, 1, 0.3)
  const tail1 = new THREE.Mesh(tailGeo1)
  tail1.position.set(-0.35, 0.4, 0.7)
  tail1.rotation.z = 0.1
  tail1.rotation.y = 0.2
  group.add(tail1)
  
  // Right hanging tail
  const tailGeo2 = new THREE.CylinderGeometry(0.25, 0.4, 2.8, 64, 64, true, 0, Math.PI)
  tailGeo2.scale(1, 1, 0.2)
  const tail2 = new THREE.Mesh(tailGeo2)
  tail2.position.set(0.35, 0.3, 0.6)
  tail2.rotation.z = -0.15
  tail2.rotation.y = -0.3
  group.add(tail2)

  // Add high-frequency folds
  group.traverse(c => {
    if (c.isMesh) {
      const pos = c.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
        // Wrinkles
        const noise = Math.sin(x*15 + y*5)*0.02 + Math.cos(z*20 - y*10)*0.015
        // Flowing drape effect based on Y height
        const drape = (2.0 - y) * 0.02 * Math.sin(y * 8)
        pos.setX(i, x + noise + drape)
        pos.setZ(i, z + noise)
      }
      c.geometry.computeVertexNormals()
    }
  })

  group.position.y = -0.6
  return { mesh: group }
}

function buildJacket() {
  const group = new THREE.Group()
  
  // Torso
  const bodyGeo = new THREE.CylinderGeometry(0.9, 1.0, 2.6, 64, 32, true)
  const body = new THREE.Mesh(bodyGeo)
  group.add(body)
  
  // Left Sleeve
  const sleeveGeo = new THREE.CylinderGeometry(0.35, 0.28, 2.0, 32, 32, true)
  const left = new THREE.Mesh(sleeveGeo)
  left.rotation.z = Math.PI / 4
  left.position.set(-1.3, 0.2, 0)
  group.add(left)
  
  // Right Sleeve
  const right = new THREE.Mesh(sleeveGeo)
  right.rotation.z = -Math.PI / 4
  right.position.set(1.3, 0.2, 0)
  group.add(right)

  // Wrinkles
  group.traverse(c => {
    if (c.isMesh) {
      const pos = c.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
        const fold = Math.sin(y*12)*0.03 + Math.cos(x*10)*0.02
        pos.setX(i, x + fold*(x > 0 ? 1 : -1))
        pos.setZ(i, z + fold)
      }
      c.geometry.computeVertexNormals()
    }
  })

  group.position.y = 0.2
  return { mesh: group }
}

function buildThrow() {
  const SEG = 128
  const geo = new THREE.PlaneGeometry(5, 5, SEG, SEG)
  const pos = geo.attributes.position
  
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    let z = 0
    
    // Drape over a couch shape
    if (y > 0.5) z = Math.cos((y - 0.5) * 1.5) * -1.0 + 1.0
    if (y <= 0.5 && y > -1.0) z = (0.5 - y) * 1.2
    if (y <= -1.0) z = 1.8
    
    // Armrests
    if (Math.abs(x) > 1.2 && y > -1.0 && y < 1.0) z += 0.8
    
    // Organic cloth folds (perlin-ish)
    const fold1 = Math.sin(x * 6 + y * 3) * 0.08
    const fold2 = Math.cos(x * 12 - y * 8) * 0.03
    pos.setZ(i, z + fold1 + fold2)
  }
  
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo)
  mesh.rotation.x = -Math.PI / 4
  mesh.position.set(0, 0, -1)
  return { mesh }
}

function buildShirt() {
  const group = new THREE.Group()
  
  // Torso (tailored shirt shape with button placket)
  const bodyGeo = new THREE.CylinderGeometry(0.75, 0.72, 2.2, 64, 32, true)
  const pos = bodyGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const ang = Math.atan2(z, x)
    // Front placket bump
    let placket = 0
    if (ang > Math.PI*0.4 && ang < Math.PI*0.6) {
      placket = 0.03
    }
    // Wrinkles around waist
    const fold = Math.sin(y * 14) * 0.02
    pos.setX(i, x * (1 + fold) + placket * Math.cos(ang))
    pos.setZ(i, z * (1 + fold) + placket * Math.sin(ang))
  }
  bodyGeo.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeo)
  group.add(body)
  
  // Collar
  const collarGeo = new THREE.TorusGeometry(0.38, 0.1, 32, 64, Math.PI * 1.5)
  collarGeo.rotateX(Math.PI / 2.2)
  collarGeo.rotateZ(-Math.PI * 0.75)
  const collar = new THREE.Mesh(collarGeo)
  collar.position.set(0, 1.15, 0)
  group.add(collar)

  // Left Sleeve
  const sleeveGeo = new THREE.CylinderGeometry(0.28, 0.22, 1.6, 32, 32, true)
  const left = new THREE.Mesh(sleeveGeo)
  left.rotation.z = Math.PI / 3.2
  left.position.set(-0.95, 0.25, 0)
  group.add(left)
  
  // Right Sleeve
  const right = new THREE.Mesh(sleeveGeo)
  right.rotation.z = -Math.PI / 3.2
  right.position.set(0.95, 0.25, 0)
  group.add(right)

  // Add subtle fabric wrinkles across all meshes
  group.traverse(c => {
    if (c.isMesh) {
      const p = c.geometry.attributes.position
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
        const fold = Math.sin(y * 16 + x * 6) * 0.015
        p.setZ(i, z + fold)
      }
      c.geometry.computeVertexNormals()
    }
  })

  group.position.y = 0.1
  return { mesh: group }
}

function buildPants() {
  const group = new THREE.Group()
  
  // Waistband
  const waistGeo = new THREE.CylinderGeometry(0.78, 0.76, 0.4, 64, 8, true)
  const waist = new THREE.Mesh(waistGeo)
  waist.position.y = 1.2
  group.add(waist)
  
  // Left Leg
  const legGeo1 = new THREE.CylinderGeometry(0.38, 0.26, 2.4, 32, 32, true)
  const p1 = legGeo1.attributes.position
  for (let i = 0; i < p1.count; i++) {
    const x = p1.getX(i), y = p1.getY(i), z = p1.getZ(i)
    const crease = (z > 0.15) ? Math.sin(y * 8) * 0.015 + 0.02 : 0
    const knee = (y > -0.2 && y < 0.2) ? Math.sin((y + 0.2) * Math.PI / 0.4) * 0.03 : 0
    p1.setZ(i, z + crease + knee)
  }
  legGeo1.computeVertexNormals()
  const leg1 = new THREE.Mesh(legGeo1)
  leg1.position.set(-0.38, -0.2, 0)
  leg1.rotation.z = -0.04
  group.add(leg1)

  // Right Leg
  const legGeo2 = new THREE.CylinderGeometry(0.38, 0.26, 2.4, 32, 32, true)
  const p2 = legGeo2.attributes.position
  for (let i = 0; i < p2.count; i++) {
    const x = p2.getX(i), y = p2.getY(i), z = p2.getZ(i)
    const crease = (z > 0.15) ? Math.sin(y * 8) * 0.015 + 0.02 : 0
    const knee = (y > -0.2 && y < 0.2) ? Math.sin((y + 0.2) * Math.PI / 0.4) * 0.03 : 0
    p2.setZ(i, z + crease + knee)
  }
  legGeo2.computeVertexNormals()
  const leg2 = new THREE.Mesh(legGeo2)
  leg2.position.set(0.38, -0.2, 0)
  leg2.rotation.z = 0.04
  group.add(leg2)

  group.position.y = 0.1
  return { mesh: group }
}

const BUILDERS = { kilt: buildKilt, scarf: buildScarf, jacket: buildJacket, throw: buildThrow, shirt: buildShirt, pants: buildPants }

export default function TryOnView({ state, garment = 'kilt', onGarmentChange }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})
  const [error, setError] = useState(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [modelLoading, setModelLoading] = useState(true)

  const applyMat = (obj, mat) => {
    obj.traverse(c => { 
      if (c.isMesh) { 
        c.material = mat; 
        c.castShadow = true; 
        c.receiveShadow = true;
        // Fix UV scaling for GLTF models
        if (c.geometry && c.geometry.attributes.uv) {
          // Adjust UV mapping if necessary, or just rely on repeat
        }
      } 
    })
  }

  const disposeMesh = (mesh) => {
    if (!mesh) return
    mesh.traverse(c => {
      if (c.isMesh && c.geometry) c.geometry.dispose()
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
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1815)

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
    camera.position.set(0, 0.6, 3.2)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.0
    controls.maxDistance = 8
    controls.target.set(0, 0.1, 0)

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.55))
    const key = new THREE.DirectionalLight(0xfff5e0, 1.4)
    key.position.set(3, 5, 4)
    key.castShadow = true
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xe0f0ff, 0.5)
    fill.position.set(-4, 1, 2)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.7)
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

    const useSheen = renderer.capabilities.isWebGL2
    const mat = useSheen
      ? new THREE.MeshPhysicalMaterial({
          map: texture, roughness: 0.82, metalness: 0.02,
          sheen: 1.0, sheenRoughness: 0.5, side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          map: texture, roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide,
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
    }
    window.addEventListener('resize', onResize)

    sceneRef.current = { renderer, scene, camera, controls, mesh: null, mat, texture, frame, garmentKey: null }
    setCanvasReady(true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      const s = sceneRef.current
      if (s.mat) s.mat.dispose()
      if (s.texture) s.texture.dispose()
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
        
        if (s.mesh) {
          disposeMesh(s.mesh)
          s.scene.remove(s.mesh)
        }
        
        // Normalize scale/position if needed based on the model
        const mesh = gltf.scene
        mesh.position.set(0, -0.5, 0) // Adjust base offset
        
        // Auto scale to fit unit sphere approx
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
      } catch (err) {
        console.warn('Failed to load GLTF, falling back to procedural:', err)
        if (!active) return
        if (s.mesh) {
          disposeMesh(s.mesh)
          s.scene.remove(s.mesh)
        }
        const built = BUILDERS[garment] || BUILDERS.kilt
        const { mesh } = built()
        applyMat(mesh, s.mat)
        s.scene.add(mesh)
        s.mesh = mesh
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

  if (error) {
    return <div className="tryon-error">⚠️ {error}</div>
  }

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
          <button
            key={g.id}
            className={`tryon-garment-btn${garment === g.id ? ' active' : ''}`}
            onClick={() => onGarmentChange?.(g.id)}>
            {g.icon} {g.label}
          </button>
        ))}
        <div className="tryon-toolbar-spacer" />
        <button className="tryon-export-btn" onClick={exportFlatLay} title="Overhead flat-lay PNG">⬓ Flat Lay</button>
        <button className="tryon-export-btn" onClick={exportTryOnPNG} title="Screenshot of 3D view">⬇ Export Frame</button>
      </div>
      
      {(!canvasReady || modelLoading) && (
        <div style={{
          position: 'absolute', inset: 0, top: 46,
          background: '#1a1815', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5c5648', fontSize: '0.8rem'
        }}>
          Preparing 3D view…
        </div>
      )}
      
      <div ref={mountRef} className="tryon-canvas" />
      <div className="tryon-hint">Drag to orbit · scroll to zoom</div>
    </div>
  )
}
