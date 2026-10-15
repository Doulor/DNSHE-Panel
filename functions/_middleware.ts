// 统一认证中间件：拦截所有 /api/* 请求，未携带有效会话一律 401
// 仅放行 /api/auth（登录/会话查询/登出）

import { isValidSession } from './lib/session.ts';

export interface Env {
  [key: string]: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // ---------------------------------------------------------------- 路径归一化
  //
  // 🔴 2026-10-14 安全审计（Critical）：这里原本直接拿 url.pathname 做**精确小写**前缀判断，
  //    而 Cloudflare Pages Functions 的**路由匹配是大小写不敏感的**。
  //    于是 `/API/keys`、`/Api/keys`、`/aPI/keys` 这类变体不满足 `startsWith('/api/')`，
  //    **整个鉴权被跳过**，请求照样落到 `functions/api/keys.ts` ——
  //    未认证即可读取上游 DNSHE 的 API Key 明文、账号配额、任意域名 WHOIS。
  //    实测：`GET /API/keys` 返回 200 + 2 个 `cfsd_*` 真实 key；同刻 `/api/keys` 返回 401。
  //    延迟约 50s 是为了掩盖这一点（延迟≠拒绝），很容易被误判成"服务卡住"而漏测。
  //
  // 修法分两层，缺一不可：
  //   ① 判断鉴权前**统一归一化**（转小写、去掉尾部斜杠），使判定与路由语义一致；
  //   ② 对 `/api` 段的**非规范形态直接 404** —— 默认拒绝，不再依赖"两边约定一致"。
  //      只做①的话，将来 Pages 路由行为一变又会重新漏；②是兜底。
  const rawPath = url.pathname;
  const lower = rawPath.toLowerCase();
  const path = lower.length > 1 ? lower.replace(/\/+$/, '') : lower;

  // ② 非规范形态一律拒绝：小写后落在 /api 段下、但原始写法不是规范形态的（含大写变体、
  //    重复斜杠、尾部斜杠）。规范形态只有 `/api` 与 `/api/...`。
  const isApiShaped = lower === '/api' || lower.startsWith('/api/') || lower.startsWith('/api//');
  const isCanonical = rawPath === '/api' || rawPath.startsWith('/api/');
  if (isApiShaped && !isCanonical) {
    return new Response(JSON.stringify({ success: false, message: '路径不规范' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const isApi = path === '/api' || path.startsWith('/api/');
  const isAuthEndpoint = path === '/api/auth';

  if (isApi && !isAuthEndpoint) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': url.origin,
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (!(await isValidSession(request, env))) {
      return new Response(JSON.stringify({ success: false, message: '未认证或会话已过期' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
  }

  const response = await next();

  // 防止中间层/浏览器缓存任何 API 数据（含敏感凭据）
  if (isApi) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  return response;
}
