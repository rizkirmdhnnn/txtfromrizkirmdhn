import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [
    {
      // Worker menerima .wasm sebagai modul yang sudah dikompilasi; di Node
      // modulnya dibuat dari file supaya test kartu OG bisa merender.
      name: "wasm-module",
      enforce: "pre",
      load(id: string) {
        const path = id.split("?")[0];
        if (!path.endsWith(".wasm")) return null;
        return `import { readFileSync } from "node:fs";
export default new WebAssembly.Module(readFileSync(${JSON.stringify(path)}));`;
      },
    },
  ],
  test: {
    // Paket wasm harus lewat pipeline Vite agar plugin di atas dipakai;
    // Node kalau tidak akan mencoba memuat .wasm sebagai modul ESM sendiri.
    server: { deps: { inline: ["@resvg/resvg-wasm", "satori"] } },
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/editor-markdown.test.ts", "tests/editor-slash.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
