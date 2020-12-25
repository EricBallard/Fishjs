"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMaterialArray = createMaterialArray;

function createPathStrings() {
  var baseFilename = "/resources/skybox/uw_";
  var sides = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];
  var pathStings = sides.map(function (side) {
    return baseFilename + side + '.jpg';
  });
  return pathStings;
}

function createMaterialArray(params) {
  var THREE = params.threejs;
  var skyboxImagepaths = createPathStrings();
  var materialArray = skyboxImagepaths.map(function (image) {
    // Load texture image
    var texture = new THREE.TextureLoader().load(image); // Create mesh and texture the, inner, backside face

    return new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    });
  });
  return materialArray;
}