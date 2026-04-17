// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  site: 'https://nubetic.com',
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: '0.0.0.0',
      allowedHosts: 'all',
    },
    // Env variables will be available at runtime via import.meta.env
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
