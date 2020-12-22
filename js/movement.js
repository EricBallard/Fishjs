export const direction = {
    NORTH: 'north',
    EAST: 'east',
    SOUTH: 'south',
    WEST: 'west',
    NORTH_WEST: 'north-west',
    NORTH_EAST: 'north-east',
    SOUTH_EAST: 'south-east',
    SOUTH_WEST: 'south-west'
}

export function getDirection(rotation) {
    const y = rotation.y;

    if (y < -0.85 || y >= 0.875) {
        return direction.NORTH;

    } else if (y >= 0.625 && y < 0.875) {
        return direction.NORTH_EAST;

    } else if (y >= 0.375 && y < 0.625) {
        return direction.EAST;

    } else if (y >= 0.125 && y < 0.375) {
        return direction.SOUTH_EAST;

    } else if (y >= -0.125 && y < 0.125) {
        return direction.SOUTH;

    } else if (y < -0.125 && y >= -0.375) {
        return direction.SOUTH_WEST;

    } else if (y < -0.375 && y >= -0.625) {
        return direction.WEST;

    } else if (y < -0.625 && y >= -0.875) {
        return direction.NORTH_WEST;
    } else {
        return null;
    }
}

export function velocityToDirection(velocity) {
    let x = velocity.x,
        z = velocity.z;

    if (x > 0 && Math.round(z) == 0)
        return direction.NORTH;
    else if (z > 0 && Math.round(x) == 0)
        return direction.EAST;
    if (x < 0 && Math.round(z) == 0)
        return direction.SOUTH;
    else if (z < 0 && Math.round(x) == 0)
        return direction.WEST;

    // TODO - maybe? Refactor offset to use division to account for decimal
    // eg; (1, 0, 0.25) is not registered as an offset despite x being *4 z

    // However this may not be noticable in final product
    let offset = x - z;

    if (x > 0 && z > 0) {
        if (offset >= -5 && offset <= 5) {
            return direction.NORTH_EAST;
        } else {
            return x > z ? direction.NORTH : direction.EAST;
        }
    }

    if (x < 0 && z >= 0 || z < 0 && x >= 0) {
        const ax = Math.abs(x),
            az = Math.abs(z),
            aoffset = ax - az;

        if (aoffset >= -5 && aoffset <= 5) {
            return offset >= 0 ? direction.NORTH_WEST : direction.SOUTH_EAST;
        } else {
            let off = Math.abs(offset);
            if (off >= -5 && off <= 5)
                return x > z ? direction.SOUTH : direction.EAST;
            else
                return offset >= 0 ? direction.NORTH_WEST : direction.SOUTH_EAST;
        }
    }

    if (x < 0 && z < 0) {
        if (offset >= -5 && offset <= 5) {
            return direction.SOUTH_WEST;
        } else {
            return x > z ? direction.WEST : direction.SOUTH;
        }
    }

    console.log('NULL DIRECTION | x: ' + x + " z: " + z + " offset: " + offset);
    return null;
}


export function rotateAroundWorldAxis(object, axis, radians) {
    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.setRotationAxis(new THREE.Vector3(0, 1, 0).normalize(), radians);
    rotationMatrix.multiplySelf(object.matrix);
    object.matrix = rotationMatrix;
    object.rotation.setRotationFromMatrix(object.matrix);
}

export class RotationManager {
    constructor(params) {
        this.boid = params.boid;
        this.obj = this.boid.obj;
        this.start = params.start;

        const dir = params.desired;
        let desiredDegree;

        const seed = ((Math.random() * 250) / 1000);

        switch (dir) {
            case direction.NORTH:
                desiredDegree = seed + 0.875;

                if (desiredDegree > 1.0)
                    desiredDegree = -1 + (desiredDegree - 1.0);
                break;
            case direction.NORTH_EAST:
                desiredDegree = seed + 0.625;
                break;
            case direction.EAST:
                desiredDegree = seed + 0.375;
                break;
            case direction.SOUTH_EAST:
                desiredDegree = seed + 0.125;
                break;
            case direction.SOUTH:
                desiredDegree = seed + -0.125;
                break;
            case direction.SOUTH_WEST:
                desiredDegree = seed + -0.375;
                break;
            case direction.WEST:
                desiredDegree = seed + -0.625;
                break;
            case direction.NORTH_WEST:
                desiredDegree = seed + -0.875;
                break;
        }


        // Randomly offset on both axis
        if (Math.random() < 0.5)
            desiredDegree -= desiredDegree * 2;


            // TODO - rotate fastest direction
        this.inverse = desiredDegree < 0;
        this.desired = Math.abs(desiredDegree);
    }

    execute() {
        const q = Math.abs(this.boid.obj.quaternion.y);

        if (Math.round(this.desired * 100) == Math.round(q * 100))
            return true;

            /* TODO add this somewhere
        // Slow down to rotate
        const v = this.boid.velocity;

        if (v.x > 1.0)
            this.boid.velocity.x = (v.x / 1.5);
        if (v.y > 1.0)
            this.boid.velocity.y = (v.y / 1.5);
        if (v.z > 1.0)
            this.boid.velocity.z = (v.z / 1.5);
            */

        // Rotate by random increments
        let offset = THREE.Math.radToDeg(((Math.random() * 5)) / 10000);
        if (this.inverse)
            offset -= offset * 2;

        //console.log("Desired Degree: " + Math.round(this.desired * 100) + " |  " + Math.round(q * 100));
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);
        return false;
    }
}