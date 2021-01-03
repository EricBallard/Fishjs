/*
    Render Scene
*/
import {
    update
} from '/js/boids/boid.js';

// Track time between frame renders - used to limit animation framte
let clock = new THREE.Clock();

let desiredFrameRate = -1,
    interval = 1 / 30,
    delta = 0;


// Process updates
export function render(params) {
    // Auto-rotate/update camera
    params.controls.update();

    // Render scene from cameras perspective
    params.renderer.render(params.scene, params.camera);

    window.requestAnimationFrame(() => {
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
            // Update animations
            for (let i = 0; i < params.animations.length; i++) params.animations[i].update((Math.random() * 20 + 10) / 1000);

            update(params.boids, params.bounceManager, params.rotationManager);
            delta = delta % interval;
        }

        // FPS counter
        countFPS(params.fps, params.fish, params.spawned);

        // Loop
        render(params);
    });
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

    getDesired().then(fps => desiredFrameRate = Math.floor(fps));

    while (desiredFrameRate == -1) {
        console.log('Calculating frame rate...');
        await sleep(1000);
    }

    console.log('Desired Frame Rate: ' + desiredFrameRate);
    loadStatus.style.display = 'none';

    initialize();
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

export function countFPS(fps, fish, spawned) {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker >= 1000;

    //const fish = boids[0];
    // if (fish == undefined)
    //    return;
    // const pos = fish.velocity;

    if (newSecond) {
        // Update FPS
        fps.innerText = framesRendered;
        fish.innerText = spawned;
        secondTracker = now;
        framesRendered = 0;
    }

    framesRendered += 1;

    // Seems to be standarized however needs to be detected/hotfixed for negative rotation
    // fish.obj.getWorldQuaternion().y

    // const pp = fish.obj.getWorldPosition();
    //  const cp = fish.child.getWorldPosition();
    // const dir = getDirectionFromChild(pp, cp);

    //xTracker.innerText = "X: " + Math.round(camera.position.x); // + "  |  Moving: " + velocityToDirection(fish.velocity);
    //yTracker.innerText = "Y: " + Math.round(camera.position.y); // + "  | (" + 0 + ") Facing: " + dir;;
    //zTracker.innerText = "Z: " + Math.round(camera.position.z);
}