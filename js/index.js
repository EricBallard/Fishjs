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
} from '/js/libs/water/Water.js';


/*
  3D Graphics
*/
let scene;

/*
  Stats & Info
*/
var fishSpawned = 0;

// Boid data
var boids = [],
    mixers = [],
    bounceManager = [],
    rotationManager = [];


export function initialize() {
    // Create scene and camera
    scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 60, 25000);
    camera.position.set(-1100, -500, -1000);

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
        scene: scene,
        camera: camera,
        renderer: renderer,
        controls: controls,
        element: sceneElement,

        boids: boids,
        animations: mixers,
        bounceManager: bounceManager,
        rotationManager: rotationManager,

        spawned: fishSpawned,
        fish: fishTracker,
        fps: fpsTracker
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

    body.addEventListener('click', () => {
        if (audio.paused)
            audio.play();
    });

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