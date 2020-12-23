import * as Managers from '/js/movement/managers.js';

function getSeed() {
    let seed = Math.random() * (Math.random() * 50) + .5 ;
    return Math.random() < 0.5 ? seed : seed -= seed * 2;
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
        this.bounceManager = params.bounceManager;
        this.rotationManager = params.rotationManager;

        // Momentum
        this.velocity = new THREE.Vector3(getSeed(), 0, getSeed());

        this.maxSpeed = 8;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        // Auto-rotate
        new Managers.Rotation({
            boid: this,
            desired: velocityToDirection(this.velocity),
            instant: true
        });

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

        /*
        const pos = this.obj.position,
            offX = pos.x >= 2000 || pos.x <= -2000,
            offY = pos.y >= 2000 || pos.y <= -2000,
            offZ = pos.z >= 2000 || pos.z <= -2000;

        if (offX || offY || offZ) {
            // Return if object is actively bouncing

            const managerSize = this.bounceManager.length;
            for (let index = 0; index < managerSize; index++) {
                const manager = this.bounceManager[index];
                if (manager == undefined)
                    continue;
                else {
                    if (manager.boid == this) {
                        if ((offX && !manager.reflectX) ||
                            (offY && !manager.reflectY) ||
                            (offZ && !manager.reflectZ)) {

                            console.log("Overriding manager...");
                            this.bounceManager.splice(index, 1);
                        } else
                            return;
                    }
                }
            }


            this.bounceManager.push(new Managers.Bounce({
                boid: this
            }));
        }
        */

    }

    align(boids) {
        const alignment = this.getAlignment(boids);
        this.acceleration = alignment;
    }

    getAlignment(boids) {
        let perceivedVelocity = new THREE.Vector3(0, 0, 0);
        const position = this.obj.position;
        let othersInPerception = 0;

        main: for (let other of boids) {
            if (other == this)
                continue;

            if (other.obj.position.distanceTo(position) <= perception) {
                // Ignore fish that are rotating
                for (let manager of this.bounceManager) {
                    if (manager.boid.obj == other.obj)
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
        for (let manager of this.rotationManager) {
            if (manager.boid == this) {
                return;
            }
        }

        const rot = getDirection(this.obj.quaternion),
            dir = velocityToDirection(this.velocity);

        if (rot != dir) {
            // Add manager to animate the rotation
            this.rotationManager.push(new Managers.Rotation({
                boid: this,
                desired: dir,
                instant: false
            }));
        }
    }
}



export function update(boids, bounceManager, rotationManager) {
    for (let boid of boids) {
        boid.bounce();

        boid.align(boids);
        boid.update();
    }

    // Update Bounce managers
    let managerSize = bounceManager.length;
    for (let index = 0; index < managerSize; index++) {
        const manager = bounceManager[index];
        if (manager != undefined && manager.execute())
            bounceManager.splice(index, 1);
    }

    // Update rotation managers
    managerSize = rotationManager.length;
    for (let index = 0; index < managerSize; index++) {
        const manager = rotationManager[index];
        if (manager != undefined && manager.execute())
            rotationManager.splice(index, 1);
    }
}