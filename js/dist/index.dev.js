"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _SkeletonUtils = require("/js/libs/SkeletonUtils.js");

var _SceneUtils = require("/js/libs/SceneUtils.js");

var Boids = _interopRequireWildcard(require("/js/boid.js"));

var _skybox = require("/js/skybox.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Threejs util
// Utils
// 3D Graphics
var scene, camera, renderer, controls; // Boid data

var boids = [],
    mixers = [],
    bounceManager = [],
    rotationManager = []; // Stats & Info

var stats,
    fps,
    framesRendered,
    secondTracker = null;
var xTracker, yTracker, zTracker;

function initialize() {
  // Create scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 60, 25000);
  camera.position.set(-1100, -500, -1000); // Configure renderer and add to DOM

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = 'canvas';
  var body = document.body;
  body.appendChild(renderer.domElement);
  body.appendChild((stats = new Stats()).dom); //Test

  /*
  body.addEventListener('click', () => {
     const rm = rotationManager[0];
       if (rm != undefined) {
         rm.inverse = !rm.inverse;
         console.log('Inversed: ' + rm.inverse);
     }
  });
  */
  // Create skybox textured mesh and add to scene

  var materialArray = (0, _skybox.createMaterialArray)({
    threejs: THREE
  });
  var skyboxGeo = new THREE.BoxGeometry(5000, 5000, 5000);
  scene.add(new THREE.Mesh(skyboxGeo, materialArray)); // Add light to scene

  var light = new THREE.PointLight();
  light.position.set(275, 2400, -1750);
  scene.add(light);
  light = new THREE.AmbientLight(0x252525, 0.01);
  scene.add(light); // Configure user-controls

  controls = new THREE.OrbitControls(camera, renderer.domElement); // controls.minPolarAngle = Math.PI / 1.55;

  controls.enabled = true; // controls.enablePan = false;
  // controls.autoRotate = true;

  controls.rotateSpeed = 0.45;
  controls.autoRotateSpeed = 0.30;
  controls.minDistance = 250;
  controls.maxDistance = 1500; // Register resize listener

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, false); // Register fps counter

  fps = document.getElementById('fps');
  xTracker = document.getElementById('x');
  yTracker = document.getElementById('y');
  zTracker = document.getElementById('z');
  loadAnimatedModel(); // Render-loop

  animate();
}

function loadAnimatedModel() {
  var manager = new THREE.LoadingManager(loadModel);
  var loader = new THREE.FBXLoader(manager);
  loader.load("/resources/fish.fbx", function (model) {
    cachedModel = model;
  }, onProgress, onError, null, false);
}

var cachedModel;

function onError() {
  console.log('ERROR LOADING MODEL!');
}

function onProgress(xhr) {
  if (xhr.lengthComputable) {
    var percentComplete = xhr.loaded / xhr.total * 100;
    console.log('Loading Model: ' + Math.round(percentComplete, 2) + '%');
  }
}

function loadModel() {
  var geometry = new THREE.BoxGeometry(1, 1, 1),
      material = new THREE.MeshBasicMaterial({
    color: 0xfffff
  });
  setTimeout(function () {
    for (var added = 0; added < 100; added++) {
      // Clone
      var fish = _SkeletonUtils.SkeletonUtils.clone(cachedModel); // Apply texture


      fish.traverse(function (e) {
        if (e.isMesh) {
          e.material = e.material.clone();
          e.material.color.set(Math.random() * 0xffffff | 0);
        }
      });
      var mixer = new THREE.AnimationMixer(fish); // Start animation

      for (var i = 0; i < 3; i++) {
        var action = mixer.clipAction(cachedModel.animations[i]);
        mixers.push(mixer);
        action.play();
      } // Randomly position


      var x = 0; //Math.round(Math.random() * 1500) - 1000;

      var y = 0; //Math.round(Math.random() * 1500) - 1000;

      var z = 0; //Math.round(Math.random() * 1500) - 1000;

      fish.position.set(x, y, z);
      fish.receiveShadow = true;
      fish.castShadow = true;
      fish.updateMatrixWorld();
      scene.add(fish); // Create direction cube

      var cube = new THREE.Mesh(geometry, material);
      cube.position.set(x + 50, y, z);
      cube.visible = false;
      scene.add(cube);

      _SceneUtils.SceneUtils.attach(cube, scene, fish); // Add to boids
      // Create boid object


      var boid = new Boids.Entity({
        x: x,
        y: y,
        z: z,
        obj: fish,
        child: cube,
        bounceManager: bounceManager,
        rotationManager: rotationManager
      }); // Store boid in array

      boids.push(boid);
    }
  }, 10);
}

function countFPS() {
  var now = new Date().getTime();
  if (secondTracker == null) secondTracker = now;
  var newSecond = now - secondTracker >= 1000;
  var fish = boids[0];
  if (fish == undefined) return;
  var pos = fish.velocity;

  if (newSecond) {
    // Update FPS
    secondTracker = now;
    framesRendered = 1;
  } else {
    framesRendered += 1;
  } // Seems to be standarized however needs to be detected/hotfixed for negative rotation
  // fish.obj.getWorldQuaternion().y


  var pp = fish.obj.getWorldPosition();
  var cp = fish.child.getWorldPosition();
  var dir = getDirectionFromChild(pp, cp);
  fps.innerText = "FPS: " + framesRendered + "  | (" + 0 + ") Facing: " + dir;
  xTracker.innerText = "X: " + Math.round(camera.position.x) + "  |  Moving: " + velocityToDirection(fish.velocity);
  yTracker.innerText = "Y: " + Math.round(camera.position.y);
  zTracker.innerText = "Z: " + Math.round(camera.position.z);
  renderer.render(scene, camera);
}

var clock = new THREE.Clock();
var delta = 0;
var interval = 1 / 30;

function animate() {
  // Auto-rotate/update camera
  controls.update(); // Render scene

  renderer.render(scene, camera);
  window.requestAnimationFrame(function () {
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
    delta += clock.getDelta(); // Update fishses' position

    if (delta > interval) {
      for (var i = 0; i < mixers.length; i++) {
        mixers[i].update(0.01);
      }

      Boids.update(boids, bounceManager, rotationManager);
      delta = delta % interval;
    }

    stats.update(); // FPS counter

    countFPS(); // Loop

    animate();
  });
}

initialize();