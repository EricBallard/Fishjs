// Utils
import * as Screen from '/js/screen.js';

import {
    createMaterialArray
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
    FXAAShader
} from '/js/libs/threejs/post/FXAAShader.js';

/*
  3D Graphics
*/
let scene = undefined,
    width = window.innerWidth,
    height = window.innerHeight;

/*
  Stats & Info
*/
let fishSpawned = 0,
    selectedFish = undefined;

// Boid data
let boids = [],
    mixers = [],
    sceneObjects = [],
    bounceManager = [],
    rotationManager = [];


export function initialize() {
    // Create scene and camera
    scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 60, 25000);
    camera.position.set(-1100, -500, -1000);

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.far = 25000;
    raycaster.near = 60;

    // Configure renderer and cache its DOM element
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.localClippingEnabled = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.id = 'canvas';

    // Post-processesing
    const composer = new THREE.EffectComposer(renderer);

    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const effectFXAA = new THREE.ShaderPass(FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    composer.addPass(effectFXAA);

    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.edgeThickness = 1.0;
    outlinePass.edgeStrength = 2.5;
    outlinePass.edgeGlow = 0.1;
    outlinePass.pulsePeriod = 0;

    composer.addPass(outlinePass);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/resources/tri_pattern.jpg', function (texture) {

        outlinePass.patternTexture = texture;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

    });

    const sceneElement = renderer.domElement
    sceneElement.style.opacity = 0;

    // Configure user-controls
    const controls = new THREE.OrbitControls(camera, sceneElement);
    controls.enabled = true;

    //controls.enablePan = false;
    // controls.autoRotate = true;
    controls.rotateSpeed = 0.45;
    controls.autoRotateSpeed = 0.30;

    controls.minDistance = 250;
    controls.maxDistance = 1500;

    // Cache DOM elements
    const fpsTracker = document.getElementById('fpsCount'),
        fishTracker = document.getElementById('fishCount');

    // Debug
    const xTracker = document.getElementById('x'),
        yTracker = document.getElementById('y'),
        zTracker = document.getElementById('z');


    // Cache app info obj
    const appInfo = {
        width: width,
        height: height,
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

        boids: boids,
        animations: mixers,
        bounceManager: bounceManager,
        rotationManager: rotationManager,

        spawned: fishSpawned,
        fish: fishTracker,
        fps: fpsTracker,


        x: xTracker,
        y: yTracker,
        z: zTracker
    };

    // Create skybox textured mesh and add to scene
    const materialArray = createMaterialArray({
        threejs: THREE
    });

    scene.add(new THREE.Mesh(new THREE.BoxGeometry(5000, 5000, 5000), materialArray));

    // Add models to scene
    loadAnimatedModel(appInfo);

    // Add water-wave distortion effect
    addWaterPhysFX();

    // Add light to scene
    /*
        FIND NEW LIBRARARY THIS SHIT IS TAAAAXING
        Makes mobile nearly unusable 
    */
    addLight(0.01, 0.1, 0.1, 1000, 999, 1750);

    // Add cached element to DOM
    const body = document.body;
    body.appendChild(sceneElement);

    // Audio
    const audio = new Audio('/resources/ambience_sound_compressed.wav');
    audio.volume = 0.15;
    audio.loop = true;

    // Register selecting fish - ignores drags (supports pc and mobile)
    let startPos;

    window.addEventListener('pointerdown', () => {
        if (audio.paused)
            audio.play();

        const p = camera.position;
        startPos = new THREE.Vector3(p.x, p.y, p.z);
    }, false);

    window.addEventListener('pointerup', e => {
        // Register as selection if mouse hasn't majorily moved during click
        const p = camera.position;

        if (Math.abs(p.x - startPos.x) <= 100 &&
            Math.abs(p.y - startPos.y) <= 100 &&
            Math.abs(p.z - startPos.z) <= 100)

            Screen.click(e, appInfo);
    }, false);

    // Register resize listener
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }, false);

    // Render-loop
    Screen.render(appInfo);
}

function addWaterPhysFX() {
    const water = new Water(new THREE.PlaneBufferGeometry(4600, 4600), {
        scale: 1,
        textureWidth: 1024,
        textureHeight: 1024,
        flowMap: new THREE.TextureLoader().load('/resources/water/Water_1_M_Flow.jpg')
    });


    water.position.y = 1000;
    water.rotation.x = Math.PI * 0.5;
    scene.add(water);
}

function addLight(h, s, l, x, y, z) {
    let light = new THREE.PointLight();
    light.position.set(x, y, z);
    scene.add(light);

}

Screen.getFrameRate();