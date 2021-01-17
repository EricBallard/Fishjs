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
        let offset = THREE.Math.radToDeg((Math.random() + 1) / 10000);
        if (this.inverse) {
            offset -= offset * 2;
        }

        // Rotate Y-axis (horizontal)
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);

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

            // Rotate Z-axis (vertical)
            this.obj.rotation.z += offset;
        }

    }
}

export class Bounce {

    constructor(params) {
        this.boid = params.boid;
        this.life = 300;

        const v = this.boid.velocity;
        this.desiredVX = params.x ? v < 0 ? this.getSeed(false) : this.getSeed(true) : v.x;

    }

    getSeed(negative) {
        const seed = Math.random() * this.boid.maxSpeed;
        return negative ? seed - (seed * 2) : seed;
    }

    execute() {
        // Limit movement pass bounds
        const p = this.boid.obj.position;
        if (p.x > 2000 || p.x < -2000)
            this.boid.obj.position.x = p.x < 0 ? -1500 : 1500;
        if (p.y > 500 || p.y < -500)
            this.boid.obj.position.y = p.y < 0 ? -500 : 500;
        if (p.z > 2000 || p.z < -2000)
            this.boid.obj.position.z = p.z < 0 ? -1500 : 1500;

        // Reflect entities velocity, making it "bounce"
        let adjusted = false;
        this.life--;

        const v = this.boid.velocity;

        if (Math.round(v.x) != this.desiredVX) {
            this.boid.velocity.x += ((this.desiredVX > 0 && v.x < this.desiredVX) || (this.desiredVX < 0 && v.x < this.desiredVX) ? Math.random() : -Math.random()) / (Math.random() * 10);
            adjusted = true;

            console.log('adj x: ' + this.desiredVX);
        }
        /*

        if (Math.round(v.y) != this.desiredVY) {
            this.boid.velocity.y += ((this.desiredVY > 0 && v.y < this.desiredVY) || (this.desiredVY < 0 && v.y < this.desiredVY) ? Math.random() : -Math.random()) / (Math.random() * 10);
            adjusted = true;
        }

        if (Math.round(v.z) != this.desiredVZ) {
            this.boid.velocity.z += ((this.desiredVZ > 0 && v.z < this.desiredVZ) || (this.desiredVZ < 0 && v.z < this.desiredVZ) ? Math.random() : -Math.random()) / (Math.random() * 10);
            adjusted = true;
        }
        */
        return this.life < 1 || (!adjusted &&
            p.x < 1250 && p.x > -1250 &&
            p.y < 250 && p.y > 0 &&
            p.z < 1250 && p.z > -1250);
    }
}