import type { BasicClockConfig } from "../types/types";

// // Remember to keep this list sorted.
// export const CLOCK_NAMES = [
//   "Archduke Von Orben",
//   "Cavity",
//   "Cosmo",
//   // "Flip",
//   "Fourier",
//   "Hex",
//   "MNCA",
//   // "Nixie",
//   // "Panels",
//   // "Pool Room",
//   // "Shadow Box",
//   // "Viva",
//   "Voxus",
//   // "Wood",
//   // "Word",
// ] as const;

export const DEFAULT_CLOCK_NAME = "Archduke Von Orben";

export const BASIC_CLOCK_CONFIGS: BasicClockConfig[] = [
  {
    name: "Archduke Von Orben",
    displayOnSite: true,
    info: (
      <>
        <span className="italic">Do not upset Archduke Von Orben.</span>
        <span>
          This is the first clock I made for this project. Just wanted to do
          something fun involving{" "}
          <a
            target="_blank"
            href="https://motion.dev/docs/react"
            rel="noopener noreferrer"
            className="underline"
          >
            Motion.dev
          </a>
          's <code>useSpring</code>
        </span>
      </>
    ),
    acknowledgements: (
      <>
        <span>
          The shader for the orb is loosely adapted from Bruno Simon's{" "}
          <a
            className="underline"
            href="https://threejs-journey.com/lessons/wobbly-sphere-shader#compute-the-normal"
          >
            Wobbly Sphere Shader tutorial
          </a>
          .
        </span>
      </>
    ),
  },
  {
    name: "Cavity",
    displayOnSite: true,
    info: "Uses ",
  },
  {
    name: "Cosmo",
    displayOnSite: false,
    displayOnDebug: true,
  },
  {
    name: "Fourier",
    displayOnSite: true,
  },
  {
    name: "Hex",
    displayOnSite: false,
    displayOnDebug: true,
  },
  {
    name: "MNCA",
    displayOnSite: true,
  },
  {
    name: "Voxus",
    displayOnSite: true,
  },
];

export const STATS_CLASS_NAME =
  "if-it-works-then-it-aint-25783154-7c53-4f0f-bb9c-5b6813dc653e";
