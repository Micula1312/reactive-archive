// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://micula1312.github.io",
  base: "/reactive-archive",
  vite: {
    define: {
      global: {}
    }
  }
});
