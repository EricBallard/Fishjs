import { OutlinePass } from '/js/_libs/post/pass/OutlinePass.js'

import { MotionBlurPass } from '/js/_libs/post/pass/MotionBlurPass.js'

// Utils
import { setLoadProgress } from '/js/loader.js'

import { isMobile } from '/js/device/device.js'

import * as Screen from '/js/device/screen.js'

import * as World from '/js/world/world.js'

import { getStats } from '/js/world/stats.js'

import { Particles } from '/js/world/particles.js'

import { loadAnimatedModel } from '/js/boids/model.js'

import { detectNativeFrameRate } from '/js/device/frame-rate.js'

export async function initialize() {
  await setLoadProgress(1, 'Configuring Scene')

  // Configure renderer
  const renderer = new THREE.WebGLRenderer({
    physicallyCorrectLights: true,
    antialias: true,
    alpha: true,
  })

  // Cache device traits
  const usingMobile = isMobile.any() != undefined
  let isLandScape = window.innerWidth > window.innerHeight
  let h = usingMobile ? (isLandScape ? screen.width : screen.height) : window.innerHeight
  let w = usingMobile ? (isLandScape ? screen.height : screen.width) : window.innerWidth

  // Apply to renderer
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Create scene and camera
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 25000)
  camera.position.set(-1000, -500, -2000)

  // Configure Post-processesing
  const composer = new THREE.EffectComposer(renderer)

  // Render scene from camera perspective
  const renderPass = new THREE.RenderPass(scene, camera)
  composer.addPass(renderPass)

  // Motion blur
  const blurPass = new MotionBlurPass(scene, camera, {
    samples: 15,
    interpolateGeometry: 0.002,
    expandGeometry: 0.002,
    smearIntensity: 0.001,
    blurTransparent: true,
    renderCameraBlur: true,
  })

  blurPass.renderToScreen = true
  composer.addPass(blurPass)

  /*
  // Selection outline
  let outlinePass = new OutlinePass(new THREE.Vector2(w, h), scene, camera)
  outlinePass.edgeThickness = 1.0
  outlinePass.edgeStrength = 2.5
  outlinePass.edgeGlow = 0.1
  outlinePass.pulsePeriod = 0
  composer.addPass(outlinePass)

  // Load selection outline texture
  const textureLoader = new THREE.TextureLoader()
  textureLoader.load('/_resources/tri_pattern.jpg', texture => {
    outlinePass.patternTexture = texture
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
  })
  */

  await setLoadProgress(20, 'Configuring Scene')

  // Set scene to opaque so we can fade in after loading
  const sceneElement = renderer.domElement
  sceneElement.style.opacity = 0.0

  // Configure user-controls
  const controls = new THREE.OrbitControls(camera, sceneElement)
  controls.enabled = true
  controls.enablePan = true
  controls.autoRotate = false

  controls.rotateSpeed = 0.45
  controls.autoRotateSpeed = 0.3

  controls.minDistance = 0
  controls.maxDistance = 1500

  controls.minPolarAngle = Math.PI * 0.15
  controls.maxPolarAngle = Math.PI * 0.75

  controls.maxAzimuthAngle = THREE.Math.degToRad(107)
  controls.minAzimuthAngle = THREE.Math.degToRad(-7)


  // Create raycaster used for selecting fish to focus
  const raycaster = new THREE.Raycaster()
  raycaster.far = 25000
  raycaster.near = 60

  // Cache DOM elements
  const fpsTracker = document.getElementById('fpsCount'),
    fishTracker = document.getElementById('fishCount'),
    selInfo = document.getElementById('selected_info'),
    info = document.getElementById('info')

  // Format info in center for mobile
  if (usingMobile) {
    info.style.top = '75vh'
    info.style.textAlign = 'center'
    info.style.left = isLandScape ? '35vw' : '17.5vw'
  }

  // Stats & Info
  let fishSpawned = 0,
    selectedFish = undefined

  // Boid data
  let boids = [],
    sceneObjects = []

  // Particles
  let particles = new Particles(scene, camera)

  // Cache app info as obj - allows refrencing variables in util
  const app = {
    // Debug toggle
    debug: true,
    // Device
    width: w,
    height: h,
    targetFPS: -1,
    targetFish: -1,
    renderInterval: -1,
    isMobile: usingMobile,
    // Controls
    controls: controls,
    // Scene
    boids: boids,
    scene: scene,
    particles: particles,
    element: sceneElement,
    sceneObjects: sceneObjects,
    // Render
    camera: camera,
    renderer: renderer,
    composer: composer,
    //outLine: outlinePass,
    motionBlur: blurPass,
    // Stats/info
    raycaster: raycaster,
    selected: selectedFish,
    selectedInfo: selInfo,
    info: info,

    spawned: fishSpawned,
    fish: fishTracker,
    fps: fpsTracker,
  }

  await setLoadProgress(40, 'Detecting Framerate')
  detectNativeFrameRate(app)

  // Add models to scene
  await setLoadProgress(50, 'Creating World')
  loadAnimatedModel(app)

  // Create skybox
  World.createRoom(THREE, scene)

  // Add water particles
  //World.addParticles(THREE, scene)

  // Add light
  World.addLight(scene)

  // Add cached element to DOM
  document.body.appendChild(sceneElement)

  /*
      !~* EVENT LISTENERS *~!
  */

  await setLoadProgress(70, 'Registering Listeners')

  // Audio
  const audio = new Audio('/_resources/ambience_sound_compressed.mp3')
  audio.volume = 0.75
  audio.loop = true

  //window.addEventListener('focus', () => (audio.paused ? audio.play() : true))
  window.addEventListener('blur', () => (audio.paused ? true : audio.pause()))

  // Register selecting fish - ignores drags (supports pc and mobile)
  //let startPos = new THREE.Vector3(0, 0, 0)

  // Play
  window.addEventListener(
    'pointerdown',
    () => {
      if (audio.paused) audio.play()
      //const p = camera.position
      //startPos = new THREE.Vector3(p.x, p.y, p.z)
    },
    false
  )

  /* Fish Selection - SCRAPPED
  window.addEventListener(
    'pointerup',
    e => {
      // Register as selection if mouse hasn't majorily moved during click
      const p = camera.position
      if (p == undefined) return

      if (Math.abs(p.x - startPos.x) <= 100 && Math.abs(p.y - startPos.y) <= 100 && Math.abs(p.z - startPos.z) <= 100)
        Screen.click(e, app)
    },
    false
  )
  */

  // Disable scrolling
  window.onscroll = e => e.preventDefault() && window.scrollTo(0, 0)

  // Register resize listener
  window.addEventListener(
    'resize',
    () => {
      isLandScape = window.innerWidth > window.innerHeight
      info.style.left = isLandScape ? '35vw' : '17.5vw'

      let h = usingMobile ? (isLandScape ? screen.width : screen.height) : window.innerHeight
      let w = usingMobile ? (isLandScape ? screen.height : screen.width) : window.innerWidth

      app.width = w
      app.height = h

      camera.aspect = w / h
      camera.updateProjectionMatrix()

      composer.setSize(w, h)

      renderer.setSize(w, h)
      renderer.setPixelRatio(window.devicePixelRatio)

      window.scrollTo(0, 0)
    },
    false
  )

  // Load view counter data
  await setLoadProgress(90, 'Getting Stats')
  getStats()

  // Render-loop
  await setLoadProgress(100, 'LOADED')
  Screen.render(app)
}

// Init app
initialize()
