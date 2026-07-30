// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://thearchiveoftheuntamed.xyz",
  base: "/reactive-archive",

  vite: {
    define: {
      global: {}
    }
  }
});
