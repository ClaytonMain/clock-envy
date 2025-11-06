
void main() {
  #include ../../../../../shaders/includes/simplexNoise4d.glsl
  // Wobble
  float wobble = simplexNoise4d(
    vec4(
      csm_Position, // XYZ
      0.0 // W
    )*0.0
  );
  csm_Position += wobble * normal;
}
