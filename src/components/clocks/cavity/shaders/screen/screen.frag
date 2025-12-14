uniform float uCubeSize;
uniform ivec3 uCubeCounts;

varying vec4 vWorldPosition;

void main() {
    float xBound = uCubeSize * float(uCubeCounts.x) / 2.0;
    float yBound = uCubeSize * float(uCubeCounts.y) / 2.0;
    float halfCube = uCubeSize / 2.0;
    if (vWorldPosition.x < xBound - halfCube && vWorldPosition.x > -xBound + halfCube && vWorldPosition.y < yBound - halfCube && vWorldPosition.y > -yBound + halfCube) {
        csm_DiffuseColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}