// Functions related to debugging
const debugPos = document.getElementById('debug-pos')

export const debug = (app) => {
    var pos = app.camera.position
    debugPos.innerText = 'X: ' + pos.x +'\nY: ' + pos.y + '\nZ: ' + pos.z

}