import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next-only modules that have no meaning outside the framework
      "server-only": path.resolve(__dirname, "test/stubs/empty.ts"),
      "next/cache": path.resolve(__dirname, "test/stubs/next-cache.ts"),
    },
  },
  test: {
    include: ["test/unit/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    environment: "node",
  },
});
