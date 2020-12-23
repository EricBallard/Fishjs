"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bounce = exports.Rotation = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Rotation =
/*#__PURE__*/
function () {
  function Rotation(params) {
    _classCallCheck(this, Rotation);

    this.boid = params.boid;
    this.obj = this.boid.obj;
    var dir = params.desired;
    var desiredDegree;
    var seed = Math.random() * 250 / 1000;

    switch (dir) {
      case direction.NORTH:
        desiredDegree = seed + 0.875;
        if (desiredDegree > 1.0) desiredDegree = -1 + (desiredDegree - 1.0);
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
    } // Instant rotate when spawning entity


    if (params.instant) {
      var quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * desiredDegree);
      this.boid.obj.applyQuaternion(quaternion);
      return;
    } // Rotate quickest direction


    var startQ = this.obj.quaternion.y;

    if (startQ > 0 && desiredDegree < 0) {
      var turnLeft = 1 - startQ + (1 - Math.abs(desiredDegree));
      var turnRight = startQ + Math.abs(desiredDegree);
      this.inverse = turnRight < turnLeft;
    } else if (startQ < 0 && desiredDegree > 0) {
      var _turnLeft = Math.abs(startQ) + desiredDegree;

      var _turnRight = 1 - Math.abs(startQ) + (1 - desiredDegree);

      this.inverse = _turnRight < _turnLeft;
    } else {
      var _turnLeft2 = desiredDegree - startQ;

      var _turnRight2 = startQ - desiredDegree;

      this.inverse = _turnRight2 < _turnLeft2;
    }

    this.desired = Math.abs(desiredDegree);
  }

  _createClass(Rotation, [{
    key: "execute",
    value: function execute() {
      var q = Math.abs(this.boid.obj.quaternion.y),
          desiredPercent = Math.round(this.desired * 100),
          currentPercent = Math.round(q * 100),
          percentDiff = desiredPercent - currentPercent;
      if (percentDiff >= -2 && percentDiff <= 2) return true; // Rotate by random increments

      var offset = THREE.Math.radToDeg((Math.random() * 20 + .1) / 10000);
      if (this.inverse) offset -= offset * 2; //console.log("Desired Degree: " + Math.round(this.desired * 100) + " |  " + Math.round(q * 100));

      this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);
      return false;
    }
  }]);

  return Rotation;
}();

exports.Rotation = Rotation;

var Bounce =
/*#__PURE__*/
function () {
  function Bounce(params) {
    _classCallCheck(this, Bounce);

    this.boid = params.boid;
    var pos = this.boid.obj.position,
        maxSpeed = this.boid.maxSpeed,
        vv = this.boid.velocity;
    this.start = vv;
    var inversed;

    if (this.reflectX = pos.x >= 1750 || pos.x <= -1750) {
      inversed = vv.x < 0;
      var vx = Math.abs(vv.x / 2);

      if (vx > maxSpeed) {
        this.boid.velocity.x = inversed ? -maxSpeed : maxSpeed;
        vx = maxSpeed;
      }

      this.desiredVX = inversed ? vx : vx - vx * 2;
      console.log('DESIRED VX: ' + this.desiredVX);
    }

    if (this.reflectY = pos.y >= 1750 || pos.y <= -1750) {
      inversed = vv.y < 0;
      var vy = Math.abs(vv.y / 2);

      if (vy > maxSpeed) {
        this.boid.velocity.y = inversed ? -maxSpeed : maxSpeed;
        vy = maxSpeed;
      }

      this.desiredVY = vv.y < 0 ? vy : vy - vy * 2;
      console.log('DESIRED VY: ' + this.desiredVY);
    }

    if (this.reflectZ = pos.z >= 1750 || pos.z <= -1750) {
      inversed = vv.z < 0;
      var vz = Math.abs(vv.z / 2);

      if (vz > maxSpeed) {
        this.boid.velocity.z = inversed ? -maxSpeed : maxSpeed;
        vz = maxSpeed;
      }

      this.desiredVZ = vv.z < 0 ? vz : vz - vz * 2;
      console.log('DESIRED VZ: ' + this.desiredVZ);
    }
  }

  _createClass(Bounce, [{
    key: "execute",
    value: function execute() {
      // Reflect entities velcoity, making it "bounce"
      var v = this.boid.velocity,
          pos = this.boid.obj.position;
      var altered = false;
      console.log('RX: ' + this.reflectX + " | RY: " + this.reflectY + " | RZ: " + this.reflectZ);
      console.log('VX: ' + v.x + " | VY: " + v.y + " | VZ: " + v.z); // X-Axis

      if (this.reflectX) {
        var inverted = this.desiredVX < 0,
            vx = Math.abs(this.desiredVX / 10);

        if (inverted ? this.start.x > this.desiredVX : this.start.x < this.desiredVX) {
          this.boid.velocity.x = inverted ? v.x - vx : v.x + vx;
          altered = true;
        }
      } // Y-Axis


      if (this.reflectY) {
        var _inverted = this.desiredVY < 0,
            vy = Math.abs(this.desiredVY / 10);

        if (_inverted ? this.start.y > this.desiredVY : this.start.y < this.desiredVY) {
          this.boid.velocity.y = _inverted ? v.y - vy : v.y + vy;
          altered = true;
        }
      } // Z-Axis


      if (this.reflectZ) {
        var _inverted2 = this.desiredVZ < 0,
            vz = Math.abs(this.desiredVZ / 10);

        if (_inverted2 ? this.start.z > this.desiredVZ : this.start.z < this.desiredVZ) {
          this.boid.velocity.z = _inverted2 ? v.z - vz : v.z + vz;
          altered = true;
        }
      }

      return !altered && pos.x <= 2000 && pos.x >= -2000 && pos.y <= 2000 && pos.y >= -2000 && pos.z <= 2000 && pos.z >= -2000;
    }
  }]);

  return Bounce;
}();

exports.Bounce = Bounce;