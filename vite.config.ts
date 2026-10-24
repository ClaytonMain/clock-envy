import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    tailwindcss(),
    glsl({
      watch: true,
      include: [
        "**/*.glsl",
        "**/*.wgsl",
        "**/*.vert",
        "**/*.frag",
        "**/*.vs",
        "**/*.fs",
      ],
    }),
  ],
  server: {
    host: true,
  },
});
