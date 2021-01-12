/*
    Render Scene
*/
import {
    update
} from '/js/boids/boid.js';

import {
    addFishToScene,
    removeFishFromScene
} from '/js/boids/model.js';

// Track time between frame renders - used to limit animation framte
let clock = new THREE.Clock();

let interval = 1 / 60,
    delta = 0;

// Process updates
export function render(params) {
    // Auto-rotate/update controls and camera
    params.controls.update();

    // Render scene with post-processing
    params.composer.render();

    window.requestAnimationFrame(() => {
        delta += clock.getDelta();

        // Update fishses' position
        if (delta > interval) {
            delta = delta % interval;

            // Check if selected fished is visible
            if (params.selected != undefined)
                alignCameraToSelected(params);

            // Update animations TODO: update via gsap
            for (let i = 0; i < params.animations.length; i++) params.animations[i].update(.01);

            // Update boids
            update(params.boids, params.bManagers, params.rManagers);
        }

        // FPS counter
        countFPS(params);

        // Loop
        render(params);
    });
}

/*
    Fish selection
*/

function getPosition(e, width, height) {
    const x = ((e.changedTouches ? e.changedTouches[0].clientX : e.clientX) / width) * 2 - 1,
        y = -((e.changedTouches ? e.changedTouches[0].clientY : e.clientY) / height) * 2 + 1;
    return new THREE.Vector2(x, y);
}

export function click(e, params) {
    const pos = getPosition(e, params.width, params.height);
    params.raycaster.setFromCamera(pos, params.camera);

    const meshes = [];
    for (let so of params.sceneObjects)
        meshes.push(so.mesh);

    const intersects = params.raycaster.intersectObjects(meshes, false);
    let selectedMesh;

    // If ray intersects with an object and that object is not currently selected
    if (intersects.length > 0 &&
        (selectedMesh = intersects[0].object) != undefined) {

        // Deselect current
        if (params.selected != undefined && params.selected.mesh == selectedMesh) {
            params.selected = undefined;
            params.outLine.selectedObjects = [];
            return;
        }

        const array = [];
        array.push(selectedMesh);

        let selectedObj = undefined;

        for (let so of params.sceneObjects) {
            if (so.mesh == selectedMesh) {
                selectedObj = so.obj;
                break;
            }
        }

        if (selectedObj == undefined) {
            console.log('Selection failed - unable to find related object and mesh!');
            params.selected = undefined;
            return;
        }

        params.selected = {
            mesh: selectedMesh,
            obj: selectedObj
        };

        params.outLine.selectedObjects = array;
    }
}

// Rotate camera to selected fish
let rotatingCamera = false;

function alignCameraToSelected(params) {
    let pos = params.selected.obj.position;

    // Update camera projection
    params.camera.updateMatrix();
    params.camera.updateMatrixWorld();

    // Define out view
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(params.camera.projectionMatrix, params.camera.matrixWorldInverse));

    if (!frustum.containsPoint(pos)) {
        if (!rotatingCamera) {
            // Selected is not visible - rotate camera
            const controls = params.controls,
                camera = params.camera;

            // Disable controls while animating
            rotatingCamera = true;
            controls.enabled = false;
            controls.update();

            // Animate camera position via gsap api
            gsap.to(camera, {
                duration: 4,
                zoom: camera.zoom,
                onUpdate: () => camera.updateProjectionMatrix()
            });

            gsap.to(camera.position, {
                duration: 4,
                x: pos.x < 0 ? Math.abs(pos.x) : pos.x - (pos.x * 2),
                y: pos.y < 0 ? Math.abs(pos.y) : pos.y - (pos.y * 2),
                z: pos.z < 0 ? Math.abs(pos.z) : pos.z - (pos.z * 2),
                onUpdate: () => controls.update(),
                onComplete: () => {
                    rotatingCamera = false;
                    controls.enabled = true;
                    controls.update();
                }
            });
        }
    }
}

/*
    Frame-rate
*/
import {
    initialize
} from '/js/index.js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Calculate native rate
export async function getFrameRate() {
    const loadStatus = document.getElementById('loadStatus');

    let requested = false;

    let desiredFrameRate,
        frameRate = undefined,
        frameRateVerify = undefined;

    while (true) {
        if (!requested) {
            getDesired().then(fps => frameRate = Math.floor(fps));
            requested = true;
        } else if (frameRate != undefined) {
            if (frameRateVerify == undefined) {
                frameRateVerify = frameRate;
            } else {
                desiredFrameRate = frameRate > frameRateVerify ? frameRate : frameRateVerify;
                break;
            }

            frameRate = undefined;
            requested = false;
        }
        await sleep(500);
    }

    // Normalize polled fps by roundomg to nearest 10th
    desiredFrameRate = Math.round(desiredFrameRate / 10) * 10;
    console.log('Desired Frame Rate: ' + desiredFrameRate);

    // Hide loading identifier
    loadStatus.style.display = 'none';

    // Init app
    initialize(desiredFrameRate);
}

const getDesired = () =>
    new Promise(resolve =>
        requestAnimationFrame(t1 =>
            requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
        )
    );

// Track current rate
let framesRendered = 0,
    secondTracker = null;

export function countFPS(params) {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker >= 1000;

    if (newSecond) {
        manageFPS(params, framesRendered);

        // Update FPS
        params.fps.innerText = framesRendered;
        params.fish.innerText = params.spawned;
        secondTracker = now;
        framesRendered = 0;
    }

    framesRendered += 1;

    // let b;

    // if ((b = params.boids[0]) == undefined)
    //    return;

    // x.innerText = "X: " + b.obj.position.x + " | " + b.velocity.x;
    // y.innerText = "Y: " + b.obj.position.y + " | " + b.velocity.y;
    //z.innerText = "Z: " + b.obj.position.z + " | " + b.velocity.z;
}

let lastFPS = undefined,
    stableFPS = false,
    addedFish = false;

async function manageFPS(params, currentFPS) {
    /*
        Add/Remove fish from scene to maintain
        optimal fps with maximum visual display
    */
    if (lastFPS != undefined) {
        const desiredFPS = params.frameRate;

        if (stableFPS) {
            if (currentFPS >= desiredFPS && lastFPS >= desiredFPS)
                stableFPS = false;
        } else if (currentFPS >= desiredFPS && lastFPS >= desiredFPS) {
            addedFish = true;
            addFishToScene();
            await sleep(1000);
        } else if (currentFPS < desiredFPS) {
            if (addedFish)
                stableFPS = true;
            addedFish = false;
            removeFishFromScene();
            await sleep(1000);
        }
    }

    lastFPS = currentFPS;
}