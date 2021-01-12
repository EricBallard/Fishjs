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
    isMobile
} from '/js/device.js';

import {
    OutlinePass
} from '/js/libs/threejs/post/pass/OutlinePass.js';

import {
    FXAAShader
} from '/js/libs/threejs/post/FXAAShader.js';

/*
  Stats & Info
*/
let fishSpawned = 0,
    selectedFish = undefined;

// Boid data
let boids = [],
    mixers = [],
    sceneObjects = [];

export function initialize() {
    const usingMobile = isMobile.any() != undefined;

    let w = window.innerWidth,
        h = window.innerHeight;
    console.log('W: ' + w + ' H: ' + h);

    const body = document.body;



    // Create scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 60, 25000);
    camera.position.set(-1100, -500, -1000);
    // camera.position.set(0, -200, 0);

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.far = 25000;
    raycaster.near = 60;

    // Configure renderer and cache its DOM element
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.localClippingEnabled = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.id = 'canvas';

    // Post-processesing
    const composer = new THREE.EffectComposer(renderer);

    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const effectFXAA = new THREE.ShaderPass(FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(1 / w, 1 / h);
    composer.addPass(effectFXAA);

    const outlinePass = new OutlinePass(new THREE.Vector2(w, h), scene, camera);
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
        width: w,
        height: h,
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
    const water = new Water(new THREE.PlaneBufferGeometry(4000, 4000), {
        scale: .1,
        textureWidth: 1048,
        textureHeight: 1024,
        flowMap: new THREE.TextureLoader().load('/resources/water/Water_1_M_Flow.jpg')
    });

    water.position.y = 1000;
    water.rotation.x = Math.PI * 0.5;
    scene.add(water);

    // Add light to scene
    let light = new THREE.PointLight();
    light.position.set(1000, 999, 1750);
    scene.add(light);

    // Add cached element to DOM
    body.appendChild(sceneElement);

    // Audio
    const audio = new Audio('/resources/ambience_sound_compressed.wav');
    audio.volume = 0.1;
    audio.loop = true;

    // Register selecting fish - ignores drags (supports pc and mobile)
    let startPos;

    window.addEventListener('pointerdown', () => {
        // if (audio.paused)
        //    audio.play();

        const p = camera.position;
        startPos = new THREE.Vector3(p.x, p.y, p.z);
    }, false);

    window.addEventListener('pointerup', e => {
        // Register as selection if mouse hasn't majorily moved during click
        const p = camera.position;

        if (p == undefined)
            return;

        if (Math.abs(p.x - startPos.x) <= 100 &&
            Math.abs(p.y - startPos.y) <= 100 &&
            Math.abs(p.z - startPos.z) <= 100)

            Screen.click(e, appInfo);
    }, false);

    const c = document.getElementById('canvas');

    // Register resize listener
    window.addEventListener('resize', () => {
        w = window.innerWidth,
            h = window.innerHeight;

        var scale = window.visualViewport.scale;
        console.log("SCALE: " + scale);
        console.log('W: ' + w + ' H: ' + h);

        appInfo.width = w;
        appInfo.height = h;

        camera.aspect = w / h;
        camera.updateProjectionMatrix()

        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        composer.setSize(w, h);

        effectFXAA.uniforms['resolution'].value.set(1 / w, 1 / h);
    }, false);

    // Render-loop
    Screen.render(appInfo);
}

Screen.getFrameRate();