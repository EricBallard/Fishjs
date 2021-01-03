import * as Managers from '/js/boids/managers.js';
import * as Movement from '/js/boids/movement.js';

function getSeed() {
    let seed = (Math.random() * 10);
    return Math.random() < 0.5 ? seed : seed - (seed * 2);
}

const perception = 1000;

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.child = params.child;
        this.bounceManager = params.bounceManager;
        this.rotationManager = params.rotationManager;

        // Momentum
        this.velocity = new THREE.Vector3(getSeed(), 0, getSeed());

        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        // Auto-rotate at start
        rotateTo(Movement.velocityToDirection(this.velocity), this.obj);

        // VIDEO @ 21:50
    }

    bounce() {
        const pos = this.obj.position,
            v = this.velocity;

        const vx = this.velocity.x,
            vy = this.velocity.y,
            vz = this.velocity.z;

        let inverse = false;

        if (pos.x >= 2000 || (inverse = pos.x <= -2000)) {
            if (inverse ? vx < 0 : vx >= 0) {
                this.velocity.x = vx < 0 ? Math.abs(vx) : vx - (vx * 2);
            }
        }

        if (pos.y >= 2000 || (inverse = pos.y <= 100)) {
            if (inverse ? vy < 0 : vy >= 0) {
                this.velocity.y = vy < 0 ? Math.abs(vy) : vy - (vy * 2);
            }
        }

        if (pos.z >= 2000 || (inverse = pos.z <= -2000)) {
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

        const nearBorder = (position.x >= 1750 || position.x <= -1750 ||
            position.y >= 1750 || position.y <= 100 ||
            position.z >= 1750 || position.z <= -1750);

        let othersInPerception = 0;

        for (let other of boids) {
            if (other == this)
                continue;

            const pos = other.obj.position;
            if (pos.distanceTo(position) > (nearBorder ? perception / 4 : perception))
                continue;

            if (pos.x >= 1500 || pos.x <= -1500 ||
                pos.y >= 1500 || pos.y <= -1500 ||
                pos.z >= 1500 || pos.z <= -1500) {
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

    update() {
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


        this.rotate();
    }

    rotate() {
        for (let manager of this.rotationManager) {
            if (manager.boid.obj == this.obj)
                return;
        }

        const facingDirection = Movement.getDirectionFromChild(this.obj.getWorldPosition(), this.child.getWorldPosition());
        const desiredDirection = Movement.velocityToDirection(this.velocity);

        if (facingDirection != desiredDirection) {
            //console.log('Facing: ' + facingDirection + ' | Desired: ' + desiredDirection);
            // Add manager to animate the rotation

            this.rotationManager.push(new Managers.Rotation({
                boid: this,
                facing: facingDirection,
                desired: desiredDirection
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
        if (manager != undefined && manager.execute()) {
            console.log("finished vbouncing");
            bounceManager.splice(index, 1);
        }
    }

    // Update rotation managers
    managerSize = rotationManager.length;
    for (let index = 0; index < managerSize; index++) {
        const manager = rotationManager[index];
        if (manager != undefined && manager.execute())
            rotationManager.splice(index, 1);
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