import * as THREE from "three";

export function getDisplayScale({ targetAspect }: { targetAspect: number }) {
  const windowAspect = window.innerWidth / window.innerHeight;
  let scaleX = 1;
  let scaleY = 1;

  if (windowAspect > targetAspect) {
    scaleX = (targetAspect * 2) / windowAspect;
    scaleY = 2;
  } else {
    scaleX = 2;
    scaleY = (windowAspect * 2) / targetAspect;
  }
  return new THREE.Vector2(scaleX, scaleY);
}
