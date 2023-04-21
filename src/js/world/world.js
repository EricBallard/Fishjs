import {
    getStringPaths
} from './textures.js';


import {
    Water
} from '../_libs/water/Water.js';

export function createRoom(THREE, scene) {
    let index = 0;

    getStringPaths(true).forEach(image => {
        const geo = new THREE.PlaneBufferGeometry(10000, 10000),
            loader = new THREE.TextureLoader();

        const mat = new THREE.MeshStandardMaterial({
            map: loader.load(image),
            fog: false
        });

        let plane = new THREE.Mesh(geo, mat);

        // Position and rotate based on index
        switch (index) {
            case 0: // Front
                plane.rotation.y = Math.PI * -0.5;
                plane.position.set(5000, 0, 0);
                break;
            case 1:  // Back
                plane.rotation.y = Math.PI * 0.5;
                plane.position.set(-5000, 0, 0);
                break;
            case 2:  // Top
                plane.rotation.x = Math.PI * 0.5;
                plane.position.set(0, 5000, 0);
                break;
            case 3: // Bottom
                plane.rotation.x = Math.PI * -0.5;
                plane.rotation.x = Math.PI * -0.5;
                plane.position.set(0, -5000, 0);
                break;
            case 4: // Left
                plane.position.set(0, 0, -5000);
                break;
            case 5: // Right
                plane.rotation.y = Math.PI * 1;
                plane.position.set(0, 0, 5000);
                break;
        }

        // Add to scene
        scene.add(plane);
        index++;
    });

    // Add water-wave distortion effect
    const water = new Water(new THREE.PlaneBufferGeometry(8500, 8500));
    water.rotation.x = Math.PI * 0.5;
    water.position.y = 1000;
    scene.add(water);
}

let getSeed = () => {
    let seed = (Math.random() * 10) + 50;
    return Math.random() < 0.5 ? seed - (seed * 2) : seed;
}
export function addParticles(THREE, scene) {
    // cache textures
    const loader = new THREE.TextureLoader();
    let textures = [];

    getStringPaths(false).forEach(image => {
        const mat = new THREE.MeshStandardMaterial({
            map: loader.load(image),
            fog: false
        });

        textures.push(loader.load(image));
    });

    // Spawn 200 particle debris
    // for (let i = 0; i < 500; i++) {
    //     const seed = getSeed();

    //     let x = Math.random() * 4000 - 2000,
    //         y = Math.random() * 1900 - 1000 - i,
    //         z = Math.random() * 4000 - 2000;

    //     particles.group.push({
    //         position: new THREE.Vector3(x, y, z),
    //         size: Math.random() * 40 + 10,
    //         colour: new THREE.Color(),
    //         alpha: Math.random() / 3,
    //         rotation: Math.random() * 2.0 * Math.PI,
    //         velocity: new THREE.Vector3(seed, getSeed(), seed)
    //     });
    // }

    const geometry = new THREE.PlaneBufferGeometry * (100, 100);

    const material = new THREE.MeshPhongMaterial({
        transparent: true,
        map: textures[0]
    });

    for (let i = 0; i < 10; i++) {
        let x = Math.random() * 4000 - 2000,
            y = Math.random() * 1900 - 1000 - i,
            z = Math.random() * 4000 - 2000;

        let mesh = new THREE.InstancedMesh(geometry, material);
        mesh.position.set(x, y, z);
     //   scene.add(mesh);
    }
}

export function addLight(scene) {
    // Add light to scene
    const color = new THREE.Color('#088DB1');
    scene.background = color;

    // Center light
    let light = new THREE.PointLight(color, 8);
    light.distance = Infinity;
    light.power = 4;
    light.decay = 2;
    scene.add(light);

    // 'Sun' light
    light = new THREE.PointLight(0xffffff, 1);
    light.position.set(1500, 4500, -1500)
    light.distance = 3750;
    light.power = 25;
    light.decay = 2;
    scene.add(light);

    // Ambient light
    light = new THREE.AmbientLight(color, 0.6);
    scene.add(light);


    //lights
    // TODO - animate between light colors
    /*
    let light = new THREE.PointLight(0xff0040, 2, 50);
    light = new THREE.PointLight(0x0040ff, 2, 50);
    light = new THREE.PointLight(0x80ff80, 2, 50);
    light = new THREE.PointLight(0xffaa00, 2, 50);
    */
}