import * as Managers from '/js/boids/managers.js';
import * as Movement from '/js/boids/movement.js';

export class Entity {
    constructor(params) {
        // Cache obj to reflect/update position based on momentum
        this.obj = params.obj;
        this.child = params.child;
        this.othersInPerception = 0;
        this.perception = 2000;

        // Momentum
        this.maxSpeed = 2;
        this.maxForce = 0.2;
        this.acceleration = new THREE.Vector3(0, 0, 0);

        //this.velocity = new THREE.Vector3(0, 0.2, 0);
        this.velocity = new THREE.Vector3(this.getSeed(), this.getSeed(), this.getSeed());
        this.direction = Movement.velocityToDirection(this.velocity);

        this.rotationManager = new Managers.Rotation({
            boid: this,
            facing: this.direction,
            desired: this.direction
        });


        // VIDEO @ 21:50
    }

    getSeed() {
        let seed = (Math.random() * this.maxSpeed);
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
        const pos = this.obj.position,
            vx = this.velocity.x,
            vy = this.velocity.y,
            vz = this.velocity.z;

        if ((pos.x > 1500 && (vx >= 0 || vz >= 0)) ||
            (pos.x < -1500 && (vx < 0 || vz < 0))

            ||
            (pos.y > 500 && vy >= 0) ||
            (pos.y < 0 && vy < 0)

            ||
            (pos.z > 1500 && (vx >= 0 || vz >= 0)) ||
            (pos.z < -1500 && (vx < 0 || vz < 0))
        ) {

            this.bounceManager = new Managers.Bounce({
                boid: this,
                desiredVX: vx - (vx * (Math.random() + 1)),
                desiredVY: vy - (vy * (Math.random() + 1)),
                desiredVZ: vz - (vz * (Math.random() + 1))
            });
        }
    }

    align(boids) {
        if (this.bounceManager != undefined)
            return;

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
            if (other == this || other.bounceManager != undefined)
                continue;

            const pos = other.obj.position;
            if (pos.distanceTo(position) > (nearBorder ? this.perception / 4 : perception.perception))
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

        this.othersInPerception = othersInPerception;
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

// Update boids
export function update(boids, bManagers, rManagers) {
    for (let boid of boids) {
        boid.align(boids);
        boid.bounce();

       // boid.move();
        boid.rotate();
    }
}