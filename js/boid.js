import * as Movement from '/js/movement.js';

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

const perception = 250;

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.managers = params.managers;

        // Momentum
        this.velocity = new THREE.Vector3(getSeed(), 0, getSeed());

        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        // VIDEO @ 21:50
    }

    bounce() {
        const pos = this.obj.position,
            v = this.velocity;

        if (pos.x >= 2450 || pos.x <= -2450) {
            const vx = this.velocity.x;
            this.velocity.x = vx < 0 ? Math.abs(vx) : vx - (vx * 2);
        }

        if (pos.y >= 2450 || pos.y <= -2450) {
            const vy = this.velocity.y;
            this.velocity.y = vy < 0 ? Math.abs(vy) : vy - (vy * 2);
        }

        if (pos.z >= 2450 || pos.z <= -2450) {
            const vz = this.velocity.z;
            this.velocity.z = vz < 0 ? Math.abs(vz) : vz - (vz * 2);
        }
    }

    align(boids) {
        const alignment = this.getAlignment(boids);
        this.acceleration = alignment;
    }

    getAlignment(boids) {
        let perceivedVelocity = new THREE.Vector3(0, 0, 0);
        const position = this.obj.position;
        let othersInPerception = 0;

        main : for (let other of boids) {
            if (other == this)
                continue;

            if (other.obj.position.distanceTo(position) <= perception) {
                // Ignore fish that are rotating
                for (let manager of this.managers) {
                    if (manager.obj == other.obj)
                        continue main;
                }

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

    update() {
        // Update momentum
        this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
        this.velocity.add(this.acceleration);

        // Rotate object based on velocity
        this.rotate();
    }

    rotate() {
        // Return if object is being actively rotated/managed
        for (let manager of this.managers) {
            if (manager.obj === this.obj) {
                return;
            }
        }

        const q = this.obj.quaternion,
            rot = Movement.getDirection(q),
            dir = Movement.velocityToDirection(this.velocity);

        if (rot != dir) {
            // Add manager to animate the rotation
            this.managers.push(new Movement.RotationManager({
                boid: this,
                start: q,
                desired: dir
            }));
        }
    }
}



export function update(boids, managers) {
    for (let boid of boids) {
        boid.bounce();

        boid.align(boids);
        boid.update();
    }

    const managerSize = managers.length;
    for (let index = 0; index < managerSize; index++) {
        const manager = managers[index];

        if (manager != undefined && manager.execute()) {
            managers.splice(index, 1);
        }
    }
}