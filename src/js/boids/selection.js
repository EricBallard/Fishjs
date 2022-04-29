
/*
    Fish selection (SCRAPPED)
*/

function getPosition(e, width, height) {
    const x = ((e.changedTouches ? e.changedTouches[0].clientX : e.clientX) / width) * 2 - 1,
      y = -((e.changedTouches ? e.changedTouches[0].clientY : e.clientY) / height) * 2 + 1
    return new THREE.Vector2(x, y)
  }
  
  function getSelectedInfo(boid) {
    // Format info
    let dir = 'going ' + boid.rotationManager.facing
  
    if (dir == null) {
      const y = boid.velocity.y
      dir = y > 0 ? 'going up' : y < 0 ? ' going down' : 'stationary'
    }
  
    // Set selected info
    return (
      boid.obj.name.split('_')[0] +
      ' is ' +
      dir +
      ', moving at \n' +
      boid.speed.toFixed(2) +
      ' cm/s with ' +
      boid.othersInPerception +
      // Grammar matters :')
      ' other' +
      (boid.othersInPerception == 1 ? '' : 's') +
      ' in perception!'
    )
  }
  
  export function click(e, app) {
    // const pp = app.boids[0].obj.position;
    // const mousePos = toScreenXY(pp, app.camera, app.element);
  
    // console.log('fish - x: ' + mousePos.x + ' y: ' + mousePos.y);
    // console.log('click - x: ' + e.clientX + ' y: ' + e.clientY);
  
    // let a = [];
    // a.push(app.boids[0]);
    // app.outLine.selectedObjects = a;
    // const box = new THREE.Box3();
    // box.setFromCenterAndSize(pp, new THREE.Vector3(100, 100, 100));
  
    // const helper = new THREE.Box3Helper(box, 0xffff00);
    // app.scene.add(helper);
  
    // let x = Math.round((pp.x + 1) * app.w / 2),
    //     y = Math.round((- pp.y + 1) * app.h / 2);
  
    // Prevent selected fish before fully loaded/presented
    if (!hidLoadingScreen || !loaded) return
  
    const pos = getPosition(e, app.width, app.height)
    app.raycaster.setFromCamera(pos, app.camera)
  
    const meshes = []
    for (let so of app.sceneObjects) meshes.push(so.mesh)
  
    const intersects = app.raycaster.intersectObjects(meshes, false)
    let selectedMesh
  
    // If ray intersects with an object and that object is not currently selected
    if (intersects.length > 0 && (selectedMesh = intersects[0].object) != undefined) {
      // Deselect current
      if (app.selected != undefined && app.selected.mesh == selectedMesh) {
        // Fade out selected in
        fade(app.info, false)
  
        // Set selected to undefined
        app.outLine.selectedObjects = []
        app.selected = undefined
  
        app.controls.autoRotate = true
        return
      }
  
      // Select current
      const array = []
      array.push(selectedMesh)
      let selectedObj = undefined
  
      for (let so of app.sceneObjects) {
        if (so.mesh == selectedMesh) {
          selectedObj = so.obj
          break
        }
      }
  
      if (selectedObj == undefined) {
        console.log('Selection failed - unable to find related object and mesh!')
        app.selected = undefined
        return
      }
  
      let boid = undefined
      for (let b of app.boids) {
        if (b.obj == selectedObj) {
          boid = b
          break
        }
      }
  
      if (boid == undefined) {
        console.log('Selection failed - unable to find related boid!')
        app.selected = undefined
        return
      }
  
      // Set as selected
      app.selected = {
        mesh: selectedMesh,
        obj: selectedObj,
        boid: boid,
      }
  
      app.controls.autoRotate = false
      app.outLine.selectedObjects = array
      app.selectedInfo.innerText = getSelectedInfo(boid)
  
      // Fade in selected info
      if (app.info.style.opacity < 1) fade(app.info, true)
    }
  }
  
  // Rotate camera to selected fish
  let rotatingCamera = false
  
  function alignCameraToSelected(app) {
    let pos = app.selected.obj.position
  
    // Update camera projection
    app.camera.updateMatrix()
    app.camera.updateMatrixWorld()
  
    // Define out view
    const frustum = new THREE.Frustum()
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(app.camera.projectionMatrix, app.camera.matrixWorldInverse)
    )
  
    if (!frustum.containsPoint(pos)) {
      if (!rotatingCamera) {
        // Selected is not visible - rotate camera
        const controls = app.controls,
          camera = app.camera
  
        // Disable controls while animating
        rotatingCamera = true
        controls.enabled = false
        controls.update()
  
        // Animate camera position via gsap api
        gsap.to(camera, {
          duration: 2.5,
          zoom: camera.zoom,
          onUpdate: () => camera.updateProjectionMatrix(),
        })
  
        gsap.to(camera.position, {
          duration: 2.5,
          x: pos.x < 0 ? Math.abs(pos.x) : pos.x - pos.x * 2,
          y: pos.y < 0 ? Math.abs(pos.y) : pos.y - pos.y * 2,
          z: pos.z < 0 ? Math.abs(pos.z) : pos.z - pos.z * 2,
          onUpdate: () => controls.update(),
          onComplete: () => {
            rotatingCamera = false
            controls.enabled = true
            controls.update()
          },
        })
      }
    }
  }