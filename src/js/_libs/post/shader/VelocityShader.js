export const VelocityShader = {
  uniforms: {
    prevProjectionMatrix: {
      value: new THREE.Matrix4(),
    },

    prevModelViewMatrix: {
      value: new THREE.Matrix4(),
    },

    prevBoneTexture: {
      value: null,
    },

    expandGeometry: {
      value: 0,
    },

    interpolateGeometry: {
      value: 1,
    },

    smearIntensity: {
      value: 1,
    },
  },

  vertexShader: `
			${THREE.ShaderChunk.skinning_pars_vertex}
			${THREE.prev_skinning_pars_vertex}
			uniform mat4 prevProjectionMatrix;
			uniform mat4 prevModelViewMatrix;
			uniform float expandGeometry;
			uniform float interpolateGeometry;
			varying vec4 prevPosition;
			varying vec4 newPosition;
			void main() {
				${THREE.velocity_vertex}
			}
		`,

  fragmentShader: `
			uniform float smearIntensity;
			varying vec4 prevPosition;
			varying vec4 newPosition;
			void main() {
				// NOTE: It seems the velociyt is incorrectly calculated here -- see the velocity pass
				// in shader replacement to see how to compute velocities in screen uv space.
				vec3 vel;
				vel = (newPosition.xyz / newPosition.w) - (prevPosition.xyz / prevPosition.w);
				gl_FragColor = vec4(vel * smearIntensity, 1.0);
			}
		`,
}
