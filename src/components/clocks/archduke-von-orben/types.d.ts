import type { ReactThreeFiber } from "@react-three/fiber";
import { ArchesMaterial } from "./materials/ArchesMaterial.tsx";
import { SimpleColorMaterial } from "./materials/SimpleColorMaterial.tsx";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        archesMaterial: ReactThreeFiber.Node<
          typeof ArchesMaterial & JSX.IntrinsicElements["shaderMaterial"],
          typeof ArchesMaterial
        >;
        simpleColorMaterial: ReactThreeFiber.Node<
          typeof SimpleColorMaterial & JSX.IntrinsicElements["shaderMaterial"],
          typeof SimpleColorMaterial
        >;
      }
    }
  }
}
