// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
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
      redirectToDefaultLocale: false,
    },
  },
});
