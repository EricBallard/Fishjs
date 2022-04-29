/*
    Render Scene
*/
import { debug } from '/js/debug.js'

import { update } from '/js/boids/boid.js'

import { countFPS } from '/js/device/frame-rate.js'

//Util
function fade(element, fadeIn) {
  var opacity = fadeIn ? 0 : 1

  var intervalID = setInterval(function () {
    if (fadeIn ? opacity < 1 : opacity > 0) {
      opacity = opacity + (fadeIn ? 0.1 : -0.1)
      element.style.opacity = opacity
    } else {
      clearInterval(intervalID)
    }
  }, 50)
}

// Track time between frame renders - used to limit animation framte
let clock = new THREE.Clock(),
  delta = 0

let hidLoadingScreen = false,
  loaded = false

// Process updates
export function render(app) {
  // Debug
  if (app.debug) debug(app)

  // Fade-in
  if (!loaded) {
    if (!hidLoadingScreen) {
      // Hide loading identifie
      document.getElementById('loader').style.visibility = 'Hidden'

      // Fade in 3D scene
      fade(app.element, true, true)
      hidLoadingScreen = true
    } else if (app.element.style.opacity >= 0.9) {
      // Fade in description
      fade(document.getElementById('desc'), true, true)

      // Init particle system
      app.controls.enabled = true
      loaded = true
    }
  }

  // Update boids
  window.requestAnimationFrame(() => {
    /*  
        Render camera/scene independetly

        Boids, particles, and camera animation are update on fixed frame-rate which
        is lower than native refresh rate - this is an optimization which allows
        signficantly less logic calculation on render
    */

    // Auto-rotate/update controls and camera
    app.controls.update()

    // Render scene with post-processing
    app.composer.render()

    if (app.targetFPS != -1) {
      // Render on fixed frame-rate
      delta += clock.getDelta()

      // Update fishses' position
      if (delta > app.renderInterval) {
        delta = delta % app.renderInterval

        // Check if selected fished is visible
        if (app.selected != undefined) alignCameraToSelected(app)

        // Update boids
        update(app)

        // Update particles
        app.particles.update(delta)
      }

      // FPS counter
      countFPS(app)
    }

    // Loop
    render(app)
  })
}
