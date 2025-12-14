const FOREGROUND_CUBE_COUNTS: [number, number, number] = [100, 40, 4];
const FOREGROUND_TOTAL_CUBES = FOREGROUND_CUBE_COUNTS.reduce(
  (a, b) => a * b,
  1,
);
export const FOREGROUND_CONSTANTS = {
  cubeCounts: FOREGROUND_CUBE_COUNTS,
  totalCubes: FOREGROUND_TOTAL_CUBES,
  cubeSize: 0.05,
  textureSize: Math.ceil(Math.sqrt(FOREGROUND_TOTAL_CUBES)),
};

const BACKGROUND_CUBE_COUNTS: [number, number, number] = [65, 22, 3];
const BACKGROUND_TOTAL_CUBES = BACKGROUND_CUBE_COUNTS.reduce(
  (a, b) => a * b,
  1,
);
export const BACKGROUND_CONSTANTS = {
  cubeCounts: BACKGROUND_CUBE_COUNTS,
  totalCubes: BACKGROUND_TOTAL_CUBES,
  cubeSize: 0.05,
  textureSize: Math.ceil(Math.sqrt(BACKGROUND_TOTAL_CUBES)),
};

export const SPRING_CONFIGS = {
  shared: {
    restDelta: 0.0001,
    damping: 5.0,
    stiffness: 100.0,
  },
  h: {
    mass: 4.0,
  },
  m: {
    mass: 2.0,
  },
  s: {
    mass: 1.0,
  },
};
