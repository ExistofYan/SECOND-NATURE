import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  base: "./",
  cacheDir: ".cache/vite",
  test: {
    environment: "node",
    fsModuleCache: false,
    include: ["tests/**/*.test.ts"],
  },
});
