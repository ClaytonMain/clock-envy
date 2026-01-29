// Source - https://stackoverflow.com/a
// Posted by appas, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-22, License - CC BY-SA 4.0

float rand2d(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
