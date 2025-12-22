import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  [key: string]: string; // 动态环境变量
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Extract action from URL path
  const pathParts = url.pathname.split('/');
  const action = pathParts[pathParts.length - 1]; // get action from path like /create, /update, /delete

  const body = await request.json();
  const { accountIndex, subdomainId, recordId, type, content, ttl, priority, name } = body;

  // Determine which account to use
  const key = env[`DNSHE_KEY_${accountIndex}`];
  const secret = env[`DNSHE_SECRET_${accountIndex}`];

  if (!key || !secret) {
    return new Response(JSON.stringify({ success: false, message: '账号不存在或未配置' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const api = new DNSHESubdomainAPI('https://api005.dnshe.com/index.php', key, secret);

  let result: any;
  try {
    switch(action) {
      case 'list':
        result = await api.listDNSRecords(subdomainId);
        break;
      case 'create':
        result = await api.createDNSRecord(subdomainId, type, content, name, ttl || 600, priority);
        break;
      case 'update':
        result = await api.updateDNSRecord(recordId, content, ttl, priority);
        break;
      case 'delete':
        result = await api.deleteDNSRecord(recordId);
        break;
      default:
        return new Response(JSON.stringify({ success: false, message: '未知操作' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}