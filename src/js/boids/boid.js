import * as Managers from './managers.js';
import * as Movement from './movement.js';

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.child = params.child;
        this.othersInPerception = 0;
        this.perception = 3000;

        // Momentum
        this.speed = 0;
        this.maxSpeed = 5;
        this.maxForce = 0.5;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        this.velocity = new THREE.Vector3(this.getSeed(), this.getSeed(), this.getSeed());
        this.direction = Movement.getDirection(this.velocity);

        // Auto-rotate on spawn (horizontally)
        var seed = Math.random() * 250 / 1000,
            desiredDegree;

        switch (this.direction) {
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
        this.obj.applyQuaternion(quaternion);

        // Set rotation manager (idle rotation + handles new directions)
        this.rotationManager = new Managers.Rotation({
            boid: this,
            facing: this.direction,
            desired: this.direction
        });

        // Animation handler
        this.animations = params.animations;
    }

    getSeed() {
        return Math.random() < 0.5 ? -this.maxSpeed : this.maxSpeed;
    }

    rotate() {
        // Rotate towards velocity
        if ((this.direction = Movement.getDirection(this.velocity)) != undefined &&
            this.direction != this.rotationManager.desired) {

            this.rotationManager = new Managers.Rotation({
                boid: this,
                facing: this.rotationManager.facing,
                desired: this.direction
            });
        }

        this.rotationManager.execute();
    }

    bounce() {
        // Update Bounce managers
        if (this.bounceManager != undefined) {
            if (this.bounceManager.execute())
                this.bounceManager = undefined;
            return;
        }

        // Detect if moving out of bounds
        const outOfBounds = isMovingOutBounds(this, 0);

        if (outOfBounds) {
            this.bounceManager = new Managers.Bounce({
                boid: this,
                x: outOfBounds.x,
                y: outOfBounds.y,
                z: outOfBounds.z
            });
        }
    }

    getOthersInPerception(boids) {
        const position = this.obj.position;
        let others = [];

        for (let other of boids) {
            // Other is me
            if (other == this ||
                // Other is bouncing
                other.bounceManager != undefined ||
                // Other is out of perception range
                other.obj.position.distanceTo(position) > this.perception)
                continue;

            // Other is in perception
            others.push(other);
        }

        return others
    }

    getAlignment(alignment) {
        alignment.divideScalar(this.othersInPerception);
        //alignment.setMag(this.maxSpeed);
        alignment.subScalar(this.velocity);
        alignment.clampScalar(this.maxForce);
    }

    getCohesion(cohesion) {
        cohesion.divideScalar(this.othersInPerception);
        cohesion.subScalar(this.obj.position);
       // cohesion.setMag(this.maxSpeed);
        cohesion.subScalar(this.velocity);
        cohesion.clampScalar(this.maxForce);
    }

    getSeparation(separation) {
        separation.divideScalar(this.othersInPerception);
       // separation.setMag(this.maxSpeed);
        separation.subScalar(this.velocity);
        separation.clampScalar(this.maxForce);
    }

    move(boids) {
        // Update speed
        const speed = Movement.getSpeed(this.velocity);
        this.speed = speed > this.maxSpeed ? this.maxSpeed : speed;

        if (this.bounceManager == undefined) {
            // Get percievable boids
            const others = this.getOthersInPerception(boids);

            if ((this.othersInPerception = others.length) > 0) {
                // Update momentum
                const pos = this.obj.position;

                let alignment = new THREE.Vector3(),
                    cohesion = new THREE.Vector3(),
                    separation = new THREE.Vector3();

                // Cache sum of other's position and velocity
                for (const other of others) {
                    const ov = other.velocity,
                        op = other.obj.position;

                    // Add to sum of percievable velocity
                    alignment.addVectors(alignment, ov);

                    // Add to sum of percievable position
                    cohesion.addVectors(cohesion, op);

                    // Add to sum of the average percievable position
                    let diff = new THREE.Vector3(pos.x, pos.y, pos.z);
                    diff.subVectors(diff, op);

                    const dist = op.distanceTo(pos),
                        dist2 = dist * dist;

                    if (dist2 != 0 && !isNaN(dist2)) {
                        diff.divideScalar(dist2);
                        separation.add(diff);
                    }
                }

                // Calculate Alignment
                this.getAlignment(alignment);
                if (!(isNaN(alignment.x) || isNaN(alignmenty.y) || isNaN(alignment.z)))
                    this.acceleration.add(alignment.x, alignment.y, alignment.z);

                // Calculate Cohesion
                this.getCohesion(cohesion);
                if (!(isNaN(cohesion.x) || isNaN(cohesion.y) || isNaN(cohesion.z)))
                    this.acceleration.add(cohesion.x, cohesion.y, cohesion.z);

                // Calculate Separation
                this.getSeparation(separation);
                if (!(isNaN(separation.x) || isNaN(separation.y) || isNaN(separation.z)))
                    this.acceleration.add(separation.x, separation.y, separation.z);

                // Appy 
                this.velocity.add(this.acceleration);
            }
        }

        // Reset acceleration
        this.acceleration.setScalar(0);

        // Limit speed
        limitToMax(this.velocity, this.maxSpeed);

        // Apply momentum
        this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
    }
}

function limitToMax(v, mx) {
    if (v.x > mx)
        v.x = mx;
    else if (v.x < -mx)
        v.x = -mx;

    if (v.y > mx)
        v.y = mx;
    else if (v.y < -mx)
        v.y = -mx;

    if (v.z > mx)
        v.z = mx;
    else if (v.z < -mx)
        v.z = -mx;
}

function isMovingOutBounds(boid, offset) {
    const pos = boid.obj.position,
        vx = boid.velocity.x,
        vy = boid.velocity.y,
        vz = boid.velocity.z;

    const bounds = 3000 + offset;
    // X
    let nearX = (pos.x >= bounds && (vx >= 0 || vz >= 0)) ||
        (pos.x <= -bounds && (vx < 0 || vz < 0));

    // Y
    let nearY = (pos.y >= 500 + offset && vy >= 0) ||
        (pos.y <= -bounds && vy < 0);

    // Z
    let nearZ = (pos.z >= bounds && (vx >= 0 || vz >= 0)) ||
        (pos.z <= -bounds && (vx < 0 || vz < 0));

    if (!nearX && !nearY && !nearZ)
        return false;
    else {
        return {
            x: nearX,
            y: nearY,
            z: nearZ
        };
    }
}

// Update boids
export function update(params) {
    for (let boid of params.boids) {
        boid.animations.update((boid.speed / 100) + 0.01);
        boid.move(params.boids);
        boid.bounce();
        boid.rotate();
    }
}