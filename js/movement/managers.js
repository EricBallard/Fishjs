import * as Movement from '/js/movement/movement.js';

export class Rotation {
    constructor(params) {
        this.boid = params.boid;
        this.obj = this.boid.obj;
        this.facing = params.facing;
        this.desired = params.desired;

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
        // Validate rotation
        const facing = Movement.getDirectionFromChild(this.boid.obj.getWorldPosition(), this.boid.child.getWorldPosition());

        if (facing == this.desired) {
            //console.log(this.desired + ' | Succesful rotate!');
            return true;
        }

        // Generate random increments
        let offset = THREE.Math.radToDeg(((Math.random() * 10) + 1) / 10000);
        if (this.inverse) {
            offset -= offset * 2;
        }

        // Rotate 
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);
        return false;
    }
}

export class Bounce {
    constructor(params) {
        this.boid = params.boid;

        const pos = this.boid.obj.position,
            maxSpeed = this.boid.maxSpeed,
            vv = this.boid.velocity;

        this.start = vv;

        if (this.reflectX = pos.x >= 2000 || pos.x <= -2000) {
            let vx = vv.x;
            vx = vx < 0 ? Math.abs(vx) : vx - (vx * 2);

            let desired = vx / ((Math.random() * 4) + .4);
            desired = (desired > maxSpeed ? maxSpeed : desired);
            console.log('EnterX: ' + this.boid.velocity.x + " | ExitX: " + desired);
            this.boid.velocity.x = vx;
            this.desiredVX = desired;
        }

        if (this.reflectY = pos.y >= 2000 || pos.y <= -2000) {
            let vy = vv.y;
            vy = vy < 0 ? Math.abs(vy) : vy - (vy * 2);

            this.boid.velocity.y = vy;
            this.desiredVY = (vy > maxSpeed ? maxSpeed : vy) / (Math.random() * 4);
        }

        if (this.reflectZ = pos.z >= 2000 || pos.z <= -2000) {
            let vz = vv.z;
            vz = vz < 0 ? Math.abs(vz) : vz - (vz * 2);

            this.boid.velocity.z = vz;
            this.desiredVZ = (vz > maxSpeed ? maxSpeed : vz) / (Math.random() * 4);
        }
    }

    execute() {
        // Reflect entities velcoity, making it "bounce"
        const v = this.boid.velocity,
            pos = this.boid.obj.position;

        let altered = false;

        // X-Axis
        if (this.reflectX) {
            const inverted = this.desiredVX < 0;

            if (inverted ? v.x > this.desiredVX : v.x < this.desiredVX) {
                this.boid.velocity.x = inverted ? v.x - (v.x / (Math.random() * 4)) : v.x + (v.x / (Math.random() * 4));
                altered = true;
            }
        }

        // Y-Axis
        if (this.reflectY) {
            const inverted = this.desiredVY < 0,
                vy = Math.abs(this.desiredVY / 10);

            if (inverted ? this.start.y > this.desiredVY : this.start.y < this.desiredVY) {
                this.boid.velocity.y = inverted ? v.y - vy : v.y + vy;
                altered = true;
            }
        }

        // Z-Axis
        if (this.reflectZ) {
            const inverted = this.desiredVZ < 0,
                vz = Math.abs(this.desiredVZ / 10);

            if (inverted ? this.start.z > this.desiredVZ : this.start.z < this.desiredVZ) {
                this.boid.velocity.z = inverted ? v.z - vz : v.z + vz;
                altered = true;
            }
        }

        return !altered &&
            (pos.x <= 1500 && pos.x >= -1500 &&
                pos.y <= 1500 && pos.y >= -1500 &&
                pos.z <= 1500 && pos.z >= -1500);
    }
}