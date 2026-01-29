varying mat4 vViewMatrix;

void main() {
  vViewMatrix = modelViewMatrix;
  gl_Position = vec4(position.xy * 2.0, 1.0, 1.0);
}