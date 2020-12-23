export class Rotation {
    constructor(params) {
        this.boid = params.boid;
        this.obj = this.boid.obj;

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


        // Instant rotate when spawning entity
        if (params.instant) {
            const quaternion = new THREE.Quaternion();
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * desiredDegree);
            this.boid.obj.applyQuaternion(quaternion);
            return;
        }

        // Rotate quickest direction
        const startQ = this.obj.quaternion.y;

        if (startQ > 0 && desiredDegree < 0) {
            const turnLeft = (1 - startQ) + (1 - Math.abs(desiredDegree));
            const turnRight = (startQ + Math.abs(desiredDegree));
            this.inverse = turnRight < turnLeft;
        } else if (startQ < 0 && desiredDegree > 0) {
            const turnLeft = Math.abs(startQ) + desiredDegree;
            const turnRight = (1 - Math.abs(startQ)) + (1 - desiredDegree);
            this.inverse = turnRight < turnLeft;
        } else {
            const turnLeft = desiredDegree - startQ;
            const turnRight = startQ - desiredDegree;
            this.inverse = turnRight < turnLeft;
        }

        this.desired = Math.abs(desiredDegree);
    }

    execute() {
        const q = Math.abs(this.boid.obj.quaternion.y),
            desiredPercent = Math.round(this.desired * 100),
            currentPercent = Math.round(q * 100),
            percentDiff = desiredPercent - currentPercent;

        if (percentDiff >= -2 && percentDiff <= 2)
            return true;

        // Rotate by random increments
        let offset = THREE.Math.radToDeg(((Math.random() * 20) + .1) / 10000);
        if (this.inverse)
            offset -= offset * 2;

        //console.log("Desired Degree: " + Math.round(this.desired * 100) + " |  " + Math.round(q * 100));
        this.boid.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset);
        return false;
    }
}

export class Bounce {
    constructor(params) {
        this.boid = params.boid;

        const pos = this.boid.obj.position,
            maxSpeed = this.boid.maxSpeed,
            vv = this.boid.velocity;

        this.start = vv;
        let inversed;

        if (this.reflectX = pos.x >= 1750 || pos.x <= -1750) {
            inversed = vv.x < 0;
            let vx = Math.abs(vv.x / 2);

            if (vx > maxSpeed) {
                this.boid.velocity.x = inversed ? -maxSpeed : maxSpeed;
                vx = maxSpeed;
            }

            this.desiredVX = inversed ? vx : vx - (vx * 2);
            console.log('DESIRED VX: ' + this.desiredVX);
        }

        if (this.reflectY = pos.y >= 1750 || pos.y <= -1750) {
            inversed = vv.y < 0;
            let vy = Math.abs(vv.y / 2);

            if (vy > maxSpeed) {
                this.boid.velocity.y = inversed ? -maxSpeed : maxSpeed;
                vy = maxSpeed;
            }

            this.desiredVY = vv.y < 0 ? vy : vy - (vy * 2);
            console.log('DESIRED VY: ' + this.desiredVY);
        }

        if (this.reflectZ = pos.z >= 1750 || pos.z <= -1750) {
            inversed = vv.z < 0;
            let vz = Math.abs(vv.z / 2);

            if (vz > maxSpeed) {
                this.boid.velocity.z = inversed ? -maxSpeed : maxSpeed;
                vz = maxSpeed;
            }

            this.desiredVZ = vv.z < 0 ? vz : vz - (vz * 2);
            console.log('DESIRED VZ: ' + this.desiredVZ);
        }
    }

    execute() {
        // Reflect entities velcoity, making it "bounce"
        const v = this.boid.velocity,
            pos = this.boid.obj.position;

        let altered = false;

        console.log('RX: ' + this.reflectX + " | RY: " + this.reflectY + " | RZ: " + this.reflectZ);
        console.log('VX: ' + v.x + " | VY: " + v.y + " | VZ: " + v.z);

        // X-Axis
        if (this.reflectX) {
            const inverted = this.desiredVX < 0,
                vx = Math.abs(this.desiredVX / 10);

            if (inverted ? this.start.x > this.desiredVX : this.start.x < this.desiredVX) {
                this.boid.velocity.x = inverted ? v.x - vx : v.x + vx;
                altered = true;
            }
        }

        // Y-Axis
        if (this.reflectY) {
            const inverted = this.desiredVY < 0,
                vy = Math.abs(this.desiredVY / 10);

            if (inverted ? this.start.y > this.desiredVY : this.start.y < this.desiredVY) {
                this.boid.velocity.y = inverted ? v.y - vy : v.y + vy;
                altered = true;
            }
        }

        // Z-Axis
        if (this.reflectZ) {
            const inverted = this.desiredVZ < 0,
                vz = Math.abs(this.desiredVZ / 10);

            if (inverted ? this.start.z > this.desiredVZ : this.start.z < this.desiredVZ) {
                this.boid.velocity.z = inverted ? v.z - vz : v.z + vz;
                altered = true;
            }
        }

        return !altered &&
            (pos.x <= 2000 && pos.x >= -2000 &&
                pos.y <= 2000 && pos.y >= -2000 &&
                pos.z <= 2000 && pos.z >= -2000);
    }
}