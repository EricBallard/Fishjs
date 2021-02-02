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
    renderInterval = undefined,
    delta = 0;

let loaded = true,
    hidLoadingScreen = false;

// Process updates
export function render(appInfo) {
    if (!loaded) {
        if (!hidLoadingScreen) {
            // Hide loading identifier
            document.getElementById('loadStatus').style.display = 'none';

            // Fade in 3D scene
            fade(appInfo.element, true, true);
            hidLoadingScreen = true;
        } else if (appInfo.element.style.opacity >= 0.9) {
            // Fade in description
            fade(document.getElementById('desc'), true, true);

            // Init particle system
            appInfo.controls.enabled = true;
            loaded = true;
        }
    }

    // Auto-rotate/update controls and camera
    appInfo.controls.update();

    // Render scene with post-processing
    appInfo.composer.render();

    // Update boids
    window.requestAnimationFrame(() => {
        if (renderInterval != undefined) {
            delta += clock.getDelta();

            // Update fishses' position
            if (delta > renderInterval) {
                delta = delta % renderInterval;

                // Check if selected fished is visible
                if (appInfo.selected != undefined)
                    alignCameraToSelected(appInfo);

                // Update boids
                update(appInfo);
            }
        } else {
            if (appInfo.targetFPS != -1) {
                safeInterval = Math.round((appInfo.targetFPS / 20) * appInfo.targetFPS / 30);
                renderInterval = 1 / (appInfo.targetFPS > 90 ? 60 : 30);
                loaded = false;
            }
        }


        // FPS counter
        countFPS(appInfo);

        // Loop
        render(appInfo);
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
        ' is ' + dir + ', moving at \n' + boid.speed.toFixed(2) +
        ' cm/s with ' + boid.othersInPerception +
        ' other' + (boid.othersInPerception == 1 ? '' : 's') +
        ' in perception!';
}

export function click(e, appInfo) {
    // Prevent selected fish before fully loaded/presented
    if (!hidLoadingScreen || !loaded)
        return;

    const pos = getPosition(e, appInfo.width, appInfo.height);
    appInfo.raycaster.setFromCamera(pos, appInfo.camera);

    const meshes = [];
    for (let so of appInfo.sceneObjects)
        meshes.push(so.mesh);

    const intersects = appInfo.raycaster.intersectObjects(meshes, false);
    let selectedMesh;

    // If ray intersects with an object and that object is not currently selected
    if (intersects.length > 0 &&
        (selectedMesh = intersects[0].object) != undefined) {

        // Deselect current
        if (appInfo.selected != undefined && appInfo.selected.mesh == selectedMesh) {
            // Fade out selected in
            fade(appInfo.info, false);

            // Set selected to undefined
            appInfo.outLine.selectedObjects = [];
            appInfo.selected = undefined;

            appInfo.controls.autoRotate = true;
            return;
        }

        // Select current
        const array = [];
        array.push(selectedMesh);
        let selectedObj = undefined;

        for (let so of appInfo.sceneObjects) {
            if (so.mesh == selectedMesh) {
                selectedObj = so.obj;
                break;
            }
        }

        if (selectedObj == undefined) {
            console.log('Selection failed - unable to find related object and mesh!');
            appInfo.selected = undefined;
            return;
        }

        let boid = undefined;
        for (let b of appInfo.boids) {
            if (b.obj == selectedObj) {
                boid = b;
                break;
            }
        }

        if (boid == undefined) {
            console.log('Selection failed - unable to find related boid!');
            appInfo.selected = undefined;
            return;
        }

        // Set as selected
        appInfo.selected = {
            mesh: selectedMesh,
            obj: selectedObj,
            boid: boid
        };

        appInfo.controls.autoRotate = false;
        appInfo.outLine.selectedObjects = array;
        appInfo.selectedInfo.innerText = getSelectedInfo(boid);

        // Fade in selected info
        if (appInfo.info.style.opacity < 1)
            fade(appInfo.info, true);
    }
}

// Rotate camera to selected fish
let rotatingCamera = false;

function alignCameraToSelected(appInfo) {
    let pos = appInfo.selected.obj.position;

    // Update camera projection
    appInfo.camera.updateMatrix();
    appInfo.camera.updateMatrixWorld();

    // Define out view
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(appInfo.camera.projectionMatrix, appInfo.camera.matrixWorldInverse));

    if (!frustum.containsPoint(pos)) {
        if (!rotatingCamera) {
            // Selected is not visible - rotate camera
            const controls = appInfo.controls,
                camera = appInfo.camera;

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

export function countFPS(appInfo) {
    const now = new Date().getTime();
    if (secondTracker == null) secondTracker = now;
    const newSecond = now - secondTracker >= 1000;

    if (newSecond) {
        // Update selected info
        if (appInfo.selected != null)
            appInfo.selectedInfo.innerText = getSelectedInfo(appInfo.selected.boid);

        // Manage fps by removing/adding fish
        manageFPS(appInfo, framesRendered);

        // Update FPS
        appInfo.fps.innerText = framesRendered;
        appInfo.fish.innerText = appInfo.spawned;
        secondTracker = now;
        framesRendered = 0;
    }

    framesRendered += 1;
}

let lastFPS = undefined,
    potentialTarget = undefined;

const commonFrateRates = [24, 29, 59, 74, 89, 119, 143];

function manageFPS(appInfo, currentFPS) {
    /*
        Add/Remove fish from scene to maintain
        optimal fps with maximum visual display
    */

    // Detect optimal fps
    if (appInfo.targetFPS == -1) {
        if (lastFPS == undefined) {
            lastFPS = currentFPS;
        } else if (Math.abs(currentFPS - lastFPS) <= 2)
            return;

        for (let cfr of commonFrateRates) {
            if (Math.abs(cfr - currentFPS) <= 2) {
                if (potentialTarget != undefined) {
                    if (potentialTarget == cfr) {
                        console.log('Target FPS: ' + cfr);
                        appInfo.targetFPS = cfr;
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
    if (currentFPS >= appInfo.targetFPS && lastFPS >= appInfo.targetFPS) {
        //addFishToScene();
    } else if (currentFPS < lastFPS + 2 && currentFPS <= appInfo.targetFPS - safeInterval && lastFPS <= appInfo.targetFPS - safeInterval) {
        removeFishFromScene();
    }

    lastFPS = currentFPS;
}