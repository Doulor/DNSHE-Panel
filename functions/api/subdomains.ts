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

  if (method === "GET") {
    const results: any[] = [];

    for (const accountId in accounts) {
      const acc = accounts[accountId];
      const key = env[acc.key as keyof Env];
      const secret = env[acc.secret as keyof Env];
      const api = new DNSHESubdomainAPI(
        'https://api005.dnshe.com/index.php',
        key,
        secret
      );

      try {
        const data = await api.listSubdomains();
        if (data.success) {
          const subdomainsWithAccount = data.subdomains.map((sd: any) => ({
            ...sd,
            account: acc.name,
            accountId: accountId
          }));
          results.push(...subdomainsWithAccount);
        }
      } catch (err) {
        console.error(`Error for ${accountId}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, subdomains: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (method === "POST") {
    const body = await request.json();

    // Determine which account to use
    const accountKey = body.account || 'account1';
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

    try {
      const data = await api.registerSubdomain(body.subdomain, body.rootdomain);
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

  if (method === "DELETE") {
    const body = await request.json();

    // Determine which account to use
    const accountKey = body.account || 'account1';
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

    try {
      const data = await api.deleteSubdomain(body.subdomain_id);
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

  if (request.url.includes('/renew')) {
    const body = await request.json();

    // Determine which account to use
    const accountKey = body.account || 'account1';
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

    try {
      const data = await api.renewSubdomain(body.subdomain_id);
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