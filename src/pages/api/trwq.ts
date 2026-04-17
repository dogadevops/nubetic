import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';

export const prerender = false;

const CONFIG_KEY = 'trwq-config';

function validateApiKey(authHeader: string | null): boolean {
  const apiKey = import.meta.env.TRWQ_API_KEY || process.env.TRWQ_API_KEY;
  console.log('API Key from env:', apiKey ? 'exists' : 'MISSING');
  
  if (!apiKey) {
    console.error('API Key not configured - check .env file');
    return false;
  }
  const expectedKey = `Bearer ${apiKey}`;
  return authHeader === expectedKey;
}

function validateValues(vbc: number, vb: number): { valid: boolean; error?: string } {
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

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!validateApiKey(authHeader)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const config = await kv.get(CONFIG_KEY);
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

    await kv.set(CONFIG_KEY, config);

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('POST Error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Failed to save config', 
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};