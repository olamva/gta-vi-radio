import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  cacheDir: resolve(import.meta.dirname, ".vite"),
  server: {
    host: "127.0.0.1",
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
  },
});
