/*
    Render Scene
*/
import {
    update
} from '/js/boids/boid.js';


// Track time between frame renders - used to limit animation framte
let clock = new THREE.Clock(),
    rotatingCamera = false;

let desiredFrameRate = -1,
    interval = 1 / 30,
    delta = 0;

// Process updates
export function render(params) {
    // Auto-rotate/update controls and camera
    params.controls.update();

    // Render scene with post-processing
    params.composer.render();

    window.requestAnimationFrame(() => {

        const fish = params.boids[0];

        if (fish != undefined) {
            // Outline obj
            if (params.outLine.selectedObjects.length < 1) {
                console.log('Adding selected obj!!!');

                const array = [];
                array.push(fish.obj);
                params.outLine.selectedObjects = array;
            }


            params.camera.updateMatrix();
            params.camera.updateMatrixWorld();
            var frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(params.camera.projectionMatrix, params.camera.matrixWorldInverse));

            const pos = fish.obj.position;
            if (!frustum.containsPoint(pos)) {
                // Fish is not visible
                if (!rotatingCamera) {
                    const controls = params.controls,
                        camera = params.camera;

                    rotatingCamera = true;
                    controls.enabled = false;
                    controls.update();

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

        delta += clock.getDelta();

        // TODO: update anims via gsap

        // Update fishses' position
        if (delta > interval) {
            // Update animations
            for (let i = 0; i < params.animations.length; i++) params.animations[i].update((Math.random() * 20 + 10) / 1000);

            update(params.boids, params.bounceManager, params.rotationManager);
            delta = delta % interval;
        }

        // FPS counter
        countFPS(params.fps, params.fish, params.spawned, params.camera, params.x, params.y, params.z);

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

export function countFPS(fps, fish, spawned, camera, x, y, z) {
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

    x.innerText = "X: " + Math.round(camera.position.x); // + "  |  Moving: " + velocityToDirection(fish.velocity);
    y.innerText = "Y: " + Math.round(camera.position.y); // + "  | (" + 0 + ") Facing: " + dir;;
    z.innerText = "Z: " + Math.round(camera.position.z);
}