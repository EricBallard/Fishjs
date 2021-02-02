import { SkeletonUtils } from '/js/libs/threejs/models/SkeletonUtils.js';

import * as Boids from '/js/boids/boid.js';

// Cache
let cachedModel, appInfo;

export function removeFishFromScene() {
  const sel = appInfo.selected;

  // Find fish to remove
  for (let boid of appInfo.boids) {
    // Check if boid is selected - ignore if so
    if (boid == undefined || (sel != undefined && sel.obj == boid.obj))
      continue;

    // Fish is not selected - remove from boid
    const toRemove = appInfo.scene.getObjectByName(boid.obj.name);
    appInfo.scene.remove(toRemove);

    const index = appInfo.boids.indexOf(boid);
    appInfo.boids.splice(index, 1);
    appInfo.spawned -= 1;
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
      appInfo.sceneObjects.push({
        mesh: e,
        obj: fish
      });
    }
  });

  // Randomly position
  const seed = appInfo.spawned * 10;
  const x = Math.round(Math.random() * 2000) + (Math.random() < 0.5 ? -seed : seed);
  const y = Math.round(Math.random()) + (Math.random() < 0.5 ? -seed : seed) - 300;
  const z = Math.round(Math.random() * 2000) + (Math.random() < 0.5 ? -seed : seed);

  fish.name = names[Math.floor(Math.random() * names.length)] + '_' + Math.random() * 1000;

  fish.position.set(x, y, z);
  fish.receiveShadow = true;
  fish.castShadow = true;

  fish.updateMatrixWorld();
  appInfo.scene.add(fish);

  //debug
  //const directionPoint = new THREE.Mesh(new THREE.CubeGeometry(1, 25, 1));

  // Attach point to determine direction
  const directionPoint = new THREE.Mesh(new THREE.Vector3(0, 0, 0));
  directionPoint.position.set(x + 50, y, z);
  directionPoint.visible = false;

  appInfo.scene.add(directionPoint);
  fish.attach(directionPoint, appInfo.scene, fish);

  const mixer = new THREE.AnimationMixer(fish),
    mixers = [];

  // Start animation
  for (let i = 0; i < 3; i++) {
    const action = mixer.clipAction(cachedModel.animations[i]);
    mixers.push(mixer);
    action.play();
  }

  // Create boid object
  var boid = new Boids.Entity({
    x: x,
    y: y,
    z: z,
    obj: fish,
    child: directionPoint,
    animations: mixers
  });

  // Store boid in array
  appInfo.boids.push(boid);
  appInfo.spawned += 1;


}

export function loadAnimatedModel(params) {
  var manager = new THREE.LoadingManager(onComplete);
  var loader = new THREE.FBXLoader(manager);

  loader.load('/resources/fish.fbx', (model) => {
    cachedModel = model;
    appInfo = params;
  }, onProgress, onError, null, false
  );
}

function onComplete() {
  setTimeout(function () {
    // Add in fish to scene
    const toAdd = appInfo.isMobile ? 40 : 100;

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
