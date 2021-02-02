function createPathStrings() {
    const baseFilename = `/resources/skybox/uw_`;
    const sides = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];
    const pathStings = sides.map(side => baseFilename + side + '.jpg');
    return pathStings;
}

export function createRoom(THREE, scene) {
    const skyboxImagepaths = createPathStrings();

    let index = 0;
    skyboxImagepaths.map(image => {
        const geo = new THREE.PlaneBufferGeometry(10000, 10000);
        const mat = new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load(image),
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