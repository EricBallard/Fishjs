const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Cache loading elements from DOM
const loadProgress = document.getElementById('loadProgress'),
  loadStatus = document.getElementById('loadStatus'),
  loadLine = document.getElementById('loadLine')

var currentProgress = 0

const adjLoadProgress = progress => {
  currentProgress = progress
  loadProgress.innerText = progress + '%'

  // Animate loading line + update status text
  loadLine.style.width = (progress * 2.75).toFixed(3) + 'px'

  /* (275 - (width * 2.75)) / 2 */
  loadLine.style.left = -((275 - progress * 2.75) / 2) + 'px'
}

export async function setLoadProgress(progress, status) {
  var change = progress - currentProgress
  loadStatus.innerText = status

  for (var i = 0; i < change; i++) {
    adjLoadProgress(currentProgress + 1)
    await sleep(1)
  }
}