import { defineConfig } from "vitest/config";

// Tes round-trip markdown editor butuh DOM sungguhan agar TipTap Editor bisa
// dibuat. Dipisah dari config utama karena cms.test.ts memakai Miniflare +
// fetch/Response global yang rusak bila environment diganti happy-dom.
export default defineConfig({
  test: {
    include: ["tests/editor-markdown.test.ts", "tests/editor-slash.test.ts"],
    environment: "happy-dom",
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
