uniform float uTime;
uniform sampler2D uClockTexture;

float neighborOffsets[8] = float[](1.0, 1.0, 0.0, -1.0, -1.0, -1.0, 0.0, 1.0);

void main() {
  vec2 uv = (gl_FragCoord.xy - vec2(0.5)) / resolution.xy;
  vec4 currentState = texture(vGameState, uv);

  int neighborCount = 0;
  for (int i = 0; i < 8; i++) {
    vec2 offset =
      vec2(neighborOffsets[i], neighborOffsets[(i + 6) % 8]) / resolution.xy;
    vec2 neighborUv = mod(uv + offset, 1.0);

    vec4 neighborState = texture(vGameState, neighborUv);
    if (neighborState.r == 1.0) {
      neighborCount++;
    }
  }

  float cellState = currentState.r;
  if (neighborCount < 2 || neighborCount > 3) {
    cellState = 0.0;
  } else if (neighborCount == 3) {
    cellState = 1.0;
  }

  vec4 clockInfo = texture(uClockTexture, uv);
  float clockLife = step(0.5, clockInfo.r);

  gl_FragColor = vec4(max(cellState, clockLife), 0.0, 0.0, 1.0);
}
