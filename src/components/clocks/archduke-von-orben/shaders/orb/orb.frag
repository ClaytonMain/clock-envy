uniform sampler2D uTDiffuse;
varying vec4 vUv;

void main() {
  vec4 base = texture2DProj(uTDiffuse, vUv);
  csm_DiffuseColor = mix(csm_DiffuseColor, base, 0.5);
}
