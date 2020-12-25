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


    var startQ = this.obj.quaternion.y; // console.log("DesiredDegree: " + desiredDegree);
    //console.log("StartQ: " + startQ);

    if (startQ >= 0 && desiredDegree < 0) {
      var turnLeft = 1 - startQ + (1 - Math.abs(desiredDegree));
      var turnRight = startQ + Math.abs(desiredDegree);
      this.inverse = turnRight < turnLeft; //console.log(this.inverse + " | pos turn")
    } else if (startQ < 0 && desiredDegree >= 0) {
      var _turnLeft = Math.abs(startQ) + desiredDegree;

      var _turnRight = 1 - Math.abs(startQ) + (1 - desiredDegree);

      this.inverse = _turnRight < _turnLeft; // console.log(this.inverse + " | neg turn")
    } else {
      if (startQ < 0 && desiredDegree < 0 || startQ >= 0 && desiredDegree >= 0) {
        var _turnLeft2 = desiredDegree - startQ;

        var _turnRight2 = startQ - desiredDegree;

        this.inverse = _turnRight2 >= 0 && _turnRight2 < _turnLeft2; // console.log(this.inverse + " | same turn")
      } else {// console.log(startQ + " | other turn")
        }
    }

    this.desired = desiredDegree;
  }

  _createClass(Rotation, [{
    key: "execute",
    value: function execute() {
      var q = this.boid.obj.quaternion.y,
          desiredPercent = Math.round(Math.abs(this.desired) * 100),
          currentPercent = Math.round(Math.abs(q) * 100),
          percentDiff = desiredPercent - currentPercent;

      if (percentDiff >= -2 && percentDiff <= 2) {
        return true;
      } // Rotate by random increments


      var offset = THREE.Math.radToDeg((Math.random() * 10 + .1) / 10000);
      if (this.inverse) offset -= offset * 2;

      if (!this.inverse) {
        if (q >= 0 && this.desired >= 0 && q > this.desired || q < 0 && this.desired < 0 && q < this.desired) {
          this.recorrected = true;
          this.inverse = true;
        }
      }

      if (this.recorrected) offset = offset / 8; //console.log("Desired Degree: " + Math.round(this.desired * 100) + " |  " + Math.round(q * 100));

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

    if (this.reflectX = pos.x >= 2000 || pos.x <= -2000) {
      var vx = vv.x;
      vx = vx < 0 ? Math.abs(vx) : vx - vx * 2;
      var desired = vx / (Math.random() * 4 + .4);
      desired = desired > maxSpeed ? maxSpeed : desired;
      console.log('EnterX: ' + this.boid.velocity.x + " | ExitX: " + desired);
      this.boid.velocity.x = vx;
      this.desiredVX = desired;
    }

    if (this.reflectY = pos.y >= 2000 || pos.y <= -2000) {
      var vy = vv.y;
      vy = vy < 0 ? Math.abs(vy) : vy - vy * 2;
      this.boid.velocity.y = vy;
      this.desiredVY = (vy > maxSpeed ? maxSpeed : vy) / (Math.random() * 4);
    }

    if (this.reflectZ = pos.z >= 2000 || pos.z <= -2000) {
      var vz = vv.z;
      vz = vz < 0 ? Math.abs(vz) : vz - vz * 2;
      this.boid.velocity.z = vz;
      this.desiredVZ = (vz > maxSpeed ? maxSpeed : vz) / (Math.random() * 4);
    }
  }

  _createClass(Bounce, [{
    key: "execute",
    value: function execute() {
      // Reflect entities velcoity, making it "bounce"
      var v = this.boid.velocity,
          pos = this.boid.obj.position;
      var altered = false; // X-Axis

      if (this.reflectX) {
        var inverted = this.desiredVX < 0;

        if (inverted ? v.x > this.desiredVX : v.x < this.desiredVX) {
          this.boid.velocity.x = inverted ? v.x - v.x / (Math.random() * 4) : v.x + v.x / (Math.random() * 4);
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

      return !altered && pos.x <= 1500 && pos.x >= -1500 && pos.y <= 1500 && pos.y >= -1500 && pos.z <= 1500 && pos.z >= -1500;
    }
  }]);

  return Bounce;
}();

exports.Bounce = Bounce;