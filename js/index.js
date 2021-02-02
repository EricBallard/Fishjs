// Utils
import * as Screen from '/js/screen.js';

import {
  isMobile
} from '/js/device.js';

import {
  createRoom
} from '/js/skybox.js';

import {
  loadAnimatedModel
} from '/js/boids/model.js';

import {
  Water
} from '/js/libs/threejs/water/Water.js';

import {
  OutlinePass
} from '/js/libs/threejs/post/pass/OutlinePass.js';

import {
  getViews
} from '/js/views.js';


export function initialize() {
  // Configure renderer
  const renderer = new THREE.WebGLRenderer({
    physicallyCorrectLights: true,
    antialias: true,
    alpha: true
  });

  // Cache device traits
  const usingMobile = isMobile.any() != undefined;
  let isLandScape = window.innerWidth > window.innerHeight;
  let h = usingMobile ? isLandScape ? screen.width : screen.height : window.innerHeight;
  let w = usingMobile ? isLandScape ? screen.height : screen.width : window.innerWidth;

  // Apply to renderer
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Create scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 1, 15000);
  camera.position.set(-1000, 0, -2000);

  // Configure Post-processesing
  const composer = new THREE.EffectComposer(renderer);

  // Render scene from camera perspective
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Selection outline
  const outlinePass = new OutlinePass(new THREE.Vector2(w, h), scene, camera);
  outlinePass.edgeThickness = 1.0;
  outlinePass.edgeStrength = 2.5;
  outlinePass.edgeGlow = 0.1;
  outlinePass.pulsePeriod = 0;
  composer.addPass(outlinePass);

  // Load selection outline texture
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('/resources/tri_pattern.jpg', function (texture) {
    outlinePass.patternTexture = texture;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  });

  // Set scene to opaque so we can fade in after loading
  const sceneElement = renderer.domElement;
  sceneElement.style.opacity = 0.0;

  // Configure user-controls
  const controls = new THREE.OrbitControls(camera, sceneElement);
  controls.enabled = true;
  controls.enablePan = true;
  controls.autoRotate = true;

  controls.rotateSpeed = 0.45;
  controls.autoRotateSpeed = 0.3;

  controls.minDistance = 0;
  controls.maxDistance = 1500;

  // Create raycaster used for selecting fish to focus
  const raycaster = new THREE.Raycaster();
  raycaster.far = 25000;
  raycaster.near = 60;

  // Cache DOM elements
  const fpsTracker = document.getElementById('fpsCount'),
    fishTracker = document.getElementById('fishCount');

  // Selected fish info
  const info = document.getElementById('info'),
    selInfo = document.getElementById('selected_info');

  // Format info in center for mobile
  if (usingMobile) {
    info.style.top = '75vh';
    info.style.textAlign = 'center';
    info.style.left = isLandScape ? '35vw' : '17.5vw';
  }

  // Stats & Info
  let fishSpawned = 0,
    selectedFish = undefined;

  // Boid data
  let boids = [],
    mixers = [],
    sceneObjects = [];

  // Cache app info as obj - allows refrencing variables in util
  const appInfo = {
    width: w,
    height: h,
    targetFPS: -1,
    isMobile: usingMobile,

    scene: scene,
    camera: camera,
    outLine: outlinePass,
    composer: composer,
    renderer: renderer,

    controls: controls,
    element: sceneElement,
    sceneObjects: sceneObjects,

    raycaster: raycaster,
    selected: selectedFish,
    selectedInfo: selInfo,
    info: info,

    boids: boids,
    animations: mixers,
    particles: undefined,

    spawned: fishSpawned,
    fish: fishTracker,
    fps: fpsTracker,
  };


  // Create skybox
  createRoom(THREE, scene);

  // Add water-wave distortion effect
  const water = new Water(new THREE.PlaneBufferGeometry(8500, 8500));
  water.rotation.x = Math.PI * 0.5;
  water.position.y = 1000;
  scene.add(water);

  // Add models to scene
  loadAnimatedModel(appInfo);

  // Add light to scene
  const color = new THREE.Color('#088DB1');
  scene.background = color;

  // Center light
  let light = new THREE.PointLight(color, 1);
  light.distance = Infinity;
  light.power = 4;
  light.decay = 2;
  scene.add(light);

  // 'Sun' light
  light = new THREE.PointLight(0xffffff, 1);
  light.position.set(1500, 4500, -1500)
  light.distance = 3750;
  light.power = 25;
  light.decay = 2;
  scene.add(light);

  // Ambient light
  light = new THREE.AmbientLight(color, 0.1);
  scene.add(light);


  //lights
  // TODO - animate between light colors
  /*
  let light = new THREE.PointLight(0xff0040, 2, 50);
  light = new THREE.PointLight(0x0040ff, 2, 50);
  light = new THREE.PointLight(0x80ff80, 2, 50);
  light = new THREE.PointLight(0xffaa00, 2, 50);
  */

  // Add cached element to DOM
  const body = document.body;
  body.appendChild(sceneElement);

  // Audio
  const audio = new Audio('/resources/ambience_sound_compressed.mp3');
  audio.volume = 0.75;
  audio.loop = true;

  window.addEventListener('focus', () => audio.paused ? audio.play() : true);
  window.addEventListener('blur', () => audio.paused ? true : audio.pause());

  // Register selecting fish - ignores drags (supports pc and mobile)
  let startPos = new THREE.Vector3(0, 0, 0);

  window.addEventListener('pointerdown', () => {
    const p = camera.position;
    startPos = new THREE.Vector3(p.x, p.y, p.z);
  }, false);

  window.addEventListener('pointerup', (e) => {
    // Register as selection if mouse hasn't majorily moved during click
    const p = camera.position;
    if (p == undefined) return;

    if (audio.paused)
      audio.play();

    if (Math.abs(p.x - startPos.x) <= 100 &&
      Math.abs(p.y - startPos.y) <= 100 &&
      Math.abs(p.z - startPos.z) <= 100)
      Screen.click(e, appInfo);
  }, false);

  // Register resize listener
  window.addEventListener('resize', () => {
    isLandScape = window.innerWidth > window.innerHeight;
    info.style.left = isLandScape ? '35vw' : '17.5vw';

    let h = usingMobile ? isLandScape ? screen.width : screen.height : window.innerHeight;
    let w = usingMobile ? isLandScape ? screen.height : screen.width : window.innerWidth;

    appInfo.width = w;
    appInfo.height = h;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    composer.setSize(w, h);

    //effectFXAA.uniforms['resolution'].value.set(1 / w, 1 / h);
    window.scrollTo(0, 0);
  }, false);

  // Disable scrolling
  window.onscroll = (e) => e.preventDefault() && window.scrollTo(0, 0);

  // Load view counter data
  // getViews();

  // Render-loop
  Screen.render(appInfo);
}

// Init app
initialize();