import { addFishToScene, removeFishFromScene } from '../boids/model.js'

/*
    Frame-rate
*/

// Track current rate
let lastFPS = undefined

let framesRendered = 0,
  secondTracker = null

function manageFPS(app, currentFPS) {
  /*
          Add/Remove fish from scene to maintain
          optimal fps with maximum visual display
      */

  // Add/remove fish to maintain optimal fps
  if (currentFPS >= app.targetFPS && lastFPS >= app.targetFPS) {
    if (app.spawned < app.targetFish) addFishToScene()
  } else if (currentFPS < lastFPS + 2 && currentFPS < app.targetFPS - 5 && lastFPS < app.targetFPS - 5) {
    removeFishFromScene()
  }

  lastFPS = currentFPS
}

export function countFPS(app) {
  const now = new Date().getTime()
  if (secondTracker == null) secondTracker = now

  const newSecond = now - secondTracker >= 1000

  if (newSecond) {
    // Update selected info
    if (app.selected != null) app.selectedInfo.innerText = getSelectedInfo(app.selected.boid)

    // Manage fps by removing/adding fish
    manageFPS(app, framesRendered)

    // Update FPS
    app.fps.innerText = framesRendered
    app.fish.innerText = app.spawned
    secondTracker = now
    framesRendered = 0
  }

  framesRendered += 1
}

var rates = {},
  pollTime = 1000,
  lastCall = undefined

export const detectNativeFrameRate = app => {
  // Detect native refresh rate of monitor
  var now = Date.now()

  var elapsed = lastCall ? now - lastCall : 0
  if (!lastCall) lastCall = now

  if (elapsed != 0) {
    pollTime -= elapsed
    var rate = Math.round(1000 / elapsed)
    var counts = rate in rates ? rates[rate] : 0
    rates[rate] = counts + 1
  }

  lastCall = now

  if (pollTime > 0) window.requestAnimationFrame(() => detectNativeFrameRate(app))
  else {
    var avgRate = Object.keys(rates).reduce((a, b) => (rates[a] > rates[b] ? a : b))

    app.targetFPS = avgRate
    app.renderInterval = 1 / (avgRate > 90 ? 60 : avgRate)

    console.info('Target FPS: ' + avgRate)
  }
}
