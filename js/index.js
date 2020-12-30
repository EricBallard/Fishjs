// Threejs util
import {
    SkeletonUtils
} from "/js/libs/SkeletonUtils.js";

// Utils
import * as Boids from '/js/boid.js';

import {
    createMaterialArray
} from '/js/skybox.js';


import {
    ParticleSystem
} from '/js/particles.js';

// Audio
const audio = new Audio('/resources/ambience_sound_compressed.wav');
audio.volume = 0.2;
audio.loop = true;

const getFPS = () =>
    new Promise(resolve =>
        requestAnimationFrame(t1 =>
            requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
        )
    );


// DOM elements
var sceneElement;

// 3D Graphics
var scene, camera, renderer, controls;

// Bubble particles
var particles = [];

// Boid data
var boids = [],
    mixers = [],
    bounceManager = [],
    rotationManager = [];

// Stats & Info
var fishSpawned = 0,
    framesRendered = 0;

var fpsTracker, fishTracker, secondTracker = null;

var xTracker, yTracker, zTracker;

var intendedFPS = -1;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFrameRate() {
    const loadStatus = document.getElementById('loadStatus');
    getFPS().then(fps => intendedFPS = Math.floor(fps));

    while (intendedFPS == -1) {
        console.log('Calculating frame rate...');
        await sleep(1000);
    }

    console.log('Frame Rate: ' + intendedFPS);
    loadStatus.style.display = 'none';

    initialize();
}

function fadeIn(element) {
    var opacity = 0;
    var intervalID = setInterval(function () {
        if (opacity < 1) {
            opacity = opacity + 0.1
            element.style.opacity = opacity;
        } else {
            clearInterval(intervalID);
            const infoStatus = document.getElementById('info');

            if (infoStatus.style.opacity != 0)
                return;
            fadeIn(infoStatus);
        }
    }, 50);
}

function initialize() {
    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 60, 25000);
    camera.position.set(-1100, -500, -1000);

    // Configure renderer and add to DOM
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.id = 'canvas';
    const body = document.body;

    // Add 3D scene to DOM
    sceneElement = renderer.domElement
    sceneElement.style.opacity = 0;
    body.appendChild(sceneElement);

    //Test

    body.addEventListener('click', () => {
        // const rm = rotationManager[0];

        // if (rm != undefined) {
        //    rm.inverse = !rm.inverse;
        //    console.log('Inversed: ' + rm.inverse);
        // }

        if (audio.paused)
            audio.play();
    });



    // Init particle system
    particles = new ParticleSystem({
        threejs: THREE,
        parent: scene,
        camera: camera,
    });

    // Create skybox textured mesh and add to scene
    const materialArray = createMaterialArray({
        threejs: THREE
    });

    scene.add(new THREE.Mesh(new THREE.BoxGeometry(5000, 5000, 5000), materialArray));

    // Add light to scene
    let light = new THREE.PointLight();
    light.position.set(2800, 3000, -2400);
    scene.add(light);


    // Configure user-controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.minPolarAngle = Math.PI / 1.55;
    controls.enabled = true;

    //controls.enablePan = false;
    // controls.autoRotate = true;
    controls.rotateSpeed = 0.45;
    controls.autoRotateSpeed = 0.30;

    controls.minDistance = 250;
    controls.maxDistance = 1500;

    // Register resize listener
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }, false);

    // Register fps counter
    fpsTracker = document.getElementById('fpsCount');
    fishTracker = document.getElementById('fishCount');

    xTracker = document.getElementById('x');
    yTracker = document.getElementById('y');
    zTracker = document.getElementById('z');

    loadAnimatedModel();



    // Render-loop
    animate();
}

function loadAnimatedModel() {
    var manager = new THREE.LoadingManager(loadModel);
    var loader = new THREE.FBXLoader(manager);

    loader.load("/resources/fish.fbx", (model) => {
        cachedModel = model;
    }, onProgress, onError, null, false);
}

var cachedModel;

function onError() {
    console.log('ERROR LOADING MODEL!');
}

function onProgress(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log('Loading Model: ' + Math.round(percentComplete, 2) + '%');
    }
}

function loadModel() {
    setTimeout(function () {

        for (let added = 0; added < 100; added++) {
            // Clone
            const fish = SkeletonUtils.clone(cachedModel);

            // Apply texture
            fish.traverse(e => {
                if (e.isMesh) {
                    e.material = e.material.clone();
                    e.material.color.set((Math.random() * 0xffffff) | 0);
                }
            });

            const mixer = new THREE.AnimationMixer(fish);

            // Start animation
            for (let i = 0; i < 3; i++) {
                const action = mixer.clipAction(cachedModel.animations[i]);
                mixers.push(mixer);
                action.play();
            }

            // Randomly position
            const x = Math.round(Math.random() * 1500) - 1000;
            const y = Math.round(Math.random() * 1500) - 1000;
            const z = Math.round(Math.random() * 1500) - 1000;

            fish.position.set(x, y, z);
            fish.receiveShadow = true;
            fish.castShadow = true;

            fish.updateMatrixWorld();
            scene.add(fish);


            // Attach point to determine direction
            const directionPoint = new THREE.Mesh(new THREE.Vector3(0, 0, 0));
            directionPoint.position.set(x + 50, y, z);
            directionPoint.visible = false;

            scene.add(directionPoint);
            fish.attach(directionPoint, scene, fish);


            // Add to boids
            // Create boid object
            var boid = new Boids.Entity({
                x: x,
                y: y,
                z: z,
                obj: fish,
                child: directionPoint,
                bounceManager: bounceManager,
                rotationManager: rotationManager
            });


            fishSpawned += 1;
            // Store boid in array
            boids.push(boid);
        }

        // Fade in 3D scene
        fadeIn(sceneElement);
    }, 10);
}


function countFPS() {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker >= 1000;

    //const fish = boids[0];
    // if (fish == undefined)
    //    return;
    // const pos = fish.velocity;

    if (newSecond) {
        // Update FPS
        fpsTracker.innerText = framesRendered;
        fishTracker.innerText = fishSpawned;
        secondTracker = now;
        framesRendered = 0;
    }

    framesRendered += 1;

    // Seems to be standarized however needs to be detected/hotfixed for negative rotation
    // fish.obj.getWorldQuaternion().y

    // const pp = fish.obj.getWorldPosition();
    //  const cp = fish.child.getWorldPosition();
    // const dir = getDirectionFromChild(pp, cp);

    //xTracker.innerText = "X: " + Math.round(camera.position.x);// + "  |  Moving: " + velocityToDirection(fish.velocity);
    // yTracker.innerText = "Y: " + Math.round(camera.position.y);// + "  | (" + 0 + ") Facing: " + dir;;
    //zTracker.innerText = "Z: " + Math.round(camera.position.z);


    renderer.render(scene, camera);
}

let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30;

var previousFrame;

function animate() {
    // Auto-rotate/update camera
    controls.update();

    // Render scene
    renderer.render(scene, camera);

    window.requestAnimationFrame((frame) => {
        /*
        const fish = boids[0];

        if (fish != undefined) {
            camera.updateMatrix();
            camera.updateMatrixWorld();
            var frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

            const pos = fish.obj.position;
            if (!frustum.containsPoint(pos)) {
                // Fish is not visible
                console.log("Fish is not visible");
            }
        }
        */

        delta += clock.getDelta();

        // Update fishses' position
        if (delta > interval) {
            // Update particles

            if (particles) {
                const timeElapsed = (frame - previousFrame) * 0.001;
                particles.Step(timeElapsed);
                previousFrame = frame;
            }
            // Update animations
            for (let i = 0; i < mixers.length; i++) mixers[i].update((Math.random() * 20 + 10) / 1000);

            Boids.update(boids, bounceManager, rotationManager);
            delta = delta % interval;
        }

        // FPS counter
        countFPS();

        // Loop
        animate();
    });
}

getFrameRate();