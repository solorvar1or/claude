import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// [НУЖНО УТОЧНИТЬ] production domain — keep in sync with src/data/site.ts and public/robots.txt.
export default defineConfig({
  site: 'https://woodger.by',
  trailingSlash: 'always',
  integrations: [
    sitemap({ filter: (page) => !page.includes('/raschet/spasibo/') && !page.includes('/404') }),
  ],
});
