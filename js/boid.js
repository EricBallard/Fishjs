export class Entity {
    constructor(params) {
        this.x = params.x;
        this.y = params.y;
        this.z = params.z;

        this.obj = params.obj;

        //TODO obj needs direction ??
        // stooped vid @ 17mins
        this.velocity = 0.0;
        this.acceleration = 0.0;
    }

    update(THREE) {
        this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(-1, 0, 0));
    }
}

export function update(params) {
    const THREE = params.threejs;
    const boids = params.flock;

    for (let boid of boids) {
        boid.update(THREE);
    }
}