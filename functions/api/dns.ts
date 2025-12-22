import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  DNSHE_KEY_1: string;
  DNSHE_SECRET_1: string;
  DNSHE_KEY_2: string;
  DNSHE_SECRET_2: string;
}

const accounts = {
  "account1": { key: "DNSHE_KEY_1", secret: "DNSHE_SECRET_1", name: "账号1" },
  "account2": { key: "DNSHE_KEY_2", secret: "DNSHE_SECRET_2", name: "账号2" },
};

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Determine which account to use from query params or default to account1
  const accountKey = url.searchParams.get('account') || 'account1';
  const acc = accounts[accountKey];
  if (!acc) {
    return new Response(JSON.stringify({ success: false, error: "Invalid account" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }

  const key = env[acc.key as keyof Env];
  const secret = env[acc.secret as keyof Env];
  const api = new DNSHESubdomainAPI(
    'https://api005.dnshe.com/index.php',
    key,
    secret
  );

  if (method === "GET") {
    const subdomainId = parseInt(url.searchParams.get('subdomain_id') || '0');
    if (!subdomainId) {
      return new Response(JSON.stringify({ success: false, error: "Missing subdomain_id" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    try {
      const data = await api.listDNSRecords(subdomainId);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }

  if (method === "POST") {
    const body = await request.json();
    const action = url.pathname.split('/').pop(); // get action from path like /create, /update, /delete

    try {
      let data;
      switch (action) {
        case 'create':
          data = await api.createDNSRecord(
            body.subdomain_id, 
            body.type, 
            body.content, 
            body.name, 
            body.ttl, 
            body.priority
          );
          break;
        case 'update':
          data = await api.updateDNSRecord(
            body.record_id, 
            body.content, 
            body.ttl, 
            body.priority
          );
          break;
        case 'delete':
          data = await api.deleteDNSRecord(body.record_id);
          break;
        default:
          return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
          });
      }

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
}