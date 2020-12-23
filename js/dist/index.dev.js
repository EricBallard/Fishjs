"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _SkeletonUtils = require("/js/libs/SkeletonUtils.js");

var Boids = _interopRequireWildcard(require("/js/boid.js"));

var _skybox = require("/js/skybox.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Threejs util
// Utils
// 3D Graphics
var scene, camera, renderer, controls, frame; // Boid data

var boids = [],
    bounceManager = [],
    rotationManager = []; // Stats & Info

var fps,
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
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = 'canvas';
  document.body.appendChild(renderer.domElement); // Create skybox textured mesh and add to scene

  var materialArray = (0, _skybox.createMaterialArray)({
    threejs: THREE
  });
  var skyboxGeo = new THREE.BoxGeometry(5000, 5000, 5000);
  scene.add(new THREE.Mesh(skyboxGeo, materialArray)); // Add light to scene

  var light = new THREE.PointLight();
  light.position.set(10, 10, 10);
  scene.add(light); // Configure user-controls

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enabled = true; //controls.enablePan = false;
  //controls.autoRotate = true;

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
  //this.mixer = new THREE.AnimationMixer(model);
  //this._mixers.push(this.mixer);
  //const anim = model.animations[0];
  //console.log('ANIM: ' + anim);
  //const idle = _APP.mixer.clipAction(anim);
  //idle.play();
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
  setTimeout(function () {
    for (var added = 0; added < 1; added++) {
      // Clone
      var fish = _SkeletonUtils.SkeletonUtils.clone(cachedModel); // Apply texture


      fish.traverse(function (e) {
        if (e.isMesh) {
          e.material = e.material.clone();
          e.material.color.set(Math.random() * 0xffffff | 0);
        }
      }); // Randomly position

      var x = Math.round(Math.random() * 1000) - added * 10;
      var y = Math.round(Math.random() * 1000) - added * 10;
      var z = Math.round(Math.random() * 1000) - added * 10;
      fish.position.set(x, y, z);
      fish.receiveShadow = true;
      fish.castShadow = true;
      fish.updateMatrixWorld();
      scene.add(fish); // Add to boids
      // Create boid object

      var boid = new Boids.Entity({
        x: x,
        y: y,
        z: z,
        obj: fish,
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
  var newSecond = now - secondTracker > 1000;
  var fish = boids[0];
  if (fish == undefined) return;
  var pos = fish.velocity;

  if (newSecond) {
    // Update FPS
    secondTracker = now;
    framesRendered = 1;
  } else {
    framesRendered += 1;
  }

  var q = fish.obj.quaternion;
  fps.innerText = "FPS: " + framesRendered + "  | (" + q.y + ") Facing: " + getDirection(q);
  xTracker.innerText = "X: " + Math.round(camera.position.x) + "  |  Moving: " + velocityToDirection(fish.velocity);
  yTracker.innerText = "Y: " + Math.round(camera.position.y);
  zTracker.innerText = "Z: " + Math.round(camera.position.z);
  renderer.render(scene, camera);
}

var clock = new THREE.Clock();
var delta = 0;
var interval = 1 / 30;

function animate() {
  // Auto-rotate camera
  controls.update(); // Render scene

  renderer.render(scene, camera);
  frame = window.requestAnimationFrame(function () {
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
      Boids.update(boids, bounceManager, rotationManager);
      delta = delta % interval;
    } // FPS counter


    countFPS(); // Loop

    animate();
  });
}

initialize();