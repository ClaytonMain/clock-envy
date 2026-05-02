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
      <div className="flex flex-col gap-4">
        <span className="italic">Do not upset Archduke Von Orben.</span>
        <span className="indent-3">
          This is the first clock I made for this project. Just wanted to do
          something visually interesting involving{" "}
          <a
            target="_blank"
            href="https://motion.dev/docs/react"
            rel="noopener noreferrer"
            className="underline"
          >
            Motion.dev's
          </a>{" "}
          springs. Integrating the spring values into the orb shader was rather
          fun.
        </span>
        <span className="indent-3">
          Getting the reflections to work the way I wanted was moderately
          annoying. I eventually got close to what I wanted by poking around in
          a compiled version of Drei's{" "}
          <a
            target="_blank"
            href="https://drei.docs.pmnd.rs/shaders/mesh-reflector-material"
            rel="noopener noreferrer"
            className="underline"
          >
            <code>MeshReflectorMaterial</code>
          </a>{" "}
          to see how it works & mimicking the relevant bits. Had to mess around
          with <code>layers</code> in a way I hadn't done before too. It's not
          perfect (and it stops looking convincing at different camera angles),
          but it's good enough for now.
        </span>
      </div>
    ),
    acknowledgements: (
      <div className="flex flex-col gap-4">
        <ul className="list-inside list-disc">
          <li>
            The shader for the orb is loosely adapted from Bruno Simon's{" "}
            <a
              className="underline"
              href="https://threejs-journey.com/lessons/wobbly-sphere-shader#compute-the-normal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wobbly Sphere Shader tutorial
            </a>
            .
          </li>
        </ul>
      </div>
    ),
  },
  {
    name: "Cavity",
    displayOnSite: true,
    info: (
      <div className="flex flex-col gap-4">
        <span className="indent-3">
          This clock is, <i>unfortunately</i>, not quite what I wanted it to be.
          Lighting, shadows, a GPGPU flow field, the instanced{" "}
          <code>RoundedBoxGeometry</code> cubes, sampling the clock texture...
        </span>
        <span>
          <i>It's expensive</i>... :/
        </span>
        <span className="indent-3">
          Had to take quite a few shortcuts to get it to run reasonably well. I
          might revisit this idea using instanced geometries again later, but I
          may also try recreating this using the same approach I took with the{" "}
          <i>Voxus</i> clock.
        </span>
      </div>
    ),
    acknowledgements: (
      <div className="flex flex-col gap-4">
        <ul className="list-inside list-disc">
          <li>
            The <code>useGPGPU</code> hook's structure is modified from a{" "}
            <a
              className="underline"
              href="https://codesandbox.io/p/sandbox/admiring-christian-nnxq97"
              target="_blank"
              rel="noopener noreferrer"
            >
              CodeSandbox project
            </a>{" "}
            I found by user "wtshm".
          </li>
        </ul>
      </div>
    ),
  },
  {
    name: "Cosmo",
    displayOnSite: false,
    displayOnDebug: true,
  },
  {
    name: "Fourier",
    displayOnSite: true,
    info: (
      <div className="flex flex-col gap-4">
        <span>
          It's a clock that uses{" "}
          <a
            className="underline"
            href="https://www.youtube.com/watch?v=r6sGWTCMz2k"
            target="_blank"
            rel="noopener noreferrer"
          >
            Fourier Series
          </a>{" "}
          to draw the hands.
        </span>
        <span className="indent-3">
          If I'd understood how Fourier Series actually worked before starting
          on this, I may have just decided to not do it at all. I was naively
          hoping there'd be a way to sort of just look at the constants involved
          in the series and possibly find a "close enough" simplification, but
          yeah... Ultimately, it's recalculating the entire series 60 times per
          second (or trying to), sorting the circles from biggest to smallest,
          and using those to draw this out. If you look long enough, you might
          notice some of the smaller circles jumping around a bit when the
          solution to the series changes drastically enough, but overall it's
          pretty smooth.
        </span>
        <span className="indent-3">
          I'm not terribly happy with how the circles and the lines look (way
          too pixelated and the glow effect is a bit too strong), but I'll leave
          it as-is for now.
        </span>
      </div>
    ),
    acknowledgements: (
      <div className="flex flex-col gap-4">
        <ul className="list-inside list-disc">
          <li>
            Obvious shout-out to 3Blue1Brown for the excellent (as always) video
            on{" "}
            <a
              className="underline"
              href="https://www.youtube.com/watch?v=r6sGWTCMz2k"
              target="_blank"
              rel="noopener noreferrer"
            >
              Fourier Series
            </a>
            .
          </li>
          <li>
            Credit to The Coding Train for the super helpful{" "}
            <a
              className="underline"
              href="https://www.youtube.com/watch?v=7_vKzcgpfvU"
              target="_blank"
              rel="noopener noreferrer"
            >
              Fourier Series code example
            </a>{" "}
            that I <span className="line-through decoration-2">stole</span>{" "}
            adapted for the GPGPU implementation.
          </li>
          <li>
            And, as usual, thanks to Iñigo Quilez for the{" "}
            <a
              className="underline"
              href="https://iquilezles.org/articles/"
              target="_blank"
              rel="noopener noreferrer"
            >
              incredible shader resources
            </a>
            .
          </li>
        </ul>
      </div>
    ),
  },
  {
    name: "Hex",
    displayOnSite: false,
    displayOnDebug: true,
  },
  {
    name: "MNCA",
    displayOnSite: true,
    info: (
      <div className="flex flex-col gap-4">
        <span className="indent-3">
          This clock is (mostly) a{" "}
          <a
            className="underline"
            href="https://slackermanz.com/understanding-multiple-neighborhood-cellular-automata/"
            target="_blank"
            rel="noopener noreferrer"
          >
            multi-neighborhood cellular automata (MNCA)
          </a>
          . It uses the same rule set displayed at 22:27 in{" "}
          <a
            className="underline"
            href="https://www.youtube.com/watch?v=I1JBiZrZ_XM&t=1345s"
            target="_blank"
            rel="noopener noreferrer"
          >
            this video by Acerola
          </a>
          .
        </span>
        <span className="indent-3">
          The digits themselves use individual chamfer box signed distance
          functions (SDFs) for each segment, combined together visually using a
          smooth union operation to get the rounded look. They're rendered
          off-screen using Drei's <code>createPortal</code>, then passed to the
          MNCA shader as a texture. The parts of the individual digits that are
          enabled at any given time are populated with "alive" cells as needed.
          That way, they can affect the simulation with their presence, but they
          aren't bound by the rules (and so remain visible), allowing the clock
          to acutually be read.
        </span>
      </div>
    ),
    acknowledgements: (
      <div className="flex flex-col gap-4">
        <ul className="list-inside list-disc">
          <li>
            Credit to Acerola for{" "}
            <a
              className="underline"
              href="https://www.youtube.com/watch?v=I1JBiZrZ_XM&t=1345s"
              target="_blank"
              rel="noopener noreferrer"
            >
              the video on MNCAs
            </a>{" "}
            that inspired this clock (and for the rule set).
          </li>
          <li>
            As usual, thanks to Iñigo Quilez for the{" "}
            <a
              className="underline"
              href="https://iquilezles.org/articles/"
              target="_blank"
              rel="noopener noreferrer"
            >
              incredible shader resources
            </a>
            .
          </li>
        </ul>
      </div>
    ),
  },
  {
    name: "Voxus",
    displayOnSite: true,
  },
];

export const STATS_CLASS_NAME =
  "if-it-works-then-it-aint-25783154-7c53-4f0f-bb9c-5b6813dc653e";
