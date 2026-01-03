uniform float uDelta;
uniform float uDecayRate;
uniform vec2 uResolution;
uniform sampler2D uPreviousTexture;
uniform sampler2D uClockTexture;
uniform int[225] uNbhood01;
uniform int[225] uNbhood02;
uniform ivec2 uNbhoodBornRange01;
uniform ivec2 uNbhoodBornRange02;
uniform ivec2 uNbhoodStableRange01;
uniform ivec2 uNbhoodStableRange02;

varying vec2 vUv;

void main() {
  int nbhoodCount01 = 0;
  int nbhoodCount02 = 0;
  for (int i = -7; i <= 7; i++) {
    for (int j = -7; j <= 7; j++) {
      if (i == 0 && j == 0) {
        continue;
      }
      vec2 offset = vec2(float(j), float(i)) / uResolution.xy;
      vec2 neighborUv = mod(vUv + offset, 1.0);
      vec4 neighborState = texture(uPreviousTexture, neighborUv);

      int nbhoodIndex = (i + 7) * 15 + (j + 7);

      nbhoodCount01 += int(neighborState.r) * uNbhood01[nbhoodIndex];

      nbhoodCount02 += int(neighborState.r) * uNbhood02[nbhoodIndex];
    }
  }

  vec4 currentState = texture(uPreviousTexture, vUv);
  float cellState = currentState.r;

  if (cellState == 0.0) {
    if (nbhoodCount01 >= uNbhoodBornRange01.x &&
      nbhoodCount01 <= uNbhoodBornRange01.y) {
      cellState = 1.0;
    }
  } else {
    if (nbhoodCount01 < uNbhoodStableRange01.x ||
      nbhoodCount01 > uNbhoodStableRange01.y) {
      cellState = 0.0;
    }
  }

  if (cellState == 0.0) {
    if (nbhoodCount02 >= uNbhoodBornRange02.x &&
      nbhoodCount02 <= uNbhoodBornRange02.y) {
      cellState = 1.0;
    }
  } else {
    if (nbhoodCount02 < uNbhoodStableRange02.x ||
      nbhoodCount02 > uNbhoodStableRange02.y) {
      cellState = 0.0;
    }
  }

  vec4 clockInfo = texture(uClockTexture, vUv);
  float clockLife = step(0.5, clockInfo.r);
  // clockLife = 0.0;

  gl_FragColor = vec4(max(cellState, clockLife), 0.0, 0.0, 1.0);
}
