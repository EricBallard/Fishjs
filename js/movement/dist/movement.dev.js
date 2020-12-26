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
}; // half = 12.5

function getDirectionFromChild(parentPos, childPos) {
  var x = parentPos.x - childPos.x,
      z = parentPos.z - childPos.z; // North

  if (x >= 37.5 && z >= -12.5 && z <= 12.5) return direction.NORTH; // East

  if (x <= 12.5 && x >= -12.5 && z >= 37.5) return direction.EAST; // South

  if (x <= -37.5 && z >= -12.5 && z <= 12.5) return direction.SOUTH; // West

  if (x <= 12.5 && x >= -12.5 && z <= -37.5) return direction.WEST; // North-East

  if (x >= 12.5 && z >= 12.5) return direction.NORTH_EAST; // South-East

  if (x <= -12.5 && z >= 12.5) return direction.SOUTH_EAST; // South-West

  if (x <= -12.5 && z <= -12.5) return direction.SOUTH_WEST; // North-West

  if (x >= 12.5 && z <= -12.5) return direction.NORTH_WEST;
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
  }

  return null;
}