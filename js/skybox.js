import {
    getStringPaths
} from '/js/textures.js';

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
}

const randomGreyscaleColor = () => {
    var value = Math.random() * 0xFF | 0;
    var grayscale = (value << 16) | (value << 8) | value;
    return '#' + grayscale.toString(16);
}

export function addParticles(scene) {
    // Points geomtry/material
    const geometry = new THREE.BufferGeometry(),
        loader = new THREE.TextureLoader();

    // Load textures and generate random particle traits (color, size)
    const traits = [],
        vertices = [];

    getStringPaths(false).forEach(image => {
        traits.push({
            color: new THREE.Color(randomGreyscaleColor()),
            size: Math.random() * 10,
            sprite: loader.load(image)
        });
    });

    // Randomly generate point vertice positions
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * 2000 - 1000,
            y = Math.random() * 2000 - 1000,
            z = Math.random() * 2000 - 1000;

        vertices.push(x, y, z);
    }

    // Apply to geomtry
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));


    // Apply traits to point geomtry material
    for (let i = 0; i < 9; i++) {
        const trait = traits[i];

        const material = new THREE.PointsMaterial({
            color: trait.color,
            map: trait.sprite,
            size: trait.size,
            depthTest: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            morphTargets: true
        });


        const particles = new THREE.Points(geometry, material);
        particles.rotation.x = Math.random() * 6;
        particles.rotation.y = Math.random() * 6;
        particles.rotation.z = Math.random() * 6;

        scene.add(particles);
    }
}

export function addLight(scene) {
    // Add light to scene
    const color = new THREE.Color('#088DB1');
    scene.background = color;

    // Center light
    let light = new THREE.PointLight(color, 1);
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
    light = new THREE.AmbientLight(color, 0.1);
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