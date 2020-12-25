"use strict";

var _SkeletonUtils = require("/js/libs/SkeletonUtils.js");

/*
  A simple three.js application shell for getting help with problems!
*/
var camera, scene, renderer, controls;
var material;
var clock;
var mixers = [];
var fish = [];
var testplane;
var lastTime = performance.now() / 1000;
init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setClearColor("blue", 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  THREE.Cache.enabled = true; //  let tex = new THREE.TextureLoader().load('https://cdn.glitch.com/8c6a200d-6243-4e2a-b5c9-d6846ac00d17%2FYSB_60S_812_750x.png?v=1585936092913')

  var fishBase;
  var fbx = new THREE.FBXLoader().load("https://cdn.glitch.com/ea8fbab7-8008-4d4e-9ba6-5542afc137ff%2Ffish.fbx?v=1608427644046", function (fbx) {
    fishBase = fbx;

    for (var x = -10; x <= 25; x++) {
      var _loop = function _loop(y) {
        //     debugger
        var fbx = _SkeletonUtils.SkeletonUtils.clone(fishBase);

        var mixer = new THREE.AnimationMixer(fbx);
        var action = mixer.clipAction(fishBase.animations[0]);
        mixers.push(mixer);
        action.play();
        var meshes = [];
        fbx.traverse(function (e) {
          if (e.isMesh) {
            meshes.push(e);
            e.material = e.material.clone();
            e.material.color.set(Math.random() * 0xffffff | 0);
          }
        });
        fbx.scale.multiplyScalar(0.01);
        fbx.updateMatrixWorld();
        fbx.position.set(x, 0, y);
        fbx.updateMatrixWorld();
        fbx.rotation.y = Math.random() * 6.2;
        fish.push(fbx);
        scene.add(fbx);
      };

      for (var y = -10; y <= 25; y++) {
        _loop(y);
      }
    }
  });
  var light = new THREE.PointLight();
  light.position.set(10, 10, 10);
  scene.add(light);
  light = new THREE.PointLight();
  light.position.set(-10, -10, -10);
  scene.add(light);
  scene.add(camera);
  window.addEventListener("resize", onWindowResize, false);
  onWindowResize();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

var tv0 = new THREE.Vector3();

function render() {
  var time = performance.now() / 1000;
  var dt = time - lastTime;
  lastTime = time;
  controls.update();

  for (var i = 0; i < mixers.length; i++) {
    mixers[i].update(0.01);
  }

  for (var _i = 0; _i < fish.length; _i++) {
    var f = fish[_i];
    f.rotation.y += Math.sin(time) * 0.01;
    tv0.set(-0.01, 0, 0).applyQuaternion(f.quaternion);
    f.position.add(tv0);
  }

  renderer.render(scene, camera); // testplane.material.opacity = (Math.sin(performance.now()/1000)+1)*.5
}