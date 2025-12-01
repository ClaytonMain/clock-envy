import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import simpleColorFragmentShader from "./../shaders/simple-color/simpleColor.frag";
import simpleColorVertexShader from "./../shaders/simple-color/simpleColor.vert";

const SimpleColorMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("#2cff05"),
  },
  simpleColorVertexShader,
  simpleColorFragmentShader,
);

export default SimpleColorMaterial;
