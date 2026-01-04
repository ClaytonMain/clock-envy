uniform int[42] uActive;

varying vec2 vUv;

float sdChamferBox(in vec2 p, in vec2 b, in float chamfer) {
  p = abs(p) - b;

  p = (p.y > p.x) ? p.yx : p.xy;
  p.y += chamfer;

  const float k = 1.0 - sqrt(2.0);
  if (p.y < 0.0 && p.y + p.x * k < 0.0)
    return p.x;

  if (p.x < p.y)
    return (p.x + p.y) * sqrt(0.5);

  return length(p);
}

float[6] digitCenterOffsets = float[6](-0.375, -0.225, -0.075, 0.075, 0.225, 0.375);
vec2 segmentOffsets[7] = vec2[7](// _
vec2(0.0, 0.1),    // A
vec2(0.05, 0.05),   // B
vec2(0.05, -0.05),  // C
vec2(0.0, -0.1),   // D
vec2(-0.05, -0.05), // E
vec2(-0.05, 0.05),  // F
vec2(0.0, 0.0)     // G
);
#define hSegmentSize vec2(0.05, 0.015)
#define vSegmentSize vec2(0.015, 0.05)
vec2 segmentSizes[7] = vec2[7](// _
hSegmentSize,    // A
vSegmentSize,    // B
vSegmentSize,    // C
hSegmentSize,    // D
vSegmentSize,    // E
vSegmentSize,    // F
hSegmentSize     // G
);

vec2 getSegmentPosition(int digitIndex, int segmentIndex) {
  vec2 pos = vec2(0.0, 0.0);
  pos.x += digitCenterOffsets[digitIndex];
  pos += segmentOffsets[segmentIndex];
  return pos;
}

float getSegmentDistance(int digitIndex, int segmentIndex, vec2 p) {
  vec2 segmentPos = getSegmentPosition(digitIndex, segmentIndex);
  return sdChamferBox(p - segmentPos, segmentSizes[segmentIndex], 0.01);
}

float opSmoothUnion(float d1, float d2, float k) {
  k *= 4.0;
  float h = max(k - abs(d1 - d2), 0.0);
  return min(d1, d2) - h * h * 0.25 / k;
}

void main() {
  vec2 pos = vUv - vec2(0.5);
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  float d = 9001.0;
  for (int i = 0; i < 6; i++) {
    d = 9001.0;
    for (int j = 0; j < 7; j++) {
      d = opSmoothUnion(d, getSegmentDistance(i, j, pos) + float((1 - uActive[i * 7 + j]) * 999), 0.004);
    }
    color.r += step(abs(d), 0.002);
    // color.r += step(d, 0.0);
  }

  gl_FragColor = color;
}