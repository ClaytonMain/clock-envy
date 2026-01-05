uniform vec2 uDisplayScale;

varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = vec4(position.xy * uDisplayScale, 1.0, 1.0);
}
