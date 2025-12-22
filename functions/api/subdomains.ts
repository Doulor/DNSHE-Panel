import { DNSHESubdomainAPI } from '../lib/dnshe_api.ts';

export interface Env {
  [key: string]: string; // 动态环境变量
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  if (method === "GET") {
    const accounts: { key: string; secret: string; index: string }[] = [];

    // 动态扫描所有 DNSHE_KEY_* / DNSHE_SECRET_* 配对
    Object.keys(env).forEach(k => {
      if (k.startsWith('DNSHE_KEY_')) {
        const idx = k.replace('DNSHE_KEY_', '');
        const secretName = `DNSHE_SECRET_${idx}`;
        if (env[secretName]) {
          accounts.push({
            key: env[k],
            secret: env[secretName],
            index: idx
          });
        }
      }
    });

    const results: any[] = [];

    for (const acc of accounts) {
      const api = new DNSHESubdomainAPI(
        'https://api005.dnshe.com/index.php',
        acc.key,
        acc.secret
      );

      try {
        const data = await api.listSubdomains();
        if (data.success) {
          const subdomainsWithAccount = data.subdomains.map((sd: any) => ({
            ...sd,
            accountIndex: acc.index,
            account: `账号${acc.index}`
          }));
          results.push(...subdomainsWithAccount);
        }
      } catch (err) {
        console.error(`账号 ${acc.index} 子域列表加载失败:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, subdomains: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (method === "POST") {
    const body = await request.json();

    // Determine which account to use
    const accountIndex = body.accountIndex || '1';
    const key = env[`DNSHE_KEY_${accountIndex}`];
    const secret = env[`DNSHE_SECRET_${accountIndex}`];

    if (!key || !secret) {
      return new Response(JSON.stringify({ success: false, error: "账号不存在或未配置" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

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
    const accountIndex = body.accountIndex || '1';
    const key = env[`DNSHE_KEY_${accountIndex}`];
    const secret = env[`DNSHE_SECRET_${accountIndex}`];

    if (!key || !secret) {
      return new Response(JSON.stringify({ success: false, error: "账号不存在或未配置" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

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
    const accountIndex = body.accountIndex || '1';
    const key = env[`DNSHE_KEY_${accountIndex}`];
    const secret = env[`DNSHE_SECRET_${accountIndex}`];

    if (!key || !secret) {
      return new Response(JSON.stringify({ success: false, error: "账号不存在或未配置" }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

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