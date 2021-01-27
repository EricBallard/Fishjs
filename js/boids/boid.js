import * as Managers from '/js/boids/managers.js';
import * as Movement from '/js/boids/movement.js';

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.child = params.child;
        this.othersInPerception = 0;
        this.perception = 500;

        // Momentum
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        //this.velocity = new THREE.Vector3(this.getSeed(), this.getSeed(), this.getSeed());
        this.velocity = new THREE.Vector3(-4, 4, 4);
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

        // VIDEO @ 21:50
    }

    getSeed() {
        let seed = Math.random() * this.maxSpeed;
        return Math.random() < 0.5 ? seed : seed - (seed * 2);
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
                other.obj.position.distanceTo(position) > this.perception ||
                // Other is moving towards border
                isMovingOutBounds(other, -500))
                continue;

            // Other is in perception
            others.push(other);
        }

        return others
    }

    getAlignment(alignment, othersInPerception) {
        // Determine average
        //alignment.divideScalar(othersInPerception);

        // Set magntiude
        //const magnitude = Math.sqrt(Math.pow(perceivedVelocity.x, 2) + Math.pow(perceivedVelocity.y, 2) + Math.pow(perceivedVelocity.z, 2));
        // const angle = Math.atan2(perceivedVelocity.y, perceivedVelocity.x);

        // perceivedVelocity.x = Math.cos(angle) * magnitude;
        // perceivedVelocity.y = Math.sin(angle) * magnitude;
        //perceivedVelocity.z = Math.tan(Math.atan2(perceivedVelocity.y, perceivedVelocity.z)) * magnitude;

        // Negate current
        // alignment.sub(this.velocity);

        // Limit speed
        //limitToMax(alignment, this.maxSpeed);

        alignment.div(othersInPerception);
        alignment.setMag(this.maxSpeed);
        alignment.sub(this.velocity);
        alignment.limit(this.maxForce);
    }

    getCohesion(cohesion, othersInPerception) {
        /*
        cohesion.divideScalar(othersInPerception);

        cohesion.sub(this.obj.position);

        //cohesion.setMag(this.maxSpeed);

        cohesion.sub(this.velocity);

        limitToMax(cohesion, this.maxSpeed);
        */

        cohesion.div(othersInPerception);
        cohesion.sub(this.obj.position);
        cohesion.setMag(this.maxSpeed);
        cohesion.sub(this.velocity);
        cohesion.limit(this.maxForce);
    }

    getSeparation(separation, othersInPerception) {
        separation.div(othersInPerception);
        separation.setMag(this.maxSpeed);
        separation.sub(this.velocity);
        separation.limit(this.maxForce);
    }


    move(boids) {
        if (this.bounceManager == undefined) {
            // Get percievable boids
            const others = this.getOthersInPerception(boids),
                othersInPerception = others.length;

            if (othersInPerception > 0) {
                // Update momentum
                const pos = this.obj.position;

                let alignment = createVector(),
                    cohesion = createVector(),
                    separation = createVector();

                // Cache sum of other's position and velocity
                for (const other of others) {
                    const ov = other.velocity,
                        op = other.obj.position;

                    // Add to sum of percievable velocity
                    alignment.add(ov.x, ov.y, ov.z);

                    // Add to sum of percievable position
                    cohesion.add(op.x, op.y, op.z);

                    // Add to sum of the average percievable position
                    let diff = createVector(pos.x, pos.y, pos.z);
                    diff.sub(op.x, op.y, op.z);

                    const dist = op.distanceTo(pos),
                        dist2 = dist * dist;

                    if (dist2 != 0 && !isNaN(dist2)) {
                        diff.div(dist2, dist2, dist2);
                        separation.add(diff);
                    }
                }

                // Calculate Alignment
                this.getAlignment(alignment, othersInPerception);
                if (!(isNaN(alignment.x) || isNaN(alignmenty.y) || isNaN(alignment.z)))
                    this.acceleration.add(alignment.x, alignment.y, alignment.z);

                // Calculate Cohesion
                this.getCohesion(cohesion, othersInPerception);
                if (!(isNaN(cohesion.x) || isNaN(cohesion.y) || isNaN(cohesion.z)))
                    this.acceleration.add(cohesion.x, cohesion.y, cohesion.z);

                // Calculate Separation
                this.getSeparation(separation, othersInPerception);
                if (!(isNaN(separation.x) || isNaN(separation.y) || isNaN(separation.z)))
                    this.acceleration.add(separation.x, separation.y, separation.z);

                // Appy 
                this.velocity.add(this.acceleration);
            }
        }

        // Reset acceleration
        this.acceleration.setScalar(0);

        // TODO: add drag? https://en.wikipedia.org/wiki/Drag_%28physics%29

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

    const bounds = 1500 + offset;
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
        boid.move(params.boids);
        boid.bounce();
        boid.rotate();
    }
}