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
    this.facing = params.facing;
    this.desired = params.desired; // Rotate quickest direction

    this.inverse = false;
    var inverseFrom = [],
        oppositeDir;

    switch (this.desired) {
      case direction.NORTH:
        inverseFrom = [direction.NORTH_WEST, direction.SOUTH_WEST, direction.WEST];
        oppositeDir = direction.SOUTH;
        break;

      case direction.EAST:
        inverseFrom = [direction.NORTH_WEST, direction.NORTH_EAST, direction.NORTH];
        oppositeDir = direction.WEST;
        break;

      case direction.SOUTH:
        inverseFrom = [direction.NORTH_EAST, direction.SOUTH_EAST, direction.EAST];
        oppositeDir = direction.NORTH;
        break;

      case direction.WEST:
        inverseFrom = [direction.SOUTH_WEST, direction.SOUTH_EAST, direction.SOUTH];
        oppositeDir = direction.EAST;
        break;

      case direction.NORTH_EAST:
        inverseFrom = [direction.NORTH_WEST, direction.NORTH, direction.WEST];
        oppositeDir = direction.SOUTH_WEST;
        break;

      case direction.SOUTH_EAST:
        inverseFrom = [direction.NORTH_WEST, direction.NORTH, direction.WEST];
        oppositeDir = direction.NORTH_WEST;
        break;

      case direction.SOUTH_WEST:
        inverseFrom = [direction.SOUTH_EAST, direction.SOUTH, direction.EAST];
        oppositeDir = direction.NORTH_EAST;
        break;

      case direction.NORTH_WEST:
        inverseFrom = [direction.SOUTH_WEST, direction.SOUTH, direction.WEST];
        oppositeDir = direction.SOUTH_EAST;
        break;
    }

    if (this.facing == oppositeDir && Math.random() < 0.5) inverseFrom.push(oppositeDir);

    for (var _i = 0, _inverseFrom = inverseFrom; _i < _inverseFrom.length; _i++) {
      var dir = _inverseFrom[_i];

      if (dir == this.facing) {
        this.inverse = true;
        break;
      }
    }
  }

  _createClass(Rotation, [{
    key: "execute",
    value: function execute() {
      // Validate rotation
      var facing = getDirectionFromChild(this.boid.obj.getWorldPosition(), this.boid.child.getWorldPosition());

      if (facing == this.desired) {
        //console.log(this.desired + ' | Succesful rotate!');
        return true;
      } // Generate random increments


      var offset = THREE.Math.radToDeg((Math.random() * 10 + 1) / 10000);

      if (this.inverse) {
        offset -= offset * 2;
      } // Rotate 


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