uniform float uDelta;
uniform float uIntensityLambda;
uniform float uColorTimeLambda;
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

#include ../../../../../shaders/includes/lerpSmooth.glsl

void main() {
  float density = 0.0;
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

      density += neighborState.r;
      nbhoodCount01 += int(neighborState.r) * uNbhood01[nbhoodIndex];
      nbhoodCount02 += int(neighborState.r) * uNbhood02[nbhoodIndex];
    }
  }

  density /= 224.0;

  vec4 currentState = texture(uPreviousTexture, vUv);
  float cellState = currentState.r;
  float prevCellState = cellState;

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
  cellState = max(cellState, clockLife);

  float intensity = texture(uPreviousTexture, vUv).g;
  intensity = lerpSmooth(intensity, cellState * 0.25, uDelta, uIntensityLambda);
  intensity = max(intensity, step(0.5, cellState - prevCellState));

  float colorTime = texture(uPreviousTexture, vUv).b;
  colorTime = lerpSmooth(colorTime, cellState, uDelta, uColorTimeLambda);

  gl_FragColor = vec4(cellState, intensity, colorTime, density);
}
