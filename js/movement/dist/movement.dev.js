"use strict";

var direction = {
  NORTH: 'north',
  EAST: 'east',
  SOUTH: 'south',
  WEST: 'west',
  NORTH_WEST: 'north-west',
  NORTH_EAST: 'north-east',
  SOUTH_EAST: 'south-east',
  SOUTH_WEST: 'south-west'
};

function getDirection(rotation) {
  var y = rotation.y;

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

function velocityToDirection(velocity) {
  var x = velocity.x,
      z = velocity.z;
  if (x > 0 && Math.round(z) == 0) return direction.NORTH;else if (z > 0 && Math.round(x) == 0) return direction.EAST;
  if (x < 0 && Math.round(z) == 0) return direction.SOUTH;else if (z < 0 && Math.round(x) == 0) return direction.WEST; // TODO - maybe? Refactor offset to use division to account for decimal
  // eg; (1, 0, 0.25) is not registered as an offset despite x being *4 z
  // However this may not be noticable in final product

  var offset = x - z;

  if (x > 0 && z > 0) {
    if (offset >= -5 && offset <= 5) {
      return direction.NORTH_EAST;
    } else {
      return x > z ? direction.NORTH : direction.EAST;
    }
  }

  if (x < 0 && z >= 0 || z < 0 && x >= 0) {
    var ax = Math.abs(x),
        az = Math.abs(z),
        aoffset = ax - az;

    if (aoffset >= -5 && aoffset <= 5) {
      return offset >= 0 ? direction.NORTH_WEST : direction.SOUTH_EAST;
    } else {
      var off = Math.abs(offset);
      if (off >= -5 && off <= 5) return x > z ? direction.SOUTH : direction.EAST;else return offset >= 0 ? direction.NORTH_WEST : direction.SOUTH_EAST;
    }
  }

  if (x < 0 && z < 0) {
    if (offset >= -5 && offset <= 5) {
      return direction.SOUTH_WEST;
    } else {
      return x > z ? direction.WEST : direction.SOUTH;
    }
  } //console.log('NULL DIRECTION | x: ' + x + " z: " + z + " offset: " + offset);


  return null;
}