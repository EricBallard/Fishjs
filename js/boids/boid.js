import * as Managers from '/js/boids/managers.js';
import * as Movement from '/js/boids/movement.js';

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.child = params.child;
        this.othersInPerception = 0;
        this.perception = 1500;

        // Momentum
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        //this.velocity = new THREE.Vector3(this.getSeed(), this.getSeed(), this.getSeed());
        this.velocity = new THREE.Vector3(-4, 4, 4);
        this.direction = Movement.velocityToDirection(this.velocity);

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

    getAlignment(boids) {
        let perceivedVelocity = new THREE.Vector3(0, 0, 0);

        if (this.bounceManager != undefined)
            return perceivedVelocity;

        const position = this.obj.position;
        let othersInPerception = 0;

        for (let other of boids) {
            if (other == this ||
                other.bounceManager != undefined ||
                other.obj.position.distanceTo(position) > this.perception ||
                isMovingOutBounds(other, -500))
                continue;


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
        }

        this.othersInPerception = othersInPerception;
        return perceivedVelocity;
    }

    move(boids) {
        // Update momentum 
        this.acceleration = this.getAlignment(boids);
        this.velocity.add(this.acceleration);
        const v = this.velocity;

        // Limit speed

        // X
        if (v.x > this.maxSpeed)
            this.velocity.x = this.maxSpeed;
        if (v.x < -this.maxSpeed)
            this.velocity.x = -this.maxSpeed;

        // Y
        if (v.y > this.maxSpeed)
            this.velocity.y = this.maxSpeed;
        if (v.y < -this.maxSpeed)
            this.velocity.y = -this.maxSpeed;

        // Z
        if (v.z > this.maxSpeed)
            this.velocity.z = this.maxSpeed;
        if (v.z < -this.maxSpeed)
            this.velocity.z = -this.maxSpeed;

        // Apply momentum
        this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
    }

    rotate() {
        // Rotate towards velocity
        if ((this.direction = Movement.velocityToDirection(this.velocity)) != undefined &&
            this.direction != this.rotationManager.desired) {

            this.rotationManager = new Managers.Rotation({
                boid: this,
                facing: this.rotationManager.facing,
                desired: this.direction
            });
        }

        this.rotationManager.execute();
    }
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