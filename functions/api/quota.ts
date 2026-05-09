import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  [key: string]: string;
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const accountIndex = url.searchParams.get('accountIndex') || '1';

  const key = env[`DNSHE_KEY_${accountIndex}`];
  const secret = env[`DNSHE_SECRET_${accountIndex}`];

  if (!key || !secret) {
    return new Response(JSON.stringify({ success: false, error: '账号不存在或未配置' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const api = new DNSHESubdomainAPI('https://api005.dnshe.com/index.php', key, secret);

  try {
    const data = await api.getQuota();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
