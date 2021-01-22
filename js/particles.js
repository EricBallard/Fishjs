export class ParticleSystem {

    constructor(params) {
        // Cache camera to calculate z-order
        this.camera = params.camera;
        this.group = [];

        // Uniforms are global GLSL variables - passed to shader
        const uniforms = {
            diffuseTexture: {
                value: new THREE.TextureLoader().load('/resources/bubble.png'),
            },
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0)),
            }
        };

        // Point material
        this.material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            vertexColors: true,
        });

        // Mesh geometry
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
        this.geometry.setAttribute("size", new THREE.Float32BufferAttribute([], 1));
        this.geometry.setAttribute("colour", new THREE.Float32BufferAttribute([], 4));

        // Mesh representated as points
        this._points = new THREE.Points(this.geometry, this.material);

        /*
            Animation gradients
        */

        // Size
        this._sizeSpline = new LinearSpline((a, b, c) => b + a * (c - b));
        this._sizeSpline.addPoint(0.0, 1.0);
        this._sizeSpline.addPoint(1.0, 3.0);
        this._sizeSpline.addPoint(1.0, 0.0);

        // Color
        this._colourSpline = new LinearSpline((a, b, c) => b.clone().lerp(c, a));
        this._colourSpline.addPoint(0.0, new THREE.Color('#6497B1'));
        this._colourSpline.addPoint(1.0, new THREE.Color('#83ADB5'));

        // Transparency
        this._alphaSpline = new LinearSpline((a, b, c) => b + a * (c - b));
        this._alphaSpline.addPoint(0.05, 0.2);
        this._alphaSpline.addPoint(0.4, 0.4);
        this._alphaSpline.addPoint(0.15, 0.015);

        /*
        */

        // Add to scene
        params.scene.add(this._points);
    }

    applyUpdate() {
        // Update attributes
        const positions = [], sizes = [], colours = [];

        for (let p of this.group) {
            positions.push(p.position.x, p.position.y, p.position.z);
            sizes.push(p.currentSize);

            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
        }

        // Apply updates
        this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.attributes.position.needsUpdate = true;

        this.geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
        this.geometry.attributes.size.needsUpdate = true;

        this.geometry.setAttribute("colour", new THREE.Float32BufferAttribute(colours, 4));
        this.geometry.attributes.colour.needsUpdate = true;
    }

    processUpdate(timeElapsed) {
        // Update life by elapsed time
        for (let p of this.group)
            p.life -= timeElapsed;

        // Remove "dead" particles from group
        this.group = this.group.filter((p) => p.life > 0.0);

        for (let p of this.group) {
            // Update attributes
            const degrade = 1.0 - p.life / p.maxLife;

            p.currentSize = p.size * this._sizeSpline.get(degrade);
            p.colour.copy(this._colourSpline.get(degrade));
            p.alpha = this._alphaSpline.get(degrade);

            // Position
            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));

            // Drag
            const drag = p.velocity.clone();
            drag.multiplyScalar(timeElapsed * 0.1);

            drag.x = Math.sign(p.velocity.x) * Math.min(Math.abs(drag.x), Math.abs(p.velocity.x));
            drag.y = Math.sign(p.velocity.y) * Math.min(Math.abs(drag.y), Math.abs(p.velocity.y));
            drag.z = Math.sign(p.velocity.z) * Math.min(Math.abs(drag.z), Math.abs(p.velocity.z));

            p.velocity.sub(drag);
        }

        // Sort particles z-order by distance from camera
        this.group.sort((a, b) => {
            const d1 = this.camera.position.distanceTo(a.position);
            const d2 = this.camera.position.distanceTo(b.position);
            return d1 > d2 ? -1 : d1 < d2 ? 1 : 0;
        });
    }

    update(timeElapsed) {
        // Update particles
        this.processUpdate(timeElapsed);
        this.applyUpdate();
    }

    // (Math.random() * 2 - 1) * 1.0,
    //(Math.random() * 2 - 1) * 1.0,
    // (Math.random() * 2 - 1) * 1.0


    addBubble(pos, vel, size) {
        const life = (Math.random() * 0.75 + 0.25) * 10.0;

        this.group.push({
            size: size,
            life: life,
            maxLife: life,
            position: pos,
            velocity: vel,
            colour: new THREE.Color(),
            rotation: Math.random() * 2.0 * Math.PI
        });
    }
}

class LinearSpline {
    constructor(lerp) {
        this.points = [];
        this.lerp = lerp;
    }

    addPoint(t, d) {
        this.points.push([t, d]);
    }

    get(t) {
        let p1 = 0;

        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i][0] >= t) {
                break;
            }
            p1 = i;
        }

        const p2 = Math.min(this.points.length - 1, p1 + 1);

        if (p1 == p2) {
            return this.points[p1][1];
        }

        // https://en.wikipedia.org/wiki/Linear_interpolation
        return this.lerp((t - this.points[p1][0]) / (this.points[p2][0] - this.points[p1][0]),
            this.points[p1][1],
            this.points[p2][1]);
    }
}

const vertexShader = `
uniform float pointMultiplier;
attribute float size;
attribute float angle;
attribute vec4 colour;
varying vec4 vColour;
varying vec2 vAngle;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;
  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
}`;

const fragmentShader = `
uniform sampler2D diffuseTexture;
varying vec4 vColour;
varying vec2 vAngle;
void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;
