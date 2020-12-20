

    this._mixers = [];
    this._particles = [];
    this._previousRAF = null;

    // Init particle system
    this._particles = new ParticleSystem({
      threejs: THREE,
      parent: this._scene,
      camera: this._camera,
    });

    this._LoadAnimatedModel();
    this._RAF();
  }

  _
  

  _RAF() {
    

    requestAnimationFrame((frame) => {

      this._RAF();
      this._Step(frame - this._previousRAF);
      this._previousRAF = frame;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;

    if (this._mixers) this._mixers.map((m) => m.update(timeElapsedS));

    if (this._particles) this._particles.Step(timeElapsedS);
  }
}

let _APP = null;

var secondTracker = null;

var framesRendered = 0;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new Fishjs();
});
