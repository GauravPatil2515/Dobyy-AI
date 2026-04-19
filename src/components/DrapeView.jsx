import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { expandSett, weaveMatrix, getFiberCanvas } from '../utils/weaveUtils.js'
import { h2r, blend, toRgba } from '../utils/colorUtils.js'

function buildFabricTexture(state) {
  const threads = expandSett(state.sett)
  if (!threads.length) return null
  const L     = threads.length
  const total = L * state.reps
  const ts    = 6
  const W     = total * ts
  const H     = total * ts

  const cv  = document.createElement('canvas')
  cv.width  = W
  cv.height = H
  const ctx = cv.getContext('2d')
  const M   = weaveMatrix(state.weave, total)

  for (let i = 0; i < total; i++) {
    for (let j = 0; j < total; j++) {
      const up  = M[i][j] === 1
      const wc  = h2r(threads[j % L])
      const fc  = h2r(threads[i % L])
      const col = blend(wc, fc, up ? 0.70 : 0.30)
      ctx.fillStyle = toRgba(col)
      ctx.fillRect(j * ts, i * ts, ts, ts)
    }
  }

  // Fiber overlay
  const fiber = getFiberCanvas()
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.1
  ctx.fillStyle = ctx.createPattern(fiber, 'repeat')
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  return cv
}

export default function DrapeView({ state }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})

  // Init Three.js scene once
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const W = el.clientWidth  || 600
    const H = el.clientHeight || 480

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    // Scene
    const scene  = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1815)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
    camera.position.set(0, 0.5, 3.2)
    camera.lookAt(0, 0, 0)

    // Lights
    const ambient = new THREE.AmbientLight(0xfff8f0, 0.7)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.2)
    dirLight.position.set(3, 5, 3)
    dirLight.castShadow = true
    scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.4)
    fillLight.position.set(-3, -1, 2)
    scene.add(fillLight)

    // Draped cloth geometry — plane with sine wave deformation
    const SEG = 40
    const geo  = new THREE.PlaneGeometry(2.4, 3.0, SEG, SEG)
    const pos  = geo.attributes.position

    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j <= SEG; j++) {
        const idx  = i * (SEG + 1) + j
        const x    = pos.getX(idx)
        const y    = pos.getY(idx)
        // Multi-wave drape simulation
        const z = Math.sin(x * 1.8 + 0.5) * 0.12
              + Math.sin(y * 1.2 - 0.3) * 0.09
              + Math.cos((x + y) * 0.9) * 0.05
              + Math.sin(x * 3.5) * 0.03
        pos.setZ(idx, z)
      }
    }
    geo.computeVertexNormals()

    // Material with fabric texture
    const texCanvas = buildFabricTexture(state)
    const texture   = new THREE.CanvasTexture(texCanvas)
    texture.wrapS   = THREE.RepeatWrapping
    texture.wrapT   = THREE.RepeatWrapping
    texture.repeat.set(1, 1)

    const mat = new THREE.MeshStandardMaterial({
      map:         texture,
      roughness:   0.88,
      metalness:   0.02,
      side:        THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -0.15
    mesh.castShadow    = true
    mesh.receiveShadow = true
    scene.add(mesh)

    // Subtle auto-rotate
    let frame
    let t = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      t += 0.008
      mesh.rotation.y = Math.sin(t * 0.4) * 0.18
      mesh.rotation.x = -0.15 + Math.sin(t * 0.3) * 0.04
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      renderer.setSize(W, H)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    sceneRef.current = { renderer, scene, mesh, mat, texture, frame }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  // Update texture when state changes
  useEffect(() => {
    const { mat, texture } = sceneRef.current
    if (!mat || !texture) return
    const texCanvas = buildFabricTexture(state)
    if (!texCanvas) return
    texture.image   = texCanvas
    texture.needsUpdate = true
  }, [state.sett, state.weave, state.ts, state.reps])

  return (
    <div ref={mountRef} style={{
      width: '100%', height: '100%',
      borderRadius: 14, overflow: 'hidden',
      background: '#1a1815',
    }}/>
  )
}
