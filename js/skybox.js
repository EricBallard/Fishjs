export function createPathStrings() {
    const baseFilename = `/resources/skybox/uw_`;
    const sides = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];
    const pathStings = sides.map(side => baseFilename + side + '.jpg');
    return pathStings;
}

export function createMaterialArray(THREE) {
    const skyboxImagepaths = createPathStrings();
    const materialArray = skyboxImagepaths.map(image => {
        // Load texture image
        let texture = new THREE.TextureLoader().load(image);

        // Create mesh and texture the, inner, backside face
        return new THREE.MeshLambertMaterial({
            color: 0xffffff,
            side: THREE.BackSide
        });
    });
    return materialArray;
}