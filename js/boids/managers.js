import * as Movement from '/js/boids/movement.js';

export class Rotation {
    constructor(params) {
        this.boid = params.boid;
        this.obj = this.boid.obj;
        this.facing = params.facing;
        this.desired = params.desired;
        this.idleDirs = Movement.getNeighboringDirections(this.desired);

        // Rotate quickest direction
        this.inverse = false;
        let inverseFrom = [],
            oppositeDir;

        switch (this.desired) {
            case Movement.direction.NORTH:
                inverseFrom = [Movement.direction.NORTH_WEST, Movement.direction.SOUTH_WEST, Movement.direction.WEST];
                oppositeDir = Movement.direction.SOUTH;
                break;
            case Movement.direction.EAST:
                inverseFrom = [Movement.direction.NORTH_WEST, Movement.direction.NORTH_EAST, Movement.direction.NORTH];
                oppositeDir = Movement.direction.WEST;
                break;
            case Movement.direction.SOUTH:
                inverseFrom = [Movement.direction.NORTH_EAST, Movement.direction.SOUTH_EAST, Movement.direction.EAST];
                oppositeDir = Movement.direction.NORTH;
                break;
            case Movement.direction.WEST:
                inverseFrom = [Movement.direction.SOUTH_WEST, Movement.direction.SOUTH_EAST, Movement.direction.SOUTH];
                oppositeDir = Movement.direction.EAST;
                break;
            case Movement.direction.NORTH_EAST:
                inverseFrom = [Movement.direction.NORTH_WEST, Movement.direction.NORTH, Movement.direction.WEST];
                oppositeDir = Movement.direction.SOUTH_WEST;
                break;
            case Movement.direction.SOUTH_EAST:
                inverseFrom = [Movement.direction.NORTH_EAST, Movement.direction.NORTH, Movement.direction.WEST];
                oppositeDir = Movement.direction.NORTH_WEST;
                break;
            case Movement.direction.SOUTH_WEST:
                inverseFrom = [Movement.direction.SOUTH_EAST, Movement.direction.SOUTH, Movement.direction.EAST];
                oppositeDir = Movement.direction.NORTH_EAST;
                break;
            case Movement.direction.NORTH_WEST:
                inverseFrom = [Movement.direction.SOUTH_WEST, Movement.direction.SOUTH, Movement.direction.WEST];
                oppositeDir = Movement.direction.SOUTH_EAST;
                break;
        }

        if (this.facing == oppositeDir && Math.random() < 0.5)
            inverseFrom.push(oppositeDir);

        for (let dir of inverseFrom) {
            if (dir == this.facing) {
                this.inverse = true;
                break;
            }
        }
    }

    execute() {
        const pp = this.obj.getWorldPosition(),
            cp = this.boid.child.getWorldPosition();

        // Validate rotation
        this.facing = Movement.getDirectionFromChild(pp, cp);

        if (this.desired == undefined) {
            if (this.facing != null) {
                this.desired = this.facing;
                this.idleDirs = Movement.getNeighboringDirections(this.desired);
            }
            return;
        }


        // Validate complete rotation - invert to opposite neighboring direction of desired
        if (((this.facing == this.desired && this.idleDir == undefined) ||
                this.facing == this.idleDir)) {

            // Rotate between neighboring direction to further sell swimming effect
            this.idleDir = this.idleDir == undefined ?
                (this.inverse ? this.idleDirs.left : this.idleDirs.right) :
                this.idleDir == this.idleDirs.right ? this.idleDirs.left : this.idleDirs.right;

            if ((this.idleDir == this.idleDirs.left && this.inverse) ||
                (!this.inverse && this.idleDir == this.idleDirs.right))
                this.inverse = this.idleDir == this.idleDirs.right ? this.inverse = true :
                this.idleDir == this.idleDirs.left ? this.inverse = false :
                this.inverse;

            return;
        }

        // Generate random increments
        let offset = THREE.Math.radToDeg(((Math.random() + 1) * Movement.getSpeed(this.boid.velocity)) / 10000);
        if (this.inverse) {
            offset -= offset * 2;
        }

        // Rotate Y-axis (horizontal)
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.idleDir != undefined ? offset / this.boid.maxSpeed : offset * 2);

        // Rotate Z-axis (vertical)
        let y = this.boid.velocity.y,
            vertPer = (y / this.boid.maxSpeed);

        if (vertPer >= 0.90)
            vertPer = 0.90;
        else if (vertPer <= -0.90)
            vertPer = -0.90;

        let ry = Movement.getVertPerFromChild(pp, cp);

        if (vertPer >= 0 ? ry < vertPer / 2 : vertPer < 0 ? ry > vertPer / 2 : false) {
            if (this.boid.velocity.y >= 0) {
                if (offset >= 0)
                    offset -= offset * 2;
            } else {
                if (offset < 0)
                    offset = Math.abs(offset);
            }

            this.obj.rotation.z += offset;
        }
    }
}

export class Bounce {

    constructor(params) {
        this.boid = params.boid;
        this.fps = params.fps;
        this.life = this.fps * 5;

        const v = this.boid.velocity;
        this.desiredVX = params.x ? (v.x >= 0 ? this.getSeed(true) : this.getSeed(false)) : v.x;
        this.desiredVY = params.y ? (v.y >= 0 ? this.getSeed(true) : this.getSeed(false)) : v.y;
        this.desiredVZ = params.z ? (v.z >= 0 ? this.getSeed(true) : this.getSeed(false)) : v.z;
    }

    getSeed(negative) {
        const seed = (Math.random() * (this.boid.maxSpeed - 1)) + 1;
        return negative ? seed - (seed * 2) : seed;
    }

    execute() {
        // Limit movement pass bounds
        const p = this.boid.obj.position;
        if (p.x > 2450 || p.x < -2450)
            this.boid.obj.position.x = p.x < 0 ? -2450 : 2450;
        if (p.y > 950 || p.y < -1500)
            this.boid.obj.position.y = p.y < 0 ? -1500 : 950;
        if (p.z > 2450 || p.z < -2450)
            this.boid.obj.position.z = p.z < 0 ? -2450 : 2450;

        // Reflect entities' velocity, making it "bounce"
        let adjusted = false;
        this.life--;

        const v = this.boid.velocity;

        // X
        if ((this.desiredVX < 0 && this.desiredVX < v.x) || (this.desiredVX >= 0 && this.desiredVX > v.x)) {
            const seed = Math.abs(this.desiredVX / (Movement.getSpeed(this.boid.velocity) * (this.fps / 4)));
            this.boid.velocity.x += this.desiredVX >= 0 ? seed : -seed;
            adjusted = true;
        }

        // Y
        if ((this.desiredVY < 0 && this.desiredVY < v.y) || (this.desiredVY >= 0 && this.desiredVY > v.y)) {
            const seed = Math.abs(this.desiredVY / (Movement.getSpeed(this.boid.velocity) * (this.fps / 4)));
            this.boid.velocity.y += this.desiredVY >= 0 ? seed : -seed;
            adjusted = true;
        }

        // Z
        if ((this.desiredVZ < 0 && this.desiredVZ < v.z) || (this.desiredVZ >= 0 && this.desiredVZ > v.z)) {
            const seed = Math.abs(this.desiredVZ / (Movement.getSpeed(this.boid.velocity) * (this.fps / 4)));
            this.boid.velocity.z += this.desiredVZ >= 0 ? seed : -seed;
            adjusted = true;
        }

        //this.life < 1 ||
        return this.life < 1 || (!adjusted &&
            (p.x < 1250 && p.x > -1250 &&
                p.y < 250 && p.y > -1250 &&
                p.z < 1250 && p.z > -1250));
    }
}