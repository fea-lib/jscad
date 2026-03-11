import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@fea-lib/values": path.resolve(__dirname, "../values/src/index.ts"),
    },
  },
  test: {
    globals: false,
  },
});
