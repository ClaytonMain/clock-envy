// Thanks to Freya Holmér for the framerate-independent lerp smoothing function
// https://mastodon.social/@acegikmo/111931613710775864
float lerpSmooth(float a, float b, float dt, float h) {
  return b + (a - b) * exp2(-dt / h);
}

// "Calculating half-life (`h`) given a duration `t` until precision `p`"
// h = -t/log2(p)
// For example, if `p` = 1 / 100, then `h` is calculated such that the
// lerp smooth is nominally within 1% distance to the target remaining,
// after `t` seconds.
float getHalfLife(float t, float p) {
  return -t / log2(p);
}