export const CUBE_COUNT_X = 60;
export const CUBE_COUNT_Y = 60;
export const CUBE_COUNT_Z = 9;
export const CUBE_SIZE = 0.2;
export const TOTAL_CUBES = CUBE_COUNT_X * CUBE_COUNT_Y * CUBE_COUNT_Z;
export const TEXTURE_SIZE = Math.ceil(Math.sqrt(TOTAL_CUBES));

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
