"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDirection = getDirection;
exports.velocityToDirection = velocityToDirection;
exports.update = update;
exports.Entity = void 0;

var _rotater = require("/js/rotater.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function getSeed() {
  return Math.random() * (Math.random() * 20);
}

function setMagnitude(params) {
  var vector = params.vector;
  var magnitude = params.magnitude;
  var direction = Math.atan2(vector.y, vector.x, vector.z);
  vector.x = Math.cos(direction) * magnitude;
  vector.y = Math.sin(direction) * magnitude;
  vector.z = Math.tan(direction) * magnitude;
}

var perception = 250;
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

  if (y < -0.85 || y >= 0.874) {
    return direction.NORTH;
  } else if (y >= 0.625 && y < 0.874) {
    return direction.NORTH_EAST;
  } else if (y >= 0.5 && y < 0.625) {
    return direction.EAST;
  } else if (y >= 0.375 && y < 0.5) {
    return direction.SOUTH_EAST;
  } else if (y >= -0.125 && y < 0.375) {
    return direction.SOUTH;
  } else if (y < -0.125 && y >= -0.375) {
    return direction.SOUTH_WEST;
  } else if (y < -0.375 && y >= -0.625) {
    return direction.WEST;
  } else if (y < -0.625 && y >= -0.85) {
    return direction.NORTH_WEST;
  } else {
    return null;
  }
}

function velocityToDirection(velocity) {
  var x = velocity.x,
      z = velocity.z;
  if (x > 0 && x <= 1 && Math.round(z) == 0) return direction.NORTH;else if (z > 0 && z <= 1 && Math.round(x) == 0) return direction.EAST;
  if (x < 0 && x >= -1 && Math.round(z) == 0) return direction.SOUTH;else if (z < 0 && z >= -1 && Math.round(x) == 0) return direction.WEST; // TODO - maybe? Refactor offset to use division to account for decimal
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

  console.log('NULL DIRECTION | x: ' + x + " z: " + z + " offset: " + offset);
  return null;
}

var Entity =
/*#__PURE__*/
function () {
  function Entity(params) {
    _classCallCheck(this, Entity);

    // Cache obj to reflect/update position based on momentum
    this.obj = params.obj; // Momentum

    this.velocity = new THREE.Vector3(getSeed(), getSeed(), getSeed());
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.acceleration = new THREE.Vector3(0, 0, 0); // VIDEO @ 21:50
  }

  _createClass(Entity, [{
    key: "bounce",
    value: function bounce() {
      var pos = this.obj.position,
          v = this.velocity; //console.log(v.x + ", " + v.y + ", " + v.z + "  |  " + pos.x + ", " + pos.y + ", " + pos.z);

      if (pos.x >= 2450 || pos.x <= -2450) {
        var vx = this.velocity.x;
        this.velocity.x = vx < 0 ? Math.abs(vx) : vx - vx * 2;
      }

      if (pos.y >= 2450 || pos.y <= -2450) {
        var vy = this.velocity.y;
        this.velocity.y = vy < 0 ? Math.abs(vy) : vy - vy * 2;
      }

      if (pos.z >= 2450 || pos.z <= -2450) {
        var vz = this.velocity.z;
        this.velocity.z = vz < 0 ? Math.abs(vz) : vz - vz * 2;
      }
    }
  }, {
    key: "update",
    value: function update() {
      // Update momentum
      this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
      this.velocity.add(this.acceleration); // Rotate object based on velocity

      this.rotate();
      getDirection(this.obj.quaternion);
    }
  }, {
    key: "rotate",
    value: function rotate() {
      //1.57
      var v = this.velocity,
          rot = Math.degrees(this.obj.rotation.y);

      if (v.x > v.y && v.x > v.y) {
        //console.log("RoT:" + rot);
        if (rot == 0 || rot < -2 || rot > 2) {
          //console.log('Rot -X: ' + rot);
          this.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), THREE.Math.radToDeg(0.0008));
        }
      } else if (v.x < v.z && v.x < v.y) {
        if (rot != 0) {
          // console.log('Rot +X: ' + rot);
          this.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), THREE.Math.radToDeg(0.0008));
        }
      } else {
        // Z-Axis
        if (v.z > v.y && v.z > v.x) {
          if (rot != 90) {
            // console.log('Rot +Z: ' + rot);
            this.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);
          }
        } else {
          if (v.z < v.y && v.z < v.x) {
            if (rot != -90) {
              //   console.log('Rot -Z: ' + rot);
              this.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -offset);
            }
          }
        }
      }
    }
  }, {
    key: "align",
    value: function align(boids) {
      var alignment = this.getAlignment(boids);
      this.acceleration = alignment; //console.log("X: " + alignment.x + " Y: " + alignment.y + " Z: " + alignment.z);
    }
  }, {
    key: "getAlignment",
    value: function getAlignment(boids) {
      var perceivedVelocity = new THREE.Vector3(0, 0, 0);
      var position = this.obj.position;
      var othersInPerception = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = boids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var other = _step.value;
          if (other == this) continue;

          if (other.obj.position.distanceTo(position) <= perception) {
            perceivedVelocity.x += other.velocity.x;
            perceivedVelocity.y += other.velocity.y;
            perceivedVelocity.z += other.velocity.z;
            othersInPerception += 1;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (othersInPerception > 0) {
        // Normalize velocity
        perceivedVelocity.x = perceivedVelocity.x / othersInPerception;
        perceivedVelocity.y = perceivedVelocity.y / othersInPerception;
        perceivedVelocity.z = perceivedVelocity.z / othersInPerception;
        setMagnitude({
          vector: perceivedVelocity,
          magnitude: this.maxSpeed
        });
        var vx = perceivedVelocity.x - this.velocity.x;
        perceivedVelocity.x = vx < 0.00 ? 0.00 : vx;
        var vy = perceivedVelocity.y - this.velocity.y;
        perceivedVelocity.y = vy < 0.00 ? 0.00 : vy;
        var vz = perceivedVelocity.z - this.velocity.z;
        perceivedVelocity.z = vz < 0.00 ? 0.00 : vz; // Limit force of velocity

        if (perceivedVelocity.x > this.maxForce) perceivedVelocity.x = this.maxForce;
        if (perceivedVelocity.y > this.maxForce) perceivedVelocity.y = this.maxForce;
        if (perceivedVelocity.z > this.maxForce) perceivedVelocity.z = this.maxForce;
      }

      return perceivedVelocity;
    }
  }]);

  return Entity;
}();

exports.Entity = Entity;

function rotateAroundWorldAxis(object, axis, radians) {
  var rotationMatrix = new THREE.Matrix4();
  rotationMatrix.setRotationAxis(new THREE.Vector3(0, 1, 0).normalize(), radians);
  rotationMatrix.multiplySelf(object.matrix); // pre-multiply

  object.matrix = rotationMatrix;
  object.rotation.setRotationFromMatrix(object.matrix);
}

var offset = Math.PI / 2;

function update(boids) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = boids[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var boid = _step2.value;
      boid.bounce();
      boid.align(boids);
      boid.update();
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}