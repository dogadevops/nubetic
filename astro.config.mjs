// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import fs from 'node:fs';
import path from 'node:path';

// Read .env file manually
const envFile = path.resolve(process.cwd(), '.env');
const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf-8') : '';
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  site: 'https://nubetic.com',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.TRWQ_API_KEY': JSON.stringify(envVars.TRWQ_API_KEY || '')
    }
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
