import { createSessionToken, isValidSession, buildSessionCookie, buildClearCookie } from '../lib/session.ts';

export interface Env {
  [key: string]: string; // 动态环境变量
}

function json(data: unknown, status = 200, cookie?: string): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(JSON.stringify(data), { status, headers });
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;

  // 会话状态查询
  if (request.method === 'GET') {
    const authenticated = await isValidSession(request, env);
    return json({ success: true, authenticated });
  }

  // 登出：清除会话 Cookie
  if (request.method === 'DELETE') {
    return json({ success: true, message: '已登出' }, 200, buildClearCookie());
  }

  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    const { password, remember } = body;

    // 从环境变量获取设置的密码
    const correctPassword = env.DNS_PANEL_PASSWORD;

    if (!correctPassword) {
      console.error('未设置 DNS_PANEL_PASSWORD 环境变量');
      return json({ success: false, message: '服务器配置错误' }, 500);
    }

    if (password !== correctPassword) {
      return json({ success: false, message: '密码错误' }, 401);
    }

    // 认证成功：签发 HttpOnly 会话 Cookie，remember 决定有效期
    const maxAge = remember ? 7 * 86400 : 12 * 3600;
    const token = await createSessionToken(env, maxAge / 86400);
    return json({ success: true, message: '认证成功' }, 200, buildSessionCookie(token, maxAge));
  } catch (error) {
    console.error('认证错误:', error);
    return json({ success: false, message: '认证失败' }, 500);
  }
}
