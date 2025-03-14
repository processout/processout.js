import { defineConfig } from "vite"

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build", // Just to avoid conflicts with the dist folder
  },
})
