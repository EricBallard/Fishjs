export const direction = Object.freeze({
    NORTH: 'north',
    EAST: 'east',
    SOUTH: 'south',
    WEST: 'west',
    NORTH_WEST: 'north-west',
    NORTH_EAST: 'north-east',
    SOUTH_EAST: 'south-east',
    SOUTH_WEST: 'south-west'
});

// Clock-wise
export function getNeighboringDirections(direction) {
    switch (direction) {
        case this.direction.NORTH:
            return ({
                left: this.direction.NORTH_WEST,
                right: this.direction.NORTH_EAST,
            });
        case this.direction.EAST:
            return ({
                left: this.direction.NORTH_EAST,
                right: this.direction.SOUTH_EAST,
            });
        case this.direction.SOUTH:
            return ({
                left: this.direction.SOUTH_EAST,
                right: this.direction.SOUTH_WEST,
            });
        case this.direction.WEST:
            return ({
                left: this.direction.SOUTH_WEST,
                right: this.direction.NORTH_WEST,
            });
        case this.direction.NORTH_EAST:
            return ({
                left: this.direction.NORTH,
                right: this.direction.EAST,
            });
        case this.direction.SOUTH_EAST:
            return ({
                left: this.direction.EAST,
                right: this.direction.SOUTH,
            });
        case this.direction.SOUTH_WEST:
            return ({
                left: this.direction.SOUTH,
                right: this.direction.WEST,
            });
        case this.direction.NORTH_WEST:
            return ({
                left: this.direction.WEST,
                right: this.direction.NORTH,
            });
    }
}

export function getVertRotFromChild(parentPos, childPos) {
    let x = parentPos.x - childPos.x,
        y = parentPos.y - childPos.y,
        z = parentPos.z - childPos.z;

    //console.log('x: ' + x + ' y: ' + y + ' z: ' + z);

    y = parentPos.y - childPos.y;
    return (y * 2) / 100;
}

// half = 12.5
export function getDirectionFromChild(parentPos, childPos) {
    let x = parentPos.x - childPos.x,
        y = parentPos.y - childPos.y,
        z = parentPos.z - childPos.z;

    // console.log('x: ' + x + ' y: ' + y + ' z: ' + z);

    // North
    if (x >= 12.5 && z >= -12.5 && z <= 12.5)
        return direction.NORTH;

    // East
    if (x <= 12.5 && x >= -12.5 && z >= 12.5)
        return direction.EAST;

    // South
    if (x <= -12.5 && z >= -12.5 && z <= 12.5)
        return direction.SOUTH;

    // West
    if (x <= 12.5 && x >= -12.5 && z <= -12.5)
        return direction.WEST;

    // North-East
    if (x >= 12.5 && z >= 12.5)
        return direction.NORTH_EAST;

    // South-East
    if (x <= -12.5 && z >= 12.5)
        return direction.SOUTH_EAST;

    // South-West
    if (x <= -12.5 && z <= -12.5)
        return direction.SOUTH_WEST;

    // North-West
    if (x >= 12.5 && z <= -12.5)
        return direction.NORTH_WEST;

    return null;
}

export function getDirection(velocity) {
    let x = velocity.x,
        y = velocity.y,
        z = velocity.z;

    if (x > 0 && Math.round(z) == 0)
        return direction.NORTH;
    else if (z > 0 && Math.round(x) == 0)
        return direction.EAST;
    if (x < 0 && Math.round(z) == 0)
        return direction.SOUTH;
    else if (z < 0 && Math.round(x) == 0)
        return direction.WEST;

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
    return null;
}

export function getSpeed(velocity) {
    const x = Math.abs(velocity.x),
        y = Math.abs(velocity.y),
        z = Math.abs(velocity.z);

    const dif = Math.abs(x - z);
    return Number(y > x && y > z ? (y - dif) : dif);
}