// Functions related to debugging
const debugPos = document.getElementById('debug-pos')

export const initDebug = app => {
  // Target bounds of fish
  var geometry = new THREE.BoxGeometry(6500, 4500, 6500)
  const wireframe = new THREE.WireframeGeometry(geometry)

  const line = new THREE.LineSegments(wireframe)
  line.material.depthTest = false
  line.material.opacity = 0.25
  line.material.transparent = true

  line.position.x = -1000
  line.position.z = -1000
  line.position.y = -1500
  app.scene.add(line)

  // Default camera position
  geometry = new THREE.SphereGeometry(60)
  const material = new THREE.MeshBasicMaterial({ color: 'red' })
  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(-178, -327, 1452)

  app.scene.add(sphere)
}

export const debug = app => {
  //var pos = app.camera.position
  //debugPos.innerText = 'X: ' + pos.x + '\nY: ' + pos.y + '\nZ: ' + pos.z
}
