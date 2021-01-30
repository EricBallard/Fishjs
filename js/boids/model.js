import { SkeletonUtils } from '/js/libs/threejs/models/SkeletonUtils.js';

import * as Boids from '/js/boids/boid.js';

// Cache
let cachedModel, cachedParams;

export function removeFishFromScene() {
  const sel = cachedParams.selected;

  // Find fish to remove
  for (let boid of cachedParams.boids) {
    // Check if boid is selected - ignore if so
    if (boid == undefined || (sel != undefined && sel.obj == boid.obj))
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

// Generate random names & colors
const names = ['Angel', 'Boss', 'Charlie', 'Don', 'Eric', 'Finn',
  'George', 'Hilda', 'Isiah', 'Jacob', 'Kendall', 'Lisa', 'Marceline',
  'Nina', 'Olivia', 'Pete', 'Quinn', 'Rose', 'Sarah', 'Trevor', 'Urijah',
  'Veronica', 'Weston', 'Xavier', 'Yoana', 'Zen',
];

const getRandomColor = () => {
  const color = THREE.Color();
  color.setStyle();
  return THREE.Color()
}


export function addFishToScene() {
  // Clone model, bones, and anims
  const fish = SkeletonUtils.clone(cachedModel);
  const size = Number(Math.random() * 2 + 1);
  fish.scale.set(size, size, size);

  // Apply texture and cache mesh for fish selection
  fish.traverse((e) => {
    if (e.isMesh) {
      // Set mesh to random color
      e.material = new THREE.MeshPhysicalMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0,
        metalness: 0,
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0
      });

      // Cache mesh for raycast selection
      cachedParams.sceneObjects.push({
        mesh: e,
        obj: fish
      });
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
  const seed = cachedParams.spawned * 10;
  const x = Math.round(Math.random() * 2000) + (Math.random() < 0.5 ? -seed : seed);
  const y = Math.round(Math.random()) + (Math.random() < 0.5 ? -seed : seed) - 300;
  const z = Math.round(Math.random() * 2000) + (Math.random() < 0.5 ? -seed : seed);

  fish.name = names[Math.floor(Math.random() * names.length)] + '_' + Math.random() * 1000;

  fish.position.set(x, y, z);
  fish.receiveShadow = true;
  fish.castShadow = true;

  fish.updateMatrixWorld();
  cachedParams.scene.add(fish);

  //debug
  //const directionPoint = new THREE.Mesh(new THREE.CubeGeometry(1, 25, 1));

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
    child: directionPoint,
  });

  // Store boid in array
  cachedParams.boids.push(boid);
  cachedParams.spawned += 1;

}

export function loadAnimatedModel(params) {
  var manager = new THREE.LoadingManager(onComplete);
  var loader = new THREE.FBXLoader(manager);

  loader.load('/resources/fish.fbx', (model) => {
    cachedModel = model;
    cachedParams = params;
  }, onProgress, onError, null, false
  );
}

function onComplete() {
  setTimeout(function () {
    // Add in fish to scene
    const toAdd = cachedParams.isMobile ? 40 : 100;

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
