uniform sampler2D uClockTexture;
uniform int uRho;
uniform ivec2 uBeta;
uniform ivec2 uDelta;
uniform float uGrowthRate;
uniform float uDecayRate;

// void main() {
//   vec2 uv = (gl_FragCoord.xy - vec2(0.5)) / resolution.xy;
//   vec4 currentState = texture(vGameState, uv);

//   float neighborSum = 0.0;
//   for (int i = -uRho; i < uRho + 1; i++) {
//     for (int j = -uRho; j < uRho + 1; j++) {
//       if (i == 0 && j == 0) {
//         continue;
//       }
//       vec2 offset = vec2(float(i), float(j)) / resolution.xy;
//       vec2 neighborUv = mod(uv + offset, 1.0);

//       vec4 neighborState = texture(vGameState, neighborUv);
//       neighborSum += neighborState.r;
//     }
//   }

//   float cellState = currentState.r;
//   // if (cellState == 0.0) {
//   if (neighborSum >= float(uBeta.x) && neighborSum <= float(uBeta.y)) {
//     cellState = min(1.0, cellState + uGrowthRate / 32.0);
//     // }
//   } else if (neighborSum < float(uDelta.x) || neighborSum > float(uDelta.y)) {
//     // if (neighborSum < float(uDelta.x) || neighborSum > float(uDelta.y)) {
//     cellState = max(0.0, cellState - uDecayRate / 32.0);
//     // }
//   }

//   vec4 clockInfo = texture(uClockTexture, uv);
//   // float clockLife = step(0.5, clockInfo.r);
//   float clockLife = clockInfo.r;
//   // clockLife = 0.0;

//   gl_FragColor = vec4(max(cellState, clockLife), 0.0, 0.0, 1.0);
// }

void main() {
  vec2 uv = (gl_FragCoord.xy - vec2(0.5)) / resolution.xy;
  vec4 currentState = texture(vGameState, uv);

  int neighborCount = 0;
  for (int i = -uRho; i < uRho + 1; i++) {
    for (int j = -uRho; j < uRho + 1; j++) {
      if (i == 0 && j == 0) {
        continue;
      }
      vec2 offset = vec2(float(i), float(j)) / resolution.xy;
      vec2 neighborUv = mod(uv + offset, 1.0);

      vec4 neighborState = texture(vGameState, neighborUv);
      if (neighborState.r == 1.0) {
        neighborCount++;
      }
    }
  }

  float cellState = currentState.r;
  if (cellState == 0.0) {
    if (neighborCount >= uBeta.x && neighborCount <= uBeta.y) {
      cellState = 1.0;
    }
  } else {
    if (neighborCount < uDelta.x || neighborCount > uDelta.y) {
      cellState = 0.0;
    }
  }

  vec4 clockInfo = texture(uClockTexture, uv);
  float clockLife = step(0.5, clockInfo.r);
  // clockLife = 0.0;

  gl_FragColor = vec4(max(cellState, clockLife), 0.0, 0.0, 1.0);
}

