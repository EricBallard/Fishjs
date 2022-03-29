import { SkeletonUtils } from '/js/libs/threejs/models/SkeletonUtils.js';

import * as Boids from '/js/boids/boid.js';

// Cache
let cachedModel, app;

export function removeFishFromScene() {
  const sel = app.selected;

  // Find fish to remove
  for (let boid of app.boids) {
    // Check if boid is selected - ignore if so
    if (boid == undefined || (sel != undefined && sel.obj == boid.obj))
      continue;

    // Fish is not selected - remove from boid
    const toRemove = app.scene.getObjectByName(boid.obj.name);
    app.scene.remove(toRemove);

    const index = app.boids.indexOf(boid);
    app.boids.splice(index, 1);
    app.spawned -= 1;
    break;
  }
}

// Generate random names & colors
const names = ['Angel', 'Boss', 'Charlie', 'Don', 'Eric', 'Finn',
  'George', 'Hilda', 'Isiah', 'Jacob', 'Kendall', 'Lisa', 'Marceline',
  'Nina', 'Olivia', 'Pete', 'Quinn', 'Rose', 'Sarah', 'Trevor', 'Urijah',
  'Veronica', 'Weston', 'Xavier', 'Yoana', 'Zen',
];

export function addFishToScene() {
  // Clone model, bones, and anims
  const fish = SkeletonUtils.clone(cachedModel.scene);
  const size = Number(Math.random() * 200 + 200);
  fish.scale.set(size, size, size);

  // Apply material and cache mesh for fish selection 
  fish.traverse((e) => {
    if (e.isSkinnedMesh) {
      // Set mesh to random color
      e.material = new THREE.MeshPhysicalMaterial({
        color: Math.random() * 0xffffff,
        clearcoatRoughness: 0,
        roughness: 0,
        metalness: 0,
        reflectivity: 1,
        clearcoat: 1,
        skinning: true,
        map: e.material.map
      });

      e.size = size;

      // Cache mesh for raycast selection
      app.sceneObjects.push({
        mesh: e,
        obj: fish
      });
    }
  });

  // Add animations
  const mixer = new THREE.AnimationMixer(fish),
    clip = mixer.clipAction(cachedModel.animations[1]);

    clip.play();


  // Randomly position
  const seed = app.spawned * 10;
  const x = Math.round(Math.random() * 2000) + (Math.random() < 0.5 ? -seed : seed);
  const y = Math.round(Math.random()) + (Math.random() < 0.5 ? -seed : seed) - 300;
  const z = Math.round(Math.random() * 2000) + (Math.random() < 0.5 ? -seed : seed);

  fish.name = names[Math.floor(Math.random() * names.length)] + '_' + Math.random() * 1000;
  fish.position.set(x, y, z);
  fish.receiveShadow = true;
  fish.castShadow = true;

  fish.updateMatrixWorld();
  fish.motionBlur = { renderTransparent: true }
  app.scene.add(fish);

  //debug
  //const directionPoint = new THREE.Mesh(new THREE.CubeGeometry(1, 25, 1));

  // Attach point to determine direction
  const directionPoint = new THREE.Mesh(new THREE.Vector3(0, 0, 0));
  directionPoint.position.set(x + 50, y, z);
  directionPoint.visible = false;

  app.scene.add(directionPoint);
  fish.attach(directionPoint, app.scene, fish);

  // Create boid object
  let boid = new Boids.Entity({
    x: x,
    y: y,
    z: z,
    obj: fish,
    child: directionPoint,
    animations: mixer
  });

  // Store boid in array
  app.boids.push(boid);
  app.spawned += 1;
}

export function loadAnimatedModel(params) {
  var manager = new THREE.LoadingManager(onComplete);
  var loader = new THREE.GLTFLoader(manager);
  THREE.Cache.enabled = true;


  loader.load('/resources/fish.glb', (model) => {
    cachedModel = model;
    app = params;
  }, onProgress, onError, null, false);
}

function onComplete() {
  setTimeout(function () {
    // Add in fish to scene
   // const toAdd = app.isMobile ? 40 : 100;
    const toAdd = 1;
    for (let added = 0; added < toAdd; added++) addFishToScene();
  }, 10);
}

function onProgress(xhr) {
  if (xhr.lengthComputable) {
    var percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log('Loading Model: ' + Math.round(percentComplete, 2) + '%');
  }
}

function onError() {
  alert('Error loading fish model! Please check your internet connection and try again.');
}
