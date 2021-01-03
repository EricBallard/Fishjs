import {
    SkeletonUtils
} from "/js/libs/models/SkeletonUtils.js";

import * as Boids from '/js/boids/boid.js';

// Cache
var cachedModel,
    bounceManager,
    rotationManager,
    animations,
    boids,
    scene,
    element;

let fishSpawned;

export function loadAnimatedModel(params) {
    var manager = new THREE.LoadingManager(loadModel);
    var loader = new THREE.FBXLoader(manager);

    loader.load("/resources/fish.fbx", (model) => {
        cachedModel = model;
        bounceManager = params.bounceManager;
        rotationManager = params.rotationManager;
        animations = params.animations;
        boids = params.boids,
        scene = params.scene,
        element = params.element,

        fishSpawned = params.spawned;
    }, onProgress, onError, null, false);
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
                animations.push(mixer);
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
        fadeIn(element, false);
    }, 10);
}

function onProgress(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log('Loading Model: ' + Math.round(percentComplete, 2) + '%');
    }
}

function onError() {
    console.log('ERROR LOADING MODEL!');
}

function fadeIn(element, slowFade) {
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
            fadeIn(infoStatus, true);
        }
    }, (slowFade ? 100 : 50));
}
