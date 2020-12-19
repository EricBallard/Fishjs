function getSeed() {
    return Math.random() * (Math.random() * 20);
}

function setMagnitude(params) {
    const vector = params.vector;
    const magnitude = params.magnitude;
    const direction = Math.atan2(vector.y, vector.x, vector.z);
    vector.x = Math.cos(direction) * magnitude;
    vector.y = Math.sin(direction) * magnitude;
    vector.z = Math.tan(direction) * magnitude;
}

const perception = 150;

export class Entity {
    constructor(params) {
        const THREE = params.threejs;

        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;

        // Momentum
        this.velocity = new THREE.Vector3(getSeed(), getSeed(), getSeed());

        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);
    }

    update(THREE) {
        // Update momentum
        this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
        this.velocity.add(this.acceleration);
    }

    align(THREE, boids) {
        const alignment = this.getAlignment(THREE, boids);
        this.acceleration = alignment;
        //console.log("X: " + alignment.x + " Y: " + alignment.y + " Z: " + alignment.z);
    }

    getAlignment(THREE, boids) {
        let perceivedVelocity = new THREE.Vector3(0, 0, 0);
        const position = this.obj.position;
        let othersInPerception = 0;

        for (let other of boids) {
            if (other == this)
                continue;

            if (other.obj.position.distanceTo(position) <= perception) {
                perceivedVelocity.x += other.velocity.x;
                perceivedVelocity.y += other.velocity.y;
                perceivedVelocity.z += other.velocity.z;
                othersInPerception += 1;
            }
        }

        if (othersInPerception > 0) {
            // Normalize velocity
            perceivedVelocity.x = (perceivedVelocity.x / othersInPerception);
            perceivedVelocity.y = (perceivedVelocity.y / othersInPerception);
            perceivedVelocity.z = (perceivedVelocity.z / othersInPerception);

            setMagnitude({
                vector: perceivedVelocity, 
                magnitude: this.maxSpeed
            });

            const vx = perceivedVelocity.x - this.velocity.x;
            perceivedVelocity.x = (vx < 0.00 ? 0.00 : vx);
            const vy = perceivedVelocity.y - this.velocity.y;
            perceivedVelocity.y = (vy < 0.00 ? 0.00 : vy);
            const vz = perceivedVelocity.z - this.velocity.z;
            perceivedVelocity.z = (vz < 0.00 ? 0.00 : vz);

            // Limit force of velocity
            if (perceivedVelocity.x > this.maxForce)
                perceivedVelocity.x = this.maxForce;
            if (perceivedVelocity.y > this.maxForce)
                perceivedVelocity.y = this.maxForce;
            if (perceivedVelocity.z > this.maxForce)
                perceivedVelocity.z = this.maxForce;

        }

        return perceivedVelocity;
    }


}


export function update(params) {
    const THREE = params.threejs;
    const boids = params.flock;

    for (let boid of boids) {
        boid.align(THREE, boids);
        boid.update(THREE);

        
    }
}