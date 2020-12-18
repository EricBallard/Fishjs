// THREEJS Utils
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {
    OrbitControls
} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

import {
    FBXLoader
} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/FBXLoader.js';

// Native Utils
import * as Boids from  '/js/boid.js';

import {
    createMaterialArray
} from '/js/skybox.js';

import {
    ParticleSystem
} from '/js/particles.js';

// 3D Graphics
var scene, camera, renderer, controls, frame;

// Boid data
var boids = [];

// Stats & Info
var fps, framesRendered, secondTracker = null;

function initialize() {
    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 60, 25000);
    camera.position.set(1200, -200, 2000);

    // Configure renderer and add to DOM
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.id = 'canvas';
    document.body.appendChild(renderer.domElement);

    // Create skybox textured mesh and add to scene
    const materialArray = createMaterialArray({
        threejs: THREE
    });

    let skyboxGeo = new THREE.BoxGeometry(25000, 25000, 25000);
    scene.add(new THREE.Mesh(skyboxGeo, materialArray));

    // Add light to scene

    // Configure user-controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = true;

    controls.enablePan = false;
    //controls.autoRotate = true;
    controls.rotateSpeed = 0.45;
    controls.autoRotateSpeed = 0.30;

    controls.minDistance = 700;
    controls.maxDistance = 1500;

    // Register resize listener
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }, false);

    // Register fps counter
    fps = document.getElementById('fps');

    loadAnimatedModel();

    // Render-loop
    animate();
}

function loadAnimatedModel() {
    const loader = new FBXLoader();
    loader.setPath("/resources/");

    // model.scale.setScalar(0.1);
    //this.mixer = new THREE.AnimationMixer(model);
    //this._mixers.push(this.mixer);

    //const anim = model.animations[0];

    //console.log('ANIM: ' + anim);
    //const idle = _APP.mixer.clipAction(anim);
    //idle.play();

    var geometry = new THREE.BoxGeometry(50, 50, 50);
    var material = new THREE.MeshBasicMaterial({
        color: 0x999999
    });

    //loader.load("fish.fbx", (model) => {
    for (let added = 0; added < 10; added++) {
        var cube = new THREE.Mesh(geometry, material);

        const x = Math.round(100 + (Math.random() * 1000));
        const y = Math.round(100 + (Math.random() * 1000));
        const z = Math.round(100 + Math.random() * 1000);

        cube.position.set(x, y, z);
        cube.receiveShadow = true;
        cube.castShadow = true;
        scene.add(cube);

        // Create boid object
        var boid = new Boids.Entity({
            x: x,
            y: y,
            z: z,
            obj: cube
        });

    
        // Store boid in array
        boids.push(boid);
    }
    // });
}

function countFPS() {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker > 1000;

    if (newSecond) {
        fps.innerText = "FPS: " + framesRendered;
        secondTracker = now;
        framesRendered = 1;
    } else {
        framesRendered += 1;
        renderer.render(scene, camera);
    }
}

function animate() {
    // Auto-rotate camera
    controls.update();

    // Render scene
    renderer.render(scene, camera);
    frame = window.requestAnimationFrame(() => {       
        // Update fishses' position
        Boids.update({
            threejs: THREE,
            flock: boids
        });

        // FPS counter
        countFPS();

        // Loop
        animate();
    });
}


initialize();