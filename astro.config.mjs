import { defineConfig, envField } from 'astro/config'
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: 'https://bibleaccesslist.org',
  prefetch: true,
  devToolbar: {enabled:false},
  compressHTML: true,
  integrations: [
    tailwind(), sitemap()
  ]
});