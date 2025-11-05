import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import archesVertexShader from "./../shaders/arches/arches.vert";
import simpleColorFragmentShader from "./../shaders/simple-color/simpleColor.frag";

const ArchesMaterial = shaderMaterial(
  {
    uArcLengthPercent: 0.0,
    uColor: new THREE.Color("#2cff05"),
  },
  archesVertexShader,
  simpleColorFragmentShader,
);

export default ArchesMaterial;
