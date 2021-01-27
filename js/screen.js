/*
    Render Scene
*/
import {
    update
} from '/js/boids/boid.js';

import {
    ParticleSystem
} from '/js/particles.js';

import {
    addFishToScene,
    removeFishFromScene
} from '/js/boids/model.js';

//Util
function fade(element, fadeIn) {
    var opacity = fadeIn ? 0 : 1;

    var intervalID = setInterval(function () {
        if (fadeIn ? opacity < 1 : opacity > 0) {
            opacity = opacity + (fadeIn ? 0.1 : -0.1);
            element.style.opacity = opacity;
        } else {
            clearInterval(intervalID);
        }
    }, 50);
}

// Track time between frame renders - used to limit animation framte
let clock = new THREE.Clock(),
    safeInterval = undefined,
    renderInterval = undefined;

let delta = 0, lastFrame = undefined;

let loaded = true,
    hidLoadingScreen = false;

// Process updates
export function render(params) {
    if (!loaded) {
        if (!hidLoadingScreen) {
            // Hide loading identifier
            document.getElementById('loadStatus').style.display = 'none';

            // Fade in 3D scene
            fade(params.element, true, true);
            hidLoadingScreen = true;
        } else if (params.element.style.opacity >= 0.9) {
            // Fade in description
            fade(document.getElementById('desc'), true, true);

            // Init particle system
            params.particles = new ParticleSystem(params);

            loaded = true;
        }
    }

    // Auto-rotate/update controls and camera
    params.controls.update();

    // Render scene with post-processing
    params.composer.render();

    window.requestAnimationFrame((frame) => {
        if (renderInterval != undefined) {
            delta += clock.getDelta();

            // Update fishses' position
            if (delta > renderInterval) {
                delta = delta % renderInterval;

                // Check if selected fished is visible
                if (params.selected != undefined)
                    alignCameraToSelected(params);

                // Update particles
                if (lastFrame && params.particles)
                    params.particles.update((frame - lastFrame) * 0.001);

                lastFrame = frame;

                // Update animations - TODO: update via gsap or remove gsap and write local util
                for (let i = 0; i < params.animations.length; i++) params.animations[i].update(.0025);

                // Update boids
                update(params);

                // Noise
                params.noise += 0.001;
                params.pass.uniforms['amount'].value = params.noise;
            }
        } else {
            if (params.targetFPS != -1) {
                renderInterval = 1 / (params.targetFPS > 90 ? 60 : 30);
                safeInterval = params.targetFPS / 3;
                loaded = false;
            }
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

function getSelectedInfo(boid) {
    // Format info 
    let dir = 'going ' + boid.rotationManager.facing;

    if (dir == null) {
        const y = boid.velocity.y;
        dir = (y > 0 ? 'going up' : y < 0 ? ' going down' : 'stationary');
    }

    // Set selected info
    return boid.obj.name.split('_')[0] +
        ' is ' + dir + ', moving at \n' +
        ' cm/s with ' + boid.othersInPerception +
        ' other' + (boid.othersInPerception == 1 ? '' : 's') +
        ' in perception!';
}

export function click(e, params) {
    // Prevent selected fish before fully loaded/presented
    if (!hidLoadingScreen || !loaded)
        return;

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
            // Fade out selected in
            fade(params.info, false);

            // Set selected to undefined
            params.outLine.selectedObjects = [];
            params.selected = undefined;

            params.controls.autoRotate = true;
            return;
        }

        // Select current
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

        let boid = undefined;
        for (let b of params.boids) {
            if (b.obj == selectedObj) {
                boid = b;
                break;
            }
        }

        if (boid == undefined) {
            console.log('Selection failed - unable to find related boid!');
            params.selected = undefined;
            return;
        }

        // Set as selected
        params.selected = {
            mesh: selectedMesh,
            obj: selectedObj,
            boid: boid
        };

        params.controls.autoRotate = false;
        params.outLine.selectedObjects = array;
        params.selectedInfo.innerText = getSelectedInfo(boid);

        // Fade in selected info
        if (params.info.style.opacity < 1)
            fade(params.info, true);
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
                duration: 2.5,
                zoom: camera.zoom,
                onUpdate: () => camera.updateProjectionMatrix()
            });

            gsap.to(camera.position, {
                duration: 2.5,
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

// Track current rate
let framesRendered = 0,
    secondTracker = null;

export function countFPS(params) {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker >= 1000;

    if (newSecond) {
        // Update selected info
        if (params.selected != null)
            params.selectedInfo.innerText = getSelectedInfo(params.selected.boid);

        manageFPS(params, framesRendered);

        // Update FPS
        params.fps.innerText = framesRendered;
        params.fish.innerText = params.spawned;
        secondTracker = now;
        framesRendered = 0;
    }

    framesRendered += 1;
}

let lastFPS = undefined,
    potentialTarget = undefined;

const commonFrateRates = [24, 29, 59, 74, 89, 119, 143];

async function manageFPS(params, currentFPS) {
    /*
        Add/Remove fish from scene to maintain
        optimal fps with maximum visual display
    */

    // Detect optimal fps
    if (params.targetFPS == -1) {
        if (lastFPS == undefined) {
            lastFPS = currentFPS;
        } else if (Math.abs(currentFPS - lastFPS) <= 2)
            return;

        for (let cfr of commonFrateRates) {
            if (Math.abs(cfr - currentFPS) <= 2) {
                if (potentialTarget != undefined) {
                    if (potentialTarget == cfr) {
                        console.log('Target FPS: ' + cfr);
                        params.targetFPS = cfr;
                        break;
                    }
                }

                potentialTarget = cfr;
                break;
            }
        }
        return;
    }

    // Add/remove fish to maintain optimal fps
    if (currentFPS >= params.targetFPS && lastFPS >= params.targetFPS) {
        addFishToScene();
        await new Promise(resolve => setTimeout(resolve, 2000));
    } else if (currentFPS < lastFPS && currentFPS <= params.targetFPS - safeInterval && lastFPS <= params.targetFPS - safeInterval) {
        removeFishFromScene();
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    lastFPS = currentFPS;
}