import {
    SkeletonUtils
} from "/js/libs/threejs/models/SkeletonUtils.js";

import * as Boids from '/js/boids/boid.js';

// Cache
let cachedModel, cachedParams;

export function removeFishFromScene() {
    const sel = cachedParams.selected;

    // Find fish to remove
    for (let boid of cachedParams.boids) {
        // Check if boid is selected - ignore if so
        if (boid == undefined || sel != undefined && sel.obj == boid.obj)
            continue;

        // Fish is not selected - remove from boid
        const toRemove = cachedParams.scene.getObjectByName(boid.obj.name);
        cachedParams.scene.remove(toRemove);

        const index = cachedParams.boids.indexOf(boid);
        cachedParams.boids.splice(index, 1);
        cachedParams.spawned -= 1;
        break;
    }
}

export function addFishToScene() {
    // Clone
    const fish = SkeletonUtils.clone(cachedModel);

    // Apply texture and cache mesh for fish selection
    fish.traverse(e => {
        if (e.isMesh) {
            cachedParams.sceneObjects.push({
                mesh: e,
                obj: fish
            });

            e.material = e.material.clone();
            e.material.color.set((Math.random() * 0xffffff) | 0);
        }
    });

    const mixer = new THREE.AnimationMixer(fish);

    // Start animation
    for (let i = 0; i < 3; i++) {
        const action = mixer.clipAction(cachedModel.animations[i]);
        cachedParams.animations.push(mixer);
        action.play();
    }

    // Randomly position
    const x = Math.round(Math.random() * 1500) - 1000;
    const y = Math.round(Math.random() * 1500) - 1000;
    const z = Math.round(Math.random() * 1500) - 1000;

    fish.name = 'FISH' + (Math.random() * 1000);
    fish.position.set(x, y, z);
    fish.receiveShadow = true;
    fish.castShadow = true;

    fish.updateMatrixWorld();
    cachedParams.scene.add(fish);

    // Attach point to determine direction
    const directionPoint = new THREE.Mesh(new THREE.Vector3(0, 0, 0));
    directionPoint.position.set(x + 50, y, z);
    directionPoint.visible = false;

    cachedParams.scene.add(directionPoint);
    fish.attach(directionPoint, cachedParams.scene, fish);

    // Create boid object
    var boid = new Boids.Entity({
        x: x,
        y: y,
        z: z,
        obj: fish,
        child: directionPoint
    });

    // Store boid in array
    cachedParams.boids.push(boid);
    cachedParams.spawned += 1;
}

export function loadAnimatedModel(params) {
    var manager = new THREE.LoadingManager(onComplete);
    var loader = new THREE.FBXLoader(manager);

    loader.load("/resources/fish.fbx", (model) => {
        cachedModel = model;
        cachedParams = params;
    }, onProgress, onError, null, false);
}

function onComplete() {
    setTimeout(function () {
        // Add in fish to scene
        const toAdd = cachedParams.isMobile ? 50 : 100;

        for (let added = 0; added < toAdd; added++)
            addFishToScene();


        // Hide loading identifier
        document.getElementById('loadStatus').style.display = 'none';

        // Fade in 3D scene
        fadeIn(cachedParams.element, false);
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

function fadeIn(element, slowFade, info) {
    var opacity = 0;
    var intervalID = setInterval(function () {
        if (opacity < 1) {
            opacity = opacity + 0.1
            element.style.opacity = opacity;

            if (info != undefined)
                info.style.opacity = opacity;
        } else {
            clearInterval(intervalID);
            const desc = document.getElementById('desc');

            if (desc.style.opacity != 0)
                return;
            fadeIn(desc, true, document.getElementById('info'));
        }
    }, (slowFade ? 100 : 50));
}