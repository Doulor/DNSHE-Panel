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

  const isApi = url.pathname === '/api' || url.pathname.startsWith('/api/');
  const isAuthEndpoint = url.pathname === '/api/auth';

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
