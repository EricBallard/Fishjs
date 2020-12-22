"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.update = update;
exports.Entity = void 0;

var Movement = _interopRequireWildcard(require("/js/movement.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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

var Entity =
/*#__PURE__*/
function () {
  function Entity(params) {
    _classCallCheck(this, Entity);

    // Cache obj to reflect/update position based on momentum
    this.obj = params.obj;
    this.managers = params.managers; // Momentum

    this.velocity = new THREE.Vector3(getSeed(), 0, getSeed());
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.acceleration = new THREE.Vector3(0, 0, 0); // VIDEO @ 21:50
  }

  _createClass(Entity, [{
    key: "bounce",
    value: function bounce() {
      var pos = this.obj.position,
          v = this.velocity;

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
    key: "align",
    value: function align(boids) {
      var alignment = this.getAlignment(boids);
      this.acceleration = alignment;
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
        main: for (var _iterator = boids[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var other = _step.value;
          if (other == this) continue;

          if (other.obj.position.distanceTo(position) <= perception) {
            // Ignore fish that are rotating
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = this.managers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var manager = _step2.value;
                if (manager.obj == other.obj) continue main;
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
  }, {
    key: "update",
    value: function update() {
      // Update momentum
      this.obj.applyMatrix4(new THREE.Matrix4().makeTranslation(this.velocity.x, this.velocity.y, this.velocity.z));
      this.velocity.add(this.acceleration); // Rotate object based on velocity

      this.rotate();
    }
  }, {
    key: "rotate",
    value: function rotate() {
      // Return if object is being actively rotated/managed
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.managers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var manager = _step3.value;

          if (manager.obj === this.obj) {
            return;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var q = this.obj.quaternion,
          rot = Movement.getDirection(q),
          dir = Movement.velocityToDirection(this.velocity);

      if (rot != dir) {
        // Add manager to animate the rotation
        this.managers.push(new Movement.RotationManager({
          boid: this,
          start: q,
          desired: dir
        }));
      }
    }
  }]);

  return Entity;
}();

exports.Entity = Entity;

function update(boids, managers) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = boids[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var boid = _step4.value;
      boid.bounce();
      boid.align(boids);
      boid.update();
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
        _iterator4["return"]();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  var managerSize = managers.length;

  for (var index = 0; index < managerSize; index++) {
    var manager = managers[index];

    if (manager != undefined && manager.execute()) {
      managers.splice(index, 1);
    }
  }
}