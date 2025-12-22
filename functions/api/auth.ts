export interface Env {
  [key: string]: string; // 动态环境变量
}

export async function onRequest(context: { request: Request, env: Env }) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { password } = body;

    // 从环境变量获取设置的密码
    const correctPassword = env.DNS_PANEL_PASSWORD;

    if (!correctPassword) {
      console.error('未设置 DNS_PANEL_PASSWORD 环境变量');
      return new Response(JSON.stringify({ success: false, message: '服务器配置错误' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password === correctPassword) {
      return new Response(JSON.stringify({ success: true, message: '认证成功' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('认证错误:', error);
    return new Response(JSON.stringify({ success: false, message: '认证失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}