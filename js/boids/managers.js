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
        // Validate rotation
        this.facing = Movement.getDirectionFromChild(this.obj.getWorldPosition(), this.boid.child.getWorldPosition());

        if (((this.facing == this.desired && this.idleDir == undefined) ||
                this.facing == this.idleDir)) {
            // Rotate between neighboring direction to further sell swimming effect

            this.idleDir = this.idleDir == undefined ?
                (this.inverse ? this.idleDirs.left : this.idleDirs.right) :
                this.idleDir == this.idleDirs.right ? this.idleDirs.left : this.idleDirs.right;

            if ((this.idleDir == this.idleDirs.left && this.inverse) ||
                (!this.inverse && this.idleDir == this.idleDirs.right))
                this.inverse = !this.inverse;

            return;
        }

        // Generate random increments
        let offset = THREE.Math.radToDeg(((Math.random() * (this.idleDir != undefined ? 1 : 6)) + 1) / 10000);
        if (this.inverse) {
            offset -= offset * 2;
        }

        // Rotate 
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);
    }
}

export class Bounce {
    constructor(params) {
        this.boid = params.boid;

        
    }

    execute() {
        // Reflect entities velcoity, making it "bounce"
      

        return false;
    }
}