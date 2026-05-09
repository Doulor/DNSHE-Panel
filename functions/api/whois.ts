import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  [key: string]: string;
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return new Response(JSON.stringify({ success: false, message: 'domain 参数缺失' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // If public WHOIS is allowed, the service may not require API key. But we'll try to use accountIndex if provided
  const accountIndex = url.searchParams.get('accountIndex') || '1';
  const key = env[`DNSHE_KEY_${accountIndex}`];
  const secret = env[`DNSHE_SECRET_${accountIndex}`];

  const api = new DNSHESubdomainAPI('https://api005.dnshe.com/index.php', key || '', secret || '');

  try {
    const data = await api.whois(domain);
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
