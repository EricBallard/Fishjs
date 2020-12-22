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

// 3D Graphics
var scene, camera, renderer, controls, frame;

// Boid data
var boids = [];

// Stats & Info
var fps, framesRendered, secondTracker = null;

var xTracker, yTracker, zTracker;

function initialize() {
    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 60, 25000);
    camera.position.set(-1100, -500, -1000);

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

    let skyboxGeo = new THREE.BoxGeometry(5000, 5000, 5000);
    scene.add(new THREE.Mesh(skyboxGeo, materialArray));

    // Add light to scene
    let light = new THREE.PointLight();
    light.position.set(10, 10, 10);
    scene.add(light);


    // Configure user-controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = true;

    //controls.enablePan = false;
    //controls.autoRotate = true;
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
    fps = document.getElementById('fps');
    xTracker = document.getElementById('x');
    yTracker = document.getElementById('y');
    zTracker = document.getElementById('z');

    loadAnimatedModel();

    // Render-loop
    animate();
}

function loadAnimatedModel() {
    //this.mixer = new THREE.AnimationMixer(model);
    //this._mixers.push(this.mixer);

    //const anim = model.animations[0];

    //console.log('ANIM: ' + anim);
    //const idle = _APP.mixer.clipAction(anim);
    //idle.play();


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
        for (let added = 0; added < 1; added++) {
            // Clone
            var fish = SkeletonUtils.clone(cachedModel);

            // Apply texture
            fish.traverse(e => {
                if (e.isMesh) {
                    e.material = e.material.clone();
                    e.material.color.set((Math.random() * 0xffffff) | 0);
                }
            });

            // Randomly position
            const x = Math.round(Math.random() * 1000);
            const y = Math.round(Math.random() * 1000);
            const z = Math.round(Math.random() * 1000);

            fish.position.set(x, y, z);
            fish.receiveShadow = true;
            fish.castShadow = true;

            fish.updateMatrixWorld();
            scene.add(fish);

            // Add to boids
            // Create boid object
            var boid = new Boids.Entity({
                x: x,
                y: y,
                z: z,
                obj: fish
            });


            // Store boid in array
            boids.push(boid);
        }
    }, 10);
}



Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

function countFPS() {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker > 1000;
    const fish = boids[0];

    if (fish == undefined)
        return;

    const pos = fish.velocity;
    if (newSecond) {
        // Update FPS
        secondTracker = now;
        framesRendered = 1;
    } else {
        framesRendered += 1;
    }

    fps.innerText = "FPS: " + framesRendered + "  |  Facing: " +  Boids.getDirection(fish.obj.quaternion);
    xTracker.innerText = "X: " + Math.round(camera.position.x) + "  |  Moving: " + Boids.velocityToDirection(fish.velocity);
    yTracker.innerText = "Y: " + Math.round(camera.position.y);
    zTracker.innerText = "Z: " + Math.round(camera.position.z);

    renderer.render(scene, camera);
}

let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30;


function animate() {
    // Auto-rotate camera
    controls.update();

    // Render scene
    renderer.render(scene, camera);

    frame = window.requestAnimationFrame(() => {
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
            Boids.update(boids);
            delta = delta % interval;
        }

        // FPS counter
        countFPS();

        // Loop
        animate();
    });
}


initialize();