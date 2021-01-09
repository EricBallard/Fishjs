import * as Managers from '/js/boids/managers.js';
import * as Movement from '/js/boids/movement.js';

function getSeed() {
    let seed = (Math.random() * 10);
    return Math.random() < 0.5 ? seed : seed - (seed * 2);
}

const perception = 500;

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.child = params.child;

        // Momentum
        this.velocity = new THREE.Vector3(getSeed(), 0, getSeed());

        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        // Rotation
        this.direction = Movement.velocityToDirection(this.velocity);

        // Auto-rotate at start
        rotateTo(this.direction, this.obj);

        this.rotationManager = new Managers.Rotation({
            boid: this,
            facing: this.direction,
            desired: this.direction
        });


        // VIDEO @ 21:50
    }

    bounce() {
        const pos = this.obj.position,
            v = this.velocity;

        const vx = this.velocity.x,
            vy = this.velocity.y,
            vz = this.velocity.z;

        let inverse = false;

        if (pos.x >= 1000 || (inverse = pos.x <= -1000)) {
            if (inverse ? vx < 0 : vx >= 0) {
                this.velocity.x = vx < 0 ? Math.abs(vx) : vx - (vx * 2);
            }
        }

        if (pos.y >= 1000 || (inverse = pos.y <= 1000)) {
            if (inverse ? vy < 0 : vy >= 0) {
                this.velocity.y = vy < 0 ? Math.abs(vy) : vy - (vy * 2);
            }
        }

        if (pos.z >= 1000 || (inverse = pos.z <= -1000)) {
            if (inverse ? vz < 0 : vz >= 0) {
                this.velocity.z = vz < 0 ? Math.abs(vz) : vz - (vz * 2);
            }
        }
    }

    align(boids) {
        const alignment = this.getAlignment(boids);
        this.acceleration = alignment;
    }

    getAlignment(boids) {
        let perceivedVelocity = new THREE.Vector3(0, 0, 0);

        const position = this.obj.position;

        const nearBorder = (position.x >= 750 || position.x <= -750 ||
            position.y >= 750 || position.y <= 750 ||
            position.z >= 750 || position.z <= -750);

        let othersInPerception = 0;

        for (let other of boids) {
            if (other == this)
                continue;

            const pos = other.obj.position;
            if (pos.distanceTo(position) > (nearBorder ? perception / 4 : perception))
                continue;

            if (pos.x >= 1000 || pos.x <= -1000 ||
                pos.y >= 1000 || pos.y <= -1000 ||
                pos.z >= 1000 || pos.z <= -1000) {
                continue;
            }

            perceivedVelocity.x += other.velocity.x;
            perceivedVelocity.y += other.velocity.y;
            perceivedVelocity.z += other.velocity.z;
            othersInPerception += 1;
        }

        if (othersInPerception > 0) {
            // Determine average velocity
            perceivedVelocity.x = (perceivedVelocity.x / othersInPerception);
            perceivedVelocity.y = (perceivedVelocity.y / othersInPerception);
            perceivedVelocity.z = (perceivedVelocity.z / othersInPerception);

            // Limit force of velocity
            if (perceivedVelocity.x > this.maxForce)
                perceivedVelocity.x = this.maxForce;
            if (perceivedVelocity.x < -this.maxForce)
                perceivedVelocity.x = -this.maxForce;

            if (perceivedVelocity.y > this.maxForce)
                perceivedVelocity.y = this.maxForce;
            if (perceivedVelocity.y < -this.maxForce)
                perceivedVelocity.y = -this.maxForce;

            if (perceivedVelocity.z > this.maxForce)
                perceivedVelocity.z = this.maxForce;
            if (perceivedVelocity.z < -this.maxForce)
                perceivedVelocity.z = -this.maxForce;
        }

        return perceivedVelocity;
    }

    move() {
        // Update momentum 
        this.velocity.add(this.acceleration);
        const v = this.velocity;

        if (v.x > this.maxSpeed)
            this.velocity.x = this.maxSpeed;
        if (v.x < -this.maxSpeed)
            this.velocity.x = -this.maxSpeed;

        if (v.y > this.maxSpeed)
            this.velocity.y = this.maxSpeed;
        if (v.y < -this.maxSpeed)
            this.velocity.y = -this.maxSpeed;

        if (v.z > this.maxSpeed)
            this.velocity.z = this.maxSpeed;
        if (v.z < -this.maxSpeed)
            this.velocity.z = -this.maxSpeed;

        this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
    }

    rotate() {
        const desiredDirection = Movement.velocityToDirection(this.velocity);

        if (desiredDirection != this.rotationManager.desired) {
            this.rotationManager = new Managers.Rotation({
                boid: this,
                facing: this.rotationManager.facing,
                desired: desiredDirection
            });
        }

        this.rotationManager.execute();
    }
}

export function update(boids, bManagers, rManagers) {
    // Update boids
    for (let boid of boids) {
        boid.align(boids);
        boid.bounce();

        boid.move();
        boid.rotate();
    }

    // Update Bounce managers
    let managerSize = bManagers.length;
    for (let index = 0; index < managerSize; index++) {
        const manager = bManagers[index];
        if (manager != undefined && manager.execute()) {
            console.log("finished vbouncing");
            bManagers.splice(index, 1);
        }
    }
}

function rotateTo(direction, obj) {
    var seed = Math.random() * 250 / 1000,
        desiredDegree;

    switch (direction) {
        case Movement.direction.NORTH:
            desiredDegree = seed + 0.875;
            if (desiredDegree > 1.0) desiredDegree = -1 + (desiredDegree - 1.0);
            break;
        case Movement.direction.NORTH_EAST:
            desiredDegree = seed + 0.625;
            break;
        case Movement.direction.EAST:
            desiredDegree = seed + 0.375;
            break;
        case Movement.direction.SOUTH_EAST:
            desiredDegree = seed + 0.125;
            break;
        case Movement.direction.SOUTH:
            desiredDegree = seed + -0.125;
            break;
        case Movement.direction.SOUTH_WEST:
            desiredDegree = seed + -0.375;
            break;
        case Movement.direction.WEST:
            desiredDegree = seed + -0.625;
            break;
        case Movement.direction.NORTH_WEST:
            desiredDegree = seed + -0.875;
            break;
    }

    var quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * desiredDegree);
    obj.applyQuaternion(quaternion);
}