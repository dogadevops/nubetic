import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

// Make this endpoint server-rendered (not static)
export const prerender = false;

const PROJECT_ROOT = path.resolve(process.cwd());
const CONFIG_PATH = path.join(PROJECT_ROOT, 'src/data/trwq-config.json');

// Security: Validate API Key
function validateApiKey(authHeader: string | null): boolean {
  // Astro exposes env variables via import.meta.env
  // For server output, also check process.env
  const apiKey = import.meta.env.TRWQ_API_KEY || process.env.TRWQ_API_KEY;
  console.log('API Key from env:', apiKey ? 'exists' : 'MISSING');
  
  if (!apiKey) {
    console.error('API Key not configured - check .env file');
    console.log('import.meta.env:', import.meta.env);
    console.log('process.env.TRWQ_API_KEY:', process.env.TRWQ_API_KEY);
    return false;
  }
  const expectedKey = `Bearer ${apiKey}`;
  const isValid = authHeader === expectedKey;
  console.log('Auth comparison:', isValid);
  return isValid;
}

// Security: Validate value ranges
function validateValues(vbc: number, vb: number): { valid: boolean; error?: string } {
  // VBC limits: 0.01 to 1000 (allows 3-digit values like 477.01)
  if (vbc < 0.01 || vbc > 1000) {
    return { valid: false, error: 'VBC must be between 0.01 and 1000' };
  }
  
  // VB limits: 0.01 to 1000 (allows 3-digit values like 630.00)
  if (vb < 0.01 || vb > 1000) {
    return { valid: false, error: 'VB must be between 0.01 and 1000' };
  }
  
  // Calculate TRWQ
  const trwq = vb / vbc;
  
  // TRWQ limits: 0.01 to 10 (more flexible for different price structures)
  if (trwq < 0.01 || trwq > 10) {
    return { valid: false, error: `TRWQ must be between 0.01 and 10. Current: ${trwq.toFixed(2)}` };
  }
  
  return { valid: true };
}

export const GET: APIRoute = async ({ request }) => {
  // Validate API Key
  const authHeader = request.headers.get('Authorization');
  if (!validateApiKey(authHeader)) {
    console.log('GET: Unauthorized access attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(data);
    return new Response(JSON.stringify(config), {
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
  // Validate API Key
  const authHeader = request.headers.get('Authorization');
  if (!validateApiKey(authHeader)) {
    console.log('POST: Unauthorized access attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  console.log('=== POST /api/trwq called ===');
  
  try {
    const body = await request.json();
    console.log('Body received:', body);
    
    const { vbc, vb } = body;

    if (vbc === undefined || vb === undefined) {
      return new Response(JSON.stringify({ error: 'Missing vbc or vb' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate values with security limits
    const validation = validateValues(vbc, vb);
    if (!validation.valid) {
      console.log('Validation failed:', validation.error);
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

    console.log('Writing config:', JSON.stringify(config, null, 2));

    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('File written successfully');

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('=== POST Error ===');
    console.error('Error message:', error.message);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to save config', 
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};