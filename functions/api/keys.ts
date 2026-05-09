import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  [key: string]: string;
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  let action: string | null = null;
  if (method === 'POST' || method === 'DELETE') {
    const body = await request.json();
    action = body.action;
    // normalize accountIndex
    const accountIndex = body.accountIndex || '1';
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
      switch (action) {
        case 'create': {
          const data = await api.createKey(body.key_name, body.ip_whitelist);
          return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        }
        case 'delete': {
          const data = await api.deleteKey(body.key_id);
          return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        }
        case 'regenerate': {
          const data = await api.regenerateKey(body.key_id);
          return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        }
        default:
          return new Response(JSON.stringify({ success: false, message: '未知操作' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else if (method === 'GET') {
    // list keys - support accountIndex query param
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
      const data = await api.listKeys();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
