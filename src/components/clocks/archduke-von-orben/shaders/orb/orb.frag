uniform sampler2D uTDiffuse;
varying vec4 vUvTextureMatrix;
varying float vSteppedToCameraAmount;

void main() {
  vec4 base = texture2DProj(uTDiffuse, vUvTextureMatrix);

  // float towardsCameraAmount =
  //   dot(normalize(vMyNormal), vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5;

  // csm_FragColor = vec4(
  //   vec3(smoothstep(0.98, 0.8, towardsCameraAmount * towardsCameraAmount)),
  //   1.0
  // );
  // if (csm_FragColor.r < 0.0 || csm_FragColor.r > 1.0) {
  //   csm_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  // }

  float mixAmount = smoothstep(
    0.0,
    0.5,
    clamp(
      base.r * base.g * base.b * (1.0 - vSteppedToCameraAmount) * 0.9 + 0.1,
      0.0,
      1.0
    )
  );

  csm_DiffuseColor = mix(csm_DiffuseColor, base, mixAmount);
}
