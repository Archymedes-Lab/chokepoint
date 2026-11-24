import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static client-only app. No backend, no network calls at runtime —
// the simulation runs entirely in the browser. See docs/ETHICS.md.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
