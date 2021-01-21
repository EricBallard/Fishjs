import * as Movement from '/js/boids/movement.js';

export class Rotation {
    constructor(params) {
        this.boid = params.boid;
        this.obj = this.boid.obj;

        // Calculate directions
        this.facing = params.facing;
        this.desired = params.desired;
        this.idleDirs = Movement.getNeighboringDirections(this.desired);

        // Rotate quickest direction towards desired
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

        // Fifhs has rotated to desired direction
        if ((this.facing == this.desired && this.idleDir == undefined) ||
            // Fish has rotated to neighboring direction
            this.facing == this.idleDir ||
            // Fish has over-rotated (fix by inversing)
            (this.idleDir == undefined && (this.facing == this.idleDirs.left ||
                this.facing == this.idleDirs.right))) {

            // Rotate between neighboring direction to further sell swimming effect
            this.idleDir = this.idleDir == undefined ?
                (this.inverse ? this.idleDirs.left : this.idleDirs.right) :
                this.idleDir == this.idleDirs.right ? this.idleDirs.left : this.idleDirs.right;

            // Correct rotation direction based on direction
            if ((this.idleDir == this.idleDirs.left && this.inverse) ||
                (this.idleDir == this.idleDirs.right && !this.inverse))

                this.inverse = this.idleDir == this.idleDirs.right ? this.inverse = true :
                    this.idleDir == this.idleDirs.left ? this.inverse = false :
                        this.inverse;
            return;
        }

        // Generate random increments
        let speed = Movement.getSpeed(this.boid.velocity);
        speed = speed > this.boid.maxSpeed ? this.boid.maxSpeed : speed;

        let offset = THREE.Math.radToDeg(((Math.random() + 1) * (speed / 2) + 1) / 10000);
        if (this.inverse) {
            offset -= offset * 2;
        }

        // Rotate Y-axis (horizontal)
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.idleDir != undefined ? offset : offset * 2);

        // Rotate Z-axis (vertical)

        let y = this.boid.velocity.y,
            desiredRot = (y / this.boid.maxSpeed);

        // Limit
        if (desiredRot >= 0.90)
            desiredRot = 0.90;
        else if (desiredRot <= -0.90)
            desiredRot = -0.90;

        let currentRot = Movement.getVertRotFromChild(pp, cp);

        // Rotate
        if (desiredRot >= 0 ? currentRot < desiredRot / 2 : desiredRot < 0 ? currentRot > desiredRot / 2 : false) {
            if (this.boid.velocity.y >= 0) {
                if (offset >= 0)
                    offset -= offset * 2;
            } else {
                if (offset < 0)
                    offset = Math.abs(offset);
            }

            this.boid.obj.rotateOnAxis(new THREE.Vector3(0, 0, 1), offset);
        }
    }
}

export class Bounce {

    constructor(params) {
        this.boid = params.boid;
        this.life = 200;

        this.changeX = params.x;
        this.changeY = params.y;
        this.changeZ = params.z;

        const v = this.boid.velocity;
        this.desiredVX = params.x ? (v.x >= 0 ? this.getSeed(true) : this.getSeed(false)) : v.x + (Math.random() < 0.5 ? Math.random() : -Math.random());
        this.desiredVY = params.y ? (v.y >= 0 ? this.getSeed(true) : this.getSeed(false)) : v.y + (Math.random() < 0.5 ? Math.random() : -Math.random());
        this.desiredVZ = params.z ? (v.z >= 0 ? this.getSeed(true) : this.getSeed(false)) : v.z + (Math.random() < 0.5 ? Math.random() : -Math.random());



    }

    getSeed(negative) {
        const seed = (Math.random() * (this.boid.maxSpeed - 2)) + 1;
        return negative ? seed - (seed * 2) : seed;
    }

    execute() {
        let onBorder = false;

        // Limit movement pass bounds
        const p = this.boid.obj.position;
        if (onBorder = onBorder || p.x > 2450 || p.x < -2450)
            this.boid.obj.position.x = p.x < 0 ? -2450 : 2450;
        if (onBorder = (p.y > 950 || p.y < -1500))
            this.boid.obj.position.y = p.y < 0 ? -1500 : 950;
        if (onBorder = (p.z > 2450 || p.z < -2450))
            this.boid.obj.position.z = p.z < 0 ? -2450 : 2450;

        // Reflect entities' velocity, making it "bounce"
        let adjusted = false;
        this.life--;

        const v = this.boid.velocity,
            max = this.boid.maxSpeed,
            pos = this.boid.obj.position;

        let speed = Movement.getSpeed(v);
        speed = speed > max ? max : speed;

        // X
        if (!this.changeX && (pos.x >= 1500 || pos.x <= -1500)) {
            this.changeX = true;
            this.desiredVX = v.x >= 0 ? this.getSeed(true) : this.getSeed(false);
        } else if ((this.desiredVX < 0 && this.desiredVX < v.x) || (this.desiredVX >= 0 && this.desiredVX > v.x)) {
            let seed = Math.abs(this.desiredVX / (speed + Math.random() * 50));
            this.boid.velocity.x += this.desiredVX >= 0 ? seed : -seed;
            adjusted = true;
        }

        // Y
        if (!this.changeY && (pos.y >= 500 || pos.y <= -1500)) {
            this.changeY = true;
            this.desiredVY = v.y >= 0 ? this.getSeed(true) : this.getSeed(false);
        } else if ((this.desiredVY < 0 && this.desiredVY < v.y) || (this.desiredVY >= 0 && this.desiredVY > v.y)) {
            let seed = Math.abs(this.desiredVY / (speed + Math.random() * 50));
            this.boid.velocity.y += this.desiredVY >= 0 ? seed : -seed;
            adjusted = true;
        }

        // Z
        if (!this.changeZ && (pos.z >= 1500 || pos.z <= -1500)) {
            this.changeZ = true;
            this.desiredVZ = v.z >= 0 ? this.getSeed(true) : this.getSeed(false);
        } else if ((this.desiredVZ < 0 && this.desiredVZ < v.z) || (this.desiredVZ >= 0 && this.desiredVZ > v.z)) {
            let seed = Math.abs(this.desiredVZ / (speed + Math.random() * 50));
            this.boid.velocity.z += this.desiredVZ >= 0 ? seed : -seed;
            adjusted = true;
        }

        return this.life < 1 || (!adjusted &&
            (p.x < 1000 && p.x > -1000 &&
                p.y < 500 && p.y > -1000 &&
                p.z < 1000 && p.z > -1000));
    }
}