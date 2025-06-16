import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [tailwindcss(), solidPlugin()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "../solidjs_dist",
    target: "esnext",
    minify: false,
  },
});
