import { defineConfig } from "vite"

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build", // Just to avoid conflicts with the dist folder
  },
  // @ts-expect-error - test is a Vitest config option, not in Vite's UserConfigExport
  test: {
    environment: "happy-dom",
    include: ["**/*.{test,spec}.{js,ts}"],
    setupFiles: ["./test/setup.ts"],
  },
})
