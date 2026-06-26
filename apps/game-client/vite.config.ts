import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Budget runtime Three.js actuel. Le shell initial reste decoupe en chunk leger.
    chunkSizeWarningLimit: 950,
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
});
