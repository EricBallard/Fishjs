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
        // console.log("DesiredDegree: " + desiredDegree);
        //console.log("StartQ: " + startQ);

        if (startQ >= 0 && desiredDegree < 0) {
            const turnLeft = (1 - startQ) + (1 - Math.abs(desiredDegree));
            const turnRight = (startQ + Math.abs(desiredDegree));
            this.inverse = turnRight < turnLeft;
            //console.log(this.inverse + " | pos turn")
        } else if (startQ < 0 && desiredDegree >= 0) {
            const turnLeft = Math.abs(startQ) + desiredDegree;
            const turnRight = (1 - Math.abs(startQ)) + (1 - desiredDegree);
            this.inverse = turnRight < turnLeft;
            // console.log(this.inverse + " | neg turn")
        } else {
            if ((startQ < 0 && desiredDegree < 0) || (startQ >= 0 && desiredDegree >= 0)) {
                const turnLeft = desiredDegree - startQ;
                const turnRight = startQ - desiredDegree;

                this.inverse = turnRight >= 0 && turnRight < turnLeft;
                // console.log(this.inverse + " | same turn")
            } else {
                // console.log(startQ + " | other turn")

            }
        }

        this.desired = desiredDegree;
    }

    execute() {
        const q = this.boid.obj.quaternion.y,
            desiredPercent = Math.round(Math.abs(this.desired) * 100),
            currentPercent = Math.round(Math.abs(q) * 100),
            percentDiff = desiredPercent - currentPercent;

        if (percentDiff >= -2 && percentDiff <= 2) {
            return true;
        }

        // Rotate by random increments
        let offset = THREE.Math.radToDeg(((Math.random() * 10) + .1) / 10000);
        if (this.inverse)
            offset -= offset * 2;

        if (!this.inverse) {
            if ((q >= 0 && this.desired >= 0 && q > this.desired) ||
                (q < 0 && this.desired < 0 && q < this.desired)) {
                this.recorrected = true;
                this.inverse = true;
            }
        }

        if (this.recorrected)
            offset = offset / 8;

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

        if (this.reflectX = pos.x >= 2000 || pos.x <= -2000) {
            let vx = vv.x;
            vx = vx < 0 ? Math.abs(vx) : vx - (vx * 2);

            let desired = vx / ((Math.random() * 4) + .4);
            desired = (desired > maxSpeed ? maxSpeed : desired);
            console.log('EnterX: ' + this.boid.velocity.x + " | ExitX: " + desired);
            this.boid.velocity.x = vx;
            this.desiredVX = desired;
        }

        if (this.reflectY = pos.y >= 2000 || pos.y <= -2000) {
            let vy = vv.y;
            vy = vy < 0 ? Math.abs(vy) : vy - (vy * 2);

            this.boid.velocity.y = vy;
            this.desiredVY = (vy > maxSpeed ? maxSpeed : vy) / (Math.random() * 4);
        }

        if (this.reflectZ = pos.z >= 2000 || pos.z <= -2000) {
            let vz = vv.z;
            vz = vz < 0 ? Math.abs(vz) : vz - (vz * 2);

            this.boid.velocity.z = vz;
            this.desiredVZ = (vz > maxSpeed ? maxSpeed : vz) / (Math.random() * 4);
        }
    }

    execute() {
        // Reflect entities velcoity, making it "bounce"
        const v = this.boid.velocity,
            pos = this.boid.obj.position;

        let altered = false;

        // X-Axis
        if (this.reflectX) {
            const inverted = this.desiredVX < 0;

            if (inverted ? v.x > this.desiredVX : v.x < this.desiredVX) {
                this.boid.velocity.x = inverted ? v.x - (v.x / (Math.random() * 4)) : v.x + (v.x / (Math.random() * 4));
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
            (pos.x <= 1500 && pos.x >= -1500 &&
                pos.y <= 1500 && pos.y >= -1500 &&
                pos.z <= 1500 && pos.z >= -1500);
    }
}