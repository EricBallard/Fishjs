var camera, scene, renderer;

var mesh;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(1, 1);

var rotationTheta = 0.1;
var rotationMatrix = new THREE.Matrix4().makeRotationY(rotationTheta);
var instanceMatrix = new THREE.Matrix4();

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    var light = new THREE.HemisphereLight(0xffffff, 0x000088);
    light.position.set(- 1, 1.5, 1);
    scene.add(light);

    var light = new THREE.HemisphereLight(0xffffff, 0x880000, 0.5);
    light.position.set(- 1, - 1.5, - 1);
    scene.add(light);

    var geometry = new THREE.BoxBufferGeometry(.5, .5, .5, 1, 1, 1);

    var material = [
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/square-outline-textured.png') }),
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/golfball.jpg') }),
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/metal.jpg') }),
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/roughness_map.jpg') }),
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/tri_pattern.jpg') }),
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/water.jpg') }),
    ];

    material.forEach((m, side) => {
        if (side != 2) return;

        m.onBeforeCompile = (shader) => {

            shader.uniforms.textures = {
                'type': 'tv', value: [
                    new THREE.TextureLoader().load('https://threejs.org/examples/textures/crate.gif'),
                    new THREE.TextureLoader().load('https://threejs.org/examples/textures/equirectangular.png'),
                    new THREE.TextureLoader().load('https://threejs.org/examples/textures/colors.png')
                ]
            };


            shader.vertexShader = shader.vertexShader.replace(
                '#define STANDARD',
                `#define STANDARD
                    varying vec3 vTint;
                    varying float vTextureIndex;`
            ).replace(
                '#include <common>',
                `#include <common>
                attribute vec3 tint;
                attribute float textureIndex;`
            ).replace(
                '#include <project_vertex>',
                `#include <project_vertex>
                vTint = tint;
                vTextureIndex=textureIndex;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#define STANDARD',
                `#define STANDARD
                    uniform sampler2D textures[3];
                    varying vec3 vTint;
                    varying float vTextureIndex;`
            )
                .replace(
                    '#include <fog_fragment>',
                    `#include <fog_fragment>
                int texIdx = int(vTextureIndex);
                vec4 col;
                if (texIdx == 0) {
                        col = texture2D(textures[0], vUv );
                    } else if ( texIdx==1) {
                        col = texture2D(textures[1], vUv );
                    } else if ( texIdx==2) {
                            col = texture2D(textures[2], vUv );
                        }

                        gl_FragColor = col;
                //		gl_FragColor.rgb *= vTint;`);
        }
    });

    mesh = new THREE.InstancedMesh(geometry, material, 100);

    var i = 0;
    var offset = (100 - 1) / 2;

    var transform = new THREE.Object3D();
    var textures = [];

    for (var x = 0; x < 100; x++) {

        for (var y = 0; y < 100; y++) {

            for (var z = 0; z < 100; z++) {

                transform.position.set(offset - x, offset - y, offset - z);
                transform.updateMatrix();

                mesh.setMatrixAt(i++, transform.matrix);


                textures.push(Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? 1 : 2));
            }

        }

    }

    geometry.setAttribute('textureIndex',
        new THREE.InstancedBufferAttribute(new Float32Array(textures), 1));

    scene.add(mesh);


    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    new THREE.OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

function animate() {

    requestAnimationFrame(animate);

    render();

}

var matrix = new THREE.Matrix4();


function render() {

    raycaster.setFromCamera(mouse, camera);

    var intersection = raycaster.intersectObject(mesh);
    // console.log('intersection', intersection.length);
    if (intersection.length > 0) {

        mesh.getMatrixAt(intersection[0].instanceId, instanceMatrix);
        matrix.multiplyMatrices(instanceMatrix, rotationMatrix);

        mesh.setMatrixAt(intersection[0].instanceId, matrix);
        mesh.instanceMatrix.needsUpdate = true;

    }

    renderer.render(scene, camera);

}
