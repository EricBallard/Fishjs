import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/GLTFLoader.js";

class BasicWorldDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(90, 0, 0);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xffffff, 5.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    // User-Controls
    const controls = new OrbitControls(this._camera, this._threejs.domElement);
    controls.minDistance = 25;
    controls.maxDistance = 150;
    controls.update();

    // Sky box
    let materialArray = [];
    let texture_ft = new THREE.TextureLoader().load("/resources/uw_ft.jpg");
    let texture_bk = new THREE.TextureLoader().load("/resources/uw_bk.jpg");
    let texture_up = new THREE.TextureLoader().load("/resources/uw_up.jpg");
    let texture_dn = new THREE.TextureLoader().load("/resources/uw_dn.jpg");
    let texture_rt = new THREE.TextureLoader().load("/resources/uw_rt.jpg");
    let texture_lf = new THREE.TextureLoader().load("/resources/uw_lf.jpg");

    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
    materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));

    for (let i = 0; i < 6; i++) materialArray[i].side = THREE.BackSide;

    let skyboxGeo = new THREE.BoxGeometry(900, 900, 900);
    let skybox = new THREE.Mesh(skyboxGeo, materialArray);
    this._scene.add(skybox);

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
      })
    );

    this.box.position.set(0, 10, 0);
    this.box.castShadow = true;
    this.box.receiveShadow = true;
    this._scene.add(this.box);

    this.fps = document.getElementById("fps");

    const loader = new GLTFLoader();
    loader.load("/resources/fish/fish.gltf", function (model) {
      const fish = model.scene.children[0];
      fish.position.set(0, 30, -30);

      fish.receiveShadow = true;
      fish.castShadow = true;
      _APP._scene.add(fish);
    });

    this._RAF();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    const now = new Date().getTime();

    if (secondTracker == null) secondTracker = now;

    requestAnimationFrame(() => {
      const newSecond = now - secondTracker > 1000;

      if (newSecond) {
        this.fps.innerText = "FPS: " + framesRendered;
        secondTracker = now;
        framesRendered = 1;
        // this.box.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.25, 0));
      } else {
        // Cap at 60 fps
        if (framesRendered <= 60) {
          framesRendered += 1;
          this._threejs.render(this._scene, this._camera);
        }
      }

      this._RAF();
    });
  }
}

let _APP = null;

var secondTracker = null;

var framesRendered = 0;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new BasicWorldDemo();
});
