import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const CONFIG_KEY = 'trwq-config';
const CONFIG_FILE = path.resolve('./src/data/trwq-config.json');

const isVercel = !!process.env.VERCEL;
const KV_AVAILABLE = isVercel && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

function validateApiKey(authHeader: string | null): boolean {
  const apiKey = import.meta.env.TRWQ_API_KEY || process.env.TRWQ_API_KEY;
  
  if (!apiKey) {
    console.error('API Key not configured');
    return false;
  }
  return authHeader === `Bearer ${apiKey}`;
}

function validateValues(vbc: number, vb: number): { valid: boolean; error?: string } {
  if (typeof vbc !== 'number' || typeof vb !== 'number') {
    return { valid: false, error: 'vbc and vb must be numbers' };
  }
  if (vbc < 0.01 || vbc > 1000) {
    return { valid: false, error: 'VBC must be between 0.01 and 1000' };
  }
  if (vb < 0.01 || vb > 1000) {
    return { valid: false, error: 'VB must be between 0.01 and 1000' };
  }
  const trwq = vb / vbc;
  if (trwq < 0.01 || trwq > 10) {
    return { valid: false, error: `TRWQ must be between 0.01 and 10. Current: ${trwq.toFixed(2)}` };
  }
  return { valid: true };
}

async function getConfig(): Promise<any> {
  if (KV_AVAILABLE) {
    return await kv.get(CONFIG_KEY);
  }
  const content = await fs.readFile(CONFIG_FILE, 'utf-8');
  return JSON.parse(content);
}

async function setConfig(config: any): Promise<void> {
  if (KV_AVAILABLE) {
    await kv.set(CONFIG_KEY, config);
    return;
  }
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!validateApiKey(authHeader)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const config = await getConfig();
    return new Response(JSON.stringify(config || {}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET Error:', error);
    return new Response(JSON.stringify({ error: 'Config not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!validateApiKey(authHeader)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { vbc, vb } = body;

    if (vbc === undefined || vb === undefined) {
      return new Response(JSON.stringify({ error: 'Missing vbc or vb' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validation = validateValues(vbc, vb);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const trwq = vb / vbc;
    const config = {
      vbc,
      vb,
      trwq,
      updatedAt: new Date().toISOString()
    };

    await setConfig(config);

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('POST Error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to save config', 
      details: KV_AVAILABLE ? undefined : 'local'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};