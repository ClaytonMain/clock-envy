uniform float uArcLengthPercent;

#define PI 3.14159

mat3 rotZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    c, -s, 0.0,
    s,  c, 0.0,
    0.0, 0.0, 1.0
  );
}

void main() {
  float baseAngle = atan(-position.y - 0.0001, -position.x - 0.0001) + PI;
  float angle = baseAngle * (1.0 - uArcLengthPercent);
  mat3 rotationMatrix = rotZ(angle);
  position = rotationMatrix * position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}