
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

let getDistance = (pos) => {
    const x = Math.abs(pos.x),
        y = Math.abs(pos.y),
        z = Math.abs(pos.z);

    const xz = x > z ? x : z;
    return xz > y ? xz : y;
}

export class Particles {

    constructor(scene, camera) {
        // Uniforms (Passed to shader)
        const uniforms = {
            diffuseTexture: {
                value: new THREE.TextureLoader().load('/resources/particles/particle_0.png'),
                h: 1.0 / scene.width
            },
            // Screen off-set for vertices
            pointMultiplier: {
                value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
            }
        };

        // Material
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        // Geometry
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
        this.geometry.setAttribute('colour', new THREE.Float32BufferAttribute([], 4));
        this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute([], 1));

        // Mesh
        this.points = new THREE.Points(this.geometry, this.material);

        // Init
        this.group = [];
        this.camera = camera;
        scene.add(this.points);
    }

    update(timeElapsed) {
        const positions = [],
            colours = [],
            sizes = [],
            angles = [];

        for (let p of this.group) {
            // Update particle traits
            p.position.add(p.velocity.clone().multiplyScalar(timeElapsed));
            p.rotation += timeElapsed * 0.5;
            p.currentSize = p.size;
            //p.alpha = p.alpha;

            // Limit position
            const pp = p.position;
            let x = (pp.x > 2000 ? -2000 : pp.x < -2000 ? 2000 : pp.x),
                y = (pp.y > 900 ? -1000 : pp.y < -1000 ? 900 : pp.y),
                z = (pp.z > 2000 ? -2000 : pp.z < -2000 ? 2000 : pp.z);

            p.position.set(x, y, z);

            // Reflect alpha based on distance
            const dis = (Math.floor(getDistance(p.position) / 100 / 2) / 2) / 10;
            p.alpha = dis;

            //  console.log('alpga: ' + dis);

            // Cache update
            positions.push(p.position.x, p.position.y, p.position.z);
            colours.push(p.colour.r, p.colour.g, p.colour.b, p.alpha);
            sizes.push(p.currentSize);
            angles.push(p.rotation);
        }

        // Sort particles by distance from camera
        this.group.sort((a, b) => {
            const d1 = this.camera.position.distanceTo(a.position);
            const d2 = this.camera.position.distanceTo(b.position);
            return d1 > d2 ? -1 : d1 < d2 ? 1 : 0;
        });

        // Push traits to geometry

        // Position
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.attributes.position.needsUpdate = true;

        // Color
        this.geometry.setAttribute('colour', new THREE.Float32BufferAttribute(colours, 4));
        this.geometry.attributes.colour.needsUpdate = true;

        // Size
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        this.geometry.attributes.size.needsUpdate = true;

        // Angle
        this.geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1));
        this.geometry.attributes.angle.needsUpdate = true;
    }
}

