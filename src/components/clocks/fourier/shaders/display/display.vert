uniform vec2 uDisplayScale;
uniform float uZoom;

varying vec2 vUv;

void main() {
  vUv = uv;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = vec4(position.xy * uDisplayScale * uZoom, 1.0, 1.0);
}
