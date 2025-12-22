import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  [key: string]: string; // 动态环境变量
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // For POST requests, get action from body; for GET requests, get from URL
  let action;
  let accountIndex, subdomainId, recordId, type, content, ttl, priority, name;

  if (method === 'POST') {
    const body = await request.json();
    action = body.action;
    accountIndex = body.accountIndex;
    subdomainId = body.subdomainId;
    recordId = body.record_id || body.recordId;
    type = body.type;
    content = body.content;
    ttl = body.ttl;
    priority = body.priority;
    name = body.name;
  } else {
    // For GET requests, extract from URL
    action = url.searchParams.get('action');
    accountIndex = url.searchParams.get('accountIndex');
    subdomainId = url.searchParams.get('subdomainId');
    recordId = url.searchParams.get('recordId');
  }

  // Determine which account to use
  const key = env[`DNSHE_KEY_${accountIndex}`];
  const secret = env[`DNSHE_SECRET_${accountIndex}`];

  if (!key || !secret) {
    console.error(`账号 ${accountIndex} 不存在或未配置`);
    return new Response(JSON.stringify({ success: false, message: `账号 ${accountIndex} 不存在或未配置` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const api = new DNSHESubdomainAPI('https://api005.dnshe.com/index.php', key, secret);

  let result: any;
  try {
    switch(action) {
      case 'list':
        result = await api.listDnsRecords(subdomainId);
        if (!result.success) {
          console.error('DNS API 调用失败:', result);
        }
        break;
      case 'create':
        result = await api.createDnsRecord(subdomainId, type, content, name, ttl, priority);
        break;
      case 'update':
        result = await api.updateDnsRecord(recordId, content, ttl, priority);
        break;
      case 'delete':
        result = await api.deleteDnsRecord(recordId);
        break;
      default:
        return new Response(JSON.stringify({ success: false, message: '未知操作' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (err: any) {
    console.error('DNS API 异常:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}